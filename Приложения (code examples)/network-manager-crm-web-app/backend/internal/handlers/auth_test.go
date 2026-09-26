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

func TestAuthIntegration(t *testing.T) {
	_ = godotenv.Load("../../.env")

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL not set, skipping integration test")
	}

	gin.SetMode(gin.TestMode)

	ctx := context.Background()
	pool, err := database.Connect(ctx, databaseURL)
	if err != nil {
		t.Skipf("database unavailable: %v", err)
	}
	defer database.Close(pool)

	cfg := config.Config{
		JWTSecret:           "integration-test-secret",
		RegistrationEnabled: true,
	}

	userRepo := repositories.NewUserRepository(pool)
	authService := services.NewAuthService(cfg, userRepo)
	authHandler := handlers.NewAuthHandler(authService)
	jwtMiddleware := middleware.JWT(cfg.JWTSecret)

	router := gin.New()
	api := router.Group("/api/v1")
	authHandler.RegisterRoutes(api, jwtMiddleware)

	email := fmt.Sprintf("integration-worker-%d@example.com", time.Now().UnixNano())
	password := "password123"

	registerBody, _ := json.Marshal(dto.RegisterRequest{
		Email:     email,
		Password:  password,
		FirstName: "Integration",
		LastName:  "Worker",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(registerBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("register status %d: %s", w.Code, w.Body.String())
	}

	var registerResp dto.AuthResponse
	if err := json.Unmarshal(w.Body.Bytes(), &registerResp); err != nil {
		t.Fatalf("decode register response: %v", err)
	}
	if registerResp.User.Status != "pending" {
		t.Fatalf("expected pending status, got %s", registerResp.User.Status)
	}
	if registerResp.Token == "" {
		t.Fatal("expected token from register")
	}

	loginBody, _ := json.Marshal(dto.LoginRequest{Email: email, Password: password})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(loginBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("login status %d: %s", w.Code, w.Body.String())
	}

	var loginResp dto.AuthResponse
	if err := json.Unmarshal(w.Body.Bytes(), &loginResp); err != nil {
		t.Fatalf("decode login response: %v", err)
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+loginResp.Token)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("me status %d: %s", w.Code, w.Body.String())
	}

	var meResp dto.UserResponse
	if err := json.Unmarshal(w.Body.Bytes(), &meResp); err != nil {
		t.Fatalf("decode me response: %v", err)
	}
	if meResp.Email != email {
		t.Fatalf("expected email %s, got %s", email, meResp.Email)
	}
}
