package services

import (
	"context"
	"math"
	"time"

	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/repositories"
)

var validControlTypes = map[string]bool{
	"accounting_only": true,
	"expiry":          true,
	"calibration":     true,
	"usage_limit":     true,
	"combined":        true,
}

var validToolProblemTypes = map[string]string{
	"malfunction":         "Неисправность / поломка",
	"calibration_overdue": "Просрочена калибровка",
	"usage_limit":         "Превышен лимит использований",
	"lost":                "Утеря / не найден",
	"other":               "Другое",
}

func needsCalibrationFields(controlType string) bool {
	return controlType == "expiry" || controlType == "calibration" || controlType == "combined"
}

func needsUsageLimit(controlType string) bool {
	return controlType == "usage_limit" || controlType == "combined"
}

func parseOptionalDate(s string) (*time.Time, error) {
	if s == "" {
		return nil, nil
	}
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		t, err = time.Parse("2006-01-02", s)
		if err != nil {
			return nil, err
		}
	}
	return &t, nil
}

type ToolService struct {
	tools         *repositories.ToolRepository
	assignments   *repositories.ToolAssignmentRepository
	calibrations  *repositories.ToolCalibrationRepository
	projects      *repositories.ProjectRepository
	users         *repositories.UserRepository
	notifications *NotificationService
	activity      *ActivityService
}

func NewToolService(
	tools *repositories.ToolRepository,
	assignments *repositories.ToolAssignmentRepository,
	calibrations *repositories.ToolCalibrationRepository,
	projects *repositories.ProjectRepository,
	users *repositories.UserRepository,
	notifications *NotificationService,
	activity *ActivityService,
) *ToolService {
	return &ToolService{
		tools:         tools,
		assignments:   assignments,
		calibrations:  calibrations,
		projects:      projects,
		users:         users,
		notifications: notifications,
		activity:      activity,
	}
}

func (s *ToolService) List(ctx context.Context, q dto.ToolListQuery) (*dto.PaginatedResponse[dto.ToolListItemResponse], error) {
	items, total, err := s.tools.ListItems(ctx, q)
	if err != nil {
		return nil, err
	}
	return paginateToolListItems(items, total, q.Page, q.PageSize), nil
}

func (s *ToolService) GetByID(ctx context.Context, id string) (*dto.ToolDetailResponse, error) {
	tool, err := s.tools.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	assignment, plannedReturn, err := s.assignments.GetActiveByToolID(ctx, id)
	if err != nil {
		return nil, err
	}
	tool.ActiveAssignment = assignment
	tool.PlannedReturnAt = plannedReturn
	history, err := s.assignments.ListByToolID(ctx, id, 20)
	if err != nil {
		return nil, err
	}
	tool.AssignmentHistory = history
	cals, err := s.calibrations.ListByToolID(ctx, id, 5)
	if err != nil {
		return nil, err
	}
	tool.Calibrations = cals
	resp := tool.ToDetailResponse()
	return &resp, nil
}

func (s *ToolService) Create(ctx context.Context, req dto.CreateToolRequest) (*dto.ToolResponse, error) {
	controlType := req.ControlType
	if controlType == "" {
		controlType = "calibration"
	}
	if !validControlTypes[controlType] {
		return nil, apperrors.New(apperrors.ErrValidation, "invalid controlType")
	}

	if needsCalibrationFields(controlType) {
		if req.LastCalibratedAt == "" || req.ValidUntil == "" {
			return nil, apperrors.New(apperrors.ErrValidation, "lastCalibratedAt and validUntil are required")
		}
	}
	if needsUsageLimit(controlType) {
		if req.UsageLimit <= 0 {
			return nil, apperrors.New(apperrors.ErrValidation, "usageLimit must be greater than 0")
		}
	}

	lastCalibrated, err := parseOptionalDate(req.LastCalibratedAt)
	if err != nil {
		return nil, apperrors.New(apperrors.ErrValidation, "invalid lastCalibratedAt")
	}
	validUntil, err := parseOptionalDate(req.ValidUntil)
	if err != nil {
		return nil, apperrors.New(apperrors.ErrValidation, "invalid validUntil")
	}
	if lastCalibrated != nil && validUntil != nil && validUntil.Before(*lastCalibrated) {
		return nil, apperrors.New(apperrors.ErrValidation, "validUntil must be after lastCalibratedAt")
	}

	purchaseDate, err := parseOptionalDate(req.PurchaseDate)
	if err != nil {
		return nil, apperrors.New(apperrors.ErrValidation, "invalid purchaseDate")
	}

	usageUnit := req.UsageUnit
	if usageUnit == "" {
		usageUnit = "tests"
	}
	calibrationPeriod := req.CalibrationPeriodMonths
	if calibrationPeriod <= 0 {
		calibrationPeriod = 12
	}

	usageLimit := 0
	usageCount := 0
	if needsUsageLimit(controlType) {
		usageLimit = req.UsageLimit
		usageCount = req.UsageCount
		if usageCount < 0 {
			usageCount = 0
		}
		if usageCount > usageLimit {
			return nil, apperrors.New(apperrors.ErrValidation, "usageCount cannot exceed usageLimit")
		}
	}

	tool := &models.Tool{
		Name:                    req.Name,
		SerialNumber:            req.SerialNumber,
		ToolType:                req.ToolType,
		Model:                   req.Model,
		ControlType:             controlType,
		UsageLimit:              usageLimit,
		UsageCount:              usageCount,
		UsageUnit:               usageUnit,
		CostCents:               req.CostCents,
		PurchaseDate:            purchaseDate,
		CalibrationPeriodMonths: calibrationPeriod,
		Comment:                 req.Comment,
	}
	if err := s.tools.Create(ctx, tool); err != nil {
		return nil, err
	}

	if needsCalibrationFields(controlType) && validUntil != nil {
		cal := &models.ToolCalibration{
			ToolID:       tool.ID,
			CalibratedAt: time.Now(),
			NextDueAt:    validUntil,
			Notes:        req.CalibrationNotes,
		}
		if lastCalibrated != nil {
			cal.CalibratedAt = *lastCalibrated
		}
		if err := s.calibrations.Create(ctx, cal); err != nil {
			return nil, err
		}
		if err := s.tools.UpdateCalibrationDue(ctx, tool.ID, validUntil); err != nil {
			return nil, err
		}
		tool.CalibrationDueAt = validUntil
	}

	resp := tool.ToResponse()
	return &resp, nil
}

