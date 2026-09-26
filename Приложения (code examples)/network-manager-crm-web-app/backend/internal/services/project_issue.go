package services

import (
	"context"
	"strings"

	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/repositories"
)

type ProjectIssueService struct {
	issues   *repositories.ProjectIssueRepository
	projects *repositories.ProjectRepository
}

func NewProjectIssueService(
	issues *repositories.ProjectIssueRepository,
	projects *repositories.ProjectRepository,
) *ProjectIssueService {
	return &ProjectIssueService{issues: issues, projects: projects}
}

func (s *ProjectIssueService) GetByID(ctx context.Context, id string) (*dto.ProjectIssueResponse, error) {
	issue, err := s.issues.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	resp := issue.ToResponse()
	return &resp, nil
}

func parseIssueStatusFilter(statusParam string) []string {
	if statusParam == "" {
		return []string{"open", "in_progress"}
	}
	parts := strings.Split(statusParam, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "open" || p == "in_progress" || p == "resolved" {
			out = append(out, p)
		}
	}
	if len(out) == 0 {
		return []string{"open", "in_progress"}
	}
	return out
}

func (s *ProjectIssueService) ListByProject(
	ctx context.Context, projectID string, statusParam string,
) ([]dto.ProjectIssueResponse, error) {
	if _, err := s.projects.GetByID(ctx, projectID); err != nil {
		return nil, err
	}
	statuses := parseIssueStatusFilter(statusParam)
	items, err := s.issues.ListByProjectID(ctx, projectID, statuses)
	if err != nil {
		return nil, err
	}
	responses := make([]dto.ProjectIssueResponse, 0, len(items))
	for _, item := range items {
		resp := item.ToResponse()
		responses = append(responses, resp)
	}
	return responses, nil
}

func (s *ProjectIssueService) ListByIDs(ctx context.Context, ids []string) ([]dto.ProjectIssueResponse, error) {
	items, err := s.issues.ListByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	responses := make([]dto.ProjectIssueResponse, 0, len(items))
	for _, item := range items {
		responses = append(responses, item.ToResponse())
	}
	return responses, nil
}

func (s *ProjectIssueService) ValidateLinkedIssues(
	ctx context.Context, projectID string, issueIDs []string,
) error {
	if len(issueIDs) == 0 {
		return nil
	}
	items, err := s.issues.ListByIDs(ctx, issueIDs)
	if err != nil {
		return err
	}
	if len(items) != len(issueIDs) {
		return apperrors.New(apperrors.ErrValidation, "invalid linked issue ids")
	}
	for _, item := range items {
		if item.ProjectID != projectID {
			return apperrors.New(apperrors.ErrValidation, "linked issue does not belong to project")
		}
	}
	return nil
}

func (s *ProjectIssueService) UpdateStatus(ctx context.Context, projectID, issueID, status string) (*dto.ProjectIssueResponse, error) {
	if status != "open" && status != "in_progress" && status != "resolved" {
		return nil, apperrors.New(apperrors.ErrValidation, "invalid status")
	}

	issue, err := s.issues.GetByID(ctx, issueID)
	if err != nil {
		return nil, err
	}
	if issue.ProjectID != projectID {
		return nil, apperrors.New(apperrors.ErrNotFound, "issue not found for project")
	}

	if err := s.issues.UpdateStatus(ctx, issueID, status); err != nil {
		return nil, err
	}

	if status == "resolved" {
		openCount, err := s.issues.CountOpenByProject(ctx, projectID)
		if err != nil {
			return nil, err
		}
		if openCount == 0 {
			_ = s.projects.UpdateSiteStatus(ctx, projectID, "ok")
		}
	}

	issue, err = s.issues.GetByID(ctx, issueID)
	if err != nil {
		return nil, err
	}
	resp := issue.ToResponse()
	return &resp, nil
}

func (s *ProjectIssueService) CreateForReport(
	ctx context.Context, projectID, reportID, siteStatus, category, description, downtimeReason string,
) (*models.ProjectIssue, error) {
	title := category
	if title == "" {
		switch siteStatus {
		case "issue":
			title = "Проблема на объекте"
		case "downtime":
			title = "Простой на объекте"
		default:
			title = "Инцидент на объекте"
		}
	}
	body := description
	if body == "" {
		body = downtimeReason
	}

	issue := &models.ProjectIssue{
		ProjectID:      projectID,
		Title:          title,
		Category:       category,
		Description:    body,
		Status:         "open",
		SourceReportID: &reportID,
	}
	if err := s.issues.Create(ctx, issue); err != nil {
		return nil, err
	}
	return issue, nil
}
