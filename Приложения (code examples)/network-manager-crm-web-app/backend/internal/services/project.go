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

type ProjectService struct {
	projects       *repositories.ProjectRepository
	projectWorkers *repositories.ProjectWorkerRepository
	workerReports  *repositories.WorkerReportRepository
	users          *repositories.UserRepository
	notifications  *NotificationService
	activity       *ActivityService
}

func NewProjectService(
	projects *repositories.ProjectRepository,
	projectWorkers *repositories.ProjectWorkerRepository,
	workerReports *repositories.WorkerReportRepository,
	users *repositories.UserRepository,
	notifications *NotificationService,
	activity *ActivityService,
) *ProjectService {
	return &ProjectService{
		projects:       projects,
		projectWorkers: projectWorkers,
		workerReports:  workerReports,
		users:          users,
		notifications:  notifications,
		activity:       activity,
	}
}

func (s *ProjectService) List(ctx context.Context, q dto.ProjectListQuery) (*dto.PaginatedResponse[dto.ProjectResponse], error) {
	items, total, err := s.projects.List(ctx, q)
	if err != nil {
		return nil, err
	}
	if err := s.enrichProjectsWithStats(ctx, items); err != nil {
		return nil, err
	}
	return paginateProjects(items, total, q.Page, q.PageSize), nil
}

func (s *ProjectService) enrichProjectsWithStats(ctx context.Context, items []models.Project) error {
	if len(items) == 0 {
		return nil
	}

	projectIDs := make([]string, len(items))
	for i := range items {
		projectIDs[i] = items[i].ID
	}

	workerStats, err := s.projectWorkers.CountByProjects(ctx, projectIDs)
	if err != nil {
		return err
	}
	reportCounts, err := s.workerReports.CountByProjectsAndStatus(ctx, projectIDs, "review")
	if err != nil {
		return err
	}

	for i := range items {
		stats := workerStats[items[i].ID]
		stats.ReportsOnReview = reportCounts[items[i].ID]
		items[i].Stats = stats
	}
	return nil
}

func (s *ProjectService) GetByID(ctx context.Context, id string, includeWorkers bool) (*dto.ProjectResponse, error) {
	project, err := s.projects.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	stats, err := s.projectWorkers.CountByProject(ctx, id)
	if err != nil {
		return nil, err
	}
	reportsOnReview, err := s.workerReports.CountByProjectAndStatus(ctx, id, "review")
	if err != nil {
		return nil, err
	}
	stats.ReportsOnReview = reportsOnReview
	project.Stats = stats
	if includeWorkers {
		workers, err := s.projectWorkers.ListByProject(ctx, id)
		if err != nil {
			return nil, err
		}
		project.Workers = workers
	}
	resp := project.ToResponse()
	return &resp, nil
}

func (s *ProjectService) Create(ctx context.Context, actorID string, req dto.CreateProjectRequest) (*dto.ProjectResponse, error) {
	exists, err := s.projects.ClientExists(ctx, req.ClientID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, apperrors.New(apperrors.ErrValidation, "client not found")
	}

	budget := req.Budget
	projectType := req.Type
	if req.EstimateID != nil && *req.EstimateID != "" {
		estimate, err := s.projects.GetEstimate(ctx, *req.EstimateID)
		if err != nil {
			return nil, apperrors.New(apperrors.ErrValidation, "estimate not found")
		}
		if _, err := s.projects.FindByEstimateID(ctx, *req.EstimateID); err == nil {
			return nil, apperrors.New(apperrors.ErrValidation, "project already exists for this estimate")
		} else if err != apperrors.ErrNotFound {
			return nil, err
		}
		if budget == "" || budget == "0" {
			budget = estimate.TotalAmount
		}
		if projectType == "" {
			projectType = "estimate"
		}
	}
	if projectType == "" {
		projectType = "estimate"
	}
	if budget == "" {
		budget = "0"
	}

	startDate, err := parseDate(req.StartDate)
	if err != nil {
		return nil, apperrors.New(apperrors.ErrValidation, "invalid startDate")
	}
	endDate, err := parseDate(req.EndDate)
	if err != nil {
		return nil, apperrors.New(apperrors.ErrValidation, "invalid endDate")
	}

	project := &models.Project{
		ClientID:   req.ClientID,
		EstimateID: req.EstimateID,
		Name:       req.Name,
		Location:   req.Location,
		StartDate:  startDate,
		EndDate:    endDate,
		Status:     "active",
		Type:       projectType,
		SiteStatus:    "ok",
		DowntimeHours: "0",
		Budget:        budget,
		Spent:         "0",
	}
	if err := s.projects.Create(ctx, project); err != nil {
		return nil, fmt.Errorf("create project: %w", err)
	}
	if s.activity != nil {
		s.activity.RecordProject(ctx, actorID, project.ID, "project_created", project.Name)
	}
	return s.GetByID(ctx, project.ID, false)
}

