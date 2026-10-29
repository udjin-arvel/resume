package httpserver

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	adminauth "scanme/backend/internal/admin/auth"
	"scanme/backend/internal/analytics"
	"scanme/backend/internal/auth"
	authmw "scanme/backend/internal/httpserver/middleware"
	"scanme/backend/internal/httpserver/response"
	platformpostgres "scanme/backend/internal/platform/postgres"
	platformredis "scanme/backend/internal/platform/redis"
	"scanme/backend/internal/moderation"
	"scanme/backend/internal/product"
	"scanme/backend/internal/reporting"
	"scanme/backend/internal/scan"
	"scanme/backend/internal/substance"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	redisv9 "github.com/redis/go-redis/v9"
)

type Dependencies struct {
	Logger    *slog.Logger
	DB        *pgxpool.Pool
	Redis     *redisv9.Client
	Auth      auth.Handler
	Admin     adminauth.Handler
	Product   product.Handler
	Scan      scan.Handler
	Tokens    auth.TokenService
	Substance  substance.Handler
	Moderation moderation.Handler
	Analytics  analytics.Handler
	Reporting  reporting.Handler
}

func NewRouter(deps Dependencies) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(requestLogger(deps.Logger))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:*", "http://127.0.0.1:*"},
		AllowedMethods:   []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "Idempotency-Key"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(authmw.PrometheusHTTP)

	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		response.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	r.Get("/readyz", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()

		if err := platformpostgres.Ping(ctx, deps.DB); err != nil {
			response.ErrorJSON(w, http.StatusServiceUnavailable, "POSTGRES_UNAVAILABLE", "postgres is not ready")
			return
		}

		if err := platformredis.Ping(ctx, deps.Redis); err != nil {
			response.ErrorJSON(w, http.StatusServiceUnavailable, "REDIS_UNAVAILABLE", "redis is not ready")
			return
		}

		response.JSON(w, http.StatusOK, map[string]string{"status": "ready"})
	})

	r.Handle("/metrics", promhttp.Handler())

	r.Route("/v1", func(r chi.Router) {
		r.Group(func(r chi.Router) {
			r.Use(middleware.Timeout(15 * time.Second))
			r.Get("/ping", func(w http.ResponseWriter, r *http.Request) {
				response.JSON(w, http.StatusOK, map[string]string{"message": "pong"})
			})
			r.Mount("/auth", deps.Auth.Routes())
			r.Mount("/admin/auth", deps.Admin.Routes())
			r.Mount("/substances", deps.Substance.PublicRoutes())
			r.Group(func(r chi.Router) {
				r.Use(authmw.RequireUser(deps.Tokens))
				r.Mount("/scans", deps.Scan.Routes())
				r.Mount("/events", deps.Analytics.Routes())
			})
			r.Group(func(r chi.Router) {
				r.Use(authmw.RequireAdmin(deps.Tokens))
				r.Mount("/admin/products", deps.Product.AdminRoutes())
				r.Mount("/admin/substances", deps.Substance.AdminRoutes())
				r.Mount("/admin/moderation", deps.Moderation.Routes())
				r.Mount("/admin/stats", deps.Reporting.StatsRoutes())
				r.Mount("/admin/users", deps.Reporting.UsersRoutes())
				r.Mount("/admin/audit", deps.Reporting.AuditRoutes())
			})
		})
		r.Group(func(r chi.Router) {
			r.Use(middleware.Timeout(120 * time.Second))
			r.Mount("/products", deps.Product.Routes())
		})
	})

	return r
}

func requestLogger(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

			next.ServeHTTP(ww, r)

			logger.InfoContext(
				r.Context(),
				"http_request",
				"method", r.Method,
				"path", r.URL.Path,
				"status", ww.Status(),
				"bytes", ww.BytesWritten(),
				"duration_ms", time.Since(start).Milliseconds(),
				"request_id", middleware.GetReqID(r.Context()),
			)
		})
	}
}
