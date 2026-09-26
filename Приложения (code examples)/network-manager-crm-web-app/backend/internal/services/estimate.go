package services

import (
	"context"
	"fmt"
	"math"
	"strings"

	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/repositories"
)

type EstimateService struct {
	estimates *repositories.EstimateRepository
	clients   *repositories.ClientRepository
	projects  *repositories.ProjectRepository
}

func NewEstimateService(
	estimates *repositories.EstimateRepository,
	clients *repositories.ClientRepository,
	projects *repositories.ProjectRepository,
) *EstimateService {
	return &EstimateService{estimates: estimates, clients: clients, projects: projects}
}

func (s *EstimateService) List(ctx context.Context, q dto.EstimateListQuery) (*dto.PaginatedResponse[dto.EstimateResponse], error) {
	items, total, err := s.estimates.List(ctx, q)
	if err != nil {
		return nil, err
	}
	page, pageSize := q.Page, q.PageSize
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}

	estimateIDs := make([]string, len(items))
	for i := range items {
		estimateIDs[i] = items[i].ID
	}
	linkedProjects, err := s.projects.MapProjectIDsByEstimateIDs(ctx, estimateIDs)
	if err != nil {
		return nil, err
	}

	responses := make([]dto.EstimateResponse, 0, len(items))
	for _, item := range items {
		var linkedID *string
		if pid, ok := linkedProjects[item.ID]; ok {
			linkedID = &pid
		}
		responses = append(responses, item.ToResponse(nil, linkedID))
	}
	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	return &dto.PaginatedResponse[dto.EstimateResponse]{
		Items: responses, Total: total, Page: page, PageSize: pageSize, TotalPages: totalPages,
	}, nil
}

func (s *EstimateService) GetByID(ctx context.Context, id string) (*dto.EstimateResponse, error) {
	estimate, err := s.estimates.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	blocks, err := s.estimates.GetBlocksByEstimateID(ctx, id)
	if err != nil {
		return nil, err
	}
	var linkedID *string
	if project, err := s.projects.FindByEstimateID(ctx, id); err == nil {
		linkedID = &project.ID
	} else if err != apperrors.ErrNotFound {
		return nil, err
	}
	resp := estimate.ToResponse(blocks, linkedID)
	return &resp, nil
}

func (s *EstimateService) Create(ctx context.Context, req dto.CreateEstimateRequest, createdBy string) (*dto.EstimateResponse, error) {
	blocks := mapBlockRequests(req.Blocks)
	total := sumBlockAmounts(blocks)
	estimate := &models.Estimate{
		Name:          req.Name,
		CompanyName:   req.CompanyName,
		ContactPerson: req.ContactPerson,
		Phone:         req.Phone,
		Email:         req.Email,
		Country:       req.Country,
		City:          req.City,
		Comment:       req.Comment,
		TotalAmount:   total,
		CreatedBy:     &createdBy,
	}
	if err := s.estimates.Create(ctx, estimate, blocks); err != nil {
		return nil, err
	}
	return s.GetByID(ctx, estimate.ID)
}

func (s *EstimateService) Update(ctx context.Context, id string, req dto.UpdateEstimateRequest) (*dto.EstimateResponse, error) {
	estimate, err := s.estimates.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if estimate.Status != "draft" && estimate.Status != "approved" {
		return nil, apperrors.New(apperrors.ErrValidation, "only draft or approved estimates can be edited")
	}

	blocks := mapBlockRequests(req.Blocks)
	estimate.Name = req.Name
	estimate.CompanyName = req.CompanyName
	estimate.ContactPerson = req.ContactPerson
	estimate.Phone = req.Phone
	estimate.Email = req.Email
	estimate.Country = req.Country
	estimate.City = req.City
	estimate.Comment = req.Comment

	if err := s.estimates.Update(ctx, estimate, blocks); err != nil {
		return nil, err
	}

	if estimate.Status == "approved" {
		if err := s.syncLinkedProject(ctx, estimate); err != nil {
			return nil, err
		}
	}

	return s.GetByID(ctx, id)
}

func (s *EstimateService) syncLinkedProject(ctx context.Context, estimate *models.Estimate) error {
	project, err := s.projects.FindByEstimateID(ctx, estimate.ID)
	if err == apperrors.ErrNotFound {
		return nil
	}
	if err != nil {
		return err
	}
	project.Name = estimate.Name
	project.Location = estimateLocation(estimate)
	project.Budget = estimate.TotalAmount
	return s.projects.Update(ctx, project)
}

func estimateLocation(e *models.Estimate) string {
	parts := make([]string, 0, 2)
	if strings.TrimSpace(e.City) != "" {
		parts = append(parts, strings.TrimSpace(e.City))
	}
	if strings.TrimSpace(e.Country) != "" {
		parts = append(parts, strings.TrimSpace(e.Country))
	}
	return strings.Join(parts, ", ")
}

func (s *EstimateService) Delete(ctx context.Context, id string) error {
	return s.estimates.Delete(ctx, id)
}

func (s *EstimateService) UpdateStatus(ctx context.Context, id string, req dto.EstimateStatusRequest) (*dto.EstimateResponse, error) {
	estimate, err := s.estimates.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if !IsValidStatusTransition(estimate.Status, req.Status) {
		return nil, apperrors.New(apperrors.ErrValidation, fmt.Sprintf("invalid status transition from %s to %s", estimate.Status, req.Status))
	}

	if req.Status == "approved" && estimate.ClientID == nil {
		client := &models.Client{
			Name:          defaultClientName(estimate),
			Country:       estimate.Country,
			City:          estimate.City,
			ContactPerson: estimate.ContactPerson,
			Phone:         estimate.Phone,
			Email:         estimate.Email,
		}
		if err := s.clients.Create(ctx, client); err != nil {
			return nil, err
		}
		if err := s.estimates.SetClientID(ctx, id, client.ID); err != nil {
			return nil, err
		}
	}

	if err := s.estimates.UpdateStatus(ctx, id, req.Status); err != nil {
		return nil, err
	}
	return s.GetByID(ctx, id)
}

func mapBlockRequests(reqs []dto.CreateEstimateBlockRequest) []models.EstimateBlock {
	blocks := make([]models.EstimateBlock, 0, len(reqs))
	for _, r := range reqs {
		amount := CalcBlockAmount(r.BlockType, r.Quantity, r.UnitPrice, r.Hours, r.Rate, r.Amount)
		blocks = append(blocks, models.EstimateBlock{
			BlockType: r.BlockType,
			SortOrder: r.SortOrder,
			Title:     r.Title,
			Quantity:  r.Quantity,
			Unit:      r.Unit,
			UnitPrice: r.UnitPrice,
			Role:      r.Role,
			Hours:     r.Hours,
			Rate:      r.Rate,
			Amount:    amount,
			Comment:   r.Comment,
		})
	}
	return blocks
}

func sumBlockAmounts(blocks []models.EstimateBlock) string {
	var total float64
	for _, b := range blocks {
		total += parseNum(b.Amount)
	}
	return formatMoney(total)
}

func IsValidStatusTransition(from, to string) bool {
	switch from {
	case "draft":
		return to == "sent"
	case "sent":
		return to == "approved" || to == "rejected"
	default:
		return false
	}
}

func defaultClientName(e *models.Estimate) string {
	if e.CompanyName != "" {
		return e.CompanyName
	}
	return e.Name
}
