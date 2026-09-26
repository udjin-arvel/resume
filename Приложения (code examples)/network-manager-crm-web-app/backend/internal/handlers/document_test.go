package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"github.com/radar-crm/backend/internal/auth"
	"github.com/radar-crm/backend/internal/config"
	"github.com/radar-crm/backend/internal/database"
	"github.com/radar-crm/backend/internal/handlers"
	"github.com/radar-crm/backend/internal/middleware"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/repositories"
	"github.com/radar-crm/backend/internal/services"
)

func setupDocumentRouter(t *testing.T) (*gin.Engine, string) {
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
		JWTSecret:           "document-access-test-secret",
		UploadDir:           t.TempDir(),
		RegistrationEnabled: true,
	}

	userRepo := repositories.NewUserRepository(pool)
	documentRepo := repositories.NewDocumentRepository(pool)
	projectWorkerRepo := repositories.NewProjectWorkerRepository(pool)
	activityRepo := repositories.NewActivityRepository(pool)
	activityService := services.NewActivityService(activityRepo)
	authService := services.NewAuthService(cfg, userRepo)
	documentService := services.NewDocumentService(cfg.UploadDir, cfg.JWTSecret, documentRepo, projectWorkerRepo, activityService)
	if err := documentService.EnsureUploadDir(); err != nil {
		t.Fatalf("upload dir: %v", err)
	}

	if _, err := userRepo.FindByEmail(ctx, "admin@example.com"); err != nil {
		t.Skip("admin user not seeded")
	}

	gin.SetMode(gin.TestMode)
	router := gin.New()
	jwtMW := middleware.JWT(cfg.JWTSecret)
	active := middleware.RequireNotBlocked(userRepo)
	api := router.Group("/api/v1")
	handlers.NewAuthHandler(authService).RegisterRoutes(api, jwtMW)
	handlers.NewDocumentHandler(documentService).RegisterRoutes(api, jwtMW, active)

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

func uploadTestDocument(t *testing.T, router *gin.Engine, token string) dto.DocumentResponse {
	t.Helper()
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	_ = writer.WriteField("entityType", "user")
	_ = writer.WriteField("entityId", "00000000-0000-0000-0000-000000000001")
	_ = writer.WriteField("documentType", "photo")
	part, err := writer.CreateFormFile("file", "test-photo.jpg")
	if err != nil {
		t.Fatalf("create form file: %v", err)
	}
	// Minimal JPEG header bytes so mime detection works if needed.
	_, _ = part.Write([]byte{
		0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
		0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
	})
	_ = writer.Close()

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/documents/upload", &body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("upload %d: %s", w.Code, w.Body.String())
	}
	var doc dto.DocumentResponse
	if err := json.Unmarshal(w.Body.Bytes(), &doc); err != nil {
		t.Fatalf("decode upload: %v", err)
	}
	return doc
}

func TestDocumentAccessURLAndServeFile(t *testing.T) {
	router, token := setupDocumentRouter(t)
	doc := uploadTestDocument(t, router, token)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/documents/"+doc.ID+"/access-url?disposition=inline", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("access-url %d: %s", w.Code, w.Body.String())
	}

	var access dto.DocumentAccessURLResponse
	if err := json.Unmarshal(w.Body.Bytes(), &access); err != nil {
		t.Fatalf("decode access-url: %v", err)
	}
	if access.URL == "" || access.Disposition != "inline" {
		t.Fatalf("unexpected access response: %+v", access)
	}
	if !strings.Contains(access.URL, "/file?") || !strings.Contains(access.URL, "token=") {
		t.Fatalf("expected signed file url, got %s", access.URL)
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, access.URL, nil)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("serve file %d: %s", w.Code, w.Body.String())
	}
	cd := w.Header().Get("Content-Disposition")
	if !strings.HasPrefix(cd, "inline;") {
		t.Fatalf("expected inline disposition, got %q", cd)
	}
	if w.Body.Len() == 0 {
		t.Fatal("expected file body")
	}
}

func TestDocumentServeFileForbiddenForWrongUser(t *testing.T) {
	router, token := setupDocumentRouter(t)
	doc := uploadTestDocument(t, router, token)

	signed, _, err := auth.GenerateDocumentAccessToken(
		doc.ID,
		"00000000-0000-0000-0000-000000000099",
		"worker",
		"document-access-test-secret",
	)
	if err != nil {
		t.Fatalf("generate token: %v", err)
	}

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/documents/"+doc.ID+"/file?token="+signed+"&disposition=inline", nil)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d: %s", w.Code, w.Body.String())
	}
}

func TestDocumentServeFileExpiredToken(t *testing.T) {
	router, token := setupDocumentRouter(t)
	doc := uploadTestDocument(t, router, token)

	claims := auth.DocumentAccessClaims{
		DocumentID: doc.ID,
		UserID:     "ignored",
		Role:       "manager",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-time.Hour)),
		},
	}
	signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte("document-access-test-secret"))
	if err != nil {
		t.Fatalf("sign expired: %v", err)
	}

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/documents/"+doc.ID+"/file?token="+signed+"&disposition=inline", nil)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		body, _ := io.ReadAll(w.Body)
		t.Fatalf("expected 401 for expired token, got %d: %s", w.Code, string(body))
	}
}

func TestDocumentServeFileInvalidToken(t *testing.T) {
	router, token := setupDocumentRouter(t)
	doc := uploadTestDocument(t, router, token)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/documents/"+doc.ID+"/file?token=not-a-valid-token&disposition=inline", nil)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d: %s", w.Code, w.Body.String())
	}
}

func TestDocumentOldGetRemoved(t *testing.T) {
	router, token := setupDocumentRouter(t)
	doc := uploadTestDocument(t, router, token)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/documents/"+doc.ID, nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)
	if w.Code == http.StatusOK {
		t.Fatal("old GET /documents/:id should be removed")
	}
}
