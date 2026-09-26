package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/radar-crm/backend/internal/config"
	"github.com/radar-crm/backend/internal/database"
	"github.com/radar-crm/backend/internal/handlers"
	"github.com/radar-crm/backend/internal/middleware"
	"github.com/radar-crm/backend/internal/repositories"
	"github.com/radar-crm/backend/internal/services"
	"github.com/radar-crm/backend/internal/telegram"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()

	if cfg.AppEnv == "prod" {
		gin.SetMode(gin.ReleaseMode)
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	ctx := context.Background()
	pool, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("database connection failed", "error", err)
		os.Exit(1)
	}
	defer database.Close(pool)

	userRepo := repositories.NewUserRepository(pool)
	clientRepo := repositories.NewClientRepository(pool)
	projectRepo := repositories.NewProjectRepository(pool)
	documentRepo := repositories.NewDocumentRepository(pool)
	estimateRepo := repositories.NewEstimateRepository(pool)
	templateRepo := repositories.NewEstimateTemplateRepository(pool)
	projectWorkerRepo := repositories.NewProjectWorkerRepository(pool)
	workerReportRepo := repositories.NewWorkerReportRepository(pool)
	supervisorReportRepo := repositories.NewSupervisorReportRepository(pool)
	financeRepo := repositories.NewFinanceRepository(pool)
	toolRepo := repositories.NewToolRepository(pool)
	toolAssignmentRepo := repositories.NewToolAssignmentRepository(pool)
	toolCalibrationRepo := repositories.NewToolCalibrationRepository(pool)
	notificationRepo := repositories.NewNotificationRepository(pool)
	activityRepo := repositories.NewActivityRepository(pool)
	projectIssueRepo := repositories.NewProjectIssueRepository(pool)
	dashboardRepo := repositories.NewDashboardRepository(pool)

	telegramSender := telegram.NewSender(cfg.TelegramBotToken, cfg.AppURL)
	activityService := services.NewActivityService(activityRepo)
	notificationService := services.NewNotificationService(notificationRepo, userRepo, telegramSender)

	authService := services.NewAuthService(cfg, userRepo)
	projectService := services.NewProjectService(projectRepo, projectWorkerRepo, workerReportRepo, userRepo, notificationService, activityService)
	clientService := services.NewClientService(clientRepo, projectService, documentRepo, financeRepo)
	estimateService := services.NewEstimateService(estimateRepo, clientRepo, projectRepo)
	templateService := services.NewEstimateTemplateService(templateRepo, estimateRepo)
	exportService := services.NewEstimateExportService(estimateRepo)
	workerService := services.NewWorkerService(userRepo, projectWorkerRepo, notificationService, activityService)
	documentService := services.NewDocumentService(cfg.UploadDir, cfg.JWTSecret, documentRepo, projectWorkerRepo, activityService)
	toolService := services.NewToolService(toolRepo, toolAssignmentRepo, toolCalibrationRepo, projectRepo, userRepo, notificationService, activityService)
	workerReportService := services.NewWorkerReportService(workerReportRepo, projectRepo, projectWorkerRepo, userRepo, documentRepo, notificationService, activityService)
	projectIssueService := services.NewProjectIssueService(projectIssueRepo, projectRepo)
	supervisorReportService := services.NewSupervisorReportService(supervisorReportRepo, projectRepo, projectWorkerRepo, documentRepo, toolAssignmentRepo, projectIssueService, notificationService, activityService)
	financeService := services.NewFinanceService(financeRepo)
	dashboardService := services.NewDashboardService(dashboardRepo, activityRepo)
	scheduler := services.NewScheduler(cfg, workerReportRepo, toolRepo, toolAssignmentRepo, toolCalibrationRepo, notificationService)

	if err := documentService.EnsureUploadDir(); err != nil {
		slog.Error("upload dir init failed", "error", err)
		os.Exit(1)
	}

	authHandler := handlers.NewAuthHandler(authService)
	clientHandler := handlers.NewClientHandler(clientService)
	projectHandler := handlers.NewProjectHandler(projectService, documentService, projectIssueService)
	estimateHandler := handlers.NewEstimateHandler(estimateService, templateService, exportService)
	workerHandler := handlers.NewWorkerHandler(workerService)
	documentHandler := handlers.NewDocumentHandler(documentService)
	toolHandler := handlers.NewToolHandler(toolService)
	workerReportHandler := handlers.NewWorkerReportHandler(workerReportService)
	supervisorReportHandler := handlers.NewSupervisorReportHandler(supervisorReportService)
	financeHandler := handlers.NewFinanceHandler(financeService)
	dashboardHandler := handlers.NewDashboardHandler(dashboardService)
	notificationHandler := handlers.NewNotificationHandler(notificationService)
	healthHandler := handlers.NewHealthHandler()

	jwtMiddleware := middleware.JWT(cfg.JWTSecret)
	activeWorker := middleware.RequireNotBlocked(userRepo)

	router := gin.New()
	router.Use(middleware.Logger(), middleware.Recovery(), middleware.CORS(cfg.CORSOrigins), middleware.Locale())

	router.GET("/health", healthHandler.Health)

	api := router.Group("/api/v1")
	authHandler.RegisterRoutes(api, jwtMiddleware)
	clientHandler.RegisterRoutes(api, jwtMiddleware)
	projectHandler.RegisterRoutes(api, jwtMiddleware, activeWorker)
	estimateHandler.RegisterRoutes(api, jwtMiddleware)
	workerHandler.RegisterRoutes(api, jwtMiddleware)
	documentHandler.RegisterRoutes(api, jwtMiddleware, activeWorker)
	toolHandler.RegisterRoutes(api, jwtMiddleware)
	workerReportHandler.RegisterRoutes(api, jwtMiddleware, activeWorker)
	supervisorReportHandler.RegisterRoutes(api, jwtMiddleware, activeWorker)
	financeHandler.RegisterRoutes(api, jwtMiddleware, activeWorker)
	dashboardHandler.RegisterRoutes(api, jwtMiddleware)
	notificationHandler.RegisterRoutes(api, jwtMiddleware, activeWorker)

	scheduler.Start()
	defer scheduler.Stop()

	addr := fmt.Sprintf(":%d", cfg.APIPort)
	srv := &http.Server{
		Addr:    addr,
		Handler: router,
	}

	go func() {
		slog.Info("starting server", "addr", addr, "env", cfg.AppEnv)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("server shutdown failed", "error", err)
	}
	slog.Info("server stopped")
}
