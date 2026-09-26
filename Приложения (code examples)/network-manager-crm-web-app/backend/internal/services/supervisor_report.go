package services

import (
	"context"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/repositories"
)

type SupervisorReportService struct {
	reports         *repositories.SupervisorReportRepository
	projects        *repositories.ProjectRepository
	projectWorkers  *repositories.ProjectWorkerRepository
	documents       *repositories.DocumentRepository
	toolAssignments *repositories.ToolAssignmentRepository
	projectIssues   *ProjectIssueService
	notifications   *NotificationService
	activity        *ActivityService
}

func NewSupervisorReportService(
	reports *repositories.SupervisorReportRepository,
	projects *repositories.ProjectRepository,
	projectWorkers *repositories.ProjectWorkerRepository,
	documents *repositories.DocumentRepository,
	toolAssignments *repositories.ToolAssignmentRepository,
	projectIssues *ProjectIssueService,
	notifications *NotificationService,
	activity *ActivityService,
) *SupervisorReportService {
	return &SupervisorReportService{
		reports:         reports,
		projects:        projects,
		projectWorkers:  projectWorkers,
		documents:       documents,
		toolAssignments: toolAssignments,
		projectIssues:   projectIssues,
		notifications:   notifications,
		activity:        activity,
	}
}

func (s *SupervisorReportService) List(
	ctx context.Context, q dto.ReportListQuery, actorRole, actorID string,
) (*dto.PaginatedResponse[dto.SupervisorReportResponse], error) {
	items, total, err := s.reports.List(ctx, q, actorRole, actorID)
	if err != nil {
		return nil, err
	}
	responses := make([]dto.SupervisorReportResponse, 0, len(items))
	reportIDs := make([]string, 0, len(items))
	for _, item := range items {
		reportIDs = append(reportIDs, item.ID)
		responses = append(responses, item.ToResponse())
	}
	if err := s.enrichListResponses(ctx, responses, reportIDs); err != nil {
		return nil, err
	}
	return paginateSupervisorReportResponses(responses, total, q.Page, q.PageSize), nil
}

func (s *SupervisorReportService) GetByID(ctx context.Context, id, actorRole, actorID string) (*dto.SupervisorReportResponse, error) {
	report, err := s.reports.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if err := s.ensureCanView(report, actorRole, actorID); err != nil {
		return nil, err
	}
	resp := report.ToResponse()
	if err := s.enrichDetailResponse(ctx, &resp, report); err != nil {
		return nil, err
	}
	return &resp, nil
}

func (s *SupervisorReportService) Create(
	ctx context.Context, req dto.CreateSupervisorReportRequest, actorID, actorRole string,
) (*dto.SupervisorReportResponse, error) {
	if err := s.ensureSupervisorOnProject(ctx, req.ProjectID, actorID); err != nil {
		return nil, err
	}

	reportDate, err := time.Parse("2006-01-02", req.ReportDate)
	if err != nil {
		return nil, apperrors.New(apperrors.ErrValidation, "invalid reportDate")
	}

	siteStatus := deriveSiteStatus(req.SiteStatus, req.DowntimeHours, req.DowntimeReason, req.IssueCategory, req.IssueDescription)
	if err := validateSiteStatus(siteStatus); err != nil {
		return nil, err
	}

	if err := s.projectIssues.ValidateLinkedIssues(ctx, req.ProjectID, req.LinkedIssueIDs); err != nil {
		return nil, err
	}

	if req.VoiceDocumentID != nil && *req.VoiceDocumentID != "" {
		doc, err := s.documents.GetByID(ctx, *req.VoiceDocumentID)
		if err != nil {
			return nil, err
		}
		if doc.OwnerID == nil || *doc.OwnerID != actorID {
			return nil, apperrors.New(apperrors.ErrValidation, "voice document does not belong to user")
		}
	}

	report := &models.SupervisorReport{
		ProjectID:        req.ProjectID,
		SupervisorID:     actorID,
		ReportDate:       reportDate,
		SiteStatus:       siteStatus,
		Description:      req.Description,
		VoiceDocumentID:  req.VoiceDocumentID,
		DowntimeHours:    req.DowntimeHours,
		DowntimeReason:   req.DowntimeReason,
		CompletedWorks:   req.CompletedWorks,
		IssueCategory:    req.IssueCategory,
		IssueDescription: req.IssueDescription,
	}

	if err := s.reports.Create(ctx, report); err != nil {
		return nil, err
	}

	if len(req.CrewUserIDs) > 0 {
		if err := s.reports.SetCrew(ctx, report.ID, req.CrewUserIDs); err != nil {
			return nil, err
		}
	}

	if len(req.LinkedIssueIDs) > 0 {
		if err := s.reports.SetLinkedIssues(ctx, report.ID, req.LinkedIssueIDs); err != nil {
			return nil, err
		}
	}

	if siteStatus == "issue" || siteStatus == "downtime" {
		issue, err := s.projectIssues.CreateForReport(
			ctx, req.ProjectID, report.ID, siteStatus,
			req.IssueCategory, req.IssueDescription, req.DowntimeReason,
		)
		if err != nil {
			return nil, err
		}
		if err := s.reports.SetRelatedIssueID(ctx, report.ID, issue.ID); err != nil {
			return nil, err
		}
		report.RelatedIssueID = &issue.ID
	}

	if len(req.ToolIDs) > 0 {
		if err := s.toolAssignments.MarkUsedInReport(ctx, req.ProjectID, req.ToolIDs); err != nil {
			return nil, err
		}
	}
	if s.activity != nil {
		s.activity.Record(ctx, actorID, "supervisor_report_created", "supervisor_report", report.ID, report.ProjectID)
	}

	return s.GetByID(ctx, report.ID, actorRole, actorID)
}