func (s *ProjectService) CreateFromEstimate(ctx context.Context, actorID string, req dto.CreateProjectFromEstimateRequest) (*dto.ProjectResponse, error) {
	estimate, err := s.projects.GetEstimate(ctx, req.EstimateID)
	if err != nil {
		return nil, err
	}
	if estimate.Status != "approved" {
		return nil, apperrors.New(apperrors.ErrValidation, "estimate must be approved")
	}
	if estimate.ClientID == nil {
		return nil, apperrors.New(apperrors.ErrValidation, "estimate has no linked client")
	}
	if _, err := s.projects.FindByEstimateID(ctx, req.EstimateID); err == nil {
		return nil, apperrors.New(apperrors.ErrValidation, "project already exists for this estimate")
	} else if err != apperrors.ErrNotFound {
		return nil, err
	}

	name := req.Name
	if name == "" {
		name = estimate.Name
	}
	startDate := req.StartDate
	createReq := dto.CreateProjectRequest{
		ClientID:   *estimate.ClientID,
		EstimateID: &estimate.ID,
		Name:       name,
		Location:   req.Location,
		StartDate:  startDate,
		Type:       "estimate",
		Budget:     estimate.TotalAmount,
	}
	return s.Create(ctx, actorID, createReq)
}

func (s *ProjectService) Update(ctx context.Context, actorID, id string, req dto.UpdateProjectRequest) (*dto.ProjectResponse, error) {
	project, err := s.projects.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Name != "" {
		project.Name = req.Name
	}
	if req.Location != "" {
		project.Location = req.Location
	}
	if req.StartDate != nil {
		startDate, err := parseDate(req.StartDate)
		if err != nil {
			return nil, apperrors.New(apperrors.ErrValidation, "invalid startDate")
		}
		project.StartDate = startDate
	}
	if req.EndDate != nil {
		endDate, err := parseDate(req.EndDate)
		if err != nil {
			return nil, apperrors.New(apperrors.ErrValidation, "invalid endDate")
		}
		project.EndDate = endDate
	}
	if req.Status != "" {
		if req.Status == "done" && project.Status != "active" {
			return nil, apperrors.New(apperrors.ErrValidation, "only active projects can be closed")
		}
		if req.Status == "done" && project.EndDate == nil {
			now := time.Now().UTC()
			today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
			project.EndDate = &today
		}
		if req.Status == "done" && s.activity != nil && project.Status == "active" {
			s.activity.RecordProject(ctx, actorID, id, "project_closed", project.Name)
		}
		project.Status = req.Status
	}
	if req.SiteStatus != "" {
		project.SiteStatus = req.SiteStatus
	}
	if req.DowntimeHours != "" {
		project.DowntimeHours = req.DowntimeHours
	}
	oldBudget := project.Budget
	if req.Budget != "" {
		project.Budget = req.Budget
	}

	if err := s.projects.Update(ctx, project); err != nil {
		return nil, err
	}
	if s.activity != nil && req.Budget != "" && req.Budget != oldBudget {
		label := fmt.Sprintf(
			"Изменён бюджет проекта: %s → %s",
			formatBudgetDisplay(oldBudget),
			formatBudgetDisplay(req.Budget),
		)
		s.activity.RecordProject(ctx, actorID, id, "budget_changed", label)
	}
	return s.GetByID(ctx, id, false)
}

func (s *ProjectService) Delete(ctx context.Context, id string) error {
	return s.projects.SoftDelete(ctx, id)
}

