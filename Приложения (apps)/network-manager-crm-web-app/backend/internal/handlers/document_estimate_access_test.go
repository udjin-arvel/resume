package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
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

func setupEstimateDocumentAccessRouter(t *testing.T) (*gin.Engine, string, string, string) {
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
		JWTSecret:           "estimate-doc-access-test",
		RegistrationEnabled: true,
		UploadDir:           t.TempDir(),
	}

	userRepo := repositories.NewUserRepository(pool)
	clientRepo := repositories.NewClientRepository(pool)
	projectRepo := repositories.NewProjectRepository(pool)
	documentRepo := repositories.NewDocumentRepository(pool)
	projectWorkerRepo := repositories.NewProjectWorkerRepository(pool)
	activityRepo := repositories.NewActivityRepository(pool)
	estimateRepo := repositories.NewEstimateRepository(pool)

	authService := services.NewAuthService(cfg, userRepo)
	activityService := services.NewActivityService(activityRepo)
	projectService := services.NewProjectService(projectRepo, projectWorkerRepo, nil, userRepo, nil, activityService)
	clientService := services.NewClientService(clientRepo, projectService, documentRepo, nil)
	documentService := services.NewDocumentService(cfg.UploadDir, cfg.JWTSecret, documentRepo, projectWorkerRepo, activityService)
	if err := documentService.EnsureUploadDir(); err != nil {
		t.Fatalf("upload dir: %v", err)
	}
	estimateService := services.NewEstimateService(estimateRepo, clientRepo, projectRepo)
	templateService := services.NewEstimateTemplateService(repositories.NewEstimateTemplateRepository(pool), estimateRepo)
	exportService := services.NewEstimateExportService(estimateRepo)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	jwt := middleware.JWT(cfg.JWTSecret)
	active := middleware.RequireNotBlocked(userRepo)
	api := router.Group("/api/v1")
	handlers.NewAuthHandler(authService).RegisterRoutes(api, jwt)
	handlers.NewClientHandler(clientService).RegisterRoutes(api, jwt)
	handlers.NewProjectHandler(projectService, documentService, nil).RegisterRoutes(api, jwt, active)
	handlers.NewDocumentHandler(documentService).RegisterRoutes(api, jwt, active)
	handlers.NewEstimateHandler(estimateService, templateService, exportService).RegisterRoutes(api, jwt)
	handlers.NewWorkerHandler(services.NewWorkerService(userRepo, projectWorkerRepo, nil, activityService)).RegisterRoutes(api, jwt)

	managerToken := loginToken(t, router, "admin@example.com", "admin12345")
	workerEmail := fmt.Sprintf("estimate-doc-worker-%d@example.com", time.Now().UnixNano())
	workerID := registerWorker(t, router, workerEmail)
	approveWorker(t, router, managerToken, workerID)
	workerToken := loginToken(t, router, workerEmail, "password123")

	return router, managerToken, workerToken, workerID
}

func uploadProjectDocument(t *testing.T, router *gin.Engine, token, projectID, documentType, filename string) dto.DocumentResponse {
	t.Helper()
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	_ = writer.WriteField("documentType", documentType)
	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		t.Fatalf("create form file: %v", err)
	}
	_, _ = part.Write([]byte("%PDF-1.4 estimate access test\n"))
	_ = writer.Close()

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/projects/"+projectID+"/documents", &body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("upload project document %s: %d %s", documentType, w.Code, w.Body.String())
	}
	var doc dto.DocumentResponse
	if err := json.Unmarshal(w.Body.Bytes(), &doc); err != nil {
		t.Fatalf("decode upload: %v", err)
	}
	return doc
}

func listProjectDocuments(t *testing.T, router *gin.Engine, token, projectID string) []dto.DocumentResponse {
	t.Helper()
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/documents?entityType=project&entityId="+projectID, nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("list documents: %d %s", w.Code, w.Body.String())
	}
	var docs []dto.DocumentResponse
	if err := json.Unmarshal(w.Body.Bytes(), &docs); err != nil {
		t.Fatalf("decode list: %v", err)
	}
	return docs
}

