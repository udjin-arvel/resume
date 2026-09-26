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

type WorkerService struct {
	users          *repositories.UserRepository
	projectWorkers *repositories.ProjectWorkerRepository
	notifications  *NotificationService
	activity       *ActivityService
}

func NewWorkerService(
	users *repositories.UserRepository,
	projectWorkers *repositories.ProjectWorkerRepository,
	notifications *NotificationService,
	activity *ActivityService,
) *WorkerService {
	return &WorkerService{
		users:          users,
		projectWorkers: projectWorkers,
		notifications:  notifications,
		activity:       activity,
	}
}

func (s *WorkerService) List(ctx context.Context, q dto.WorkerListQuery) (*dto.PaginatedResponse[dto.WorkerResponse], error) {
	items, total, err := s.users.ListWorkers(ctx, q)
	if err != nil {
		return nil, err
	}
	page, pageSize := q.Page, q.PageSize
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	responses := make([]dto.WorkerResponse, 0, len(items))
	userIDs := make([]string, 0, len(items))
	for _, item := range items {
		userIDs = append(userIDs, item.ID)
	}
	projects, err := s.projectWorkers.LatestProjectsByUsers(ctx, userIDs)
	if err != nil {
		return nil, err
	}
	for _, item := range items {
		resp := item.ToWorkerResponse()
		if p, ok := projects[item.ID]; ok {
			resp.ProjectName = p.ProjectName
			resp.ProjectStatus = p.ProjectStatus
		}
		responses = append(responses, resp)
	}
	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	return &dto.PaginatedResponse[dto.WorkerResponse]{
		Items: responses, Total: total, Page: page, PageSize: pageSize, TotalPages: totalPages,
	}, nil
}

func (s *WorkerService) GetByID(ctx context.Context, id string) (*dto.WorkerResponse, error) {
	user, err := s.users.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if user.Role != models.UserRoleWorker && user.Role != models.UserRoleSupervisor {
		return nil, apperrors.ErrNotFound
	}
	resp := user.ToWorkerResponse()
	projects, err := s.projectWorkers.LatestProjectsByUsers(ctx, []string{id})
	if err != nil {
		return nil, err
	}
	if p, ok := projects[id]; ok {
		resp.ProjectName = p.ProjectName
		resp.ProjectStatus = p.ProjectStatus
	}
	s.enrichBlockProjectName(ctx, &resp)
	return &resp, nil
}

func (s *WorkerService) Create(ctx context.Context, req dto.CreateWorkerRequest) (*dto.WorkerResponse, error) {
	email := strings.TrimSpace(req.Email)
	exists, err := s.users.EmailExists(ctx, email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, apperrors.New(apperrors.ErrConflict, "email already registered")
	}

	hash, err := HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	hourlyRate := req.HourlyRate
	if hourlyRate == "" {
		hourlyRate = "0"
	}
	user := &models.User{
		Role:           models.UserRoleWorker,
		Status:         models.UserStatusActive,
		FirstName:      req.FirstName,
		LastName:       req.LastName,
		Phone:          req.Phone,
		Email:          email,
		PasswordHash:   hash,
		Country:        req.Country,
		Position:       req.Position,
		Specialization: req.Specialization,
		HourlyRate:     hourlyRate,
		Language:       "en",
	}
	if err := s.users.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("create worker: %w", err)
	}
	resp := user.ToWorkerResponse()
	return &resp, nil
}

func (s *WorkerService) Update(ctx context.Context, id string, req dto.UpdateWorkerRequest) (*dto.WorkerResponse, error) {
	user, err := s.users.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if user.Role != models.UserRoleWorker && user.Role != models.UserRoleSupervisor {
		return nil, apperrors.ErrNotFound
	}
	user.FirstName = req.FirstName
	user.LastName = req.LastName
	user.Phone = req.Phone
	user.Email = req.Email
	user.Country = req.Country
	user.Position = req.Position
	user.Specialization = req.Specialization
	user.InternalComment = req.InternalComment
	user.TelegramUsername = strings.TrimPrefix(strings.TrimSpace(req.TelegramUsername), "@")
	if req.HourlyRate != "" {
		user.HourlyRate = req.HourlyRate
	}
	if err := s.users.Update(ctx, user); err != nil {
		return nil, err
	}
	resp := user.ToWorkerResponse()
	return &resp, nil
}