func ensureProjectActive(project *models.Project) error {
	if project.Status != "active" {
		return apperrors.New(apperrors.ErrValidation, "project is not active")
	}
	return nil
}

func (s *ProjectService) AssignWorker(ctx context.Context, projectID string, req dto.AssignWorkerRequest) (*dto.ProjectWorkerResponse, error) {
	project, err := s.projects.GetByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if err := ensureProjectActive(project); err != nil {
		return nil, err
	}
	user, err := s.users.FindByID(ctx, req.UserID)
	if err != nil {
		return nil, err
	}
	if user.Status != models.UserStatusActive {
		return nil, apperrors.New(apperrors.ErrValidation, "worker must be active")
	}
	if user.Role != models.UserRoleWorker && user.Role != models.UserRoleSupervisor {
		return nil, apperrors.New(apperrors.ErrValidation, "user must be worker or supervisor")
	}
	role := req.Role
	if role == "" {
		role = "worker"
	}

	assigned, err := s.projectWorkers.IsAssigned(ctx, projectID, req.UserID)
	if err != nil {
		return nil, err
	}
	if assigned {
		pw, err := s.projectWorkers.GetAssignment(ctx, projectID, req.UserID)
		if err != nil {
			return nil, err
		}
		resp := pw.ToResponse()
		return &resp, nil
	}

	_, err = s.projectWorkers.Assign(ctx, projectID, req.UserID, role)
	if err != nil {
		return nil, err
	}
	if role == "supervisor" {
		_ = s.projects.UpdateSupervisorID(ctx, projectID, &req.UserID)
	}
	if s.activity != nil {
		fullName := strings.TrimSpace(user.FirstName + " " + user.LastName)
		if role == "supervisor" {
			s.activity.RecordProject(ctx, "", projectID, "supervisor_assigned", "Назначен супервайзер: "+fullName)
		} else {
			s.activity.RecordProject(ctx, "", projectID, "worker_assigned", "Добавлен работник "+fullName)
		}
	}
	s.sendProjectInvite(ctx, projectID, req.UserID)

	pw, err := s.projectWorkers.GetAssignment(ctx, projectID, req.UserID)
	if err != nil {
		return nil, err
	}
	resp := pw.ToResponse()
	_ = project
	return &resp, nil
}

func (s *ProjectService) AssignWorkersBatch(ctx context.Context, projectID string, req dto.AssignWorkersBatchRequest) ([]dto.ProjectWorkerResponse, error) {
	if len(req.UserIDs) == 0 {
		return nil, apperrors.New(apperrors.ErrValidation, "userIds is required")
	}
	project, err := s.projects.GetByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if err := ensureProjectActive(project); err != nil {
		return nil, err
	}
	_ = project
	role := req.Role
	if role == "" {
		role = "worker"
	}
	if role != "worker" {
		return nil, apperrors.New(apperrors.ErrValidation, "batch assign supports worker role only")
	}

	responses := make([]dto.ProjectWorkerResponse, 0, len(req.UserIDs))
	for _, userID := range req.UserIDs {
		if userID == "" {
			continue
		}
		resp, err := s.AssignWorker(ctx, projectID, dto.AssignWorkerRequest{
			UserID: userID,
			Role:   role,
		})
		if err != nil {
			return nil, err
		}
		responses = append(responses, *resp)
	}
	return responses, nil
}

