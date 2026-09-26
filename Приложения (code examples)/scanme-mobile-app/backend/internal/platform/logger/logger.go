package logger

import (
	"log/slog"
	"os"
	"strings"
)

func New(env string, logLevel string) *slog.Logger {
	level := slog.LevelInfo
	switch strings.ToLower(strings.TrimSpace(logLevel)) {
	case "debug":
		level = slog.LevelDebug
	case "warn", "warning":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	}

	opts := &slog.HandlerOptions{
		Level: level,
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			switch a.Key {
			case "password", "refresh_token", "access_token", "authorization":
				return slog.String(a.Key, "[redacted]")
			case "email", "device_id", "deviceId":
				return slog.String(a.Key, "[redacted]")
			default:
				return a
			}
		},
	}

	if env == "development" {
		return slog.New(slog.NewTextHandler(os.Stdout, opts))
	}

	return slog.New(slog.NewJSONHandler(os.Stdout, opts))
}
