package models

import "github.com/radar-crm/backend/internal/models/dto"

type EstimateBlock struct {
	ID         string
	EstimateID string
	BlockType  string
	SortOrder  int
	Title      string
	Quantity   string
	Unit       string
	UnitPrice  string
	Role       string
	Hours      string
	Rate       string
	Amount     string
	Comment    string
}

func (b *EstimateBlock) ToResponse() dto.EstimateBlockResponse {
	return dto.EstimateBlockResponse{
		ID:        b.ID,
		BlockType: b.BlockType,
		SortOrder: b.SortOrder,
		Title:     b.Title,
		Quantity:  b.Quantity,
		Unit:      b.Unit,
		UnitPrice: b.UnitPrice,
		Role:      b.Role,
		Hours:     b.Hours,
		Rate:      b.Rate,
		Amount:    b.Amount,
		Comment:   b.Comment,
	}
}

type EstimateTemplate struct {
	ID        string
	Name      string
	CreatedBy *string
	CreatedAt string
	UpdatedAt string
	Blocks    []EstimateTemplateBlock
}

type EstimateTemplateBlock struct {
	ID         string
	TemplateID string
	BlockType  string
	SortOrder  int
	Title      string
	Quantity   string
	Unit       string
	UnitPrice  string
	Role       string
	Hours      string
	Rate       string
	Amount     string
	Comment    string
}

func (b *EstimateTemplateBlock) ToBlockResponse() dto.EstimateBlockResponse {
	return dto.EstimateBlockResponse{
		ID:        b.ID,
		BlockType: b.BlockType,
		SortOrder: b.SortOrder,
		Title:     b.Title,
		Quantity:  b.Quantity,
		Unit:      b.Unit,
		UnitPrice: b.UnitPrice,
		Role:      b.Role,
		Hours:     b.Hours,
		Rate:      b.Rate,
		Amount:    b.Amount,
		Comment:   b.Comment,
	}
}
