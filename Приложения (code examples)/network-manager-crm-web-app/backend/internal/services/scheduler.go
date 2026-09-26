package services

import (
	"context"
	"log/slog"
	"time"

	"github.com/radar-crm/backend/internal/config"
	"github.com/radar-crm/backend/internal/repositories"
	"github.com/robfig/cron/v3"
)

type Scheduler struct {
	cron          *cron.Cron
	workerReports *repositories.WorkerReportRepository
	tools         *repositories.ToolRepository
	assignments   *repositories.ToolAssignmentRepository
	calibrations  *repositories.ToolCalibrationRepository
	notifications *NotificationService
	cfg           config.Config
}

func NewScheduler(
	cfg config.Config,
	workerReports *repositories.WorkerReportRepository,
	tools *repositories.ToolRepository,
	assignments *repositories.ToolAssignmentRepository,
	calibrations *repositories.ToolCalibrationRepository,
	notifications *NotificationService,
) *Scheduler {
	return &Scheduler{
		cron:          cron.New(),
		workerReports: workerReports,
		tools:         tools,
		assignments:   assignments,
		calibrations:  calibrations,
		notifications: notifications,
		cfg:           cfg,
	}
}

func (s *Scheduler) Start() {
	if !s.cfg.CronEnabled {
		slog.Info("cron scheduler disabled")
		return
	}
	_, _ = s.cron.AddFunc(s.cfg.CronReportOverdue, s.markOverdueReports)
	_, _ = s.cron.AddFunc(s.cfg.CronToolCalibration, s.checkToolCalibration)
	_, _ = s.cron.AddFunc(s.cfg.CronToolReturn, s.checkUnreturnedTools)
	_, _ = s.cron.AddFunc(s.cfg.CronWorkerWeeklyReminder, s.sendWorkerWeeklyReportReminders)
	_, _ = s.cron.AddFunc(s.cfg.CronSupervisorDailyReminder, s.sendSupervisorDailyReportReminders)
	s.cron.Start()
	slog.Info("cron scheduler started")
}

func (s *Scheduler) Stop() {
	if s.cron != nil {
		ctx := s.cron.Stop()
		<-ctx.Done()
	}
}

func (s *Scheduler) markOverdueReports() {
	ctx := context.Background()
	count, err := s.workerReports.MarkOverdue(ctx, time.Now())
	if err != nil {
		slog.Error("cron overdue reports failed", "error", err)
		return
	}
	if count > 0 {
		slog.Info("cron marked overdue reports", "count", count)
	}
}

func (s *Scheduler) checkToolCalibration() {
	ctx := context.Background()
	count, err := s.tools.MarkOverdueCalibration(ctx, time.Now())
	if err != nil {
		slog.Error("cron tool calibration check failed", "error", err)
		return
	}
	if count > 0 {
		slog.Info("cron marked overdue calibrations", "count", count)
	}
	tools, err := s.calibrations.ListDueWithin(ctx, time.Now().Add(7*24*time.Hour))
	if err != nil || s.notifications == nil {
		return
	}
	for _, tool := range tools {
		_ = s.notifications.NotifyToolCalibrationDue(ctx, "", tool.ID, tool.Name)
	}
}

func (s *Scheduler) checkUnreturnedTools() {
	ctx := context.Background()
	olderThan := time.Now().Add(-30 * 24 * time.Hour)
	count, err := s.assignments.MarkOverdueUnreturned(ctx, olderThan)
	if err != nil {
		slog.Error("cron unreturned tools failed", "error", err)
		return
	}
	if count > 0 {
		slog.Info("cron marked unreturned tools", "count", count)
	}
}

func (s *Scheduler) sendWorkerWeeklyReportReminders() {
	if s.notifications == nil {
		return
	}
	count, err := s.notifications.SendWorkerWeeklyReportReminders(context.Background())
	if err != nil {
		slog.Error("cron worker weekly report reminders failed", "error", err)
		return
	}
	if count > 0 {
		slog.Info("cron sent worker weekly report reminders", "count", count)
	}
}

func (s *Scheduler) sendSupervisorDailyReportReminders() {
	if s.notifications == nil {
		return
	}
	count, err := s.notifications.SendSupervisorDailyReportReminders(context.Background())
	if err != nil {
		slog.Error("cron supervisor daily report reminders failed", "error", err)
		return
	}
	if count > 0 {
		slog.Info("cron sent supervisor daily report reminders", "count", count)
	}
}