func (s *ProjectService) SetSupervisor(ctx context.Context, projectID string, req dto.SetProjectSupervisorRequest) (*dto.ProjectWorkerResponse, error) {
	project, err := s.projects.GetByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if err := ensureProjectActive(project); err != nil {
		return nil, err
	}
	user, err := s.users.FindByID(ctx, req.UserID)
	if err != nil {
		return nil, err
	}
	if user.Status != models.UserStatusActive {
		return nil, apperrors.New(apperrors.ErrValidation, "worker must be active")
	}
	if user.Role != models.UserRoleWorker && user.Role != models.UserRoleSupervisor {
		return nil, apperrors.New(apperrors.ErrValidation, "user must be worker or supervisor")
	}

	workers, err := s.projectWorkers.ListByProject(ctx, projectID)
	if err != nil {
		return nil, err
	}
	for _, w := range workers {
		if w.Role == "supervisor" && w.UserID != req.UserID {
			if err := s.RemoveWorker(ctx, projectID, w.UserID); err != nil {
				return nil, err
			}
		}
	}

	assigned, err := s.projectWorkers.IsAssigned(ctx, projectID, req.UserID)
	if err != nil {
		return nil, err
	}
	if assigned {
		resp, err := s.ChangeWorkerRole(ctx, projectID, req.UserID, dto.ChangeWorkerRoleRequest{Role: "supervisor"})
		if err != nil {
			return nil, err
		}
		s.sendProjectInvite(ctx, projectID, req.UserID)
		s.notifySupervisorAssigned(ctx, projectID, req.UserID, project.Name)
		return resp, nil
	}

	resp, err := s.AssignWorker(ctx, projectID, dto.AssignWorkerRequest{
		UserID: req.UserID,
		Role:   "supervisor",
	})
	if err != nil {
		return nil, err
	}
	s.notifySupervisorAssigned(ctx, projectID, req.UserID, project.Name)
	return resp, nil
}

func (s *ProjectService) SupervisorCandidates(ctx context.Context, projectID string) (*dto.SupervisorCandidatesResponse, error) {
	if _, err := s.projects.GetByID(ctx, projectID); err != nil {
		return nil, err
	}
	workers, err := s.users.ListActiveWorkers(ctx)
	if err != nil {
		return nil, err
	}
	onProject, err := s.projectWorkers.ListUserIDsOnProject(ctx, projectID)
	if err != nil {
		return nil, err
	}

	resp := &dto.SupervisorCandidatesResponse{
		OnProject: make([]dto.WorkerResponse, 0),
		Available: make([]dto.WorkerResponse, 0),
	}
	for _, w := range workers {
		if w.Role != models.UserRoleWorker && w.Role != models.UserRoleSupervisor {
			continue
		}
		item := w.ToWorkerResponse()
		if _, assigned := onProject[w.ID]; assigned {
			resp.OnProject = append(resp.OnProject, item)
		} else {
			resp.Available = append(resp.Available, item)
		}
	}
	return resp, nil
}

func (s *ProjectService) sendProjectInvite(ctx context.Context, projectID, userID string) {
	if s.notifications == nil {
		return
	}
	_ = s.Invite(ctx, projectID, dto.ProjectInviteRequest{UserID: userID})
}

func (s *ProjectService) notifySupervisorAssigned(ctx context.Context, projectID, userID, projectName string) {
	if s.notifications == nil {
		return
	}
	_ = s.notifications.NotifySupervisorAssigned(ctx, userID, projectID, projectName)
}

func (s *ProjectService) RemoveWorker(ctx context.Context, projectID, workerID string) error {
	project, err := s.projects.GetByID(ctx, projectID)
	if err != nil {
		return err
	}
	if err := ensureProjectActive(project); err != nil {
		return err
	}
	pw, err := s.projectWorkers.GetAssignment(ctx, projectID, workerID)
	if err != nil {
		return err
	}
	if err := s.projectWorkers.Remove(ctx, projectID, workerID); err != nil {
		return err
	}
	if pw.Role == "supervisor" {
		return s.projects.UpdateSupervisorID(ctx, projectID, nil)
	}
	return nil
}

func (s *ProjectService) ChangeWorkerRole(ctx context.Context, projectID, workerID string, req dto.ChangeWorkerRoleRequest) (*dto.ProjectWorkerResponse, error) {
	if req.Role != "worker" && req.Role != "supervisor" {
		return nil, apperrors.New(apperrors.ErrValidation, "invalid role")
	}
	project, err := s.projects.GetByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if err := ensureProjectActive(project); err != nil {
		return nil, err
	}
	if err := s.projectWorkers.ChangeRole(ctx, projectID, workerID, req.Role); err != nil {
		return nil, err
	}
	if req.Role == "supervisor" {
		_ = s.projects.UpdateSupervisorID(ctx, projectID, &workerID)
		project, _ := s.projects.GetByID(ctx, projectID)
		if project != nil {
			s.notifySupervisorAssigned(ctx, projectID, workerID, project.Name)
		}
	} else {
		project, _ := s.projects.GetByID(ctx, projectID)
		if project != nil && project.SupervisorID != nil && *project.SupervisorID == workerID {
			_ = s.projects.UpdateSupervisorID(ctx, projectID, nil)
		}
	}
	user, err := s.users.FindByID(ctx, workerID)
	if err != nil {
		return nil, err
	}
	pw, err := s.projectWorkers.GetAssignment(ctx, projectID, workerID)
	if err != nil {
		return nil, err
	}
	_ = user
	resp := pw.ToResponse()
	return &resp, nil
}

