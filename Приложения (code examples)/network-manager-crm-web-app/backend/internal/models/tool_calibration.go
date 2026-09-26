package models

import (
	"time"

	"github.com/radar-crm/backend/internal/models/dto"
)

type ToolCalibration struct {
	ID          string
	ToolID      string
	CalibratedAt time.Time
	NextDueAt   *time.Time
	PerformedBy *string
	PerformerName string
	Notes       string
	CreatedAt   time.Time
}

func (c *ToolCalibration) ToResponse() dto.ToolCalibrationResponse {
	resp := dto.ToolCalibrationResponse{
		ID:           c.ID,
		ToolID:       c.ToolID,
		CalibratedAt: c.CalibratedAt.Format(time.RFC3339),
		Notes:        c.Notes,
		PerformerName: c.PerformerName,
	}
	if c.NextDueAt != nil {
		s := c.NextDueAt.Format(time.RFC3339)
		resp.NextDueAt = &s
	}
	if c.PerformedBy != nil {
		resp.PerformedBy = c.PerformedBy
	}
	return resp
}
