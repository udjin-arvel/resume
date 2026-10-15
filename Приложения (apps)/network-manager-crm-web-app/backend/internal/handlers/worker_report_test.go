package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/radar-crm/backend/internal/config"
	"github.com/radar-crm/backend/internal/database"
	"github.com/radar-crm/backend/internal/handlers"
	"github.com/radar-crm/backend/internal/middleware"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/repositories"
	"github.com/radar-crm/backend/internal/services"
	"github.com/radar-crm/backend/internal/telegram"
)

func setupReportRouter(t *testing.T) (*gin.Engine, string, string, string) {
	t.Helper()
	_ = godotenv.Load("../../.env")
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL not set")
	}

	ctx := context.Background()
	pool, err := database.Connect(ctx, databaseURL)
	if err != nil {
		t.Skipf("database unavailable: %v", err)
	}
	t.Cleanup(func() { database.Close(pool) })

	cfg := config.Config{
		JWTSecret:                  "stage3-report-test",
		RegistrationEnabled:        true,
		UploadDir:                  t.TempDir(),
		ReportOverdueCheckInterval: "1h",
	}

	userRepo := repositories.NewUserRepository(pool)
	clientRepo := repositories.NewClientRepository(pool)
	projectRepo := repositories.NewProjectRepository(pool)
	documentRepo := repositories.NewDocumentRepository(pool)
	projectWorkerRepo := repositories.NewProjectWorkerRepository(pool)
	workerReportRepo := repositories.NewWorkerReportRepository(pool)
	supervisorReportRepo := repositories.NewSupervisorReportRepository(pool)
	financeRepo := repositories.NewFinanceRepository(pool)
	toolAssignmentRepo := repositories.NewToolAssignmentRepository(pool)
	notificationRepo := repositories.NewNotificationRepository(pool)
	activityRepo := repositories.NewActivityRepository(pool)
	toolRepo := repositories.NewToolRepository(pool)
	toolCalibrationRepo := repositories.NewToolCalibrationRepository(pool)
	dashboardRepo := repositories.NewDashboardRepository(pool)
	projectIssueRepo := repositories.NewProjectIssueRepository(pool)

	authService := services.NewAuthService(cfg, userRepo)
	activityService := services.NewActivityService(activityRepo)
	telegramSender := telegram.NewSender(cfg.TelegramBotToken, cfg.AppURL)
	notificationService := services.NewNotificationService(notificationRepo, userRepo, telegramSender)
	projectService := services.NewProjectService(projectRepo, projectWorkerRepo, workerReportRepo, userRepo, notificationService, activityService)
	clientService := services.NewClientService(clientRepo, projectService, documentRepo, financeRepo)
	documentService := services.NewDocumentService(cfg.UploadDir, cfg.JWTSecret, documentRepo, projectWorkerRepo, activityService)
	_ = documentService.EnsureUploadDir()
	toolService := services.NewToolService(toolRepo, toolAssignmentRepo, toolCalibrationRepo, projectRepo, userRepo, notificationService, activityService)
	workerReportService := services.NewWorkerReportService(workerReportRepo, projectRepo, projectWorkerRepo, userRepo, documentRepo, notificationService, activityService)
	projectIssueService := services.NewProjectIssueService(projectIssueRepo, projectRepo)
	supervisorReportService := services.NewSupervisorReportService(supervisorReportRepo, projectRepo, projectWorkerRepo, documentRepo, toolAssignmentRepo, projectIssueService, notificationService, activityService)
	financeService := services.NewFinanceService(financeRepo)
	dashboardService := services.NewDashboardService(dashboardRepo, activityRepo)

	workerService := services.NewWorkerService(userRepo, projectWorkerRepo, notificationService, activityService)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	jwt := middleware.JWT(cfg.JWTSecret)
	active := middleware.RequireNotBlocked(userRepo)
	api := router.Group("/api/v1")
	handlers.NewAuthHandler(authService).RegisterRoutes(api, jwt)
	handlers.NewClientHandler(clientService).RegisterRoutes(api, jwt)
	handlers.NewProjectHandler(projectService, documentService, projectIssueService).RegisterRoutes(api, jwt, active)
	handlers.NewWorkerHandler(workerService).RegisterRoutes(api, jwt)
	handlers.NewWorkerReportHandler(workerReportService).RegisterRoutes(api, jwt, active)
	handlers.NewSupervisorReportHandler(supervisorReportService).RegisterRoutes(api, jwt, active)
	handlers.NewFinanceHandler(financeService).RegisterRoutes(api, jwt, active)
	handlers.NewToolHandler(toolService).RegisterRoutes(api, jwt)
	handlers.NewDashboardHandler(dashboardService).RegisterRoutes(api, jwt)
	handlers.NewNotificationHandler(notificationService).RegisterRoutes(api, jwt, active)

	managerToken := loginToken(t, router, "admin@example.com", "admin12345")
	workerEmail := fmt.Sprintf("stage3-worker-%d@example.com", time.Now().UnixNano())
	workerID := registerWorker(t, router, workerEmail)
	approveWorker(t, router, managerToken, workerID)
	workerToken := loginToken(t, router, workerEmail, "password123")

	return router, managerToken, workerToken, workerID
}

