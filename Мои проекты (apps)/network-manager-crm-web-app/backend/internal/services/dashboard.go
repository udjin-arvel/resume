package services

import (
	"context"
	"math"

	"github.com/radar-crm/backend/internal/i18n"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/repositories"
)

type DashboardService struct {
	dashboard *repositories.DashboardRepository
	activity  *repositories.ActivityRepository
}

func NewDashboardService(dashboard *repositories.DashboardRepository, activity *repositories.ActivityRepository) *DashboardService {
	return &DashboardService{dashboard: dashboard, activity: activity}
}

type urgentDef struct {
	key     string
	countFn func(context.Context) (int, error)
	prevFn  func(context.Context, int) ([]repositories.UrgentPreviewRow, error)
}

func (s *DashboardService) Urgent(ctx context.Context, locale string) ([]dto.UrgentActionResponse, error) {
	defs := []urgentDef{
		{"pending_workers", s.dashboard.CountPendingWorkers, s.dashboard.PreviewPendingWorkers},
		{"unconfirmed_workers", s.dashboard.CountUnconfirmedWorkers, s.dashboard.PreviewUnconfirmedWorkers},
		{"supervisor_reports_review", s.dashboard.CountSupervisorReportsReview, s.dashboard.PreviewSupervisorReportsReview},
		{"worker_reports_review", s.dashboard.CountWorkerReportsReview, s.dashboard.PreviewWorkerReportsReview},
		{"site_issue", s.dashboard.CountSiteIssue, s.dashboard.PreviewSiteIssue},
		{"site_downtime", s.dashboard.CountSiteDowntime, s.dashboard.PreviewSiteDowntime},
		{"overdue_reports", s.dashboard.CountOverdueReports, s.dashboard.PreviewOverdueReports},
		{"tools_attention", s.dashboard.CountToolsAttention, s.dashboard.PreviewToolsAttention},
	}

	result := make([]dto.UrgentActionResponse, 0, len(defs))
	for _, d := range defs {
		count, err := d.countFn(ctx)
		if err != nil {
			return nil, err
		}
		preview := []dto.UrgentPreviewItem{}
		if count > 0 {
			rows, err := d.prevFn(ctx, 3)
			if err != nil {
				return nil, err
			}
			for _, row := range rows {
				preview = append(preview, dto.UrgentPreviewItem{ID: row.ID, Name: row.Name, Label: row.Label})
			}
		}
		result = append(result, dto.UrgentActionResponse{
			Key:     d.key,
			Count:   count,
			Title:   i18n.T(locale, "urgent."+d.key, nil),
			Preview: preview,
		})
	}
	return result, nil
}

func (s *DashboardService) ProblemProjects(ctx context.Context) ([]dto.ProblemProjectResponse, error) {
	return s.dashboard.ListProblemProjects(ctx, 10)
}

func (s *DashboardService) Activity(ctx context.Context, page, pageSize int) (*dto.PaginatedResponse[dto.ActivityItemResponse], error) {
	items, total, err := s.activity.ListPaginated(ctx, page, pageSize)
	if err != nil {
		return nil, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	responses := make([]dto.ActivityItemResponse, 0, len(items))
	for _, item := range items {
		responses = append(responses, item.ToResponse())
	}
	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	if total == 0 {
		totalPages = 0
	}
	return &dto.PaginatedResponse[dto.ActivityItemResponse]{
		Items: responses, Total: total, Page: page, PageSize: pageSize, TotalPages: totalPages,
	}, nil
}