func (s *WorkerService) Approve(ctx context.Context, id string) (*dto.WorkerResponse, error) {
	user, err := s.getPendingWorker(ctx, id)
	if err != nil {
		return nil, err
	}
	if err := s.users.UpdateStatus(ctx, user.ID, models.UserStatusActive); err != nil {
		return nil, err
	}
	user.Status = models.UserStatusActive
	if s.activity != nil {
		s.activity.Record(ctx, "", "worker_approved", "user", user.ID, user.FirstName+" "+user.LastName)
	}
	if s.notifications != nil {
		_ = s.notifications.NotifyWorkerApproved(ctx, user.ID)
	}
	resp := user.ToWorkerResponse()
	return &resp, nil
}

func (s *WorkerService) Reject(ctx context.Context, id string, req dto.RejectWorkerApplicationRequest) (*dto.WorkerResponse, error) {
	user, err := s.getPendingWorker(ctx, id)
	if err != nil {
		return nil, err
	}
	if err := validateApplicationReasons(req.Reasons, rejectApplicationReasons); err != nil {
		return nil, err
	}
	feedback := dto.ApplicationFeedback{
		Action:     "reject",
		Reasons:    req.Reasons,
		Comment:    strings.TrimSpace(req.Comment),
		ReviewedAt: time.Now().UTC().Format(time.RFC3339),
	}
	if err := s.users.SetApplicationReview(ctx, user.ID, models.UserStatusRejected, feedback, false); err != nil {
		return nil, err
	}
	user.Status = models.UserStatusRejected
	user.ApplicationFeedback = feedback
	user.ApplicationCorrectionsNeeded = false
	if s.activity != nil {
		s.activity.Record(ctx, "", "worker_rejected", "user", user.ID, user.FirstName+" "+user.LastName)
	}
	if s.notifications != nil {
		_ = s.notifications.NotifyWorkerRejected(ctx, user.ID, feedback)
	}
	resp := user.ToWorkerResponse()
	return &resp, nil
}

func (s *WorkerService) ReturnApplication(
	ctx context.Context, id string, req dto.ReturnWorkerApplicationRequest,
) (*dto.WorkerResponse, error) {
	user, err := s.getPendingWorker(ctx, id)
	if err != nil {
		return nil, err
	}
	if err := validateApplicationReasons(req.Reasons, returnApplicationReasons); err != nil {
		return nil, err
	}
	feedback := dto.ApplicationFeedback{
		Action:     "return",
		Reasons:    req.Reasons,
		Comment:    strings.TrimSpace(req.Comment),
		ReviewedAt: time.Now().UTC().Format(time.RFC3339),
	}
	if err := s.users.SetApplicationReview(ctx, user.ID, models.UserStatusPending, feedback, true); err != nil {
		return nil, err
	}
	user.ApplicationFeedback = feedback
	user.ApplicationCorrectionsNeeded = true
	if s.activity != nil {
		s.activity.Record(ctx, "", "worker_application_returned", "user", user.ID, user.FirstName+" "+user.LastName)
	}
	if s.notifications != nil {
		_ = s.notifications.NotifyWorkerApplicationReturned(ctx, user.ID, feedback)
	}
	resp := user.ToWorkerResponse()
	return &resp, nil
}

func (s *WorkerService) Block(ctx context.Context, id string, req dto.BlockWorkerRequest) (*dto.WorkerResponse, error) {
	user, err := s.users.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if user.Role != models.UserRoleWorker && user.Role != models.UserRoleSupervisor {
		return nil, apperrors.ErrNotFound
	}

	projectID := strings.TrimSpace(req.ProjectID)
	var projectIDPtr *string
	if projectID != "" {
		projectIDPtr = &projectID
	} else {
		projects, err := s.projectWorkers.LatestProjectsByUsers(ctx, []string{id})
		if err != nil {
			return nil, err
		}
		if p, ok := projects[id]; ok && p.ProjectID != "" {
			projectIDPtr = &p.ProjectID
		}
	}

	now := time.Now().UTC()
	if err := s.users.BlockUser(ctx, id, strings.TrimSpace(req.Reason), projectIDPtr, now); err != nil {
		return nil, err
	}

	user, err = s.users.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	resp := user.ToWorkerResponse()
	s.enrichBlockProjectName(ctx, &resp)
	return &resp, nil
}

