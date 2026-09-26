package services

import (
	"context"
	"log/slog"

	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/repositories"
)

type ActivityService struct {
	activity *repositories.ActivityRepository
}

func NewActivityService(activity *repositories.ActivityRepository) *ActivityService {
	return &ActivityService{activity: activity}
}

func (s *ActivityService) Record(ctx context.Context, actorID, action, entityType, entityID, label string) {
	meta := map[string]any{}
	if label != "" {
		meta["label"] = label
	}
	if err := s.activity.Create(ctx, actorID, action, entityType, entityID, meta); err != nil {
		slog.Error("activity log failed", "error", err, "action", action)
	}
}

func (s *ActivityService) RecordWithMeta(ctx context.Context, actorID, action, entityType, entityID string, meta map[string]any) {
	if err := s.activity.Create(ctx, actorID, action, entityType, entityID, meta); err != nil {
		slog.Error("activity log failed", "error", err, "action", action)
	}
}

func (s *ActivityService) RecordProject(ctx context.Context, actorID, projectID, action, label string) {
	meta := map[string]any{
		"projectId": projectID,
		"label":     label,
	}
	s.RecordWithMeta(ctx, actorID, action, "project", projectID, meta)
}

func (s *ActivityService) ListByProject(ctx context.Context, projectID string, limit int) ([]dto.ActivityItemResponse, error) {
	items, err := s.activity.ListByProject(ctx, projectID, limit)
	if err != nil {
		return nil, err
	}
	responses := make([]dto.ActivityItemResponse, 0, len(items))
	for _, item := range items {
		responses = append(responses, item.ToResponse())
	}
	return responses, nil
}
