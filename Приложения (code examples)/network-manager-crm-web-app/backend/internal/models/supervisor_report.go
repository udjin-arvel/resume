package models

import (
	"time"

	"github.com/radar-crm/backend/internal/models/dto"
)

type SupervisorReport struct {
	ID               string
	ProjectID        string
	ProjectName      string
	SupervisorID     string
	SupervisorName   string
	ReportDate       time.Time
	SiteStatus       string
	Description      string
	Transcription    string
	VoiceDocumentID  *string
	Status           string
	ManagerComment   string
	DowntimeHours    string
	DowntimeReason   string
	CompletedWorks   string
	IssueCategory    string
	IssueDescription string
	RelatedIssueID   *string
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

func mapSupervisorReportStatus(status string) string {
	if status == "accepted" {
		return "approved"
	}
	return status
}

func (r *SupervisorReport) ToResponse() dto.SupervisorReportResponse {
	return dto.SupervisorReportResponse{
		ID:               r.ID,
		ProjectID:        r.ProjectID,
		ProjectName:      r.ProjectName,
		SupervisorID:     r.SupervisorID,
		SupervisorName:   r.SupervisorName,
		ReportDate:       r.ReportDate.Format("2006-01-02"),
		SiteStatus:       r.SiteStatus,
		Description:      r.Description,
		Transcription:    r.Transcription,
		Status:           mapSupervisorReportStatus(r.Status),
		ManagerComment:   r.ManagerComment,
		DowntimeHours:    r.DowntimeHours,
		DowntimeReason:   r.DowntimeReason,
		SubmittedAt:      r.CreatedAt.Format(time.RFC3339),
		VoiceDocumentID:  r.VoiceDocumentID,
		CompletedWorks:   r.CompletedWorks,
		IssueCategory:    r.IssueCategory,
		IssueDescription: r.IssueDescription,
	}
}
