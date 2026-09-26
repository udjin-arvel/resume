package services

import (
	"context"
	"fmt"

	"github.com/radar-crm/backend/internal/i18n"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/repositories"
	"github.com/radar-crm/backend/internal/telegram"
)

type NotificationService struct {
	notifications *repositories.NotificationRepository
	users         *repositories.UserRepository
	telegram      *telegram.Sender
}

func NewNotificationService(
	notifications *repositories.NotificationRepository,
	users *repositories.UserRepository,
	telegram *telegram.Sender,
) *NotificationService {
	return &NotificationService{
		notifications: notifications,
		users:         users,
		telegram:      telegram,
	}
}

func (s *NotificationService) localeForUser(ctx context.Context, userID string) string {
	user, err := s.users.FindByID(ctx, userID)
	if err != nil || user.Language == "" {
		return "ru"
	}
	return user.Language
}

func (s *NotificationService) SendProjectInvite(ctx context.Context, userID, projectID, projectName string) error {
	locale := s.localeForUser(ctx, userID)
	return s.Notify(ctx, userID, "project_invite", "notification.project_invite.title", "notification.project_invite.body",
		fmt.Sprintf("/worker/projects/%s", projectID), map[string]string{"name": projectName}, locale)
}

func (s *NotificationService) NotifyReportReturned(
	ctx context.Context, userID, reportID, projectName, weekStart string,
) error {
	locale := s.localeForUser(ctx, userID)
	params := map[string]string{
		"projectName": projectName,
		"weekStart":   weekStart,
	}
	return s.Notify(ctx, userID, "report_returned", "notification.report_returned.title", "notification.report_returned.body",
		fmt.Sprintf("/worker/reports/%s", reportID), params, locale)
}

func (s *NotificationService) NotifySupervisorAttention(ctx context.Context, userID, reportID string) error {
	locale := s.localeForUser(ctx, userID)
	return s.Notify(ctx, userID, "supervisor_attention", "notification.supervisor_attention.title", "notification.supervisor_attention.body",
		fmt.Sprintf("/worker/daily-reports/%s", reportID), nil, locale)
}

func (s *NotificationService) NotifyToolCalibrationDue(ctx context.Context, userID, toolID, toolName string) error {
	locale := s.localeForUser(ctx, userID)
	return s.Notify(ctx, userID, "tool_calibration_due", "notification.tool_calibration_due.title", "notification.tool_calibration_due.body",
		fmt.Sprintf("/tools/%s", toolID), map[string]string{"name": toolName}, locale)
}

func (s *NotificationService) NotifyToolProblem(
	ctx context.Context, managerID, toolID, toolName, problemLabel, comment string,
) error {
	locale := s.localeForUser(ctx, managerID)
	params := map[string]string{
		"name":    toolName,
		"problem": problemLabel,
		"comment": comment,
	}
	return s.Notify(ctx, managerID, "tool_problem", "notification.tool_problem.title", "notification.tool_problem.body",
		fmt.Sprintf("/tools/%s", toolID), params, locale)
}

func (s *NotificationService) NotifyWorkerWeeklyReportReminder(ctx context.Context, userID, projectID, projectName string) error {
	locale := s.localeForUser(ctx, userID)
	link := "/worker/reports/new"
	if projectID != "" {
		link = fmt.Sprintf("/worker/reports/new?projectId=%s", projectID)
	}
	return s.Notify(ctx, userID, "worker_weekly_report_reminder",
		"notification.worker_weekly_report_reminder.title",
		"notification.worker_weekly_report_reminder.body",
		link, map[string]string{"name": projectName}, locale)
}

func (s *NotificationService) NotifySupervisorDailyReportReminder(ctx context.Context, userID, projectID, projectName string) error {
	locale := s.localeForUser(ctx, userID)
	link := "/worker/daily-reports/new"
	if projectID != "" {
		link = fmt.Sprintf("/worker/daily-reports/new?projectId=%s", projectID)
	}
	return s.Notify(ctx, userID, "supervisor_daily_report_reminder",
		"notification.supervisor_daily_report_reminder.title",
		"notification.supervisor_daily_report_reminder.body",
		link, map[string]string{"name": projectName}, locale)
}

func (s *NotificationService) NotifyWorkerApproved(ctx context.Context, userID string) error {
	locale := s.localeForUser(ctx, userID)
	return s.Notify(ctx, userID, "worker_approved", "notification.worker_approved.title", "notification.worker_approved.body",
		"/worker/profile", nil, locale)
}

func (s *NotificationService) NotifyWorkerRejected(ctx context.Context, userID string, feedback dto.ApplicationFeedback) error {
	locale := s.localeForUser(ctx, userID)
	params := map[string]string{"comment": feedback.Comment}
	return s.Notify(ctx, userID, "worker_rejected", "notification.worker_rejected.title", "notification.worker_rejected.body",
		"/application-rejected", params, locale)
}

