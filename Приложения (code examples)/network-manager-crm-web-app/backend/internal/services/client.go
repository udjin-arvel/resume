package services

import (
	"context"
	"math"

	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/repositories"
)

type ClientService struct {
	clients     *repositories.ClientRepository
	projectList *ProjectService
	documents   *repositories.DocumentRepository
	finance     *repositories.FinanceRepository
}

func NewClientService(
	clients *repositories.ClientRepository,
	projectList *ProjectService,
	documents *repositories.DocumentRepository,
	finance *repositories.FinanceRepository,
) *ClientService {
	return &ClientService{
		clients:     clients,
		projectList: projectList,
		documents:   documents,
		finance:     finance,
	}
}

func (s *ClientService) List(ctx context.Context, q dto.ClientListQuery) (*dto.PaginatedResponse[dto.ClientResponse], error) {
	items, total, err := s.clients.List(ctx, q.PaginationQuery)
	if err != nil {
		return nil, err
	}
	return paginateClients(items, total, q.Page, q.PageSize), nil
}

func (s *ClientService) GetByID(ctx context.Context, id string) (*dto.ClientResponse, error) {
	client, err := s.clients.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	resp := client.ToResponse()
	return &resp, nil
}

func (s *ClientService) Create(ctx context.Context, req dto.UpdateClientRequest) (*dto.ClientResponse, error) {
	client := &models.Client{
		Name:          req.Name,
		Country:       req.Country,
		City:          req.City,
		ContactPerson: req.ContactPerson,
		Phone:         req.Phone,
		Email:         req.Email,
		Comment:       req.Comment,
	}
	if err := s.clients.Create(ctx, client); err != nil {
		return nil, err
	}
	resp := client.ToResponse()
	return &resp, nil
}

func (s *ClientService) Update(ctx context.Context, id string, req dto.UpdateClientRequest) (*dto.ClientResponse, error) {
	client, err := s.clients.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	client.Name = req.Name
	client.Country = req.Country
	client.City = req.City
	client.ContactPerson = req.ContactPerson
	client.Phone = req.Phone
	client.Email = req.Email
	client.Comment = req.Comment
	if err := s.clients.Update(ctx, client); err != nil {
		return nil, err
	}
	resp := client.ToResponse()
	return &resp, nil
}

func (s *ClientService) Delete(ctx context.Context, id string) error {
	return s.clients.SoftDelete(ctx, id)
}

func (s *ClientService) ListProjects(ctx context.Context, clientID string) ([]dto.ProjectResponse, error) {
	if _, err := s.clients.GetByID(ctx, clientID); err != nil {
		return nil, err
	}
	resp, err := s.projectList.List(ctx, dto.ProjectListQuery{
		ClientID:        clientID,
		PaginationQuery: dto.PaginationQuery{Page: 1, PageSize: 100},
	})
	if err != nil {
		return nil, err
	}
	return resp.Items, nil
}

func (s *ClientService) ListDocuments(ctx context.Context, clientID string) ([]dto.DocumentResponse, error) {
	if _, err := s.clients.GetByID(ctx, clientID); err != nil {
		return nil, err
	}
	docs, err := s.documents.List(ctx, dto.DocumentListQuery{EntityType: "client", EntityID: clientID})
	if err != nil {
		return nil, err
	}
	responses := make([]dto.DocumentResponse, 0, len(docs))
	for _, d := range docs {
		responses = append(responses, d.ToResponse())
	}
	return responses, nil
}

func (s *ClientService) Finance(ctx context.Context, clientID string) (*dto.ClientFinanceResponse, error) {
	if _, err := s.clients.GetByID(ctx, clientID); err != nil {
		return nil, err
	}
	return s.finance.ClientByID(ctx, clientID)
}

func paginateClients(items []models.Client, total int64, page, pageSize int) *dto.PaginatedResponse[dto.ClientResponse] {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	responses := make([]dto.ClientResponse, 0, len(items))
	for _, item := range items {
		responses = append(responses, item.ToResponse())
	}
	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	return &dto.PaginatedResponse[dto.ClientResponse]{
		Items:      responses,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}
}