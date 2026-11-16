package config

import (
	"strings"
	"testing"
	"time"
)

func env(m map[string]string) func(string) (string, bool) {
	return func(k string) (string, bool) { v, ok := m[k]; return v, ok }
}

func TestLoadDefaults(t *testing.T) {
	c, err := Load(env(nil))
	if err != nil {
		t.Fatal(err)
	}
	if c != Defaults() {
		t.Fatalf("got %+v, want defaults %+v", c, Defaults())
	}
	if c.MaxUploadBytes != 200*1024*1024 || c.Workers != 2 || c.QueueSize != 100 {
		t.Fatalf("unexpected defaults: %+v", c)
	}
}

func TestLoadOverrides(t *testing.T) {
	c, err := Load(env(map[string]string{
		"PORT": "9000", "WORKERS": "4", "QUEUE_SIZE": "10", "MAX_UPLOAD_MB": "50",
		"FFMPEG_TIMEOUT": "90s", "FILE_TTL": "2h", "DATA_DIR": "/tmp/x",
		"CRF": "28", "PRESET": "fast", "CLEANUP_INTERVAL": "1m",
	}))
	if err != nil {
		t.Fatal(err)
	}
	want := Defaults()
	want.Port, want.Workers, want.QueueSize = 9000, 4, 10
	want.MaxUploadBytes = 50 << 20
	want.FFmpegTimeout, want.FileTTL, want.CleanupInterval = 90*time.Second, 2*time.Hour, time.Minute
	want.DataDir, want.CRF, want.Preset = "/tmp/x", 28, "fast"
	if c != want {
		t.Fatalf("got %+v\nwant %+v", c, want)
	}
}

func TestLoadEmptyValuesUseDefaults(t *testing.T) {
	c, err := Load(env(map[string]string{"WORKERS": "", "PRESET": "  "}))
	if err != nil || c.Workers != 2 || c.Preset != "veryfast" {
		t.Fatalf("c=%+v err=%v", c, err)
	}
}

func TestLoadInvalid(t *testing.T) {
	_, err := Load(env(map[string]string{
		"WORKERS": "0", "PORT": "abc", "FFMPEG_TIMEOUT": "ten", "CRF": "99", "PRESET": "turbo",
	}))
	if err == nil {
		t.Fatal("expected error")
	}
	for _, key := range []string{"WORKERS", "PORT", "FFMPEG_TIMEOUT", "CRF", "PRESET"} {
		if !strings.Contains(err.Error(), key) {
			t.Errorf("error does not mention %s: %v", key, err)
		}
	}
}