func (s *ToolService) Update(ctx context.Context, id string, req dto.UpdateToolRequest) (*dto.ToolResponse, error) {
	tool, err := s.tools.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if tool.Status == "assigned" {
		return nil, apperrors.New(apperrors.ErrValidation, "cannot edit assigned tool")
	}
	if req.ControlType != "" && !validControlTypes[req.ControlType] {
		return nil, apperrors.New(apperrors.ErrValidation, "invalid controlType")
	}

	purchaseDate, err := parseOptionalDate(req.PurchaseDate)
	if err != nil {
		return nil, apperrors.New(apperrors.ErrValidation, "invalid purchaseDate")
	}

	tool.Name = req.Name
	tool.SerialNumber = req.SerialNumber
	tool.ToolType = req.ToolType
	tool.Model = req.Model
	if req.ControlType != "" {
		tool.ControlType = req.ControlType
	}
	if req.UsageLimit > 0 {
		tool.UsageLimit = req.UsageLimit
	}
	if req.UsageUnit != "" {
		tool.UsageUnit = req.UsageUnit
	}
	tool.CostCents = req.CostCents
	tool.PurchaseDate = purchaseDate
	if req.CalibrationPeriodMonths > 0 {
		tool.CalibrationPeriodMonths = req.CalibrationPeriodMonths
	}
	tool.Comment = req.Comment
	if err := s.tools.Update(ctx, tool); err != nil {
		return nil, err
	}
	resp := tool.ToResponse()
	return &resp, nil
}

func (s *ToolService) Assign(ctx context.Context, toolID string, req dto.AssignToolRequest) (*dto.ToolDetailResponse, error) {
	tool, err := s.tools.GetByID(ctx, toolID)
	if err != nil {
		return nil, err
	}
	if tool.Status == "needs_attention" {
		return nil, apperrors.New(apperrors.ErrValidation, "tool requires attention before assignment")
	}
	if tool.Status != "available" {
		return nil, apperrors.New(apperrors.ErrValidation, "tool is not available")
	}
	project, err := s.projects.GetByID(ctx, req.ProjectID)
	if err != nil {
		return nil, err
	}
	if project.Status != "active" {
		return nil, apperrors.New(apperrors.ErrValidation, "project is not active")
	}
	var responsibleID *string
	if req.ResponsibleUserID != "" {
		responsibleID = &req.ResponsibleUserID
	}
	if _, err := s.assignments.Assign(ctx, toolID, req.ProjectID, responsibleID); err != nil {
		return nil, err
	}
	if err := s.tools.UpdateStatus(ctx, toolID, "assigned"); err != nil {
		return nil, err
	}
	if s.activity != nil {
		s.activity.Record(ctx, "", "tool_assigned", "tool", toolID, project.Name)
	}
	return s.GetByID(ctx, toolID)
}

func (s *ToolService) Return(ctx context.Context, toolID string, req dto.ReturnToolRequest) (*dto.ToolDetailResponse, error) {
	tool, err := s.tools.GetByID(ctx, toolID)
	if err != nil {
		return nil, err
	}
	if tool.Status != "assigned" && tool.Status != "needs_attention" {
		return nil, apperrors.New(apperrors.ErrValidation, "tool is not assigned")
	}
	assignment, _, err := s.assignments.GetActiveByToolID(ctx, toolID)
	if err != nil {
		return nil, err
	}
	if assignment == nil {
		return nil, apperrors.New(apperrors.ErrValidation, "no active assignment")
	}
	if err := s.assignments.Return(ctx, assignment.ID, req.ConditionOnReturn); err != nil {
		return nil, err
	}
	if tool.ControlType == "usage_limit" || tool.ControlType == "combined" {
		_ = s.tools.IncrementUsageCount(ctx, toolID)
	}
	nextStatus := "available"
	if tool.Status == "needs_attention" {
		nextStatus = "needs_attention"
	}
	if err := s.tools.UpdateStatus(ctx, toolID, nextStatus); err != nil {
		return nil, err
	}
	if s.activity != nil {
		s.activity.Record(ctx, "", "tool_returned", "tool", toolID, tool.Name)
	}
	return s.GetByID(ctx, toolID)
}

