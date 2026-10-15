package scan

import (
	"context"
	"errors"
	"strings"
	"time"
)

var ErrInvalidBarcode = errors.New("invalid barcode")

type Service struct {
	repository Repository
}

func NewService(repository Repository) Service {
	return Service{repository: repository}
}

func (s Service) Create(ctx context.Context, userID string, req CreateScanRequest, idempotencyKey string) (Scan, error) {
	req.Barcode = strings.TrimSpace(req.Barcode)
	if req.Barcode == "" || len(req.Barcode) > 64 {
		return Scan{}, ErrInvalidBarcode
	}

	req.ProductSnapshot.Barcode = strings.TrimSpace(req.ProductSnapshot.Barcode)
	if req.ProductSnapshot.Barcode == "" {
		req.ProductSnapshot.Barcode = req.Barcode
	}
	if strings.TrimSpace(req.ProductSnapshot.Name) == "" {
		req.ProductSnapshot.Name = "Без названия"
	}

	return s.repository.Create(ctx, userID, req, strings.TrimSpace(idempotencyKey))
}

func (s Service) List(ctx context.Context, userID string, limit int, cursor *time.Time) ([]Scan, error) {
	if limit <= 0 || limit > 100 {
		limit = 30
	}
	return s.repository.List(ctx, userID, limit, cursor)
}

func (s Service) Delete(ctx context.Context, userID string, id string) error {
	return s.repository.Delete(ctx, userID, strings.TrimSpace(id))
}