func (s *NotificationService) NotifyWorkerApplicationReturned(
	ctx context.Context, userID string, feedback dto.ApplicationFeedback,
) error {
	locale := s.localeForUser(ctx, userID)
	params := map[string]string{"comment": feedback.Comment}
	return s.Notify(ctx, userID, "worker_application_returned", "notification.worker_application_returned.title", "notification.worker_application_returned.body",
		"/onboarding", params, locale)
}

func (s *NotificationService) NotifySupervisorAssigned(ctx context.Context, userID, projectID, projectName string) error {
	locale := s.localeForUser(ctx, userID)
	return s.Notify(ctx, userID, "supervisor_assigned", "notification.supervisor_assigned.title", "notification.supervisor_assigned.body",
		fmt.Sprintf("/worker/projects/%s", projectID), map[string]string{"name": projectName}, locale)
}

func (s *NotificationService) NotifyWorkerJoined(ctx context.Context, supervisorID, projectID, projectName, workerName string) error {
	locale := s.localeForUser(ctx, supervisorID)
	return s.Notify(ctx, supervisorID, "worker_joined", "notification.worker_joined.title", "notification.worker_joined.body",
		fmt.Sprintf("/worker/projects/%s", projectID), map[string]string{"name": workerName, "projectName": projectName}, locale)
}

func (s *NotificationService) NotifyWorkerReportSubmitted(
	ctx context.Context, supervisorID, reportID, workerName, projectName string,
) error {
	locale := s.localeForUser(ctx, supervisorID)
	return s.Notify(ctx, supervisorID, "worker_report_submitted", "notification.worker_report_submitted.title", "notification.worker_report_submitted.body",
		fmt.Sprintf("/worker/reports/%s", reportID),
		map[string]string{"name": workerName, "projectName": projectName}, locale)
}

func (s *NotificationService) Notify(
	ctx context.Context, userID, notifType, titleKey, bodyKey, link string,
	params map[string]string, locale string,
) error {
	if locale == "" {
		locale = s.localeForUser(ctx, userID)
	}
	title := i18n.T(locale, titleKey, params)
	body := i18n.T(locale, bodyKey, params)
	n := &models.Notification{
		UserID:           userID,
		Title:            title,
		Body:             body,
		NotificationType: notifType,
		Link:             link,
	}
	if err := s.notifications.Create(ctx, n); err != nil {
		return err
	}
	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return nil
	}
	if user.TelegramID != nil && s.telegram != nil {
		text := title
		if body != "" {
			text += "\n" + body
		}
		_ = s.telegram.SendMessage(ctx, *user.TelegramID, text, link)
	}
	return nil
}

func (s *NotificationService) ListForUser(ctx context.Context, userID string) ([]dto.NotificationResponse, error) {
	items, err := s.notifications.ListByUser(ctx, userID, false)
	if err != nil {
		return nil, err
	}
	responses := make([]dto.NotificationResponse, 0, len(items))
	for _, item := range items {
		responses = append(responses, item.ToResponse())
	}
	return responses, nil
}

func (s *NotificationService) MarkRead(ctx context.Context, id, userID string) (*dto.NotificationResponse, error) {
	if err := s.notifications.MarkRead(ctx, id, userID); err != nil {
		return nil, err
	}
	n, err := s.notifications.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	resp := n.ToResponse()
	return &resp, nil
}

func (s *NotificationService) SendManual(ctx context.Context, req dto.SendNotificationRequest) (*dto.NotificationResponse, error) {
	n := &models.Notification{
		UserID:           req.UserID,
		Title:            req.Title,
		Body:             req.Body,
		NotificationType: "manual",
		Link:             req.Link,
	}
	if err := s.notifications.Create(ctx, n); err != nil {
		return nil, err
	}
	user, err := s.users.FindByID(ctx, req.UserID)
	if err != nil {
		return nil, err
	}
	if user.TelegramID != nil && s.telegram != nil {
		text := req.Title
		if req.Body != "" {
			text += "\n" + req.Body
		}
		_ = s.telegram.SendMessage(ctx, *user.TelegramID, text, req.Link)
	}
	resp := n.ToResponse()
	return &resp, nil
}

func (s *NotificationService) SendWorkerWeeklyReportReminders(ctx context.Context) (int, error) {
	candidates, err := s.notifications.ListWorkersMissingWeeklyReport(ctx)
	if err != nil {
		return 0, err
	}
	sent := 0
	for _, c := range candidates {
		if err := s.NotifyWorkerWeeklyReportReminder(ctx, c.UserID, c.ProjectID, c.ProjectName); err == nil {
			sent++
		}
	}
	return sent, nil
}

func (s *NotificationService) SendSupervisorDailyReportReminders(ctx context.Context) (int, error) {
	candidates, err := s.notifications.ListSupervisorsMissingDailyReport(ctx)
	if err != nil {
		return 0, err
	}
	sent := 0
	for _, c := range candidates {
		if err := s.NotifySupervisorDailyReportReminder(ctx, c.UserID, c.ProjectID, c.ProjectName); err == nil {
			sent++
		}
	}
	return sent, nil
}