func (s *ToolService) Calibrate(ctx context.Context, toolID string, req dto.CalibrateToolRequest, performedBy string) (*dto.ToolDetailResponse, error) {
	if _, err := s.tools.GetByID(ctx, toolID); err != nil {
		return nil, err
	}
	var nextDue *time.Time
	if req.NextDueAt != "" {
		t, err := time.Parse(time.RFC3339, req.NextDueAt)
		if err != nil {
			t, err = time.Parse("2006-01-02", req.NextDueAt)
			if err != nil {
				return nil, apperrors.New(apperrors.ErrValidation, "invalid nextDueAt")
			}
		}
		nextDue = &t
	}
	var performer *string
	if performedBy != "" {
		performer = &performedBy
	}
	cal := &models.ToolCalibration{
		ToolID:      toolID,
		NextDueAt:   nextDue,
		PerformedBy: performer,
		Notes:       req.Notes,
	}
	if err := s.calibrations.Create(ctx, cal); err != nil {
		return nil, err
	}
	if err := s.tools.UpdateCalibrationDue(ctx, toolID, nextDue); err != nil {
		return nil, err
	}
	if s.activity != nil {
		s.activity.Record(ctx, performedBy, "tool_calibrated", "tool", toolID, "")
	}
	return s.GetByID(ctx, toolID)
}

func (s *ToolService) ReportProblem(ctx context.Context, toolID, actorID string, req dto.ReportToolProblemRequest) error {
	problemLabel, ok := validToolProblemTypes[req.ProblemType]
	if !ok {
		return apperrors.New(apperrors.ErrValidation, "invalid problemType")
	}

	tool, err := s.tools.GetByID(ctx, toolID)
	if err != nil {
		return err
	}
	if tool.Status == "written_off" {
		return apperrors.New(apperrors.ErrValidation, "cannot report problem for written off tool")
	}

	if err := s.tools.UpdateProblem(ctx, toolID, req.ProblemType, req.Comment); err != nil {
		return err
	}

	if s.activity != nil {
		meta := map[string]any{
			"problemType": req.ProblemType,
			"problem":     problemLabel,
			"comment":     req.Comment,
		}
		s.activity.RecordWithMeta(ctx, actorID, "tool_problem_reported", "tool", toolID, meta)
	}

	if s.notifications != nil && s.users != nil {
		managerIDs, err := s.users.ListActiveManagerIDs(ctx)
		if err != nil {
			return err
		}
		comment := req.Comment
		if comment == "" {
			comment = "—"
		}
		for _, managerID := range managerIDs {
			_ = s.notifications.NotifyToolProblem(ctx, managerID, toolID, tool.Name, problemLabel, comment)
		}
	}

	return nil
}

func (s *ToolService) ResolveProblem(ctx context.Context, toolID, actorID string) (*dto.ToolDetailResponse, error) {
	tool, err := s.tools.GetByID(ctx, toolID)
	if err != nil {
		return nil, err
	}
	if tool.Status != "needs_attention" {
		return nil, apperrors.New(apperrors.ErrValidation, "tool does not have an open problem")
	}

	nextStatus := "available"
	assignment, _, err := s.assignments.GetActiveByToolID(ctx, toolID)
	if err != nil {
		return nil, err
	}
	if assignment != nil {
		nextStatus = "assigned"
	}

	if err := s.tools.ClearProblem(ctx, toolID, nextStatus); err != nil {
		return nil, err
	}

	if s.activity != nil {
		s.activity.Record(ctx, actorID, "tool_problem_resolved", "tool", toolID, tool.Name)
	}

	return s.GetByID(ctx, toolID)
}

func paginateToolListItems(items []models.ToolListItem, total int64, page, pageSize int) *dto.PaginatedResponse[dto.ToolListItemResponse] {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	responses := make([]dto.ToolListItemResponse, 0, len(items))
	for _, item := range items {
		responses = append(responses, item.ToListItemResponse())
	}
	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	return &dto.PaginatedResponse[dto.ToolListItemResponse]{
		Items: responses, Total: total, Page: page, PageSize: pageSize, TotalPages: totalPages,
	}
}

func paginateTools(items []models.Tool, total int64, page, pageSize int) *dto.PaginatedResponse[dto.ToolResponse] {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	responses := make([]dto.ToolResponse, 0, len(items))
	for _, item := range items {
		responses = append(responses, item.ToResponse())
	}
	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	return &dto.PaginatedResponse[dto.ToolResponse]{
		Items: responses, Total: total, Page: page, PageSize: pageSize, TotalPages: totalPages,
	}
}
