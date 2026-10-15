package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/joho/godotenv"
	"github.com/radar-crm/backend/internal/database"
	"github.com/radar-crm/backend/internal/models/dto"
)

func setUserRole(t *testing.T, userID, role string) {
	t.Helper()
	_ = godotenv.Load("../../.env")
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL not set")
	}
	ctx := context.Background()
	pool, err := database.Connect(ctx, databaseURL)
	if err != nil {
		t.Fatalf("database: %v", err)
	}
	defer database.Close(pool)
	if _, err := pool.Exec(ctx, `UPDATE users SET role = $2 WHERE id = $1`, userID, role); err != nil {
		t.Fatalf("set role: %v", err)
	}
}

func TestSupervisorReportIntegration(t *testing.T) {
	router, managerToken, _, _ := setupReportRouter(t)

	clientBody, _ := json.Marshal(dto.UpdateClientRequest{Name: "Stage3 Sup Client"})
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
		ClientID: client.ID, Name: "Stage3 Sup Project", Budget: "8000",
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

	supervisorEmail := "stage3-supervisor-" + time.Now().Format("150405") + "@example.com"
	supervisorID := registerWorker(t, router, supervisorEmail)
	approveWorker(t, router, managerToken, supervisorID)
	setUserRole(t, supervisorID, "supervisor")
	supervisorToken := loginToken(t, router, supervisorEmail, "password123")

	assignBody, _ := json.Marshal(dto.AssignWorkerRequest{UserID: supervisorID, Role: "supervisor"})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/projects/"+project.ID+"/workers", bytes.NewReader(assignBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("assign supervisor: %d %s", w.Code, w.Body.String())
	}

	reportBody, _ := json.Marshal(dto.CreateSupervisorReportRequest{
		ProjectID:  project.ID,
		ReportDate: time.Now().Format("2006-01-02"),
		SiteStatus: "issue",
		Description: "Minor issue on site",
	})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/reports/supervisor", bytes.NewReader(reportBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+supervisorToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create supervisor report: %d %s", w.Code, w.Body.String())
	}
	var report dto.SupervisorReportResponse
	_ = json.Unmarshal(w.Body.Bytes(), &report)

	// PATCH report fields before approve
	patchBody, _ := json.Marshal(dto.PatchSupervisorReportRequest{
		CompletedWorks: "Updated completed works",
		Description:    "Updated completed works",
	})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPatch, "/api/v1/reports/supervisor/"+report.ID, bytes.NewReader(patchBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+supervisorToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("patch supervisor report: %d %s", w.Code, w.Body.String())
	}
	var patched dto.SupervisorReportResponse
	_ = json.Unmarshal(w.Body.Bytes(), &patched)
	if patched.CompletedWorks != "Updated completed works" {
		t.Fatalf("expected patched completed works, got %s", patched.CompletedWorks)
	}

	// Manager marks report as needs attention; supervisor edit resubmits to review.
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/reports/supervisor/"+report.ID+"/attention", nil)
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("attention supervisor report: %d %s", w.Code, w.Body.String())
	}

	patchBody, _ = json.Marshal(dto.PatchSupervisorReportRequest{
		CompletedWorks: "Resubmitted after attention",
		Description:    "Resubmitted after attention",
	})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPatch, "/api/v1/reports/supervisor/"+report.ID, bytes.NewReader(patchBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+supervisorToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("patch supervisor report after attention: %d %s", w.Code, w.Body.String())
	}
	_ = json.Unmarshal(w.Body.Bytes(), &patched)
	if patched.Status != "review" {
		t.Fatalf("expected status review after resubmit, got %s", patched.Status)
	}
	if patched.CompletedWorks != "Resubmitted after attention" {
		t.Fatalf("expected resubmitted completed works, got %s", patched.CompletedWorks)
	}

	// List project issues
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/projects/"+project.ID+"/issues", nil)
	req.Header.Set("Authorization", "Bearer "+supervisorToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("list project issues: %d %s", w.Code, w.Body.String())
	}
	var issues []dto.ProjectIssueResponse
	_ = json.Unmarshal(w.Body.Bytes(), &issues)
	if len(issues) == 0 {
		t.Fatalf("expected at least one project issue from report")
	}

	transcribeBody, _ := json.Marshal(dto.TranscribeRequest{Transcription: "All clear after inspection"})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/reports/supervisor/"+report.ID+"/transcribe", bytes.NewReader(transcribeBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+supervisorToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("transcribe: %d %s", w.Code, w.Body.String())
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/reports/supervisor/"+report.ID+"/approve", nil)
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("approve supervisor report: %d %s", w.Code, w.Body.String())
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/projects/"+project.ID, nil)
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	var projectDetail dto.ProjectResponse
	_ = json.Unmarshal(w.Body.Bytes(), &projectDetail)
	if projectDetail.SiteStatus != "issue" {
		t.Fatalf("expected site status issue, got %s", projectDetail.SiteStatus)
	}
}
