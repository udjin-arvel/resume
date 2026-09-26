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

type WorkerReportService struct {
	reports        *repositories.WorkerReportRepository
	projects       *repositories.ProjectRepository
	projectWorkers *repositories.ProjectWorkerRepository
	users          *repositories.UserRepository
	documents      *repositories.DocumentRepository
	notifications  *NotificationService
	activity       *ActivityService
}

func NewWorkerReportService(
	reports *repositories.WorkerReportRepository,
	projects *repositories.ProjectRepository,
	projectWorkers *repositories.ProjectWorkerRepository,
	users *repositories.UserRepository,
	documents *repositories.DocumentRepository,
	notifications *NotificationService,
	activity *ActivityService,
) *WorkerReportService {
	return &WorkerReportService{
		reports:        reports,
		projects:       projects,
		projectWorkers: projectWorkers,
		users:          users,
		documents:      documents,
		notifications:  notifications,
		activity:       activity,
	}
}

func (s *WorkerReportService) List(
	ctx context.Context, q dto.ReportListQuery, actorRole, actorID string,
) (*dto.PaginatedResponse[dto.WorkerReportResponse], error) {
	_, _ = s.reports.MarkOverdue(ctx, time.Now())
	items, total, err := s.reports.List(ctx, q, actorRole, actorID)
	if err != nil {
		return nil, err
	}
	return paginateWorkerReports(items, total, q.Page, q.PageSize), nil
}

func (s *WorkerReportService) GetByID(ctx context.Context, id, actorRole, actorID string) (*dto.WorkerReportResponse, error) {
	report, err := s.reports.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if err := s.ensureCanView(report, actorRole, actorID); err != nil {
		return nil, err
	}
	resp := report.ToResponse()
	return &resp, nil
}

func (s *WorkerReportService) Create(
	ctx context.Context, req dto.CreateWorkerReportRequest, actorID, actorRole string,
) (*dto.WorkerReportResponse, error) {
	if actorRole != string(models.UserRoleWorker) && actorRole != string(models.UserRoleSupervisor) {
		return nil, apperrors.New(apperrors.ErrForbidden, "only workers and supervisors can create worker reports")
	}

	user, err := s.users.FindByID(ctx, actorID)
	if err != nil {
		return nil, err
	}
	if user.Status != models.UserStatusActive {
		return nil, apperrors.New(apperrors.ErrValidation, "user must be active")
	}

	assigned, err := s.projectWorkers.IsAssigned(ctx, req.ProjectID, actorID)
	if err != nil {
		return nil, err
	}
	if !assigned {
		return nil, apperrors.New(apperrors.ErrValidation, "not assigned to this project")
	}

	if _, err := s.projects.GetByID(ctx, req.ProjectID); err != nil {
		return nil, err
	}

	weekStart, weekEnd, err := parseWeekDates(req.WeekStart, req.WeekEnd)
	if err != nil {
		return nil, apperrors.New(apperrors.ErrValidation, err.Error())
	}

	totalHours := calcReportTotalHours(req)
	if !req.AsDraft && !hasReportHours(req) {
		return nil, apperrors.New(apperrors.ErrValidation, "at least one hour must be specified")
	}
	expenses, err := s.buildExpenses(ctx, req.Expenses, "", actorID)
	if err != nil {
		return nil, err
	}
	totalAmount := calcWorkerReportAmount(totalHours, user.HourlyRate, expenses)

	status := "review"
	if req.AsDraft {
		status = "draft"
	}

	report := &models.WorkerReport{
		ProjectID:   req.ProjectID,
		WorkerID:    actorID,
		WeekStart:   weekStart,
		WeekEnd:     weekEnd,
		HoursMon:    req.HoursMon,
		HoursTue:    req.HoursTue,
		HoursWed:    req.HoursWed,
		HoursThu:    req.HoursThu,
		HoursFri:    req.HoursFri,
		HoursSat:    req.HoursSat,
		HoursSun:    req.HoursSun,
		Description: req.Description,
		Status:      status,
		TotalHours:  totalHours,
		TotalAmount: totalAmount,
	}

	if err := s.reports.Create(ctx, report, expenses); err != nil {
		return nil, err
	}
	if !req.AsDraft {
		if err := s.validateExpenseDocuments(ctx, report.ID, expenses); err != nil {
			return nil, err
		}
		if s.activity != nil {
			s.activity.Record(ctx, actorID, "report_submitted", "worker_report", report.ID, report.ProjectName)
		}
		project, _ := s.projects.GetByID(ctx, req.ProjectID)
		if s.notifications != nil && project != nil && project.SupervisorID != nil && *project.SupervisorID != actorID {
			workerName := strings.TrimSpace(user.FirstName + " " + user.LastName)
			_ = s.notifications.NotifyWorkerReportSubmitted(ctx, *project.SupervisorID, report.ID, workerName, project.Name)
		}
	}
	return s.GetByID(ctx, report.ID, actorRole, actorID)
}

