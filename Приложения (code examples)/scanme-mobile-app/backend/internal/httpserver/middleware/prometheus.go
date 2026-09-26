package middleware

import (
	"net/http"
	"strconv"
	"time"

	platformmetrics "scanme/backend/internal/platform/metrics"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
)

func PrometheusHTTP(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if path == "/metrics" || path == "/healthz" || path == "/readyz" {
			next.ServeHTTP(w, r)
			return
		}

		start := time.Now()
		ww := chiMiddleware.NewWrapResponseWriter(w, r.ProtoMajor)

		next.ServeHTTP(ww, r)

		route := chi.RouteContext(r.Context()).RoutePattern()
		if route == "" {
			route = "unknown"
		}

		status := strconv.Itoa(ww.Status())
		platformmetrics.HTTPRequestDurationSeconds.WithLabelValues(r.Method, route, status).Observe(time.Since(start).Seconds())
	})
}
