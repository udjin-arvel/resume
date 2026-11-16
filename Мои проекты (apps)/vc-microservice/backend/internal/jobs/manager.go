package jobs

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"sync"
	"time"

	"github.com/vc-microservice/backend/internal/ffmpeg"
	"github.com/vc-microservice/backend/internal/storage"
)

var (
	// ErrQueueFull is returned by Submit when the buffered queue has no room.
	ErrQueueFull = errors.New("job queue is full")
	// ErrShuttingDown is returned by Submit after Shutdown was called.
	ErrShuttingDown = errors.New("service is shutting down")
)

// Options configures a Manager.
type Options struct {
	Workers   int
	QueueSize int
	FileTTL   time.Duration
	Converter ffmpeg.Converter
	Storage   *storage.Storage
	Logger    *slog.Logger
	Now       func() time.Time // for tests; defaults to time.Now
}

// Manager keeps job state in memory and runs a fixed pool of workers that pull
// from a bounded channel. Concurrency of FFmpeg is therefore capped at Workers,
// and back-pressure (HTTP 429) kicks in once QueueSize jobs are waiting.
type Manager struct {
	opts  Options
	log   *slog.Logger
	queue chan *Job

	mu     sync.RWMutex
	jobs   map[string]*Job
	closed bool

	stop       chan struct{}      // closed on Shutdown: workers stop taking new jobs
	workCtx    context.Context    // parent of every ffmpeg run
	cancelWork context.CancelFunc // hard-cancels running conversions
	wg         sync.WaitGroup
	startOnce  sync.Once
}

// NewManager validates options and creates a Manager. Call Start to run workers.
func NewManager(o Options) (*Manager, error) {
	if o.Workers < 1 || o.QueueSize < 1 {
		return nil, fmt.Errorf("jobs: workers and queue size must be positive")
	}
	if o.Converter == nil || o.Storage == nil {
		return nil, fmt.Errorf("jobs: converter and storage are required")
	}
	if o.Logger == nil {
		o.Logger = slog.Default()
	}
	if o.Now == nil {
		o.Now = time.Now
	}
	ctx, cancel := context.WithCancel(context.Background())
	return &Manager{
		opts:       o,
		log:        o.Logger,
		queue:      make(chan *Job, o.QueueSize),
		jobs:       make(map[string]*Job),
		stop:       make(chan struct{}),
		workCtx:    ctx,
		cancelWork: cancel,
	}, nil
}

// Start launches the worker pool. It is safe to call once; later calls are no-ops.
func (m *Manager) Start() {
	m.startOnce.Do(func() {
		for i := range m.opts.Workers {
			m.wg.Add(1)
			go m.worker(i + 1)
		}
		m.log.Info("worker pool started", "workers", m.opts.Workers, "queue_size", m.opts.QueueSize)
	})
}

// HasCapacity is a cheap pre-check used before accepting a large upload, so the
// client gets 429 immediately instead of after transferring 200 MB.
func (m *Manager) HasCapacity() bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return !m.closed && len(m.queue) < cap(m.queue)
}

// Stats returns queue length and capacity.
func (m *Manager) Stats() (queued, capacity, workers int) {
	return len(m.queue), cap(m.queue), m.opts.Workers
}

// Submit registers a job whose source file is already on disk and enqueues it
// without blocking. On error the job is not registered and the caller owns the file.
func (m *Manager) Submit(j *Job) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.closed {
		return ErrShuttingDown
	}
	j.Status = StatusQueued
	if j.CreatedAt.IsZero() {
		j.CreatedAt = m.opts.Now()
	}
	select {
	case m.queue <- j:
		m.jobs[j.ID] = j
		return nil
	default:
		return ErrQueueFull
	}
}

// Get returns a copy of the job, safe to read without locks.
func (m *Manager) Get(id string) (Job, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	j, ok := m.jobs[id]
	if !ok {
		return Job{}, false
	}
	return *j, true
}

// Active reports whether a job with this ID is still queued or processing.
func (m *Manager) active(id string) bool {
	j, ok := m.jobs[id]
	return ok && !j.Finished()
}

func (m *Manager) worker(n int) {
	defer m.wg.Done()
	log := m.log.With("worker", n)
	for {
		// Prefer the stop signal over pending work (select alone picks randomly).
		select {
		case <-m.stop:
			return
		default:
		}
		select {
		case <-m.stop:
			return
		case j := <-m.queue:
			m.process(log, j)
		}
	}
}