func (s *SupervisorReportService) Patch(
	ctx context.Context, id string, req dto.PatchSupervisorReportRequest, actorRole, actorID string,
) (*dto.SupervisorReportResponse, error) {
	report, err := s.reports.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if err := s.ensureCanView(report, actorRole, actorID); err != nil {
		return nil, err
	}
	if report.SupervisorID != actorID {
		return nil, apperrors.New(apperrors.ErrForbidden, "only report author can update report")
	}
	if report.Status != "review" && report.Status != "attention" {
		return nil, apperrors.New(apperrors.ErrValidation, "report cannot be edited in current status")
	}
	wasAttention := report.Status == "attention"
	if err := s.ensureSupervisorOnProject(ctx, report.ProjectID, actorID); err != nil {
		return nil, err
	}

	siteStatus := deriveSiteStatus(req.SiteStatus, req.DowntimeHours, req.DowntimeReason, req.IssueCategory, req.IssueDescription)
	if err := validateSiteStatus(siteStatus); err != nil {
		return nil, err
	}

	if err := s.projectIssues.ValidateLinkedIssues(ctx, report.ProjectID, req.LinkedIssueIDs); err != nil {
		return nil, err
	}

	report.SiteStatus = siteStatus
	report.Description = req.Description
	report.CompletedWorks = req.CompletedWorks
	report.IssueCategory = req.IssueCategory
	report.IssueDescription = req.IssueDescription
	report.DowntimeHours = req.DowntimeHours
	report.DowntimeReason = req.DowntimeReason

	if err := s.reports.UpdateFields(ctx, report); err != nil {
		return nil, err
	}

	if req.CrewUserIDs != nil {
		if err := s.reports.SetCrew(ctx, id, req.CrewUserIDs); err != nil {
			return nil, err
		}
	}

	if req.LinkedIssueIDs != nil {
		if err := s.reports.SetLinkedIssues(ctx, id, req.LinkedIssueIDs); err != nil {
			return nil, err
		}
	}

	if req.VoiceDocumentID != nil && *req.VoiceDocumentID != "" {
		doc, err := s.documents.GetByID(ctx, *req.VoiceDocumentID)
		if err != nil {
			return nil, err
		}
		if doc.OwnerID == nil || *doc.OwnerID != actorID {
			return nil, apperrors.New(apperrors.ErrValidation, "voice document does not belong to user")
		}
		if err := s.reports.SetVoiceDocumentID(ctx, id, *req.VoiceDocumentID); err != nil {
			return nil, err
		}
	}

	if wasAttention {
		if err := s.reports.UpdateStatus(ctx, id, "review"); err != nil {
			return nil, err
		}
	}

	return s.GetByID(ctx, id, actorRole, actorID)
}

func (s *SupervisorReportService) Transcribe(
	ctx context.Context, id string, req dto.TranscribeRequest, actorRole, actorID string,
) (*dto.SupervisorReportResponse, error) {
	report, err := s.reports.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if err := s.ensureCanView(report, actorRole, actorID); err != nil {
		return nil, err
	}
	if report.SupervisorID != actorID {
		return nil, apperrors.New(apperrors.ErrForbidden, "only report author can transcribe")
	}
	if err := s.ensureSupervisorOnProject(ctx, report.ProjectID, actorID); err != nil {
		return nil, err
	}

	transcription := req.Transcription
	if transcription == "" {
		transcription = "[pending transcription]"
	}
	if err := s.reports.UpdateTranscription(ctx, id, transcription); err != nil {
		return nil, err
	}
	return s.GetByID(ctx, id, actorRole, actorID)
}

func (s *SupervisorReportService) Approve(ctx context.Context, id string) (*dto.SupervisorReportResponse, error) {
	if err := s.reports.Approve(ctx, id); err != nil {
		return nil, err
	}
	report, err := s.reports.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if s.activity != nil {
		s.activity.RecordWithMeta(ctx, "", "supervisor_report_approved", "supervisor_report", id, map[string]any{
			"projectId": report.ProjectID,
			"label":     "Ежедневный отчёт супервайзера принят",
		})
		if parseNum(report.DowntimeHours) > 0 {
			reason := downtimeReasonLabel(report.DowntimeReason)
			label := fmt.Sprintf("Зафиксирован простой: %s ч (%s)", strings.TrimSuffix(report.DowntimeHours, ".00"), reason)
			s.activity.RecordProject(ctx, "", report.ProjectID, "downtime_recorded", label)
		}
	}
	return s.GetByID(ctx, id, "manager", "")
}

