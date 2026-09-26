package services_test

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/joho/godotenv"
	"github.com/radar-crm/backend/internal/database"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/repositories"
	"github.com/radar-crm/backend/internal/services"
)

func TestSendReportRemindersCreatesTypedNotifications(t *testing.T) {
	_ = godotenv.Load("../../.env")
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL not set")
	}
	ctx := context.Background()
	pool, err := database.Connect(ctx, databaseURL)
	if err != nil {
		t.Skipf("database unavailable: %v", err)
	}
	t.Cleanup(func() { database.Close(pool) })

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	var clientID, projectID, workerID, supervisorID string

	if err := pool.QueryRow(ctx, `INSERT INTO clients (name) VALUES ($1) RETURNING id`, "svc-reminder-"+suffix).Scan(&clientID); err != nil {
		t.Fatalf("insert client: %v", err)
	}
	t.Cleanup(func() { _, _ = pool.Exec(ctx, `DELETE FROM clients WHERE id = $1`, clientID) })

	if err := pool.QueryRow(ctx, `
		INSERT INTO projects (client_id, name, location, status)
		VALUES ($1, $2, 'Porto', 'active') RETURNING id
	`, clientID, "svc-project-"+suffix).Scan(&projectID); err != nil {
		t.Fatalf("insert project: %v", err)
	}
	t.Cleanup(func() { _, _ = pool.Exec(ctx, `DELETE FROM projects WHERE id = $1`, projectID) })

	if err := pool.QueryRow(ctx, `
		INSERT INTO users (role, status, first_name, last_name, email, language, timezone)
		VALUES ('worker', 'active', 'Ann', 'Worker', $1, 'en', 'UTC') RETURNING id
	`, "svc-worker-"+suffix+"@example.com").Scan(&workerID); err != nil {
		t.Fatalf("insert worker: %v", err)
	}
	if err := pool.QueryRow(ctx, `
		INSERT INTO users (role, status, first_name, last_name, email, language, timezone)
		VALUES ('supervisor', 'active', 'Bob', 'Lead', $1, 'en', 'UTC') RETURNING id
	`, "svc-supervisor-"+suffix+"@example.com").Scan(&supervisorID); err != nil {
		t.Fatalf("insert supervisor: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(ctx, `DELETE FROM users WHERE id = $1 OR id = $2`, workerID, supervisorID)
	})
	if _, err := pool.Exec(ctx, `
		INSERT INTO project_workers (project_id, user_id, role, confirmation_status)
		VALUES ($1, $2, 'worker', 'confirmed'), ($1, $3, 'supervisor', 'confirmed')
	`, projectID, workerID, supervisorID); err != nil {
		t.Fatalf("insert assignments: %v", err)
	}
	t.Cleanup(func() { _, _ = pool.Exec(ctx, `DELETE FROM project_workers WHERE project_id = $1`, projectID) })
	t.Cleanup(func() {
		_, _ = pool.Exec(ctx, `DELETE FROM notifications WHERE user_id = $1 OR user_id = $2`, workerID, supervisorID)
	})

	userRepo := repositories.NewUserRepository(pool)
	notifRepo := repositories.NewNotificationRepository(pool)
	svc := services.NewNotificationService(notifRepo, userRepo, nil)

	weeklySent, err := svc.SendWorkerWeeklyReportReminders(ctx)
	if err != nil {
		t.Fatalf("weekly reminders: %v", err)
	}
	if weeklySent < 1 {
		t.Fatal("expected at least one weekly reminder")
	}
	dailySent, err := svc.SendSupervisorDailyReportReminders(ctx)
	if err != nil {
		t.Fatalf("daily reminders: %v", err)
	}
	if dailySent < 1 {
		t.Fatal("expected at least one daily reminder")
	}

	workerNotifs, err := notifRepo.ListByUser(ctx, workerID, false)
	if err != nil {
		t.Fatalf("list worker notifications: %v", err)
	}
	if !hasNotifType(workerNotifs, "worker_weekly_report_reminder") {
		t.Fatal("expected worker_weekly_report_reminder notification")
	}

	supervisorNotifs, err := notifRepo.ListByUser(ctx, supervisorID, false)
	if err != nil {
		t.Fatalf("list supervisor notifications: %v", err)
	}
	if !hasNotifType(supervisorNotifs, "supervisor_daily_report_reminder") {
		t.Fatal("expected supervisor_daily_report_reminder notification")
	}
}

func hasNotifType(items []models.Notification, typ string) bool {
	for _, item := range items {
		if item.NotificationType == typ {
			return true
		}
	}
	return false
}
