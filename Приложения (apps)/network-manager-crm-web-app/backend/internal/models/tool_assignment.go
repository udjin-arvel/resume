package models

import (
	"time"

	"github.com/radar-crm/backend/internal/models/dto"
)

type ToolAssignment struct {
	ID                string
	ToolID            string
	ProjectID         string
	ProjectName       string
	ResponsibleUserID *string
	ResponsibleName   string
	ResponsibleRole   string
	AssignedAt        time.Time
	ReturnedAt        *time.Time
	ConditionOnReturn string
	UsedInReport      bool
}

func (a *ToolAssignment) ToResponse() dto.ToolAssignmentResponse {
	resp := dto.ToolAssignmentResponse{
		ID:                a.ID,
		ToolID:            a.ToolID,
		ProjectID:         a.ProjectID,
		ProjectName:       a.ProjectName,
		ResponsibleUserID: a.ResponsibleUserID,
		ResponsibleName:   a.ResponsibleName,
		ResponsibleRole:   a.ResponsibleRole,
		AssignedAt:        a.AssignedAt.Format(time.RFC3339),
		UsedInReport:      a.UsedInReport,
		ConditionOnReturn: a.ConditionOnReturn,
	}
	if a.ReturnedAt != nil {
		s := a.ReturnedAt.Format(time.RFC3339)
		resp.ReturnedAt = &s
	}
	return resp
}
