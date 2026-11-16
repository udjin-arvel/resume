package jobs

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"os"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/vc-microservice/backend/internal/storage"
)

// fakeConverter writes a small output file; it can block, fail and track concurrency.
type fakeConverter struct {
	err     error
	block   chan struct{} // if non-nil, Convert waits for it (or ctx)
	running atomic.Int32
	peak    atomic.Int32
	calls   atomic.Int32
}

func (f *fakeConverter) Convert(ctx context.Context, in, out string) error {
	f.calls.Add(1)
	n := f.running.Add(1)
	defer f.running.Add(-1)
	for {
		p := f.peak.Load()
		if n <= p || f.peak.CompareAndSwap(p, n) {
			break
		}
	}
	if f.block != nil {
		select {
		case <-f.block:
		case <-ctx.Done():
			return ctx.Err()
		}
	}
	if f.err != nil {
		return f.err
	}
	return os.WriteFile(out, []byte("compressed"), 0o644)
}

func quietLogger() *slog.Logger { return slog.New(slog.NewTextHandler(io.Discard, nil)) }

func newTestManager(t *testing.T, conv *fakeConverter, workers, queue int) (*Manager, *storage.Storage) {
	t.Helper()
	st, err := storage.New(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	m, err := NewManager(Options{
		Workers: workers, QueueSize: queue, FileTTL: time.Hour,
		Converter: conv, Storage: st, Logger: quietLogger(),
	})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		m.Shutdown(ctx)
	})
	return m, st
}

func newJob(t *testing.T, st *storage.Storage) *Job {
	t.Helper()
	id := NewID()
	path := st.UploadPath(id, "mov")
	if err := os.WriteFile(path, []byte("original video bytes"), 0o644); err != nil {
		t.Fatal(err)
	}
	return &Job{ID: id, OriginalName: "clip.mov", SizeIn: 20, InputPath: path}
}

func waitStatus(t *testing.T, m *Manager, id string, want Status) Job {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		if j, _ := m.Get(id); j.Status == want {
			return j
		}
		time.Sleep(5 * time.Millisecond)
	}
	j, _ := m.Get(id)
	t.Fatalf("job %s: status %q, want %q", id, j.Status, want)
	return j
}

func exists(p string) bool { _, err := os.Stat(p); return err == nil }

func TestJobCompletes(t *testing.T) {
	conv := &fakeConverter{}
	m, st := newTestManager(t, conv, 2, 10)
	m.Start()

	j := newJob(t, st)
	if err := m.Submit(j); err != nil {
		t.Fatal(err)
	}
	got := waitStatus(t, m, j.ID, StatusCompleted)
	if got.SizeOut != int64(len("compressed")) || got.FinishedAt.IsZero() || got.Error != "" {
		t.Fatalf("unexpected job: %+v", got)
	}
	if exists(j.InputPath) {
		t.Error("source must be removed after success")
	}
	if !exists(st.ProcessedPath(j.ID)) || exists(st.TempProcessedPath(j.ID)) {
		t.Error("result must be renamed from .part to final path")
	}
}

func TestJobFails(t *testing.T) {
	conv := &fakeConverter{err: errors.New("ffmpeg: Invalid data found when processing input")}
	m, st := newTestManager(t, conv, 1, 10)
	m.Start()

	j := newJob(t, st)
	m.Submit(j)
	got := waitStatus(t, m, j.ID, StatusFailed)
	if got.Error != conv.err.Error() {
		t.Fatalf("error = %q", got.Error)
	}
	if exists(j.InputPath) {
		t.Error("source must be removed after failure")
	}
	if exists(st.ProcessedPath(j.ID)) {
		t.Error("no result expected")
	}
}

func TestStatusTransitions(t *testing.T) {
	conv := &fakeConverter{block: make(chan struct{})}
	m, st := newTestManager(t, conv, 1, 10)

	j := newJob(t, st)
	m.Submit(j)
	if got, _ := m.Get(j.ID); got.Status != StatusQueued {
		t.Fatalf("before Start: %s", got.Status)
	}
	m.Start()
	waitStatus(t, m, j.ID, StatusProcessing)
	close(conv.block)
	waitStatus(t, m, j.ID, StatusCompleted)
}

func TestConcurrencyLimitedByWorkers(t *testing.T) {
	conv := &fakeConverter{block: make(chan struct{})}
	m, st := newTestManager(t, conv, 2, 10)
	m.Start()

	var ids []string
	for range 5 {
		j := newJob(t, st)
		if err := m.Submit(j); err != nil {
			t.Fatal(err)
		}
		ids = append(ids, j.ID)
	}
	time.Sleep(100 * time.Millisecond)

	processing, queued := 0, 0
	for _, id := range ids {
		j, _ := m.Get(id)
		switch j.Status {
		case StatusProcessing:
			processing++
		case StatusQueued:
			queued++
		}
	}
	if processing != 2 || queued != 3 {
		t.Fatalf("processing=%d queued=%d, want 2 and 3", processing, queued)
	}

	close(conv.block)
	for _, id := range ids {
		waitStatus(t, m, id, StatusCompleted)
	}
	if p := conv.peak.Load(); p != 2 {
		t.Fatalf("peak concurrency = %d, want 2", p)
	}
}

