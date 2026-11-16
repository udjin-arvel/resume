package ffmpeg

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strings"
	"testing"
	"time"
)

func TestArgs(t *testing.T) {
	r := &Runner{CRF: 23, Preset: "veryfast"}
	in := "/data/uploaded/x; rm -rf /.mov"
	args := r.Args(in, "/data/processed/x.mp4.part")

	// The input path is a single argv element right after -i: no shell, no splitting.
	i := slices.Index(args, "-i")
	if i < 0 || args[i+1] != in {
		t.Fatalf("input not passed as a single argument: %q", args)
	}
	if args[len(args)-1] != "/data/processed/x.mp4.part" {
		t.Fatalf("output must be last: %q", args)
	}
	joined := strings.Join(args, " ")
	for _, want := range []string{
		"-c:v libx264", "-preset veryfast", "-crf 23",
		"-c:a aac", "-b:a 128k", "-movflags +faststart", "-f mp4", "-y",
	} {
		if !strings.Contains(joined, want) {
			t.Errorf("args missing %q: %s", want, joined)
		}
	}
}

func TestTailBuffer(t *testing.T) {
	b := &tailBuffer{max: 8}
	b.Write([]byte("hello "))
	b.Write([]byte("world"))
	if got := b.String(); got != "lo world" {
		t.Fatalf("got %q", got)
	}
	b.Write([]byte("0123456789abc"))
	if got := b.String(); got != "56789abc" {
		t.Fatalf("got %q", got)
	}
}

func TestLastLine(t *testing.T) {
	if got := lastLine("a\nb\n  c: bad input \n"); got != "c: bad input" {
		t.Fatalf("got %q", got)
	}
}

// Integration tests below need a real ffmpeg with libx264; they are skipped otherwise.

func requireFFmpeg(t *testing.T) string {
	t.Helper()
	bin, err := exec.LookPath("ffmpeg")
	if err != nil {
		t.Skip("ffmpeg not installed")
	}
	return bin
}

func TestConvertReal(t *testing.T) {
	bin := requireFFmpeg(t)
	dir := t.TempDir()
	in := filepath.Join(dir, "in.mov")
	// 1 s of 321x241 test pattern (odd size on purpose) + tone, MJPEG/PCM in MOV.
	gen := exec.Command(bin, "-hide_banner", "-loglevel", "error", "-y",
		"-f", "lavfi", "-i", "testsrc=size=321x241:rate=25:duration=1",
		"-f", "lavfi", "-i", "sine=frequency=440:duration=1",
		"-c:v", "mjpeg", "-q:v", "2", "-c:a", "pcm_s16le", in)
	if out, err := gen.CombinedOutput(); err != nil {
		t.Skipf("cannot generate sample (ffmpeg without lavfi?): %v %s", err, out)
	}

	r := &Runner{Bin: bin, CRF: 23, Preset: "veryfast", Timeout: time.Minute}
	out := filepath.Join(dir, "out.mp4.part")
	if err := r.Convert(context.Background(), in, out); err != nil {
		if strings.Contains(err.Error(), "libx264") {
			t.Skipf("ffmpeg built without libx264: %v", err)
		}
		t.Fatal(err)
	}
	data, err := os.ReadFile(out)
	if err != nil {
		t.Fatal(err)
	}
	// faststart: the moov atom must come before mdat.
	moov, mdat := strings.Index(string(data), "moov"), strings.Index(string(data), "mdat")
	if moov < 0 || mdat < 0 || moov > mdat {
		t.Fatalf("moov (%d) is not before mdat (%d): faststart not applied", moov, mdat)
	}
}

func TestConvertBadInput(t *testing.T) {
	bin := requireFFmpeg(t)
	dir := t.TempDir()
	in := filepath.Join(dir, "garbage.mp4")
	os.WriteFile(in, []byte("\x00\x00\x00\x20ftypisom-but-garbage-afterwards"), 0o644)
	r := &Runner{Bin: bin, CRF: 23, Preset: "veryfast", Timeout: time.Minute}
	err := r.Convert(context.Background(), in, filepath.Join(dir, "out.part"))
	if err == nil || !strings.HasPrefix(err.Error(), "ffmpeg") {
		t.Fatalf("want ffmpeg error with stderr, got %v", err)
	}
}

func TestConvertTimeout(t *testing.T) {
	if _, err := exec.LookPath("sh"); err != nil {
		t.Skip("no sh")
	}
	// A fake "ffmpeg" that hangs: the runner must kill it when the timeout fires.
	script := filepath.Join(t.TempDir(), "hung-ffmpeg")
	if err := os.WriteFile(script, []byte("#!/bin/sh\nexec sleep 30\n"), 0o755); err != nil {
		t.Fatal(err)
	}
	r := &Runner{Bin: script, CRF: 23, Preset: "veryfast", Timeout: 200 * time.Millisecond}
	start := time.Now()
	err := r.Convert(context.Background(), "in.mp4", "out.part")
	if err == nil || !strings.Contains(err.Error(), "timed out") {
		t.Fatalf("want timeout error, got %v", err)
	}
	if d := time.Since(start); d > 5*time.Second {
		t.Fatalf("process was not killed promptly: %s", d)
	}
}

func TestConvertCanceled(t *testing.T) {
	script := filepath.Join(t.TempDir(), "hung-ffmpeg")
	if err := os.WriteFile(script, []byte("#!/bin/sh\nexec sleep 30\n"), 0o755); err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	time.AfterFunc(100*time.Millisecond, cancel)
	err := (&Runner{Bin: script}).Convert(ctx, "in", "out")
	if err == nil || !strings.Contains(err.Error(), "canceled") {
		t.Fatalf("want canceled error, got %v", err)
	}
}