func (m *Manager) process(log *slog.Logger, j *Job) {
	log = log.With("job_id", j.ID)
	m.update(j, func(j *Job) { j.Status = StatusProcessing })
	log.Info("job processing", "original_name", j.OriginalName, "size_in", j.SizeIn)

	tmp := m.opts.Storage.TempProcessedPath(j.ID)
	final := m.opts.Storage.ProcessedPath(j.ID)

	err := m.opts.Converter.Convert(m.workCtx, j.InputPath, tmp)
	var sizeOut int64
	if err == nil {
		sizeOut, err = finalize(tmp, final)
	}

	// The source is no longer needed in either outcome.
	if rmErr := storage.Remove(j.InputPath); rmErr != nil {
		log.Warn("remove input", "err", rmErr)
	}

	if err != nil {
		_ = storage.Remove(tmp)
		m.update(j, func(j *Job) {
			j.Status = StatusFailed
			j.Error = err.Error()
			j.FinishedAt = m.opts.Now()
		})
		log.Error("job failed", "err", err)
		return
	}
	m.update(j, func(j *Job) {
		j.Status = StatusCompleted
		j.SizeOut = sizeOut
		j.FinishedAt = m.opts.Now()
	})
	log.Info("job completed", "size_in", j.SizeIn, "size_out", sizeOut)
}

// finalize atomically publishes the converted file and returns its size.
func finalize(tmp, final string) (int64, error) {
	st, err := os.Stat(tmp)
	if err != nil {
		return 0, fmt.Errorf("output missing: %w", err)
	}
	if st.Size() == 0 {
		return 0, errors.New("ffmpeg produced an empty file")
	}
	if err := os.Rename(tmp, final); err != nil {
		return 0, fmt.Errorf("publish output: %w", err)
	}
	return st.Size(), nil
}

func (m *Manager) update(j *Job, fn func(*Job)) {
	m.mu.Lock()
	fn(j)
	m.mu.Unlock()
}

// Cleanup removes finished jobs older than FileTTL together with their files,
// processed files that belong to no known job (e.g. left over from a restart),
// and orphaned uploads with no active job. It returns the number of removed jobs.
func (m *Manager) Cleanup() int {
	now := m.opts.Now()
	ttl := m.opts.FileTTL
	removed := 0

	m.mu.Lock()
	for id, j := range m.jobs {
		if j.Finished() && now.Sub(j.FinishedAt) > ttl {
			delete(m.jobs, id)
			removed++
			if err := storage.Remove(m.opts.Storage.ProcessedPath(id)); err != nil {
				m.log.Warn("cleanup: remove processed", "job_id", id, "err", err)
			}
		}
	}
	m.mu.Unlock()

	m.sweep(storage.ProcessedDir, now, ttl, func(id string) bool {
		_, known := m.jobs[id]
		return known
	})
	// An upload in progress has no job yet but keeps a fresh mtime; anything
	// older than TTL without an active job is garbage.
	m.sweep(storage.UploadedDir, now, ttl, m.active)

	if removed > 0 {
		m.log.Info("cleanup: expired jobs removed", "count", removed)
	}
	return removed
}

func (m *Manager) sweep(dir string, now time.Time, ttl time.Duration, keep func(id string) bool) {
	entries, err := m.opts.Storage.List(dir)
	if err != nil {
		m.log.Warn("cleanup: list", "dir", dir, "err", err)
		return
	}
	for _, e := range entries {
		m.mu.RLock()
		k := keep(e.JobID)
		m.mu.RUnlock()
		if k || now.Sub(e.ModTime) <= ttl {
			continue
		}
		if err := storage.Remove(e.Path); err != nil {
			m.log.Warn("cleanup: remove file", "path", e.Path, "err", err)
			continue
		}
		m.log.Info("cleanup: orphan file removed", "path", e.Path)
	}
}

// RunCleanup calls Cleanup every interval until ctx is done.
func (m *Manager) RunCleanup(ctx context.Context, interval time.Duration) {
	t := time.NewTicker(interval)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			m.Cleanup()
		}
	}
}

// Shutdown stops accepting jobs, lets running conversions finish until ctx
// expires (then kills them), and fails whatever is still queued.
func (m *Manager) Shutdown(ctx context.Context) error {
	m.mu.Lock()
	if m.closed {
		m.mu.Unlock()
		return nil
	}
	m.closed = true
	m.mu.Unlock()
	close(m.stop)

	done := make(chan struct{})
	go func() { m.wg.Wait(); close(done) }()

	var err error
	select {
	case <-done:
	case <-ctx.Done():
		m.log.Warn("shutdown timeout: canceling running conversions")
		m.cancelWork()
		<-done
		err = ctx.Err()
	}
	m.cancelWork()

	// Fail jobs that never started; their uploads are useless after restart anyway.
	for {
		select {
		case j := <-m.queue:
			_ = storage.Remove(j.InputPath)
			m.update(j, func(j *Job) {
				j.Status = StatusFailed
				j.Error = ErrShuttingDown.Error()
				j.FinishedAt = m.opts.Now()
			})
		default:
			m.log.Info("worker pool stopped")
			return err
		}
	}
}