func (s *WorkerService) Unblock(ctx context.Context, id string) (*dto.WorkerResponse, error) {
	user, err := s.users.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if user.Role != models.UserRoleWorker && user.Role != models.UserRoleSupervisor {
		return nil, apperrors.ErrNotFound
	}
	if user.Status != models.UserStatusBlocked {
		return nil, apperrors.New(apperrors.ErrValidation, "worker is not blocked")
	}
	if err := s.users.UnblockUser(ctx, id); err != nil {
		return nil, err
	}
	user, err = s.users.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	resp := user.ToWorkerResponse()
	return &resp, nil
}

func (s *WorkerService) enrichBlockProjectName(ctx context.Context, resp *dto.WorkerResponse) {
	if resp.BlockProjectID == "" {
		return
	}
	name, err := s.users.GetProjectName(ctx, resp.BlockProjectID)
	if err != nil {
		return
	}
	resp.BlockProjectName = name
}

func (s *WorkerService) Resources(ctx context.Context) ([]dto.WorkerResourceStat, error) {
	return s.users.WorkerResourceStats(ctx)
}

func (s *WorkerService) ListProjects(ctx context.Context, id string) ([]dto.WorkerProjectResponse, error) {
	user, err := s.users.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if user.Role != models.UserRoleWorker && user.Role != models.UserRoleSupervisor {
		return nil, apperrors.ErrNotFound
	}
	rows, err := s.projectWorkers.ListProjectsByUser(ctx, id, "", "")
	if err != nil {
		return nil, err
	}
	responses := make([]dto.WorkerProjectResponse, 0, len(rows))
	for _, row := range rows {
		responses = append(responses, dto.WorkerProjectResponse{
			ID:                 row.ProjectID,
			Name:               row.Name,
			Location:           row.Location,
			ClientName:         row.ClientName,
			Status:             row.Status,
			SiteStatus:         row.SiteStatus,
			StartDate:          row.StartDate,
			EndDate:            row.EndDate,
			Role:               row.Role,
			ConfirmationStatus: row.ConfirmationStatus,
			AssignedAt:         row.AssignedAt,
		})
	}
	return responses, nil
}

func (s *WorkerService) Available(ctx context.Context, projectID string) ([]dto.WorkerResponse, error) {
	workers, err := s.users.ListActiveWorkers(ctx)
	if err != nil {
		return nil, err
	}
	var onProject map[string]struct{}
	if projectID != "" {
		onProject, err = s.projectWorkers.ListUserIDsOnProject(ctx, projectID)
	} else {
		onProject, err = s.projectWorkers.ListUserIDsOnActiveProjects(ctx)
	}
	if err != nil {
		return nil, err
	}

	responses := make([]dto.WorkerResponse, 0)
	for _, w := range workers {
		if _, busy := onProject[w.ID]; !busy {
			responses = append(responses, w.ToWorkerResponse())
		}
	}
	return responses, nil
}

func (s *WorkerService) getPendingWorker(ctx context.Context, id string) (*models.User, error) {
	user, err := s.users.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if user.Role != models.UserRoleWorker && user.Role != models.UserRoleSupervisor {
		return nil, apperrors.ErrNotFound
	}
	if user.Status != models.UserStatusPending {
		return nil, apperrors.New(apperrors.ErrValidation, "worker is not pending approval")
	}
	return user, nil
}

var rejectApplicationReasons = map[string]struct{}{
	"incomplete_documents": {},
	"wrong_specialization": {},
	"no_positions":         {},
	"other":                {},
}

var returnApplicationReasons = map[string]struct{}{
	"upload_license":         {},
	"clarify_specialization": {},
	"fix_rate":               {},
	"other":                  {},
}

func validateApplicationReasons(reasons []string, allowed map[string]struct{}) error {
	if len(reasons) == 0 {
		return apperrors.New(apperrors.ErrValidation, "at least one reason is required")
	}
	for _, reason := range reasons {
		if _, ok := allowed[strings.TrimSpace(reason)]; !ok {
			return apperrors.New(apperrors.ErrValidation, "invalid reason: "+reason)
		}
	}
	return nil
}
