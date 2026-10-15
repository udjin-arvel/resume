package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/radar-crm/backend/internal/models/dto"
)

func TestNotificationListAndMarkRead(t *testing.T) {
	router, managerToken, workerToken, workerID := setupReportRouter(t)

	sendBody, _ := json.Marshal(dto.SendNotificationRequest{
		UserID: workerID,
		Title:  "Stage4 test",
		Body:   "Hello worker",
		Link:   "/projects",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/notifications/send", bytes.NewReader(sendBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+managerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("send notification: %d %s", w.Code, w.Body.String())
	}

	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/api/v1/notifications", nil)
	req.Header.Set("Authorization", "Bearer "+workerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("list notifications: %d %s", w.Code, w.Body.String())
	}
	var list []dto.NotificationResponse
	_ = json.Unmarshal(w.Body.Bytes(), &list)
	if len(list) == 0 {
		t.Fatal("expected at least one notification")
	}

	notifID := list[0].ID
	w = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodPut, "/api/v1/notifications/"+notifID+"/read", nil)
	req.Header.Set("Authorization", "Bearer "+workerToken)
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("mark read: %d %s", w.Code, w.Body.String())
	}
	var read dto.NotificationResponse
	_ = json.Unmarshal(w.Body.Bytes(), &read)
	if read.ReadAt == nil {
		t.Fatal("expected readAt to be set")
	}
}