func (s *WorkerReportService) Update(
	ctx context.Context, id string, req dto.UpdateWorkerReportRequest, actorID, actorRole string,
) (*dto.WorkerReportResponse, error) {
	report, err := s.reports.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if report.WorkerID != actorID {
		return nil, apperrors.New(apperrors.ErrForbidden, "only report author can edit")
	}
	if report.Status != "review" && report.Status != "returned" && report.Status != "draft" {
		return nil, apperrors.New(apperrors.ErrValidation, "report cannot be edited in current status")
	}

	user, err := s.users.FindByID(ctx, actorID)
	if err != nil {
		return nil, err
	}

	weekStart, weekEnd, err := parseWeekDates(req.WeekStart, req.WeekEnd)
	if err != nil {
		return nil, apperrors.New(apperrors.ErrValidation, err.Error())
	}

	wasDraft := report.Status == "draft"
	wasReturned := report.Status == "returned"
	if wasDraft && req.Submit && !hasReportHours(req.CreateWorkerReportRequest) {
		return nil, apperrors.New(apperrors.ErrValidation, "at least one hour must be specified")
	}

	totalHours := calcReportTotalHours(req.CreateWorkerReportRequest)
	expenses, err := s.buildExpenses(ctx, req.Expenses, id, actorID)
	if err != nil {
		return nil, err
	}
	totalAmount := calcWorkerReportAmount(totalHours, user.HourlyRate, expenses)

	newStatus := report.Status
	if wasDraft && req.Submit {
		newStatus = "review"
	} else if report.Status == "returned" {
		newStatus = "review"
	}

	report.WeekStart = weekStart
	report.WeekEnd = weekEnd
	report.HoursMon = req.HoursMon
	report.HoursTue = req.HoursTue
	report.HoursWed = req.HoursWed
	report.HoursThu = req.HoursThu
	report.HoursFri = req.HoursFri
	report.HoursSat = req.HoursSat
	report.HoursSun = req.HoursSun
	report.Description = req.Description
	report.TotalHours = totalHours
	report.TotalAmount = totalAmount
	report.Status = newStatus

	if err := s.reports.Update(ctx, report, expenses); err != nil {
		return nil, err
	}
	shouldValidateDocs := (wasDraft && req.Submit) || wasReturned
	if shouldValidateDocs {
		if err := s.validateExpenseDocuments(ctx, id, expenses); err != nil {
			return nil, err
		}
	}
	if wasDraft && req.Submit {
		if s.activity != nil {
			s.activity.Record(ctx, actorID, "report_submitted", "worker_report", report.ID, report.ProjectName)
		}
		project, _ := s.projects.GetByID(ctx, req.ProjectID)
		if s.notifications != nil && project != nil && project.SupervisorID != nil && *project.SupervisorID != actorID {
			workerName := strings.TrimSpace(user.FirstName + " " + user.LastName)
			_ = s.notifications.NotifyWorkerReportSubmitted(ctx, *project.SupervisorID, report.ID, workerName, project.Name)
		}
	}
	return s.GetByID(ctx, id, actorRole, actorID)
}

func (s *WorkerReportService) Approve(ctx context.Context, id string) (*dto.WorkerReportResponse, error) {
	if err := s.reports.Approve(ctx, id); err != nil {
		return nil, err
	}
	report, err := s.reports.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if s.activity != nil {
		s.activity.Record(ctx, "", "report_approved", "worker_report", id, report.ProjectName)
	}
	resp := report.ToResponse()
	return &resp, nil
}

func (s *WorkerReportService) RevertReturn(ctx context.Context, id string) (*dto.WorkerReportResponse, error) {
	if err := s.reports.RevertReturn(ctx, id); err != nil {
		return nil, err
	}
	report, err := s.reports.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if s.activity != nil {
		s.activity.Record(ctx, "", "report_return_reverted", "worker_report", id, report.ProjectName)
	}
	resp := report.ToResponse()
	return &resp, nil
}

func (s *WorkerReportService) Remind(ctx context.Context, id string) (*dto.WorkerReportResponse, error) {
	report, err := s.reports.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if report.Status != "overdue" {
		return nil, apperrors.New(apperrors.ErrValidation, "report cannot be reminded in current status")
	}
	if s.notifications != nil {
		if err := s.notifications.NotifyWorkerWeeklyReportReminder(ctx, report.WorkerID, report.ProjectID, report.ProjectName); err != nil {
			return nil, err
		}
	}
	resp := report.ToResponse()
	return &resp, nil
}