func hasDocumentType(docs []dto.DocumentResponse, documentType string) bool {
	for _, d := range docs {
		if d.DocumentType == documentType {
			return true
		}
	}
	return false
}

func TestWorkerCannotAccessProjectEstimateDocuments(t *testing.T) {
	router, managerToken, workerToken, workerID := setupEstimateDocumentAccessRouter(t)

	clientBody, _ := json.Marshal(dto.UpdateClientRequest{Name: "Estimate Doc Client"})
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
		ClientID: client.ID, Name: "Estimate Doc Project", Budget: "50000",
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

	estimateDoc := uploadProjectDocument(t, router, managerToken, project.ID, "estimate", "secret-estimate.pdf")
	instructionDoc := uploadProjectDocument(t, router, managerToken, project.ID, "instruction", "instructions.pdf")
	generalDoc := uploadProjectDocument(t, router, managerToken, project.ID, "general", "general-info.pdf")

	assignBody, _ := json.Marshal(dto.AssignWorkerRequest{UserID: workerID, Role: "worker"})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/projects/"+project.ID+"/workers", bytes.NewReader(assignBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated && w.Code != http.StatusOK {
		t.Fatalf("assign worker: %d %s", w.Code, w.Body.String())
	}

	managerDocs := listProjectDocuments(t, router, managerToken, project.ID)
	if !hasDocumentType(managerDocs, "estimate") || !hasDocumentType(managerDocs, "instruction") {
		t.Fatalf("manager should see estimate and instruction docs, got %+v", managerDocs)
	}

	workerDocs := listProjectDocuments(t, router, workerToken, project.ID)
	if hasDocumentType(workerDocs, "estimate") {
		t.Fatalf("worker must not see estimate documents, got %+v", workerDocs)
	}
	if !hasDocumentType(workerDocs, "instruction") || !hasDocumentType(workerDocs, "general") {
		t.Fatalf("worker should see instruction and general docs, got %+v", workerDocs)
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/documents/"+estimateDoc.ID+"/access-url", nil)
	req.Header.Set("Authorization", "Bearer "+workerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusForbidden {
		t.Fatalf("worker access-url for estimate doc: expected 403, got %d %s", w.Code, w.Body.String())
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/documents/"+instructionDoc.ID+"/access-url", nil)
	req.Header.Set("Authorization", "Bearer "+workerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("worker access-url for instruction doc: expected 200, got %d %s", w.Code, w.Body.String())
	}
	_ = generalDoc
}

func TestWorkerProjectResponseHidesBudgetAndEstimatesAPIForbidden(t *testing.T) {
	router, managerToken, workerToken, workerID := setupEstimateDocumentAccessRouter(t)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/estimates", nil)
	req.Header.Set("Authorization", "Bearer "+workerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusForbidden {
		t.Fatalf("worker GET /estimates: expected 403, got %d", w.Code)
	}

	clientBody, _ := json.Marshal(dto.UpdateClientRequest{Name: "Budget Hide Client"})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/clients", bytes.NewReader(clientBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create client: %d %s", w.Code, w.Body.String())
	}
	var client dto.ClientResponse
	_ = json.Unmarshal(w.Body.Bytes(), &client)

	projectBody, _ := json.Marshal(dto.CreateProjectRequest{
		ClientID: client.ID, Name: "Budget Hide Project", Budget: "99999",
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

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/projects/"+project.ID, nil)
	req.Header.Set("Authorization", "Bearer "+workerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("worker GET project: %d %s", w.Code, w.Body.String())
	}
	body := w.Body.String()
	if strings.Contains(body, `"budget"`) || strings.Contains(body, `"estimateId"`) {
		t.Fatalf("worker project response must not contain budget or estimateId: %s", body)
	}
}