func loginToken(t *testing.T, router *gin.Engine, email, password string) string {
	t.Helper()
	body, _ := json.Marshal(dto.LoginRequest{Email: email, Password: password})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("login %s failed: %d %s", email, w.Code, w.Body.String())
	}
	var resp dto.AuthResponse
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	return resp.Token
}

func registerWorker(t *testing.T, router *gin.Engine, email string) string {
	t.Helper()
	body, _ := json.Marshal(dto.RegisterRequest{
		Email: email, Password: "password123",
		FirstName: "Stage3", LastName: "Worker",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("register failed: %d %s", w.Code, w.Body.String())
	}
	var resp dto.AuthResponse
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	return resp.User.ID
}

func approveWorker(t *testing.T, router *gin.Engine, managerToken, workerID string) {
	t.Helper()
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/workers/"+workerID+"/approve", nil)
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("approve worker: %d %s", w.Code, w.Body.String())
	}
}

func TestWorkerReportIntegration(t *testing.T) {
	router, managerToken, workerToken, workerID := setupReportRouter(t)

	clientBody, _ := json.Marshal(dto.UpdateClientRequest{Name: "Stage3 Client"})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/clients", bytes.NewReader(clientBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create client: %d %s", w.Code, w.Body.String())
	}
	var client dto.ClientResponse
	_ = json.Unmarshal(w.Body.Bytes(), &client)

	projectBody, _ := json.Marshal(dto.CreateProjectRequest{
		ClientID: client.ID, Name: "Stage3 Project", Budget: "10000",
	})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/projects", bytes.NewReader(projectBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create project: %d %s", w.Code, w.Body.String())
	}
	var project dto.ProjectResponse
	_ = json.Unmarshal(w.Body.Bytes(), &project)

	assignBody, _ := json.Marshal(dto.AssignWorkerRequest{UserID: workerID, Role: "worker"})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/projects/"+project.ID+"/workers", bytes.NewReader(assignBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated && w.Code != http.StatusOK {
		t.Fatalf("assign worker: %d %s", w.Code, w.Body.String())
	}

	reportBody, _ := json.Marshal(dto.CreateWorkerReportRequest{
		ProjectID: project.ID,
		WeekStart: "2026-06-09",
		WeekEnd:   "2026-06-15",
		HoursMon:  "8", HoursTue: "8", HoursWed: "8", HoursThu: "8", HoursFri: "8",
		Expenses: []dto.CreateReportExpenseRequest{
			{ExpenseType: "transport", Amount: "100", Comment: "taxi"},
		},
	})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/reports/worker", bytes.NewReader(reportBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+workerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create report: %d %s", w.Code, w.Body.String())
	}
	var report dto.WorkerReportResponse
	_ = json.Unmarshal(w.Body.Bytes(), &report)
	if report.Status != "review" {
		t.Fatalf("expected review status, got %s", report.Status)
	}
	if report.TotalHours != "40.00" {
		t.Fatalf("expected 40.00 hours, got %s", report.TotalHours)
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/projects/"+project.ID, nil)
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	var projectDetail dto.ProjectResponse
	_ = json.Unmarshal(w.Body.Bytes(), &projectDetail)
	if projectDetail.ReportsOnReview != 1 {
		t.Fatalf("expected 1 report on review, got %d", projectDetail.ReportsOnReview)
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/reports/worker/"+report.ID+"/approve", nil)
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("approve report: %d %s", w.Code, w.Body.String())
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/finance/overview", nil)
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("finance overview: %d %s", w.Code, w.Body.String())
	}
}

