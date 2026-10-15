package services

import (
	"context"

	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/repositories"
)

type EstimateTemplateService struct {
	templates *repositories.EstimateTemplateRepository
	estimates *repositories.EstimateRepository
}

func NewEstimateTemplateService(templates *repositories.EstimateTemplateRepository, estimates *repositories.EstimateRepository) *EstimateTemplateService {
	return &EstimateTemplateService{templates: templates, estimates: estimates}
}

func (s *EstimateTemplateService) List(ctx context.Context) ([]dto.EstimateTemplateResponse, error) {
	items, err := s.templates.List(ctx)
	if err != nil {
		return nil, err
	}
	responses := make([]dto.EstimateTemplateResponse, 0, len(items))
	for _, item := range items {
		responses = append(responses, dto.EstimateTemplateResponse{
			ID:   item.ID,
			Name: item.Name,
		})
	}
	return responses, nil
}

func (s *EstimateTemplateService) Create(ctx context.Context, req dto.CreateEstimateTemplateRequest, createdBy string) (*dto.EstimateTemplateResponse, error) {
	estimate, err := s.estimates.GetByID(ctx, req.EstimateID)
	if err != nil {
		return nil, err
	}
	_ = estimate

	id, err := s.templates.CreateFromEstimate(ctx, req.EstimateID, req.Name, &createdBy)
	if err != nil {
		return nil, err
	}
	tpl, err := s.templates.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	blocks := make([]dto.EstimateBlockResponse, 0, len(tpl.Blocks))
	for _, b := range tpl.Blocks {
		blocks = append(blocks, b.ToBlockResponse())
	}
	return &dto.EstimateTemplateResponse{ID: tpl.ID, Name: tpl.Name, Blocks: blocks}, nil
}

func (s *EstimateTemplateService) CreateEstimateFromTemplate(ctx context.Context, req dto.CreateFromTemplateRequest, createdBy string) (*dto.EstimateResponse, error) {
	if _, err := s.templates.GetByID(ctx, req.TemplateID); err != nil {
		return nil, err
	}
	estimateID, err := s.templates.CreateEstimateFromTemplate(ctx, req.TemplateID, req.Name, &createdBy)
	if err != nil {
		return nil, err
	}
	estimate, err := s.estimates.GetByID(ctx, estimateID)
	if err != nil {
		return nil, err
	}
	blocks, err := s.estimates.GetBlocksByEstimateID(ctx, estimateID)
	if err != nil {
		return nil, err
	}
	resp := estimate.ToResponse(blocks, nil)
	return &resp, nil
}
