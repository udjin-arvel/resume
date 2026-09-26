package models

import (
	"time"

	"github.com/radar-crm/backend/internal/models/dto"
)

type Document struct {
	ID           string
	OwnerID      *string
	EntityType   string
	EntityID     string
	DocumentType string
	Filename     string
	MimeType     string
	SizeBytes    int64
	StoragePath  string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (d *Document) ToResponse() dto.DocumentResponse {
	return dto.DocumentResponse{
		ID:           d.ID,
		EntityType:   d.EntityType,
		EntityID:     d.EntityID,
		DocumentType: d.DocumentType,
		Filename:     d.Filename,
		MimeType:     d.MimeType,
		SizeBytes:    d.SizeBytes,
		CreatedAt:    d.CreatedAt.Format(time.RFC3339),
	}
}
