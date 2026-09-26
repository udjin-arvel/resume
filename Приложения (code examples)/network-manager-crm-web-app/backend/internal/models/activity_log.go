package models

import (
	"encoding/json"
	"time"

	"github.com/radar-crm/backend/internal/models/dto"
)

type ActivityLog struct {
	ID         string
	ActorID    *string
	ActorName  string
	Action     string
	EntityType string
	EntityID   string
	Metadata   json.RawMessage
	CreatedAt  time.Time
}

func (a *ActivityLog) ToResponse() dto.ActivityItemResponse {
	label := a.Action
	var meta map[string]any
	if len(a.Metadata) > 0 {
		_ = json.Unmarshal(a.Metadata, &meta)
		if v, ok := meta["label"].(string); ok && v != "" {
			label = v
		}
	}
	return dto.ActivityItemResponse{
		ID:         a.ID,
		ActorName:  a.ActorName,
		Action:     a.Action,
		EntityType: a.EntityType,
		EntityID:   a.EntityID,
		Label:      label,
		CreatedAt:  a.CreatedAt.Format(time.RFC3339),
	}
}
