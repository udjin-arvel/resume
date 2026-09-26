package models

import (
	"time"

	"github.com/radar-crm/backend/internal/models/dto"
)

type ProjectIssue struct {
	ID             string
	ProjectID      string
	Number         int
	Title          string
	Category       string
	Description    string
	Status         string
	SourceReportID *string
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func (i *ProjectIssue) ToResponse() dto.ProjectIssueResponse {
	var sourceReportID *string
	if i.SourceReportID != nil && *i.SourceReportID != "" {
		sourceReportID = i.SourceReportID
	}
	return dto.ProjectIssueResponse{
		ID:             i.ID,
		ProjectID:      i.ProjectID,
		Number:         i.Number,
		Title:          i.Title,
		Category:       i.Category,
		Description:    i.Description,
		Status:         i.Status,
		SourceReportID: sourceReportID,
	}
}
