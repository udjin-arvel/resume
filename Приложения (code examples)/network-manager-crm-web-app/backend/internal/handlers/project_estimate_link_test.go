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

func setupProjectEstimateRouter(t *testing.T) (*gin.Engine, string) {
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

	cfg := config.Config{JWTSecret: "project-estimate-link-test"}
	userRepo := repositories.NewUserRepository(pool)
	clientRepo := repositories.NewClientRepository(pool)
	projectRepo := repositories.NewProjectRepository(pool)
	projectWorkerRepo := repositories.NewProjectWorkerRepository(pool)
	workerReportRepo := repositories.NewWorkerReportRepository(pool)
	estimateRepo := repositories.NewEstimateRepository(pool)
	activityRepo := repositories.NewActivityRepository(pool)

	authService := services.NewAuthService(cfg, userRepo)
	activityService := services.NewActivityService(activityRepo)
	projectService := services.NewProjectService(projectRepo, projectWorkerRepo, workerReportRepo, userRepo, nil, activityService)
	clientService := services.NewClientService(clientRepo, projectService, nil, nil)
	estimateService := services.NewEstimateService(estimateRepo, clientRepo, projectRepo)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	jwt := middleware.JWT(cfg.JWTSecret)
	api := router.Group("/api/v1")
	handlers.NewAuthHandler(authService).RegisterRoutes(api, jwt)
	handlers.NewClientHandler(clientService).RegisterRoutes(api, jwt)
	handlers.NewProjectHandler(projectService, nil, nil).RegisterRoutes(api, jwt, middleware.RequireNotBlocked(userRepo))
	handlers.NewEstimateHandler(estimateService, nil, nil).RegisterRoutes(api, jwt)

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
	return router, authResp.Token
}

func createApprovedEstimateWithClient(t *testing.T, router *gin.Engine, token string) (dto.ClientResponse, dto.EstimateResponse) {
	t.Helper()

	clientBody, _ := json.Marshal(dto.UpdateClientRequest{Name: fmt.Sprintf("Link Client %d", time.Now().UnixNano())})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/clients", bytes.NewReader(clientBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create client: %d %s", w.Code, w.Body.String())
	}
	var client dto.ClientResponse
	_ = json.Unmarshal(w.Body.Bytes(), &client)

	estimateBody, _ := json.Marshal(dto.CreateEstimateRequest{
		Name:        "Linked Estimate",
		Country:     "Germany",
		City:        "Berlin",
		CompanyName: "Test Co",
		Blocks: []dto.CreateEstimateBlockRequest{
			{BlockType: "service", Title: "Work", Quantity: "1", UnitPrice: "1000"},
		},
	})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/estimates", bytes.NewReader(estimateBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create estimate: %d %s", w.Code, w.Body.String())
	}
	var estimate dto.EstimateResponse
	_ = json.Unmarshal(w.Body.Bytes(), &estimate)

	for _, status := range []string{"sent", "approved"} {
		statusBody, _ := json.Marshal(dto.EstimateStatusRequest{Status: status})
		w = httptest.NewRecorder()
		req = httptest.NewRequest(http.MethodPost, "/api/v1/estimates/"+estimate.ID+"/status", bytes.NewReader(statusBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("set estimate status %s: %d %s", status, w.Code, w.Body.String())
		}
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/estimates/"+estimate.ID, nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("get estimate: %d %s", w.Code, w.Body.String())
	}
	_ = json.Unmarshal(w.Body.Bytes(), &estimate)
	return client, estimate
}

func TestCreateFromEstimateDuplicateRejected(t *testing.T) {
	router, token := setupProjectEstimateRouter(t)
	_, estimate := createApprovedEstimateWithClient(t, router, token)

	projectBody, _ := json.Marshal(dto.CreateProjectFromEstimateRequest{EstimateID: estimate.ID})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/projects/from-estimate", bytes.NewReader(projectBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("first create from estimate: %d %s", w.Code, w.Body.String())
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/projects/from-estimate", bytes.NewReader(projectBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)
	if w.Code == http.StatusCreated {
		t.Fatal("expected duplicate project from estimate to be rejected")
	}
}

func TestApprovedEstimateUpdateSyncsLinkedProject(t *testing.T) {
	router, token := setupProjectEstimateRouter(t)
	_, estimate := createApprovedEstimateWithClient(t, router, token)

	projectBody, _ := json.Marshal(dto.CreateProjectFromEstimateRequest{EstimateID: estimate.ID})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/projects/from-estimate", bytes.NewReader(projectBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create from estimate: %d %s", w.Code, w.Body.String())
	}
	var project dto.ProjectResponse
	_ = json.Unmarshal(w.Body.Bytes(), &project)

	updateBody, _ := json.Marshal(dto.UpdateEstimateRequest{
		Name:    "Updated Estimate Name",
		Country: "France",
		City:    "Paris",
		Blocks: []dto.CreateEstimateBlockRequest{
			{BlockType: "service", Title: "Work", Quantity: "2", UnitPrice: "500"},
		},
	})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPut, "/api/v1/estimates/"+estimate.ID, bytes.NewReader(updateBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("update approved estimate: %d %s", w.Code, w.Body.String())
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/projects/"+project.ID, nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("get project: %d %s", w.Code, w.Body.String())
	}
	_ = json.Unmarshal(w.Body.Bytes(), &project)

	if project.Name != "Updated Estimate Name" {
		t.Fatalf("expected synced project name, got %q", project.Name)
	}
	if project.Location != "Paris, France" {
		t.Fatalf("expected synced location Paris, France, got %q", project.Location)
	}
	if project.Budget != "1000.00" {
		t.Fatalf("expected synced budget 1000.00, got %q", project.Budget)
	}
}

func TestCloseActiveProject(t *testing.T) {
	router, token := setupProjectEstimateRouter(t)
	client, _ := createApprovedEstimateWithClient(t, router, token)

	projectBody, _ := json.Marshal(dto.CreateProjectRequest{
		ClientID: client.ID,
		Name:     "Close Me",
		Budget:   "5000",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/projects", bytes.NewReader(projectBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create project: %d %s", w.Code, w.Body.String())
	}
	var project dto.ProjectResponse
	_ = json.Unmarshal(w.Body.Bytes(), &project)
	if project.Status != "active" {
		t.Fatalf("expected active project, got %q", project.Status)
	}

	closeBody, _ := json.Marshal(dto.UpdateProjectRequest{Status: "done"})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPut, "/api/v1/projects/"+project.ID, bytes.NewReader(closeBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("close project: %d %s", w.Code, w.Body.String())
	}
	_ = json.Unmarshal(w.Body.Bytes(), &project)
	if project.Status != "done" {
		t.Fatalf("expected done status, got %q", project.Status)
	}
	if project.EndDate == nil || *project.EndDate == "" {
		t.Fatal("expected endDate to be set when closing project")
	}
}
