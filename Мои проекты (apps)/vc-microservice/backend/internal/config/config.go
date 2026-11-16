// Package config loads service settings from environment variables.
package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds all runtime settings of the service.
type Config struct {
	Port            int
	Workers         int
	QueueSize       int
	MaxUploadBytes  int64
	FFmpegTimeout   time.Duration
	FileTTL         time.Duration
	CleanupInterval time.Duration
	ShutdownTimeout time.Duration
	DataDir         string
	CRF             int
	Preset          string
	FFmpegBin       string
}

// Defaults returns the configuration used when no env vars are set.
func Defaults() Config {
	return Config{
		Port:            8080,
		Workers:         2,
		QueueSize:       100,
		MaxUploadBytes:  200 << 20,
		FFmpegTimeout:   10 * time.Minute,
		FileTTL:         time.Hour,
		CleanupInterval: 10 * time.Minute,
		ShutdownTimeout: 30 * time.Second,
		DataDir:         "/data",
		CRF:             23,
		Preset:          "veryfast",
		FFmpegBin:       "ffmpeg",
	}
}

var validPresets = map[string]bool{
	"ultrafast": true, "superfast": true, "veryfast": true, "faster": true, "fast": true,
	"medium": true, "slow": true, "slower": true, "veryslow": true,
}

// FromEnv reads configuration from the process environment.
func FromEnv() (Config, error) { return Load(os.LookupEnv) }

// Load builds a Config using the given lookup function (os.LookupEnv in production,
// a map in tests). All problems are collected and returned together.
func Load(lookup func(string) (string, bool)) (Config, error) {
	c := Defaults()
	var errs []error

	get := func(key string) (string, bool) {
		v, ok := lookup(key)
		v = strings.TrimSpace(v)
		return v, ok && v != ""
	}
	intVar := func(key string, dst *int, min, max int) {
		v, ok := get(key)
		if !ok {
			return
		}
		n, err := strconv.Atoi(v)
		if err != nil || n < min || n > max {
			errs = append(errs, fmt.Errorf("%s: want integer in [%d, %d], got %q", key, min, max, v))
			return
		}
		*dst = n
	}
	durVar := func(key string, dst *time.Duration) {
		v, ok := get(key)
		if !ok {
			return
		}
		d, err := time.ParseDuration(v)
		if err != nil || d <= 0 {
			errs = append(errs, fmt.Errorf("%s: want positive duration (e.g. 10m), got %q", key, v))
			return
		}
		*dst = d
	}

	intVar("PORT", &c.Port, 1, 65535)
	intVar("WORKERS", &c.Workers, 1, 64)
	intVar("QUEUE_SIZE", &c.QueueSize, 1, 100000)
	maxMB := int(c.MaxUploadBytes >> 20)
	intVar("MAX_UPLOAD_MB", &maxMB, 1, 100000)
	c.MaxUploadBytes = int64(maxMB) << 20
	intVar("CRF", &c.CRF, 0, 51)
	durVar("FFMPEG_TIMEOUT", &c.FFmpegTimeout)
	durVar("FILE_TTL", &c.FileTTL)
	durVar("CLEANUP_INTERVAL", &c.CleanupInterval)
	durVar("SHUTDOWN_TIMEOUT", &c.ShutdownTimeout)

	if v, ok := get("DATA_DIR"); ok {
		c.DataDir = v
	}
	if v, ok := get("FFMPEG_BIN"); ok {
		c.FFmpegBin = v
	}
	if v, ok := get("PRESET"); ok {
		if !validPresets[v] {
			errs = append(errs, fmt.Errorf("PRESET: unknown x264 preset %q", v))
		} else {
			c.Preset = v
		}
	}

	return c, errors.Join(errs...)
}
