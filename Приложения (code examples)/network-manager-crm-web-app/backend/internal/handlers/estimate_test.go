package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/radar-crm/backend/internal/config"
	"github.com/radar-crm/backend/internal/database"
	"github.com/radar-crm/backend/internal/handlers"
	"github.com/radar-crm/backend/internal/middleware"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/repositories"
	"github.com/radar-crm/backend/internal/services"
)

func setupEstimateRouter(t *testing.T) (*gin.Engine, string) {
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

	cfg := config.Config{JWTSecret: "stage2-test-secret"}
	userRepo := repositories.NewUserRepository(pool)
	clientRepo := repositories.NewClientRepository(pool)
	projectRepo := repositories.NewProjectRepository(pool)
	estimateRepo := repositories.NewEstimateRepository(pool)
	templateRepo := repositories.NewEstimateTemplateRepository(pool)

	admin, err := userRepo.FindByEmail(ctx, "admin@example.com")
	if err != nil {
		t.Skip("admin user not seeded")
	}

	authService := services.NewAuthService(cfg, userRepo)
	estimateService := services.NewEstimateService(estimateRepo, clientRepo, projectRepo)
	templateService := services.NewEstimateTemplateService(templateRepo, estimateRepo)
	exportService := services.NewEstimateExportService(estimateRepo)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	jwt := middleware.JWT(cfg.JWTSecret)
	api := router.Group("/api/v1")
	handlers.NewAuthHandler(authService).RegisterRoutes(api, jwt)
	handlers.NewEstimateHandler(estimateService, templateService, exportService).RegisterRoutes(api, jwt)

	loginBody, _ := json.Marshal(dto.LoginRequest{Email: "admin@example.com", Password: "admin12345"})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(loginBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("login failed: %s", w.Body.String())
	}
	var authResp dto.AuthResponse
	_ = json.Unmarshal(w.Body.Bytes(), &authResp)
	_ = admin
	return router, authResp.Token
}

func TestEstimateIntegration(t *testing.T) {
	router, token := setupEstimateRouter(t)

	createBody, _ := json.Marshal(dto.CreateEstimateRequest{
		Name:        "Stage2 Test Estimate",
		CompanyName: "Test Co",
		Blocks: []dto.CreateEstimateBlockRequest{
			{BlockType: "service", Title: "Install", Quantity: "2", UnitPrice: "100"},
			{BlockType: "expense", Title: "Materials", Amount: "50"},
		},
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/estimates", bytes.NewReader(createBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create estimate %d: %s", w.Code, w.Body.String())
	}

	var estimate dto.EstimateResponse
	if err := json.Unmarshal(w.Body.Bytes(), &estimate); err != nil {
		t.Fatal(err)
	}
	if estimate.TotalAmount != "250.00" {
		t.Fatalf("expected total 250.00, got %s", estimate.TotalAmount)
	}

	statusBody, _ := json.Marshal(dto.EstimateStatusRequest{Status: "sent"})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/estimates/"+estimate.ID+"/status", bytes.NewReader(statusBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("sent status %d: %s", w.Code, w.Body.String())
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/estimates/"+estimate.ID+"/export/pdf", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("export pdf %d: %s", w.Code, w.Body.String())
	}
	if len(w.Body.Bytes()) < 100 {
		t.Fatal("pdf too small")
	}
}
