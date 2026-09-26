package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/radar-crm/backend/internal/models/dto"
)

func TestToolIntegration(t *testing.T) {
	router, managerToken, _, _ := setupReportRouter(t)

	clientBody, _ := json.Marshal(dto.UpdateClientRequest{Name: "Stage4 Tool Client"})
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
		ClientID: client.ID, Name: "Stage4 Tool Project", Budget: "5000",
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

	toolBody, _ := json.Marshal(dto.CreateToolRequest{
		Name:         "Multimeter-" + time.Now().Format("150405"),
		SerialNumber: "SN-001",
		ToolType:     "measurement",
		ControlType:  "usage_limit",
		UsageLimit:   10,
	})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/tools", bytes.NewReader(toolBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("create tool: %d %s", w.Code, w.Body.String())
	}
	var tool dto.ToolResponse
	_ = json.Unmarshal(w.Body.Bytes(), &tool)
	if tool.Status != "available" {
		t.Fatalf("expected available, got %s", tool.Status)
	}

	assignBody, _ := json.Marshal(dto.AssignToolRequest{ProjectID: project.ID})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/tools/"+tool.ID+"/assign", bytes.NewReader(assignBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("assign tool: %d %s", w.Code, w.Body.String())
	}
	var assigned dto.ToolDetailResponse
	_ = json.Unmarshal(w.Body.Bytes(), &assigned)
	if assigned.Status != "assigned" || assigned.ActiveAssignment == nil {
		t.Fatalf("expected assigned tool with assignment")
	}

	returnBody, _ := json.Marshal(dto.ReturnToolRequest{ConditionOnReturn: "good"})
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPost, "/api/v1/tools/"+tool.ID+"/return", bytes.NewReader(returnBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("return tool: %d %s", w.Code, w.Body.String())
	}
	var returned dto.ToolDetailResponse
	_ = json.Unmarshal(w.Body.Bytes(), &returned)
	if returned.Status != "available" {
		t.Fatalf("expected available after return, got %s", returned.Status)
	}
	if returned.UsageCount != 1 {
		t.Fatalf("expected usage count 1, got %d", returned.UsageCount)
	}
}
