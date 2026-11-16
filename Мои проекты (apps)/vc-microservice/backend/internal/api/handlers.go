// Package api exposes the HTTP interface of the service.
package api

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"mime"
	"mime/multipart"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/vc-microservice/backend/internal/jobs"
	"github.com/vc-microservice/backend/internal/storage"
)

// Machine-readable error codes.
const (
	CodeBadRequest       = "BAD_REQUEST"
	CodeFileTooLarge     = "FILE_TOO_LARGE"
	CodeUnsupportedMedia = "UNSUPPORTED_MEDIA_TYPE"
	CodeQueueFull        = "QUEUE_FULL"
	CodeShuttingDown     = "SHUTTING_DOWN"
	CodeNotFound         = "NOT_FOUND"
	CodeNotReady         = "JOB_NOT_READY"
	CodeJobFailed        = "JOB_FAILED"
	CodeInternal         = "INTERNAL"
)

// multipartOverhead is the allowance for multipart boundaries and headers on
// top of the file itself when limiting the request body.
const multipartOverhead = 1 << 20

// Server holds handler dependencies.
type Server struct {
	Jobs           *jobs.Manager
	Storage        *storage.Storage
	MaxUploadBytes int64
	FFmpegBin      string
	Logger         *slog.Logger
}

// Handler builds the router with middleware.
func (s *Server) Handler() http.Handler {
	if s.Logger == nil {
		s.Logger = slog.Default()
	}
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/jobs", s.createJob)
	mux.HandleFunc("GET /api/jobs/{id}", s.getJob)
	mux.HandleFunc("GET /api/jobs/{id}/download", s.downloadJob)
	mux.HandleFunc("GET /api/health", s.health)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusNotFound, CodeNotFound, "route not found")
	})
	return chain(mux, requestID(s.Logger), accessLog(s.Logger), recoverer(s.Logger))
}

// jobResponse is the public JSON representation of a job.
type jobResponse struct {
	ID           string      `json:"id"`
	Status       jobs.Status `json:"status"`
	OriginalName string      `json:"original_name"`
	SizeIn       int64       `json:"size_in"`
	SizeOut      *int64      `json:"size_out"`
	DownloadURL  *string     `json:"download_url"`
	Error        *string     `json:"error"`
	CreatedAt    time.Time   `json:"created_at"`
	FinishedAt   *time.Time  `json:"finished_at"`
}

func toResponse(j jobs.Job) jobResponse {
	r := jobResponse{
		ID:           j.ID,
		Status:       j.Status,
		OriginalName: j.OriginalName,
		SizeIn:       j.SizeIn,
		CreatedAt:    j.CreatedAt.UTC(),
	}
	if j.Status == jobs.StatusCompleted {
		u := storage.PublicURL(j.ID)
		size := j.SizeOut
		r.DownloadURL, r.SizeOut = &u, &size
	}
	if j.Error != "" {
		e := j.Error
		r.Error = &e
	}
	if !j.FinishedAt.IsZero() {
		t := j.FinishedAt.UTC()
		r.FinishedAt = &t
	}
	return r
}

// createJob streams a multipart upload straight to disk and enqueues a job.
func (s *Server) createJob(w http.ResponseWriter, r *http.Request) {
	log := loggerFrom(r.Context(), s.Logger)

	// Fail fast before reading a potentially huge body.
	if !s.Jobs.HasCapacity() {
		writeError(w, http.StatusTooManyRequests, CodeQueueFull, "queue is full, try again later")
		return
	}
	limit := s.MaxUploadBytes + multipartOverhead
	if r.ContentLength > limit {
		s.tooLarge(w)
		return
	}
	if mt, _, err := mime.ParseMediaType(r.Header.Get("Content-Type")); err != nil || mt != "multipart/form-data" {
		writeError(w, http.StatusBadRequest, CodeBadRequest, "expected multipart/form-data with a \"file\" field")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, limit)

	// MultipartReader (not ParseMultipartForm) gives a stream: nothing is
	// buffered in memory or spooled to temp files.
	mr, err := r.MultipartReader()
	if err != nil {
		writeError(w, http.StatusBadRequest, CodeBadRequest, "invalid multipart body")
		return
	}
	part, err := nextFilePart(mr)
	if err != nil {
		if isTooLarge(err) {
			s.tooLarge(w)
			return
		}
		writeError(w, http.StatusBadRequest, CodeBadRequest, "missing \"file\" field")
		return
	}
	defer part.Close()

	originalName := sanitizeName(part.FileName())
	ext, ok := storage.NormalizeExt(originalName)
	if !ok {
		writeError(w, http.StatusUnsupportedMediaType, CodeUnsupportedMedia,
			"unsupported file type, allowed: "+strings.Join(storage.AllowedExtensions(), ", "))
		return
	}

	br := bufio.NewReaderSize(part, 64<<10)
	head, err := br.Peek(storage.SniffLen)
	if err != nil && !errors.Is(err, io.EOF) && !errors.Is(err, bufio.ErrBufferFull) {
		if isTooLarge(err) {
			s.tooLarge(w)
			return
		}
		writeError(w, http.StatusBadRequest, CodeBadRequest, "failed to read upload")
		return
	}
	if !storage.MatchesExt(ext, head) {
		writeError(w, http.StatusUnsupportedMediaType, CodeUnsupportedMedia,
			"file content does not look like a ."+ext+" video")
		return
	}

	id := jobs.NewID()
	path := s.Storage.UploadPath(id, ext)
	size, err := saveFile(path, br, s.MaxUploadBytes)
	if err != nil {
		_ = storage.Remove(path)
		switch {
		case isTooLarge(err):
			s.tooLarge(w)
		case errors.Is(err, io.ErrUnexpectedEOF):
			log.Warn("upload aborted by client", "job_id", id)
			writeError(w, http.StatusBadRequest, CodeBadRequest, "upload interrupted")
		default:
			log.Error("save upload", "job_id", id, "err", err)
			writeError(w, http.StatusInternalServerError, CodeInternal, "failed to store file")
		}
		return
	}
	if size == 0 {
		_ = storage.Remove(path)
		writeError(w, http.StatusBadRequest, CodeBadRequest, "empty file")
		return
	}

	job := &jobs.Job{ID: id, OriginalName: originalName, SizeIn: size, InputPath: path}
	if err := s.Jobs.Submit(job); err != nil {
		_ = storage.Remove(path)
		if errors.Is(err, jobs.ErrQueueFull) {
			writeError(w, http.StatusTooManyRequests, CodeQueueFull, "queue is full, try again later")
		} else {
			writeError(w, http.StatusServiceUnavailable, CodeShuttingDown, err.Error())
		}
		return
	}
	log.Info("job accepted", "job_id", id, "original_name", originalName, "size_in", size)
	writeJSON(w, http.StatusAccepted, map[string]any{"id": id, "status": jobs.StatusQueued})
}

