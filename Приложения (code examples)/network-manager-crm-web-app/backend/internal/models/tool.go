package models

import (
	"time"

	"github.com/radar-crm/backend/internal/models/dto"
)

type Tool struct {
	ID                      string
	Name                    string
	SerialNumber            string
	ToolType                string
	Model                   string
	ControlType             string
	Status                  string
	CalibrationDueAt        *time.Time
	CalibrationPeriodMonths int
	UsageLimit              int
	UsageCount              int
	UsageUnit               string
	CostCents               int
	PurchaseDate            *time.Time
	Comment                 string
	ProblemType             *string
	ProblemComment          string
	ProblemReportedAt       *time.Time
	CreatedAt               time.Time
	UpdatedAt               time.Time
	ActiveAssignment        *ToolAssignment
	AssignmentHistory       []ToolAssignment
	PlannedReturnAt         *time.Time
	Calibrations            []ToolCalibration
}

func (t *Tool) ToResponse() dto.ToolResponse {
	resp := dto.ToolResponse{
		ID:                      t.ID,
		Name:                    t.Name,
		SerialNumber:            t.SerialNumber,
		ToolType:                t.ToolType,
		Model:                   t.Model,
		ControlType:             t.ControlType,
		Status:                  t.Status,
		UsageLimit:              t.UsageLimit,
		UsageCount:              t.UsageCount,
		UsageUnit:               t.UsageUnit,
		CostCents:               t.CostCents,
		CalibrationPeriodMonths: t.CalibrationPeriodMonths,
		Comment:                 t.Comment,
	}
	if t.ProblemType != nil {
		resp.ProblemType = *t.ProblemType
	}
	if t.ProblemComment != "" {
		resp.ProblemComment = t.ProblemComment
	}
	if t.ProblemReportedAt != nil {
		s := t.ProblemReportedAt.Format(time.RFC3339)
		resp.ProblemReportedAt = &s
	}
	if t.CalibrationDueAt != nil {
		s := t.CalibrationDueAt.Format(time.RFC3339)
		resp.CalibrationDueAt = &s
	}
	if t.PurchaseDate != nil {
		s := t.PurchaseDate.Format("2006-01-02")
		resp.PurchaseDate = &s
	}
	return resp
}

func (t *Tool) ToDetailResponse() dto.ToolDetailResponse {
	resp := dto.ToolDetailResponse{ToolResponse: t.ToResponse()}
	if t.ActiveAssignment != nil {
		a := t.ActiveAssignment.ToResponse()
		resp.ActiveAssignment = &a
	}
	if t.PlannedReturnAt != nil {
		s := t.PlannedReturnAt.Format("2006-01-02")
		resp.PlannedReturnAt = &s
	}
	if len(t.AssignmentHistory) > 0 {
		resp.AssignmentHistory = make([]dto.ToolAssignmentResponse, 0, len(t.AssignmentHistory))
		for _, a := range t.AssignmentHistory {
			resp.AssignmentHistory = append(resp.AssignmentHistory, a.ToResponse())
		}
	}
	if len(t.Calibrations) > 0 {
		resp.Calibrations = make([]dto.ToolCalibrationResponse, 0, len(t.Calibrations))
		for _, c := range t.Calibrations {
			resp.Calibrations = append(resp.Calibrations, c.ToResponse())
		}
	}
	return resp
}

type ToolListItem struct {
	Tool
	LastReturnedAt  *time.Time
	PlannedReturnAt *time.Time
}

func (item *ToolListItem) ToListItemResponse() dto.ToolListItemResponse {
	resp := dto.ToolListItemResponse{ToolResponse: item.Tool.ToResponse()}
	if item.ActiveAssignment != nil {
		a := item.ActiveAssignment.ToResponse()
		resp.ActiveAssignment = &a
	}
	if item.LastReturnedAt != nil {
		s := item.LastReturnedAt.Format(time.RFC3339)
		resp.LastReturnedAt = &s
	}
	if item.PlannedReturnAt != nil {
		s := item.PlannedReturnAt.Format("2006-01-02")
		resp.PlannedReturnAt = &s
	}
	return resp
}
