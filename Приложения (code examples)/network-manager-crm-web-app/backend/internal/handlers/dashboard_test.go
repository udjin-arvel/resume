package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/radar-crm/backend/internal/models/dto"
)

func TestDashboardUrgentIntegration(t *testing.T) {
	router, managerToken, workerToken, workerID := setupReportRouter(t)

	clientBody, _ := json.Marshal(dto.UpdateClientRequest{Name: "Stage4 Dash Client"})
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
		ClientID: client.ID, Name: "Stage4 Dash Project", Budget: "12000",
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
	})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/reports/worker", bytes.NewReader(reportBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+workerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create report: %d %s", w.Code, w.Body.String())
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/dashboard/urgent", nil)
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("dashboard urgent: %d %s", w.Code, w.Body.String())
	}
	var urgent []dto.UrgentActionResponse
	_ = json.Unmarshal(w.Body.Bytes(), &urgent)
	if len(urgent) != 8 {
		t.Fatalf("expected 8 urgent blocks, got %d", len(urgent))
	}
	var reviewCount int
	for _, item := range urgent {
		if item.Key == "worker_reports_review" {
			reviewCount = item.Count
		}
	}
	if reviewCount < 1 {
		t.Fatalf("expected worker_reports_review count >= 1, got %d", reviewCount)
	}
}
