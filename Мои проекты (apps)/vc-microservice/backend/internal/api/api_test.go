package api

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/vc-microservice/backend/internal/ffmpeg"
	"github.com/vc-microservice/backend/internal/jobs"
	"github.com/vc-microservice/backend/internal/storage"
)

type copyConverter struct{ block chan struct{} }

func (c copyConverter) Convert(ctx context.Context, in, out string) error {
	if c.block != nil {
		select {
		case <-c.block:
		case <-ctx.Done():
			return ctx.Err()
		}
	}
	return os.WriteFile(out, []byte("small"), 0o644)
}

type env struct {
	srv   *httptest.Server
	mgr   *jobs.Manager
	store *storage.Storage
	dir   string
}

func setup(t *testing.T, conv ffmpeg.Converter, maxBytes int64, queue int, start bool) *env {
	t.Helper()
	dir := t.TempDir()
	st, err := storage.New(dir)
	if err != nil {
		t.Fatal(err)
	}
	log := slog.New(slog.NewTextHandler(io.Discard, nil))
	mgr, err := jobs.NewManager(jobs.Options{
		Workers: 1, QueueSize: queue, FileTTL: time.Hour, Converter: conv, Storage: st, Logger: log,
	})
	if err != nil {
		t.Fatal(err)
	}
	if start {
		mgr.Start()
	}
	s := &Server{Jobs: mgr, Storage: st, MaxUploadBytes: maxBytes, FFmpegBin: "sh", Logger: log}
	ts := httptest.NewServer(s.Handler())
	t.Cleanup(func() {
		ts.Close()
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		mgr.Shutdown(ctx)
	})
	return &env{srv: ts, mgr: mgr, store: st, dir: dir}
}

var mp4Head = []byte("\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2avc1mp41")

func multipartBody(t *testing.T, field, filename string, content []byte) (*bytes.Buffer, string) {
	t.Helper()
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	w.WriteField("comment", "ignored field before the file")
	if field != "" {
		fw, _ := w.CreateFormFile(field, filename)
		fw.Write(content)
	}
	w.Close()
	return &buf, w.FormDataContentType()
}

func upload(t *testing.T, e *env, filename string, content []byte) (*http.Response, map[string]any) {
	t.Helper()
	body, ct := multipartBody(t, "file", filename, content)
	resp, err := http.Post(e.srv.URL+"/api/jobs", ct, body)
	if err != nil {
		t.Fatal(err)
	}
	return resp, decode(t, resp)
}

func decode(t *testing.T, resp *http.Response) map[string]any {
	t.Helper()
	defer resp.Body.Close()
	var m map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&m); err != nil {
		t.Fatalf("status %d: response is not JSON: %v", resp.StatusCode, err)
	}
	return m
}