func (s *ProjectService) Invite(ctx context.Context, projectID string, req dto.ProjectInviteRequest) error {
	project, err := s.projects.GetByID(ctx, projectID)
	if err != nil {
		return err
	}
	if err := ensureProjectActive(project); err != nil {
		return err
	}
	user, err := s.users.FindByID(ctx, req.UserID)
	if err != nil {
		return err
	}
	if user.Status != models.UserStatusActive {
		return apperrors.New(apperrors.ErrValidation, "user must be active")
	}
	assigned, err := s.projectWorkers.IsAssigned(ctx, projectID, req.UserID)
	if err != nil {
		return err
	}
	if !assigned {
		return apperrors.New(apperrors.ErrValidation, "worker is not assigned to this project")
	}
	if err := s.notifications.SendProjectInvite(ctx, req.UserID, projectID, project.Name); err != nil {
		return err
	}
	return s.projectWorkers.TouchInvitedAt(ctx, projectID, req.UserID)
}

func (s *ProjectService) SendNotifications(ctx context.Context, projectID string, req dto.SendProjectNotificationsRequest) (*dto.SendProjectNotificationsResponse, error) {
	project, err := s.projects.GetByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if err := ensureProjectActive(project); err != nil {
		return nil, err
	}

	projectUserIDs, err := s.projectWorkers.ListUserIDsOnProject(ctx, projectID)
	if err != nil {
		return nil, err
	}

	title := strings.TrimSpace(req.Title)
	if title == "" {
		title = "Уведомление по проекту"
	}
	link := strings.TrimSpace(req.Link)
	if link == "" {
		link = fmt.Sprintf("/worker/projects/%s", projectID)
	}

	sent := 0
	for _, userID := range req.UserIDs {
		if userID == "" {
			continue
		}
		if _, ok := projectUserIDs[userID]; !ok {
			return nil, apperrors.New(apperrors.ErrValidation, "user is not assigned to this project")
		}
		if _, err := s.notifications.SendManual(ctx, dto.SendNotificationRequest{
			UserID: userID,
			Title:  title,
			Body:   req.Body,
			Link:   link,
		}); err != nil {
			return nil, err
		}
		sent++
	}

	return &dto.SendProjectNotificationsResponse{Sent: sent}, nil
}

