package models

import (
	"time"

	"github.com/radar-crm/backend/internal/models/dto"
)

type Notification struct {
	ID               string
	UserID           string
	Title            string
	Body             string
	NotificationType string
	Link             string
	ReadAt           *time.Time
	CreatedAt        time.Time
}

func (n *Notification) ToResponse() dto.NotificationResponse {
	resp := dto.NotificationResponse{
		ID:               n.ID,
		Title:            n.Title,
		Body:             n.Body,
		NotificationType: n.NotificationType,
		Link:             n.Link,
		CreatedAt:        n.CreatedAt.Format(time.RFC3339),
	}
	if n.ReadAt != nil {
		s := n.ReadAt.Format(time.RFC3339)
		resp.ReadAt = &s
	}
	return resp
}
