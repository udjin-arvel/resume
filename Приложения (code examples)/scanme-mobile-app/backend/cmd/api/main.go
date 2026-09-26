package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"

	adminauth "scanme/backend/internal/admin/auth"
	"scanme/backend/internal/analytics"
	"scanme/backend/internal/auth"
	"scanme/backend/internal/config"
	"scanme/backend/internal/httpserver"
	"scanme/backend/internal/moderation"
	deepseekplatform "scanme/backend/internal/platform/deepseek"
	"scanme/backend/internal/platform/logger"
	platformpostgres "scanme/backend/internal/platform/postgres"
	platformredis "scanme/backend/internal/platform/redis"
	sentryplatform "scanme/backend/internal/platform/sentry"
	"scanme/backend/internal/product"
	"scanme/backend/internal/reporting"
	"scanme/backend/internal/scan"
	"scanme/backend/internal/substance"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		slog.Error("load_config_failed", "error", err)
		os.Exit(1)
	}

	log := logger.New(cfg.Env, cfg.LogLevel)
	slog.SetDefault(log)

	if err := sentryplatform.Init(cfg.SentryDSN, cfg.Env); err != nil {
		log.Error("init_sentry_failed", "error", err)
		os.Exit(1)
	}
	defer sentryplatform.Flush()

	db, err := platformpostgres.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Error("connect_postgres_failed", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	redisClient, err := platformredis.NewClient(cfg.RedisURL)
	if err != nil {
		log.Error("connect_redis_failed", "error", err)
		os.Exit(1)
	}
	defer redisClient.Close()

	tokenService := auth.NewTokenService(cfg.JWTSecret)
	authService := auth.NewService(
		auth.NewRepository(db),
		tokenService,
		cfg.AccessTokenTTL,
		cfg.RefreshTokenTTL,
	)
	adminAuthService := adminauth.NewService(
		adminauth.NewRepository(db),
		tokenService,
		cfg.AdminAccessTokenTTL,
		cfg.AdminPasswordPepper,
	)
	if err := adminAuthService.EnsureInitialAdmin(ctx, cfg.InitialAdminEmail, cfg.InitialAdminPassword); err != nil {
		log.Error("ensure_initial_admin_failed", "error", err)
		os.Exit(1)
	}
	substanceService := substance.NewService(substance.NewRepository(db))
	moderationService := moderation.NewService(moderation.NewRepository(db), substanceService)
	productSvc := product.NewService(
		product.NewRepository(db),
		product.NewOFFClient(cfg.OpenFoodFactsBaseURL, cfg.OpenFoodFactsTimeout),
		cfg.ProductCacheTTL,
		cfg.ProductOffMissTTL,
	).WithSubstances(&substanceService)

	if strings.TrimSpace(cfg.DeepSeekAPIKey) != "" {
		dsClient, err := deepseekplatform.New(deepseekplatform.Config{
			APIKey:     cfg.DeepSeekAPIKey,
			BaseURL:    cfg.DeepSeekBaseURL,
			Model:      cfg.DeepSeekModel,
			Timeout:    cfg.DeepSeekTimeout,
			MaxRetries: cfg.DeepSeekMaxRetries,
		})
		if err != nil {
			log.Error("deepseek_client_failed", "error", err)
			os.Exit(1)
		}
		productSvc = productSvc.WithDeepSeek(dsClient)
		log.Info("deepseek_enrichment_enabled", "model", dsClient.Model())
	}

	scanService := scan.NewService(scan.NewRepository(db))
	analyticsService := analytics.NewService(analytics.NewRepository(db), redisClient)
	reportingRepo := reporting.NewRepository(db)

	server := &http.Server{
		Addr: cfg.HTTPAddr,
		Handler: httpserver.NewRouter(httpserver.Dependencies{
			Logger:    log,
			DB:        db,
			Redis:     redisClient,
			Auth:      auth.NewHandler(authService),
			Admin:     adminauth.NewHandler(adminAuthService),
			Product:   product.NewHandler(productSvc),
			Scan:      scan.NewHandler(scanService),
			Tokens:    tokenService,
			Substance:  substance.NewHandler(substanceService),
			Moderation: moderation.NewHandler(moderationService),
			Analytics:  analytics.NewHandler(analyticsService),
			Reporting:  reporting.NewHandler(reportingRepo),
		}),
	}

	go func() {
		log.Info("api_server_started", "addr", cfg.HTTPAddr, "env", cfg.Env)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Error("api_server_failed", "error", err)
			stop()
		}
	}()

	<-ctx.Done()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Error("api_server_shutdown_failed", "error", err)
		os.Exit(1)
	}

	log.Info("api_server_stopped")
}