func TestWorkerReportRevertReturnAndRemind(t *testing.T) {
	router, managerToken, workerToken, workerID := setupReportRouter(t)

	clientBody, _ := json.Marshal(dto.UpdateClientRequest{Name: "Revert Client"})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/clients", bytes.NewReader(clientBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create client: %d %s", w.Code, w.Body.String())
	}
	var client dto.ClientResponse
	_ = json.Unmarshal(w.Body.Bytes(), &client)

	projectBody, _ := json.Marshal(dto.CreateProjectRequest{
		ClientID: client.ID, Name: "Revert Project", Budget: "10000",
	})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/projects", bytes.NewReader(projectBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create project: %d %s", w.Code, w.Body.String())
	}
	var project dto.ProjectResponse
	_ = json.Unmarshal(w.Body.Bytes(), &project)

	assignBody, _ := json.Marshal(dto.AssignWorkerRequest{UserID: workerID, Role: "worker"})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/projects/"+project.ID+"/workers", bytes.NewReader(assignBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated && w.Code != http.StatusOK {
		t.Fatalf("assign worker: %d %s", w.Code, w.Body.String())
	}

	reportBody, _ := json.Marshal(dto.CreateWorkerReportRequest{
		ProjectID: project.ID,
		WeekStart: "2026-01-06",
		WeekEnd:   "2026-01-12",
		HoursMon:  "8",
	})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/reports/worker", bytes.NewReader(reportBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+workerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create report: %d %s", w.Code, w.Body.String())
	}
	var report dto.WorkerReportResponse
	_ = json.Unmarshal(w.Body.Bytes(), &report)

	rejectBody, _ := json.Marshal(dto.RejectWorkerReportRequest{Comment: "fix hours"})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/reports/worker/"+report.ID+"/reject", bytes.NewReader(rejectBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("reject report: %d %s", w.Code, w.Body.String())
	}
	_ = json.Unmarshal(w.Body.Bytes(), &report)
	if report.Status != "returned" {
		t.Fatalf("expected returned status, got %s", report.Status)
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/reports/worker/"+report.ID+"/revert-return", nil)
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("revert return: %d %s", w.Code, w.Body.String())
	}
	_ = json.Unmarshal(w.Body.Bytes(), &report)
	if report.Status != "review" {
		t.Fatalf("expected review status after revert, got %s", report.Status)
	}
	if report.ManagerComment != "" {
		t.Fatalf("expected cleared manager comment, got %q", report.ManagerComment)
	}

	overdueBody, _ := json.Marshal(dto.CreateWorkerReportRequest{
		ProjectID: project.ID,
		WeekStart: "2025-12-30",
		WeekEnd:   "2026-01-05",
		HoursMon:  "4",
	})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/reports/worker", bytes.NewReader(overdueBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+workerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create overdue report: %d %s", w.Code, w.Body.String())
	}
	var overdueReport dto.WorkerReportResponse
	_ = json.Unmarshal(w.Body.Bytes(), &overdueReport)

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/reports/worker?workerId="+workerID, nil)
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("list reports: %d %s", w.Code, w.Body.String())
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/reports/worker/"+overdueReport.ID, nil)
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("get overdue report: %d %s", w.Code, w.Body.String())
	}
	_ = json.Unmarshal(w.Body.Bytes(), &overdueReport)
	if overdueReport.Status != "overdue" {
		t.Fatalf("expected overdue status, got %s", overdueReport.Status)
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/reports/worker/"+overdueReport.ID+"/remind", nil)
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("remind overdue report: %d %s", w.Code, w.Body.String())
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/reports/worker/"+overdueReport.ID+"/approve", nil)
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("approve overdue report: %d %s", w.Code, w.Body.String())
	}
	_ = json.Unmarshal(w.Body.Bytes(), &overdueReport)
	if overdueReport.Status != "approved" {
		t.Fatalf("expected approved status after overdue approve, got %s", overdueReport.Status)
	}
}
