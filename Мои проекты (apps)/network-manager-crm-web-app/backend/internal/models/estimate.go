package models

import (
	"time"

	"github.com/radar-crm/backend/internal/models/dto"
)

type Estimate struct {
	ID            string
	ClientID      *string
	CreatedBy     *string
	Name          string
	CompanyName   string
	ContactPerson string
	Phone         string
	Email         string
	Country       string
	City          string
	Comment       string
	Status        string
	TotalAmount   string
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (e *Estimate) ToResponse(blocks []EstimateBlock, linkedProjectID *string) dto.EstimateResponse {
	resp := dto.EstimateResponse{
		ID:              e.ID,
		ClientID:        e.ClientID,
		Name:            e.Name,
		CompanyName:     e.CompanyName,
		ContactPerson:   e.ContactPerson,
		Phone:           e.Phone,
		Email:           e.Email,
		Country:         e.Country,
		City:            e.City,
		Comment:         e.Comment,
		Status:          e.Status,
		TotalAmount:     e.TotalAmount,
		LinkedProjectID: linkedProjectID,
		CreatedAt:       e.CreatedAt.Format(time.RFC3339),
		UpdatedAt:       e.UpdatedAt.Format(time.RFC3339),
	}
	if len(blocks) > 0 {
		resp.Blocks = make([]dto.EstimateBlockResponse, 0, len(blocks))
		for _, b := range blocks {
			resp.Blocks = append(resp.Blocks, b.ToResponse())
		}
	}
	return resp
}
