// Command server runs the video-compressor HTTP service.
package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"syscall"
	"time"

	"github.com/vc-microservice/backend/internal/api"
	"github.com/vc-microservice/backend/internal/config"
	"github.com/vc-microservice/backend/internal/ffmpeg"
	"github.com/vc-microservice/backend/internal/jobs"
	"github.com/vc-microservice/backend/internal/storage"
)

func main() {
	if err := run(); err != nil {
		slog.Error("fatal", "err", err)
		os.Exit(1)
	}
}

func run() error {
	level := slog.LevelInfo
	if os.Getenv("LOG_LEVEL") == "debug" {
		level = slog.LevelDebug
	}
	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level}))
	slog.SetDefault(log)

	cfg, err := config.FromEnv()
	if err != nil {
		return fmt.Errorf("config: %w", err)
	}
	if _, err := exec.LookPath(cfg.FFmpegBin); err != nil {
		log.Warn("ffmpeg not found in PATH, jobs will fail", "bin", cfg.FFmpegBin)
	}

	store, err := storage.New(cfg.DataDir)
	if err != nil {
		return err
	}
	conv := &ffmpeg.Runner{
		Bin: cfg.FFmpegBin, CRF: cfg.CRF, Preset: cfg.Preset,
		Timeout: cfg.FFmpegTimeout, Logger: log.With("component", "ffmpeg"),
	}
	mgr, err := jobs.NewManager(jobs.Options{
		Workers: cfg.Workers, QueueSize: cfg.QueueSize, FileTTL: cfg.FileTTL,
		Converter: conv, Storage: store, Logger: log.With("component", "jobs"),
	})
	if err != nil {
		return err
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	mgr.Start()
	mgr.Cleanup() // remove leftovers from a previous run right away
	go mgr.RunCleanup(ctx, cfg.CleanupInterval)

	srv := &http.Server{
		Addr: fmt.Sprintf(":%d", cfg.Port),
		Handler: (&api.Server{
			Jobs: mgr, Storage: store, MaxUploadBytes: cfg.MaxUploadBytes,
			FFmpegBin: cfg.FFmpegBin, Logger: log,
		}).Handler(),
		// No ReadTimeout/WriteTimeout: a 200 MB upload on a slow link may take
		// minutes. Slowloris is mitigated by ReadHeaderTimeout and by nginx.
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       120 * time.Second,
		ErrorLog:          slog.NewLogLogger(log.Handler(), slog.LevelWarn),
	}

	errCh := make(chan error, 1)
	go func() {
		log.Info("http server listening", "addr", srv.Addr, "workers", cfg.Workers,
			"queue_size", cfg.QueueSize, "max_upload_mb", cfg.MaxUploadBytes>>20,
			"ffmpeg_timeout", cfg.FFmpegTimeout.String(), "file_ttl", cfg.FileTTL.String())
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
		close(errCh)
	}()

	select {
	case err := <-errCh:
		if err != nil {
			return err
		}
	case <-ctx.Done():
	}
	stop() // a second signal now kills the process immediately

	log.Info("shutting down", "timeout", cfg.ShutdownTimeout.String())
	shCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()

	// 1) stop accepting connections and let in-flight requests (uploads) finish;
	// 2) stop the worker pool, waiting for running conversions within the same budget.
	if err := srv.Shutdown(shCtx); err != nil {
		log.Warn("http shutdown", "err", err)
	}
	if err := mgr.Shutdown(shCtx); err != nil {
		log.Warn("worker pool shutdown", "err", err)
	}
	log.Info("bye")
	return nil
}
