package substance

import (
	"context"
	"encoding/json"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
)

var (
	ErrInvalidSubstance = errors.New("invalid substance")
	ErrNotFound         = errors.New("substance not found")
)

type Service struct {
	repository Repository
}

func NewService(repository Repository) Service {
	return Service{repository: repository}
}

func (s Service) List(ctx context.Context, opts ListOptions) (ListResponse, error) {
	items, err := s.repository.List(ctx, opts)
	if err != nil {
		return ListResponse{}, err
	}

	var nextVersion int64
	for _, item := range items {
		if item.Version > nextVersion {
			nextVersion = item.Version
		}
	}
	if nextVersion == 0 {
		nextVersion = opts.Since
	}

	return ListResponse{Items: items, NextVersion: nextVersion}, nil
}

func (s Service) Create(ctx context.Context, input UpsertInput, adminID string) (Substance, error) {
	normalized, err := normalizeInput(input)
	if err != nil {
		return Substance{}, err
	}
	return s.repository.Create(ctx, normalized, adminID)
}

func (s Service) Update(ctx context.Context, id string, input UpsertInput, adminID string) (Substance, error) {
	normalized, err := normalizeInput(input)
	if err != nil {
		return Substance{}, err
	}

	item, err := s.repository.Update(ctx, strings.TrimSpace(id), normalized, adminID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Substance{}, ErrNotFound
	}
	return item, err
}

func (s Service) Delete(ctx context.Context, id string, adminID string) error {
	if err := s.repository.Delete(ctx, strings.TrimSpace(id), adminID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}
	return nil
}

func (s Service) Import(ctx context.Context, inputs []UpsertInput, adminID string) ([]Substance, error) {
	items := make([]Substance, 0, len(inputs))
	for _, input := range inputs {
		item, err := s.Create(ctx, input, adminID)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

func (s Service) GetByID(ctx context.Context, id string) (Substance, error) {
	item, err := s.repository.GetByID(ctx, strings.TrimSpace(id))
	if errors.Is(err, pgx.ErrNoRows) {
		return Substance{}, ErrNotFound
	}
	return item, err
}

func (s Service) FindMergeCandidate(ctx context.Context, code, rawName string) (string, bool, error) {
	return s.repository.FindMergeCandidate(ctx, code, rawName)
}

func (s Service) ListAuditHistory(ctx context.Context, substanceID string, limit int) ([]AuditHistoryRow, error) {
	return s.repository.ListAuditHistoryForSubstance(ctx, strings.TrimSpace(substanceID), limit)
}

func (s Service) RollbackToAudit(ctx context.Context, substanceID, auditID, adminID string) (Substance, error) {
	substanceID = strings.TrimSpace(substanceID)
	auditID = strings.TrimSpace(auditID)
	diff, err := s.repository.GetAuditDiffByID(ctx, auditID, substanceID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Substance{}, ErrNotFound
	}
	if err != nil {
		return Substance{}, err
	}
	var snapshot Substance
	if err := json.Unmarshal(diff, &snapshot); err != nil {
		return Substance{}, ErrInvalidSubstance
	}
	if snapshot.ID != substanceID {
		return Substance{}, ErrInvalidSubstance
	}
	if err := s.repository.RestoreSubstanceSnapshot(ctx, snapshot, adminID); err != nil {
		return Substance{}, err
	}
	return s.repository.GetByID(ctx, substanceID)
}

func normalizeInput(input UpsertInput) (UpsertInput, error) {
	input.Code = strings.TrimSpace(input.Code)
	input.Name = strings.TrimSpace(input.Name)
	input.Category = strings.TrimSpace(input.Category)
	input.Description = strings.TrimSpace(input.Description)

	if input.Name == "" || !validDangerLevel(input.DangerLevel) {
		return UpsertInput{}, ErrInvalidSubstance
	}
	if input.Category == "" {
		input.Category = "other"
	}

	input.Aliases = normalizeStringList(input.Aliases)
	input.Sources = normalizeStringList(input.Sources)

	return input, nil
}

func normalizeStringList(values []string) []string {
	seen := make(map[string]struct{}, len(values))
	normalized := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" {
			continue
		}
		key := strings.ToLower(value)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		normalized = append(normalized, value)
	}
	return normalized
}

func validDangerLevel(level DangerLevel) bool {
	switch level {
	case DangerLevelSafe, DangerLevelControversial, DangerLevelDangerous:
		return true
	default:
		return false
	}
}