func (s *Server) tooLarge(w http.ResponseWriter) {
	writeError(w, http.StatusRequestEntityTooLarge, CodeFileTooLarge,
		fmt.Sprintf("file exceeds %d MB", s.MaxUploadBytes>>20))
}

// errFileTooLarge is returned when the file part alone exceeds the limit.
var errFileTooLarge = errors.New("file too large")

func isTooLarge(err error) bool {
	var mbe *http.MaxBytesError
	return errors.As(err, &mbe) || errors.Is(err, errFileTooLarge)
}

// nextFilePart skips form fields until the "file" part.
func nextFilePart(mr *multipart.Reader) (*multipart.Part, error) {
	for {
		p, err := mr.NextPart()
		if err != nil {
			return nil, err
		}
		if p.FormName() == "file" && p.FileName() != "" {
			return p, nil
		}
		_ = p.Close()
	}
}

// saveFile streams src into a new file, enforcing max bytes for the file itself.
func saveFile(path string, src io.Reader, max int64) (int64, error) {
	f, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		return 0, err
	}
	n, err := io.Copy(f, io.LimitReader(src, max+1))
	if cerr := f.Close(); err == nil {
		err = cerr
	}
	if err != nil {
		return n, err
	}
	if n > max {
		return n, errFileTooLarge
	}
	return n, nil
}

// sanitizeName keeps the client's name for display only: no path components,
// no control characters, bounded length.
func sanitizeName(name string) string {
	if i := strings.LastIndexAny(name, `/\`); i >= 0 {
		name = name[i+1:]
	}
	name = strings.Map(func(r rune) rune {
		if r < 0x20 || r == 0x7f {
			return -1
		}
		return r
	}, name)
	if r := []rune(name); len(r) > 200 {
		name = string(r[:200])
	}
	return name
}

func (s *Server) lookup(w http.ResponseWriter, r *http.Request) (jobs.Job, bool) {
	id := r.PathValue("id")
	if !jobs.ValidID(id) {
		writeError(w, http.StatusNotFound, CodeNotFound, "job not found")
		return jobs.Job{}, false
	}
	j, ok := s.Jobs.Get(id)
	if !ok {
		writeError(w, http.StatusNotFound, CodeNotFound, "job not found")
		return jobs.Job{}, false
	}
	return j, true
}

func (s *Server) getJob(w http.ResponseWriter, r *http.Request) {
	if j, ok := s.lookup(w, r); ok {
		w.Header().Set("Cache-Control", "no-store")
		writeJSON(w, http.StatusOK, toResponse(j))
	}
}

// downloadJob redirects to nginx, which serves the file from the shared volume
// (sendfile, range requests) without the Go process touching the bytes.
func (s *Server) downloadJob(w http.ResponseWriter, r *http.Request) {
	j, ok := s.lookup(w, r)
	if !ok {
		return
	}
	switch j.Status {
	case jobs.StatusCompleted:
		http.Redirect(w, r, storage.PublicURL(j.ID), http.StatusFound)
	case jobs.StatusFailed:
		writeError(w, http.StatusConflict, CodeJobFailed, "job failed: "+j.Error)
	default:
		writeError(w, http.StatusConflict, CodeNotReady, "job is "+string(j.Status))
	}
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	queued, capacity, workers := s.Jobs.Stats()
	if _, err := exec.LookPath(s.FFmpegBin); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{
			"status": "unavailable", "ffmpeg": false, "error": "ffmpeg not found",
		})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "ok",
		"ffmpeg":  true,
		"workers": workers,
		"queue":   map[string]int{"length": queued, "capacity": capacity},
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, code, msg string) {
	writeJSON(w, status, map[string]string{"error": msg, "code": code})
}
