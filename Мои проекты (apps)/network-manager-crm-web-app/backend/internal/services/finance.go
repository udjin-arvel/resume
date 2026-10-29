package services

import (
	"context"

	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/repositories"
)

type FinanceService struct {
	finance *repositories.FinanceRepository
}

func NewFinanceService(finance *repositories.FinanceRepository) *FinanceService {
	return &FinanceService{finance: finance}
}

func (s *FinanceService) Overview(ctx context.Context, q dto.FinanceScopeQuery) (*dto.FinanceOverviewResponse, error) {
	return s.finance.Overview(ctx, q)
}

func (s *FinanceService) Projects(ctx context.Context, q dto.FinanceScopeQuery) ([]dto.ProjectFinanceResponse, error) {
	return s.finance.Projects(ctx, q)
}

func (s *FinanceService) ProjectByID(ctx context.Context, id string) (*dto.ProjectFinanceResponse, error) {
	return s.finance.ProjectByID(ctx, id)
}

func (s *FinanceService) Workers(ctx context.Context, q dto.FinanceScopeQuery) ([]dto.WorkerFinanceResponse, error) {
	return s.finance.Workers(ctx, q)
}

func (s *FinanceService) WorkerByID(ctx context.Context, id string) (*dto.WorkerFinanceMineResponse, error) {
	return s.finance.Mine(ctx, id)
}

func (s *FinanceService) Categories(ctx context.Context, q dto.FinanceCategoryQuery) ([]dto.ExpenseCategoryResponse, error) {
	return s.finance.Categories(ctx, q)
}

func (s *FinanceService) Mine(ctx context.Context, userID string) (*dto.WorkerFinanceMineResponse, error) {
	return s.finance.Mine(ctx, userID)
}