func (s *SupervisorReportService) Attention(ctx context.Context, id string) (*dto.SupervisorReportResponse, error) {
	report, err := s.reports.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if report.Status != "review" {
		return nil, apperrors.New(apperrors.ErrValidation, "report cannot be marked in current status")
	}
	if err := s.reports.UpdateStatus(ctx, id, "attention"); err != nil {
		return nil, err
	}
	if s.notifications != nil {
		_ = s.notifications.NotifySupervisorAttention(ctx, report.SupervisorID, id)
	}
	if s.activity != nil {
		s.activity.Record(ctx, "", "supervisor_attention", "supervisor_report", id, report.ProjectID)
	}
	return s.GetByID(ctx, id, "manager", "")
}

func (s *SupervisorReportService) Comment(ctx context.Context, id string, req dto.ManagerCommentRequest) (*dto.SupervisorReportResponse, error) {
	if err := s.reports.SetManagerComment(ctx, id, req.Comment); err != nil {
		return nil, err
	}
	return s.GetByID(ctx, id, "manager", "")
}

func (s *SupervisorReportService) enrichListResponses(ctx context.Context, responses []dto.SupervisorReportResponse, reportIDs []string) error {
	photoCounts, err := s.reports.CountPhotosByReportIDs(ctx, reportIDs)
	if err != nil {
		return err
	}
	previews, err := s.reports.ListAttachmentPreviews(ctx, reportIDs, 2)
	if err != nil {
		return err
	}
	for i := range responses {
		id := responses[i].ID
		responses[i].PhotoCount = photoCounts[id]
		responses[i].AttachmentsPreview = previews[id]
	}
	return nil
}

func (s *SupervisorReportService) enrichDetailResponse(ctx context.Context, resp *dto.SupervisorReportResponse, report *models.SupervisorReport) error {
	crew, err := s.reports.ListCrew(ctx, report.ID)
	if err != nil {
		return err
	}
	resp.CrewPresent = crew

	if report.RelatedIssueID != nil && *report.RelatedIssueID != "" {
		issueResp, err := s.projectIssues.GetByID(ctx, *report.RelatedIssueID)
		if err == nil {
			resp.RelatedIssue = issueResp
		}
	}

	linkedIDs, err := s.reports.ListLinkedIssueIDs(ctx, report.ID)
	if err != nil {
		return err
	}
	if len(linkedIDs) > 0 {
		issues, err := s.projectIssues.ListByIDs(ctx, linkedIDs)
		if err != nil {
			return err
		}
		resp.LinkedIssues = issues
	}

	previews, err := s.reports.ListAttachmentPreviews(ctx, []string{report.ID}, 10)
	if err != nil {
		return err
	}
	resp.AttachmentsPreview = previews[report.ID]

	photoCounts, err := s.reports.CountPhotosByReportIDs(ctx, []string{report.ID})
	if err != nil {
		return err
	}
	resp.PhotoCount = photoCounts[report.ID]
	return nil
}

func (s *SupervisorReportService) ensureCanView(report *models.SupervisorReport, actorRole, actorID string) error {
	if actorRole == "manager" || report.SupervisorID == actorID {
		return nil
	}
	return apperrors.New(apperrors.ErrForbidden, "forbidden")
}

func (s *SupervisorReportService) ensureSupervisorOnProject(ctx context.Context, projectID, userID string) error {
	project, err := s.projects.GetByID(ctx, projectID)
	if err != nil {
		return err
	}
	if project.SupervisorID != nil && *project.SupervisorID == userID {
		return nil
	}
	pw, err := s.projectWorkers.GetAssignment(ctx, projectID, userID)
	if err != nil {
		return apperrors.New(apperrors.ErrValidation, "not a supervisor on this project")
	}
	if pw.Role != "supervisor" {
		return apperrors.New(apperrors.ErrValidation, "not a supervisor on this project")
	}
	return nil
}

func deriveSiteStatus(explicit, downtimeHours, downtimeReason, issueCategory, issueDescription string) string {
	if explicit != "" {
		return explicit
	}
	if strings.TrimSpace(downtimeHours) != "" || strings.TrimSpace(downtimeReason) != "" {
		return "downtime"
	}
	if strings.TrimSpace(issueCategory) != "" || strings.TrimSpace(issueDescription) != "" {
		return "issue"
	}
	return "ok"
}

func validateSiteStatus(siteStatus string) error {
	if siteStatus != "ok" && siteStatus != "issue" && siteStatus != "downtime" {
		return apperrors.New(apperrors.ErrValidation, "invalid siteStatus")
	}
	return nil
}

func paginateSupervisorReportResponses(
	items []dto.SupervisorReportResponse, total int64, page, pageSize int,
) *dto.PaginatedResponse[dto.SupervisorReportResponse] {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	return &dto.PaginatedResponse[dto.SupervisorReportResponse]{
		Items: items, Total: total, Page: page, PageSize: pageSize, TotalPages: totalPages,
	}
}
