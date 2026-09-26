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
)

func setupWorkerRouter(t *testing.T) (*gin.Engine, string) {
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

	cfg := config.Config{JWTSecret: "stage2-worker-test", RegistrationEnabled: true}
	userRepo := repositories.NewUserRepository(pool)
	projectWorkerRepo := repositories.NewProjectWorkerRepository(pool)
	activityRepo := repositories.NewActivityRepository(pool)
	authService := services.NewAuthService(cfg, userRepo)
	activityService := services.NewActivityService(activityRepo)
	notificationRepo := repositories.NewNotificationRepository(pool)
	notificationService := services.NewNotificationService(notificationRepo, userRepo, nil)
	workerService := services.NewWorkerService(userRepo, projectWorkerRepo, notificationService, activityService)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	jwt := middleware.JWT(cfg.JWTSecret)
	api := router.Group("/api/v1")
	handlers.NewAuthHandler(authService).RegisterRoutes(api, jwt)
	handlers.NewWorkerHandler(workerService).RegisterRoutes(api, jwt)

	loginBody, _ := json.Marshal(dto.LoginRequest{Email: "admin@example.com", Password: "admin12345"})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(loginBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Skip("admin login failed - run seed first")
	}
	var authResp dto.AuthResponse
	_ = json.Unmarshal(w.Body.Bytes(), &authResp)
	return router, authResp.Token
}

func TestWorkerApproveIntegration(t *testing.T) {
	router, managerToken := setupWorkerRouter(t)

	email := fmt.Sprintf("stage2-pending-%d@example.com", time.Now().UnixNano())
	registerBody, _ := json.Marshal(dto.RegisterRequest{
		Email: email, Password: "password123",
		FirstName: "Pending", LastName: "Worker",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(registerBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("register %d: %s", w.Code, w.Body.String())
	}
	var reg dto.AuthResponse
	_ = json.Unmarshal(w.Body.Bytes(), &reg)

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/workers/"+reg.User.ID+"/approve", nil)
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("approve %d: %s", w.Code, w.Body.String())
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/workers?status=active", nil)
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("list workers %d: %s", w.Code, w.Body.String())
	}
	_ = email
}