func TestQueueFull(t *testing.T) {
	conv := &fakeConverter{}
	m, st := newTestManager(t, conv, 1, 2) // not started: nothing drains the queue

	for range 2 {
		if err := m.Submit(newJob(t, st)); err != nil {
			t.Fatal(err)
		}
	}
	if m.HasCapacity() {
		t.Fatal("HasCapacity must be false when queue is full")
	}
	extra := newJob(t, st)
	if err := m.Submit(extra); !errors.Is(err, ErrQueueFull) {
		t.Fatalf("got %v, want ErrQueueFull", err)
	}
	if _, ok := m.Get(extra.ID); ok {
		t.Fatal("rejected job must not be registered")
	}
}

func TestCleanup(t *testing.T) {
	now := time.Date(2026, 1, 1, 12, 0, 0, 0, time.UTC)
	var mu sync.Mutex
	clock := func() time.Time { mu.Lock(); defer mu.Unlock(); return now }
	advance := func(d time.Duration) { mu.Lock(); now = now.Add(d); mu.Unlock() }

	st, _ := storage.New(t.TempDir())
	m, _ := NewManager(Options{
		Workers: 1, QueueSize: 10, FileTTL: time.Hour,
		Converter: &fakeConverter{}, Storage: st, Logger: quietLogger(), Now: clock,
	})
	m.Start()
	defer m.Shutdown(context.Background())

	j := newJob(t, st)
	m.Submit(j)
	waitStatus(t, m, j.ID, StatusCompleted)

	// Orphans: a processed file from a "previous run" and a stale upload, both old.
	orphanOut := st.ProcessedPath(NewID())
	orphanIn := st.UploadPath(NewID(), "mp4")
	os.WriteFile(orphanOut, []byte("x"), 0o644)
	os.WriteFile(orphanIn, []byte("x"), 0o644)
	old := now.Add(-2 * time.Hour)
	os.Chtimes(orphanOut, old, old)
	os.Chtimes(orphanIn, old, old)
	// A fresh upload (in progress) must survive.
	fresh := st.UploadPath(NewID(), "mp4")
	os.WriteFile(fresh, []byte("x"), 0o644)
	os.Chtimes(fresh, now, now)

	advance(30 * time.Minute)
	if n := m.Cleanup(); n != 0 {
		t.Fatalf("job removed before TTL: %d", n)
	}
	if !exists(st.ProcessedPath(j.ID)) {
		t.Fatal("result removed before TTL")
	}
	if exists(orphanOut) || exists(orphanIn) {
		t.Fatal("old orphan files must be removed")
	}
	if !exists(fresh) {
		t.Fatal("fresh upload must be kept")
	}

	advance(31 * time.Minute)
	if n := m.Cleanup(); n != 1 {
		t.Fatalf("Cleanup removed %d jobs, want 1", n)
	}
	if _, ok := m.Get(j.ID); ok {
		t.Fatal("expired job still registered")
	}
	if exists(st.ProcessedPath(j.ID)) {
		t.Fatal("expired result still on disk")
	}
}

func TestShutdownWaitsForRunningAndFailsQueued(t *testing.T) {
	conv := &fakeConverter{block: make(chan struct{})}
	m, st := newTestManager(t, conv, 1, 10)
	m.Start()

	running, queued := newJob(t, st), newJob(t, st)
	m.Submit(running)
	waitStatus(t, m, running.ID, StatusProcessing)
	m.Submit(queued)

	done := make(chan error)
	go func() { done <- m.Shutdown(context.Background()) }()

	time.Sleep(50 * time.Millisecond)
	if err := m.Submit(newJob(t, st)); !errors.Is(err, ErrShuttingDown) {
		t.Fatalf("Submit during shutdown = %v", err)
	}
	select {
	case <-done:
		t.Fatal("Shutdown returned while a job was still running")
	default:
	}
	close(conv.block)
	if err := <-done; err != nil {
		t.Fatal(err)
	}
	if j, _ := m.Get(running.ID); j.Status != StatusCompleted {
		t.Fatalf("running job: %s", j.Status)
	}
	if j, _ := m.Get(queued.ID); j.Status != StatusFailed || exists(queued.InputPath) {
		t.Fatalf("queued job: %+v", j)
	}
}

func TestShutdownTimeoutCancelsConversion(t *testing.T) {
	conv := &fakeConverter{block: make(chan struct{})} // never released
	m, st := newTestManager(t, conv, 1, 10)
	m.Start()
	j := newJob(t, st)
	m.Submit(j)
	waitStatus(t, m, j.ID, StatusProcessing)

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()
	if err := m.Shutdown(ctx); !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("Shutdown = %v", err)
	}
	if got, _ := m.Get(j.ID); got.Status != StatusFailed {
		t.Fatalf("status = %s, want failed", got.Status)
	}
}

func TestIDs(t *testing.T) {
	seen := map[string]bool{}
	for range 1000 {
		id := NewID()
		if !ValidID(id) || seen[id] || id[14] != '4' {
			t.Fatalf("bad id %q", id)
		}
		seen[id] = true
	}
	for _, bad := range []string{"", "../etc/passwd", "11111111-2222-4333-8444-55555555555Z", "x"} {
		if ValidID(bad) {
			t.Fatalf("ValidID(%q) = true", bad)
		}
	}
}