func (s *WorkerReportService) Reject(ctx context.Context, id, comment string) (*dto.WorkerReportResponse, error) {
	report, err := s.reports.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if report.Status != "review" && report.Status != "returned" && report.Status != "overdue" {
		return nil, apperrors.New(apperrors.ErrValidation, "report cannot be rejected in current status")
	}
	if err := s.reports.Reject(ctx, id, comment); err != nil {
		return nil, err
	}
	report, err = s.reports.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if s.notifications != nil {
		weekStart := report.WeekStart.Format("2006-01-02")
		_ = s.notifications.NotifyReportReturned(ctx, report.WorkerID, id, report.ProjectName, weekStart)
	}
	if s.activity != nil {
		s.activity.Record(ctx, "", "report_returned", "worker_report", id, report.ProjectName)
	}
	resp := report.ToResponse()
	return &resp, nil
}

func (s *WorkerReportService) ensureCanView(report *models.WorkerReport, actorRole, actorID string) error {
	if actorRole == "manager" || report.WorkerID == actorID {
		return nil
	}
	return apperrors.New(apperrors.ErrForbidden, "forbidden")
}

func (s *WorkerReportService) buildExpenses(
	ctx context.Context, reqs []dto.CreateReportExpenseRequest, reportID, actorID string,
) ([]models.ReportExpense, error) {
	expenses := make([]models.ReportExpense, 0, len(reqs))
	for _, req := range reqs {
		e := models.ReportExpense{
			ExpenseType: req.ExpenseType,
			Amount:      req.Amount,
			Comment:     req.Comment,
			DocumentID:  req.DocumentID,
		}
		if e.Amount == "" {
			e.Amount = "0"
		}
		if req.DocumentID != nil && *req.DocumentID != "" {
			doc, err := s.documents.GetByID(ctx, *req.DocumentID)
			if err != nil {
				return nil, err
			}
			if doc.OwnerID == nil || *doc.OwnerID != actorID {
				return nil, apperrors.New(apperrors.ErrValidation, "document does not belong to user")
			}
			if doc.EntityType != "worker_report" {
				return nil, apperrors.New(apperrors.ErrValidation, "invalid document entity type")
			}
			if reportID != "" && doc.EntityID != reportID {
				return nil, apperrors.New(apperrors.ErrValidation, "document is not linked to this report")
			}
		}
		expenses = append(expenses, e)
	}
	return expenses, nil
}

func (s *WorkerReportService) validateExpenseDocuments(ctx context.Context, reportID string, expenses []models.ReportExpense) error {
	for _, e := range expenses {
		if e.DocumentID == nil || *e.DocumentID == "" {
			continue
		}
		doc, err := s.documents.GetByID(ctx, *e.DocumentID)
		if err != nil {
			return err
		}
		if doc.EntityType != "worker_report" || doc.EntityID != reportID {
			return apperrors.New(apperrors.ErrValidation, "expense document must be linked to this report")
		}
	}
	return nil
}

func calcReportTotalHours(req dto.CreateWorkerReportRequest) string {
	total := parseNum(req.HoursMon) + parseNum(req.HoursTue) + parseNum(req.HoursWed) +
		parseNum(req.HoursThu) + parseNum(req.HoursFri) + parseNum(req.HoursSat) + parseNum(req.HoursSun)
	return formatMoney(total)
}

func hasReportHours(req dto.CreateWorkerReportRequest) bool {
	return parseNum(req.HoursMon) > 0 || parseNum(req.HoursTue) > 0 || parseNum(req.HoursWed) > 0 ||
		parseNum(req.HoursThu) > 0 || parseNum(req.HoursFri) > 0 || parseNum(req.HoursSat) > 0 ||
		parseNum(req.HoursSun) > 0
}

func calcWorkerReportAmount(totalHours, hourlyRate string, expenses []models.ReportExpense) string {
	labor := parseNum(totalHours) * parseNum(hourlyRate)
	var expenseTotal float64
	for _, e := range expenses {
		expenseTotal += parseNum(e.Amount)
	}
	return formatMoney(labor + expenseTotal)
}

func parseWeekDates(start, end string) (time.Time, time.Time, error) {
	weekStart, err := time.Parse("2006-01-02", start)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("invalid weekStart")
	}
	weekEnd, err := time.Parse("2006-01-02", end)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("invalid weekEnd")
	}
	if weekEnd.Before(weekStart) {
		return time.Time{}, time.Time{}, fmt.Errorf("weekEnd must be on or after weekStart")
	}
	return weekStart, weekEnd, nil
}

func paginateWorkerReports(
	items []models.WorkerReport, total int64, page, pageSize int,
) *dto.PaginatedResponse[dto.WorkerReportResponse] {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	responses := make([]dto.WorkerReportResponse, 0, len(items))
	for _, item := range items {
		responses = append(responses, item.ToResponse())
	}
	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	return &dto.PaginatedResponse[dto.WorkerReportResponse]{
		Items: responses, Total: total, Page: page, PageSize: pageSize, TotalPages: totalPages,
	}
}
