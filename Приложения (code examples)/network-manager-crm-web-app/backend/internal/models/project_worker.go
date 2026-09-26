package models

import (
	"time"

	"github.com/radar-crm/backend/internal/models/dto"
)

type ProjectWorker struct {
	ID                 string
	ProjectID          string
	UserID             string
	Role               string
	ConfirmationStatus string
	AssignedAt         time.Time
	InvitedAt          *time.Time
	FirstName          string
	LastName           string
	HourlyRate         string
	Specialization     string
	Position           string
}

func (pw *ProjectWorker) ToResponse() dto.ProjectWorkerResponse {
	resp := dto.ProjectWorkerResponse{
		ID:                 pw.ID,
		UserID:             pw.UserID,
		FirstName:          pw.FirstName,
		LastName:           pw.LastName,
		Role:               pw.Role,
		ConfirmationStatus: pw.ConfirmationStatus,
		HourlyRate:         pw.HourlyRate,
		Specialization:     pw.Specialization,
		Position:           pw.Position,
		AssignedAt:         pw.AssignedAt.UTC().Format(time.RFC3339),
	}
	if pw.InvitedAt != nil {
		resp.InvitedAt = pw.InvitedAt.UTC().Format(time.RFC3339)
	}
	return resp
}

type ProjectStats struct {
	Workers         int
	Confirmed       int
	ReportsOnReview int
}