func get(t *testing.T, url string) (*http.Response, map[string]any) {
	t.Helper()
	client := &http.Client{CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	resp, err := client.Get(url)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode == http.StatusFound {
		resp.Body.Close()
		return resp, nil
	}
	return resp, decode(t, resp)
}

func pollStatus(t *testing.T, e *env, id string, want string) map[string]any {
	t.Helper()
	deadline := time.Now().Add(30 * time.Second)
	var body map[string]any
	for time.Now().Before(deadline) {
		_, body = get(t, e.srv.URL+"/api/jobs/"+id)
		if body["status"] == want {
			return body
		}
		if body["status"] == "failed" && want != "failed" {
			t.Fatalf("job failed: %v", body["error"])
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatalf("job %s: last status %v, want %s", id, body["status"], want)
	return nil
}

func TestUploadLifecycle(t *testing.T) {
	block := make(chan struct{})
	e := setup(t, copyConverter{block: block}, 1<<20, 10, true)

	content := append(append([]byte{}, mp4Head...), bytes.Repeat([]byte{0xAB}, 4096)...)
	resp, body := upload(t, e, "../../My Clip.MP4", content)
	if resp.StatusCode != http.StatusAccepted {
		t.Fatalf("status %d: %v", resp.StatusCode, body)
	}
	id, _ := body["id"].(string)
	if !jobs.ValidID(id) || body["status"] != "queued" {
		t.Fatalf("bad 202 body: %v", body)
	}
	if resp.Header.Get("X-Request-ID") == "" {
		t.Error("missing X-Request-ID")
	}
	// The upload is stored under the job ID with a normalized extension only.
	if _, err := os.Stat(e.store.UploadPath(id, "mp4")); err != nil {
		t.Fatalf("upload not stored by id: %v", err)
	}

	st := pollStatus(t, e, id, "processing")
	if st["download_url"] != nil || st["size_out"] != nil || st["finished_at"] != nil {
		t.Fatalf("in-progress job must have null download_url/size_out/finished_at: %v", st)
	}
	r, b := get(t, e.srv.URL+"/api/jobs/"+id+"/download")
	if r.StatusCode != http.StatusConflict || b["code"] != CodeNotReady {
		t.Fatalf("download before ready: %d %v", r.StatusCode, b)
	}

	close(block)
	st = pollStatus(t, e, id, "completed")
	want := map[string]any{
		"original_name": "My Clip.MP4",
		"size_in":       float64(len(content)),
		"size_out":      float64(len("small")),
		"download_url":  "/files/processed/" + id + ".mp4",
		"error":         nil,
	}
	for k, v := range want {
		if st[k] != v {
			t.Errorf("%s = %v, want %v", k, st[k], v)
		}
	}
	for _, k := range []string{"created_at", "finished_at"} {
		if _, err := time.Parse(time.RFC3339Nano, st[k].(string)); err != nil {
			t.Errorf("%s: %v", k, err)
		}
	}

	r, _ = get(t, e.srv.URL+"/api/jobs/"+id+"/download")
	if r.StatusCode != http.StatusFound || r.Header.Get("Location") != "/files/processed/"+id+".mp4" {
		t.Fatalf("download: %d Location=%q", r.StatusCode, r.Header.Get("Location"))
	}
}

func TestUploadValidation(t *testing.T) {
	e := setup(t, copyConverter{}, 64<<10, 10, false)
	big := append(append([]byte{}, mp4Head...), make([]byte, 64<<10)...)

	tests := []struct {
		name     string
		filename string
		content  []byte
		status   int
		code     string
	}{
		{"wrong extension", "notes.txt", []byte("hello"), 415, CodeUnsupportedMedia},
		{"image renamed to mp4", "cat.mp4", []byte("\x89PNG\r\n\x1a\n\x00\x00\x00\x0dIHDR"), 415, CodeUnsupportedMedia},
		{"mkv bytes as mov", "a.mov", []byte{0x1A, 0x45, 0xDF, 0xA3, 0, 0, 0, 0, 0, 0, 0, 0}, 415, CodeUnsupportedMedia},
		{"too large", "big.mp4", big, 413, CodeFileTooLarge},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, body := upload(t, e, tt.filename, tt.content)
			if resp.StatusCode != tt.status || body["code"] != tt.code || body["error"] == "" {
				t.Fatalf("got %d %v, want %d %s", resp.StatusCode, body, tt.status, tt.code)
			}
		})
	}

	// Rejected uploads leave nothing behind.
	if es, _ := e.store.List(storage.UploadedDir); len(es) != 0 {
		t.Fatalf("leftover uploads: %v", es)
	}
}

func TestUploadBadRequests(t *testing.T) {
	e := setup(t, copyConverter{}, 1<<20, 10, false)

	resp, err := http.Post(e.srv.URL+"/api/jobs", "application/json", strings.NewReader(`{}`))
	if err != nil {
		t.Fatal(err)
	}
	if b := decode(t, resp); resp.StatusCode != 400 || b["code"] != CodeBadRequest {
		t.Fatalf("non-multipart: %d %v", resp.StatusCode, b)
	}

	body, ct := multipartBody(t, "", "", nil)
	resp, _ = http.Post(e.srv.URL+"/api/jobs", ct, body)
	if b := decode(t, resp); resp.StatusCode != 400 {
		t.Fatalf("missing file: %d %v", resp.StatusCode, b)
	}
}

func TestContentLengthPrecheck(t *testing.T) {
	e := setup(t, copyConverter{}, 1<<10, 10, false)
	req, _ := http.NewRequest(http.MethodPost, e.srv.URL+"/api/jobs", bytes.NewReader(make([]byte, 3<<20)))
	req.Header.Set("Content-Type", "multipart/form-data; boundary=x")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	if b := decode(t, resp); resp.StatusCode != 413 || b["code"] != CodeFileTooLarge {
		t.Fatalf("got %d %v", resp.StatusCode, b)
	}
}

func TestQueueFull429(t *testing.T) {
	e := setup(t, copyConverter{}, 1<<20, 1, false) // workers not started

	if resp, b := upload(t, e, "a.mp4", mp4Head); resp.StatusCode != 202 {
		t.Fatalf("first: %d %v", resp.StatusCode, b)
	}
	resp, b := upload(t, e, "b.mp4", mp4Head)
	if resp.StatusCode != 429 || b["code"] != CodeQueueFull {
		t.Fatalf("second: %d %v", resp.StatusCode, b)
	}
}

func TestNotFound(t *testing.T) {
	e := setup(t, copyConverter{}, 1<<20, 1, false)
	for _, p := range []string{
		"/api/jobs/" + jobs.NewID(),
		"/api/jobs/not-a-uuid",
		"/api/jobs/" + jobs.NewID() + "/download",
		"/api/unknown",
	} {
		resp, b := get(t, e.srv.URL+p)
		if resp.StatusCode != 404 || b["code"] != CodeNotFound {
			t.Errorf("%s: %d %v", p, resp.StatusCode, b)
		}
	}
}

func TestFailedJobDownload409(t *testing.T) {
	e := setup(t, failing{}, 1<<20, 10, true)
	_, b := upload(t, e, "a.mp4", mp4Head)
	id := b["id"].(string)
	st := pollStatus(t, e, id, "failed")
	if st["error"] != "ffmpeg: boom" || st["download_url"] != nil {
		t.Fatalf("failed job body: %v", st)
	}
	resp, body := get(t, e.srv.URL+"/api/jobs/"+id+"/download")
	if resp.StatusCode != 409 || body["code"] != CodeJobFailed {
		t.Fatalf("got %d %v", resp.StatusCode, body)
	}
}

type failing struct{}

func (failing) Convert(context.Context, string, string) error { return errString("ffmpeg: boom") }

type errString string

func (e errString) Error() string { return string(e) }

func TestHealth(t *testing.T) {
	e := setup(t, copyConverter{}, 1<<20, 5, false)
	resp, b := get(t, e.srv.URL+"/api/health")
	if resp.StatusCode != 200 || b["status"] != "ok" {
		t.Fatalf("got %d %v", resp.StatusCode, b)
	}
}

func TestSanitizeName(t *testing.T) {
	cases := map[string]string{
		"../../etc/passwd.mp4": "passwd.mp4",
		`C:\Users\me\v.mov`:    "v.mov",
		"a\x00b\nc.mkv":        "abc.mkv",
		"нормальное имя.mp4":   "нормальное имя.mp4",
	}
	for in, want := range cases {
		if got := sanitizeName(in); got != want {
			t.Errorf("sanitizeName(%q) = %q, want %q", in, got, want)
		}
	}
}

// TestIntegrationRealFFmpeg runs the whole pipeline with the real ffmpeg on
// testdata/sample.mov (generate with `make testdata`). Skipped if either is missing.
func TestIntegrationRealFFmpeg(t *testing.T) {
	bin, err := exec.LookPath("ffmpeg")
	if err != nil {
		t.Skip("ffmpeg not installed")
	}
	sample, err := os.ReadFile(filepath.Join("..", "..", "testdata", "sample.mov"))
	if err != nil {
		t.Skip("testdata/sample.mov missing; run `make testdata`")
	}
	conv := &ffmpeg.Runner{Bin: bin, CRF: 23, Preset: "veryfast", Timeout: time.Minute}
	e := setup(t, conv, 10<<20, 10, true)

	resp, b := upload(t, e, "sample.mov", sample)
	if resp.StatusCode != 202 {
		t.Fatalf("upload: %d %v", resp.StatusCode, b)
	}
	id := b["id"].(string)
	st := pollStatus(t, e, id, "completed")
	if out := st["size_out"].(float64); out <= 0 || out >= float64(len(sample)) {
		t.Fatalf("size_out %v not smaller than size_in %d", out, len(sample))
	}
	data, err := os.ReadFile(e.store.ProcessedPath(id))
	if err != nil {
		t.Fatal(err)
	}
	if !storage.MatchesExt("mp4", data) {
		t.Fatal("output is not an MP4")
	}
	if m, d := bytes.Index(data, []byte("moov")), bytes.Index(data, []byte("mdat")); m < 0 || m > d {
		t.Fatal("faststart: moov must precede mdat")
	}
	if _, err := os.Stat(e.store.UploadPath(id, "mov")); !os.IsNotExist(err) {
		t.Fatal("source must be deleted after conversion")
	}
}
