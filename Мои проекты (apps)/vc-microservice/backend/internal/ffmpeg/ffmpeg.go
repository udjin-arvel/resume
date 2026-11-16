// Package ffmpeg wraps the ffmpeg binary behind a small, mockable interface.
package ffmpeg

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"time"
)

// Converter turns an input video into a web-friendly MP4.
type Converter interface {
	Convert(ctx context.Context, in, out string) error
}

// Runner calls the real ffmpeg binary.
type Runner struct {
	Bin     string        // path or name of the ffmpeg binary
	CRF     int           // x264 quality
	Preset  string        // x264 preset
	Timeout time.Duration // hard limit per conversion
	Logger  *slog.Logger
}

// stderrTail is how much of ffmpeg's stderr is kept for logs and errors.
const stderrTail = 4 << 10

// Args builds the ffmpeg argument list. Arguments are passed as a slice to
// exec — never through a shell — so file names cannot inject options or commands.
// Paths are server-generated, but "-i" + absolute path keeps even odd names safe.
func (r *Runner) Args(in, out string) []string {
	return []string{
		"-hide_banner", "-nostdin", "-nostats", "-loglevel", "error",
		"-y", "-i", in,
		"-c:v", "libx264", "-preset", r.Preset, "-crf", strconv.Itoa(r.CRF),
		// Browser compatibility: 8-bit 4:2:0 and even dimensions (required by
		// yuv420p) — otherwise 10-bit or odd-sized sources produce unplayable files.
		"-pix_fmt", "yuv420p", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
		"-c:a", "aac", "-b:a", "128k",
		"-movflags", "+faststart",
		// Output goes to a temporary name without .mp4, so the muxer is explicit.
		"-f", "mp4",
		out,
	}
}

// Convert runs ffmpeg with a timeout. On failure the returned error carries the
// tail of stderr so the client gets a meaningful message.
func (r *Runner) Convert(ctx context.Context, in, out string) error {
	if r.Timeout > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, r.Timeout)
		defer cancel()
	}

	cmd := exec.CommandContext(ctx, r.Bin, r.Args(in, out)...)
	// On cancel: SIGKILL (the CommandContext default), and do not hang forever
	// waiting for pipes held open by stray child processes.
	cmd.WaitDelay = 5 * time.Second
	stderr := &tailBuffer{max: stderrTail}
	cmd.Stderr = stderr

	start := time.Now()
	err := cmd.Run()
	log := r.logger().With("in", in, "duration", time.Since(start).Round(time.Millisecond))

	if err == nil {
		log.Debug("ffmpeg finished")
		return nil
	}

	tail := strings.TrimSpace(stderr.String())
	switch {
	case errors.Is(ctx.Err(), context.DeadlineExceeded):
		log.Warn("ffmpeg timed out", "timeout", r.Timeout, "stderr", tail)
		return fmt.Errorf("ffmpeg timed out after %s", r.Timeout)
	case errors.Is(ctx.Err(), context.Canceled):
		log.Warn("ffmpeg canceled")
		return errors.New("conversion canceled")
	}
	log.Error("ffmpeg failed", "err", err, "stderr", tail)
	if line := lastLine(tail); line != "" {
		return fmt.Errorf("ffmpeg: %s", line)
	}
	return fmt.Errorf("ffmpeg: %w", err)
}

func (r *Runner) logger() *slog.Logger {
	if r.Logger != nil {
		return r.Logger
	}
	return slog.Default()
}

func lastLine(s string) string {
	s = strings.TrimSpace(s)
	if i := strings.LastIndexByte(s, '\n'); i >= 0 {
		s = strings.TrimSpace(s[i+1:])
	}
	const max = 300
	if len(s) > max {
		s = s[:max] + "…"
	}
	return s
}

// tailBuffer is an io.Writer that keeps only the last max bytes written,
// so a chatty ffmpeg cannot grow memory unboundedly.
type tailBuffer struct {
	mu  sync.Mutex
	max int
	buf []byte
}

func (t *tailBuffer) Write(p []byte) (int, error) {
	t.mu.Lock()
	defer t.mu.Unlock()
	n := len(p)
	if len(p) >= t.max {
		t.buf = append(t.buf[:0], p[len(p)-t.max:]...)
		return n, nil
	}
	if over := len(t.buf) + len(p) - t.max; over > 0 {
		t.buf = append(t.buf[:0], t.buf[over:]...)
	}
	t.buf = append(t.buf, p...)
	return n, nil
}

func (t *tailBuffer) String() string {
	t.mu.Lock()
	defer t.mu.Unlock()
	return string(t.buf)
}