func (s *ProjectService) ListMine(ctx context.Context, userID string, q dto.MyProjectListQuery) ([]dto.MyProjectResponse, error) {
	rows, err := s.projectWorkers.ListProjectsByUser(ctx, userID, q.Status, q.ConfirmationStatus)
	if err != nil {
		return nil, err
	}
	responses := make([]dto.MyProjectResponse, 0, len(rows))
	for _, row := range rows {
		responses = append(responses, dto.MyProjectResponse{
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

func (s *ProjectService) GetForWorker(ctx context.Context, projectID, userID string) (*dto.MyProjectResponse, error) {
	assigned, err := s.projectWorkers.IsAssigned(ctx, projectID, userID)
	if err != nil {
		return nil, err
	}
	if !assigned {
		return nil, apperrors.ErrForbidden
	}
	project, err := s.projects.GetByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	assignment, err := s.projectWorkers.GetAssignment(ctx, projectID, userID)
	if err != nil {
		return nil, err
	}
	if assignment.ConfirmationStatus == "rejected" {
		return nil, apperrors.ErrForbidden
	}

	var crew []dto.ProjectWorkerResponse
	if assignment.Role == string(models.UserRoleSupervisor) {
		workers, err := s.projectWorkers.ListByProject(ctx, projectID)
		if err != nil {
			return nil, err
		}
		crew = make([]dto.ProjectWorkerResponse, 0, len(workers))
		for _, w := range workers {
			crew = append(crew, w.ToResponse())
		}
	}

	var startDate, endDate *string
	if project.StartDate != nil {
		s := project.StartDate.Format("2006-01-02")
		startDate = &s
	}
	if project.EndDate != nil {
		s := project.EndDate.Format("2006-01-02")
		endDate = &s
	}
	clientName := ""
	if name, err := s.projects.GetClientName(ctx, project.ClientID); err == nil {
		clientName = name
	}
	contacts, err := s.buildProjectContacts(ctx, project)
	if err != nil {
		return nil, err
	}

	resp := &dto.MyProjectResponse{
		ID:                 project.ID,
		Name:               project.Name,
		Location:           project.Location,
		ClientName:         clientName,
		Status:             project.Status,
		SiteStatus:         project.SiteStatus,
		StartDate:          startDate,
		EndDate:            endDate,
		Role:               assignment.Role,
		ConfirmationStatus: assignment.ConfirmationStatus,
		AssignedAt:         assignment.AssignedAt.UTC().Format(time.RFC3339),
		Contacts:           contacts,
	}
	if len(crew) > 0 {
		resp.ProjectWorkers = crew
	}
	return resp, nil
}

func (s *ProjectService) GetCrew(ctx context.Context, projectID, userID string) ([]dto.ProjectWorkerResponse, error) {
	assigned, err := s.projectWorkers.IsAssigned(ctx, projectID, userID)
	if err != nil {
		return nil, err
	}
	if !assigned {
		return nil, apperrors.ErrForbidden
	}
	assignment, err := s.projectWorkers.GetAssignment(ctx, projectID, userID)
	if err != nil {
		return nil, err
	}
	if assignment.Role != string(models.UserRoleSupervisor) {
		return nil, apperrors.ErrForbidden
	}
	workers, err := s.projectWorkers.ListByProject(ctx, projectID)
	if err != nil {
		return nil, err
	}
	crew := make([]dto.ProjectWorkerResponse, 0, len(workers))
	for _, w := range workers {
		crew = append(crew, w.ToResponse())
	}
	return crew, nil
}

func (s *ProjectService) buildProjectContacts(
	ctx context.Context,
	project *models.Project,
) ([]dto.ProjectContact, error) {
	contacts := make([]dto.ProjectContact, 0, 2)

	if clientContact, err := s.projects.GetClientContact(ctx, project.ClientID); err == nil {
		name := strings.TrimSpace(clientContact.ContactPerson)
		if name != "" || clientContact.Phone != "" {
			contacts = append(contacts, dto.ProjectContact{
				Role:  "manager",
				Name:  name,
				Phone: clientContact.Phone,
			})
		}
	}

	workers, err := s.projectWorkers.ListByProject(ctx, project.ID)
	if err != nil {
		return nil, err
	}
	for _, w := range workers {
		if w.Role != string(models.UserRoleSupervisor) {
			continue
		}
		name := strings.TrimSpace(w.FirstName + " " + w.LastName)
		phone := ""
		if u, err := s.users.FindByID(ctx, w.UserID); err == nil {
			phone = u.Phone
			if name == "" {
				name = strings.TrimSpace(u.FirstName + " " + u.LastName)
			}
		}
		contacts = append(contacts, dto.ProjectContact{
			Role:  "supervisor",
			Name:  name,
			Phone: phone,
		})
		return contacts, nil
	}

	if project.SupervisorID != nil && *project.SupervisorID != "" {
		u, err := s.users.FindByID(ctx, *project.SupervisorID)
		if err == nil {
			name := strings.TrimSpace(u.FirstName + " " + u.LastName)
			contacts = append(contacts, dto.ProjectContact{
				Role:  "supervisor",
				Name:  name,
				Phone: u.Phone,
			})
		}
	}

	return contacts, nil
}

func (s *ProjectService) ConfirmParticipation(ctx context.Context, projectID, userID string) error {
	assigned, err := s.projectWorkers.IsAssigned(ctx, projectID, userID)
	if err != nil {
		return err
	}
	if !assigned {
		return apperrors.New(apperrors.ErrValidation, "not assigned to this project")
	}
	if err := s.projectWorkers.Confirm(ctx, projectID, userID); err != nil {
		return err
	}
	if s.activity != nil {
		s.activity.Record(ctx, userID, "participation_confirmed", "project", projectID, "")
	}
	project, err := s.projects.GetByID(ctx, projectID)
	if err != nil {
		return nil
	}
	if s.notifications != nil && project.SupervisorID != nil && *project.SupervisorID != userID {
		worker, err := s.users.FindByID(ctx, userID)
		if err == nil {
			name := strings.TrimSpace(worker.FirstName + " " + worker.LastName)
			_ = s.notifications.NotifyWorkerJoined(ctx, *project.SupervisorID, projectID, project.Name, name)
		}
	}
	return nil
}

func (s *ProjectService) DeclineParticipation(ctx context.Context, projectID, userID string) error {
	assigned, err := s.projectWorkers.IsAssigned(ctx, projectID, userID)
	if err != nil {
		return err
	}
	if !assigned {
		return apperrors.New(apperrors.ErrValidation, "not assigned to this project")
	}
	if err := s.projectWorkers.Reject(ctx, projectID, userID); err != nil {
		if err == apperrors.ErrNotFound {
			return apperrors.New(apperrors.ErrValidation, "invitation is not pending")
		}
		return err
	}
	if s.activity != nil {
		s.activity.Record(ctx, userID, "participation_declined", "project", projectID, "")
	}
	return nil
}

func (s *ProjectService) ListWorkerDocuments(ctx context.Context, projectID string) ([]dto.ProjectWorkerDocumentsGroup, error) {
	if _, err := s.projects.GetByID(ctx, projectID); err != nil {
		return nil, err
	}

	rows, err := s.workerReports.ListExpenseDocumentsByProject(ctx, projectID)
	if err != nil {
		return nil, err
	}

	groups := make([]dto.ProjectWorkerDocumentsGroup, 0)
	indexByWorker := make(map[string]int)

	for _, row := range rows {
		idx, ok := indexByWorker[row.WorkerID]
		if !ok {
			name := strings.TrimSpace(row.FirstName + " " + row.LastName)
			groups = append(groups, dto.ProjectWorkerDocumentsGroup{
				WorkerID:   row.WorkerID,
				WorkerName: name,
				Documents:  []dto.ProjectWorkerDocumentItem{},
			})
			idx = len(groups) - 1
			indexByWorker[row.WorkerID] = idx
		}
		if row.DocumentID == nil || *row.DocumentID == "" {
			continue
		}
		item := dto.ProjectWorkerDocumentItem{
			ID:       *row.DocumentID,
			Filename: derefString(row.Filename),
		}
		if row.ExpenseType != nil {
			item.ExpenseType = *row.ExpenseType
		}
		if row.CreatedAt != nil {
			item.CreatedAt = row.CreatedAt.UTC().Format(time.RFC3339)
		}
		groups[idx].Documents = append(groups[idx].Documents, item)
	}

	return groups, nil
}

func (s *ProjectService) ListHistory(ctx context.Context, projectID string) ([]dto.ActivityItemResponse, error) {
	if _, err := s.projects.GetByID(ctx, projectID); err != nil {
		return nil, err
	}
	if s.activity == nil {
		return []dto.ActivityItemResponse{}, nil
	}
	return s.activity.ListByProject(ctx, projectID, 100)
}

func derefString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func parseDate(s *string) (*time.Time, error) {
	if s == nil || *s == "" {
		return nil, nil
	}
	t, err := time.Parse("2006-01-02", *s)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func paginateProjects(items []models.Project, total int64, page, pageSize int) *dto.PaginatedResponse[dto.ProjectResponse] {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	responses := make([]dto.ProjectResponse, 0, len(items))
	for _, item := range items {
		responses = append(responses, item.ToResponse())
	}
	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	return &dto.PaginatedResponse[dto.ProjectResponse]{
		Items: responses, Total: total, Page: page, PageSize: pageSize, TotalPages: totalPages,
	}
}
