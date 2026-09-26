package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/radar-crm/backend/internal/models/dto"
)

func TestSetSupervisorAllowsProjectWorkerRole(t *testing.T) {
	router, managerToken, workerToken, workerID := setupReportRouter(t)

	clientBody, _ := json.Marshal(dto.UpdateClientRequest{Name: "Supervisor Role Client"})
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
		ClientID: client.ID, Name: "Supervisor Role Project", Budget: "10000",
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

	supervisorBody, _ := json.Marshal(dto.SetProjectSupervisorRequest{UserID: workerID})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/projects/"+project.ID+"/supervisor", bytes.NewReader(supervisorBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("set supervisor from worker role: %d %s", w.Code, w.Body.String())
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/projects/"+project.ID+"/confirm", nil)
	req.Header.Set("Authorization", "Bearer "+workerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("confirm project: %d %s", w.Code, w.Body.String())
	}

	reportBody, _ := json.Marshal(dto.CreateSupervisorReportRequest{
		ProjectID:   project.ID,
		ReportDate:  "2026-06-15",
		SiteStatus:  "ok",
		Description: "Daily check",
	})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/reports/supervisor", bytes.NewReader(reportBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+workerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("worker with project supervisor role should create daily report: %d %s", w.Code, w.Body.String())
	}
}

func TestSupervisorReportForbiddenWithoutProjectRole(t *testing.T) {
	router, managerToken, workerToken, workerID := setupReportRouter(t)

	clientBody, _ := json.Marshal(dto.UpdateClientRequest{Name: "No Supervisor Client"})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/clients", bytes.NewReader(clientBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	var client dto.ClientResponse
	_ = json.Unmarshal(w.Body.Bytes(), &client)

	projectBody, _ := json.Marshal(dto.CreateProjectRequest{
		ClientID: client.ID, Name: "No Supervisor Project", Budget: "10000",
	})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/projects", bytes.NewReader(projectBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	var project dto.ProjectResponse
	_ = json.Unmarshal(w.Body.Bytes(), &project)

	assignBody, _ := json.Marshal(dto.AssignWorkerRequest{UserID: workerID, Role: "worker"})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/projects/"+project.ID+"/workers", bytes.NewReader(assignBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/projects/"+project.ID+"/confirm", nil)
	req.Header.Set("Authorization", "Bearer "+workerToken)
	router.ServeHTTP(w, req)

	reportBody, _ := json.Marshal(dto.CreateSupervisorReportRequest{
		ProjectID:  project.ID,
		ReportDate: "2026-06-15",
		SiteStatus: "ok",
	})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/reports/supervisor", bytes.NewReader(reportBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+workerToken)
	router.ServeHTTP(w, req)
	if w.Code == http.StatusCreated {
		t.Fatal("expected worker without project supervisor role to be forbidden")
	}
}
