package moderation

import (
	"context"
	"encoding/json"
	"strings"

	"scanme/backend/internal/substance"
)

type substanceModerator interface {
	Create(ctx context.Context, input substance.UpsertInput, adminID string) (substance.Substance, error)
	Update(ctx context.Context, id string, input substance.UpsertInput, adminID string) (substance.Substance, error)
	FindMergeCandidate(ctx context.Context, code, rawName string) (string, bool, error)
	GetByID(ctx context.Context, id string) (substance.Substance, error)
}

type Service struct {
	queue      Repository
	substances substanceModerator
}

func NewService(queue Repository, substances substanceModerator) Service {
	return Service{queue: queue, substances: substances}
}

func (s Service) ListQueue(ctx context.Context, status string, limit int, withSuggestions bool) (QueueListResponse, error) {
	counts, err := s.queue.CountsByStatus(ctx)
	if err != nil {
		return QueueListResponse{}, err
	}
	items, err := s.queue.List(ctx, status, limit)
	if err != nil {
		return QueueListResponse{}, err
	}
	if withSuggestions {
		for i := range items {
			if items[i].Status != "pending" {
				continue
			}
			var cand CandidatePayload
			if err := json.Unmarshal(items[i].Candidate, &cand); err != nil {
				continue
			}
			id, ok, err := s.substances.FindMergeCandidate(ctx, cand.Code, cand.Name)
			if err != nil || !ok {
				continue
			}
			sub, err := s.substances.GetByID(ctx, id)
			if err != nil {
				continue
			}
			raw, err := json.Marshal(sub)
			if err != nil {
				continue
			}
			items[i].MergeSuggestion = raw
		}
	}
	return QueueListResponse{Counts: counts, Items: items}, nil
}

type ApproveOverrides struct {
	Code        *string   `json:"code"`
	Name        *string   `json:"name"`
	Aliases     *[]string `json:"aliases"`
	Category    *string   `json:"category"`
	DangerLevel *string   `json:"dangerLevel"`
	Description *string   `json:"description"`
	Sources     *[]string `json:"sources"`
	IsActive    *bool     `json:"isActive"`
}

func (s Service) Approve(ctx context.Context, queueID string, adminID string, overrides ApproveOverrides) (substance.Substance, error) {
	item, err := s.queue.GetPendingByID(ctx, queueID)
	if err != nil {
		return substance.Substance{}, err
	}

	var cand CandidatePayload
	if err := json.Unmarshal(item.Candidate, &cand); err != nil {
		return substance.Substance{}, ErrInvalidInput
	}
	input := upsertFromCandidate(cand)
	applyOverrides(&input, overrides)

	if strings.TrimSpace(input.Name) == "" {
		return substance.Substance{}, ErrInvalidInput
	}

	existingID, ok, err := s.substances.FindMergeCandidate(ctx, input.Code, input.Name)
	if err != nil {
		return substance.Substance{}, err
	}

	var created substance.Substance
	if ok {
		created, err = s.substances.Update(ctx, existingID, input, adminID)
	} else {
		created, err = s.substances.Create(ctx, input, adminID)
	}
	if err != nil {
		return substance.Substance{}, err
	}

	if err := s.queue.MarkApproved(ctx, queueID, adminID, created.ID); err != nil {
		return substance.Substance{}, err
	}
	return created, nil
}

func (s Service) Reject(ctx context.Context, queueID, adminID, reason string) error {
	return s.queue.MarkRejected(ctx, queueID, adminID, reason)
}

func upsertFromCandidate(c CandidatePayload) substance.UpsertInput {
	desc := strings.TrimSpace(c.Rationale)
	active := true
	return substance.UpsertInput{
		Code:        strings.TrimSpace(c.Code),
		Name:        strings.TrimSpace(c.Name),
		Category:    "other",
		DangerLevel: mapSuggestedDanger(c.SuggestedDangerLevel),
		Description: desc,
		Sources:     []string{"deepseek_candidate"},
		IsActive:    &active,
	}
}

func applyOverrides(in *substance.UpsertInput, ov ApproveOverrides) {
	if ov.Code != nil {
		in.Code = strings.TrimSpace(*ov.Code)
	}
	if ov.Name != nil {
		in.Name = strings.TrimSpace(*ov.Name)
	}
	if ov.Aliases != nil {
		in.Aliases = append([]string(nil), *ov.Aliases...)
	}
	if ov.Category != nil {
		in.Category = strings.TrimSpace(*ov.Category)
	}
	if ov.DangerLevel != nil {
		in.DangerLevel = mapSuggestedDanger(*ov.DangerLevel)
	}
	if ov.Description != nil {
		in.Description = strings.TrimSpace(*ov.Description)
	}
	if ov.Sources != nil {
		in.Sources = append([]string(nil), *ov.Sources...)
	}
	if ov.IsActive != nil {
		in.IsActive = ov.IsActive
	}
}

func mapSuggestedDanger(raw string) substance.DangerLevel {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "dangerous":
		return substance.DangerLevelDangerous
	case "controversial":
		return substance.DangerLevelControversial
	case "safe":
		return substance.DangerLevelSafe
	default:
		return substance.DangerLevelControversial
	}
}

var _ substanceModerator = substance.Service{}
