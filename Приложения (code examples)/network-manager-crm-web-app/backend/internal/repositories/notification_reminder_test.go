package repositories_test

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/joho/godotenv"
	"github.com/radar-crm/backend/internal/database"
	"github.com/radar-crm/backend/internal/repositories"
)

func TestMissingReportCandidatesRespectReportsAndTimezone(t *testing.T) {
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

	if err := pool.QueryRow(ctx, `
		INSERT INTO clients (name) VALUES ($1) RETURNING id
	`, "reminder-client-"+suffix).Scan(&clientID); err != nil {
		t.Fatalf("insert client: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(ctx, `DELETE FROM clients WHERE id = $1`, clientID)
	})

	if err := pool.QueryRow(ctx, `
		INSERT INTO projects (client_id, name, location, status)
		VALUES ($1, $2, 'Lisbon', 'active')
		RETURNING id
	`, clientID, "reminder-project-"+suffix).Scan(&projectID); err != nil {
		t.Fatalf("insert project: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(ctx, `DELETE FROM projects WHERE id = $1`, projectID)
	})

	if err := pool.QueryRow(ctx, `
		INSERT INTO users (role, status, first_name, last_name, email, language, timezone)
		VALUES ('worker', 'active', 'Weekly', 'Worker', $1, 'en', 'UTC')
		RETURNING id
	`, "weekly-worker-"+suffix+"@example.com").Scan(&workerID); err != nil {
		t.Fatalf("insert worker: %v", err)
	}
	if err := pool.QueryRow(ctx, `
		INSERT INTO users (role, status, first_name, last_name, email, language, timezone)
		VALUES ('supervisor', 'active', 'Daily', 'Supervisor', $1, 'en', 'UTC')
		RETURNING id
	`, "daily-supervisor-"+suffix+"@example.com").Scan(&supervisorID); err != nil {
		t.Fatalf("insert supervisor: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(ctx, `DELETE FROM users WHERE id = $1 OR id = $2`, workerID, supervisorID)
	})

	if _, err := pool.Exec(ctx, `
		INSERT INTO project_workers (project_id, user_id, role, confirmation_status)
		VALUES ($1, $2, 'worker', 'confirmed'), ($1, $3, 'supervisor', 'confirmed')
	`, projectID, workerID, supervisorID); err != nil {
		t.Fatalf("insert project workers: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(ctx, `DELETE FROM project_workers WHERE project_id = $1`, projectID)
	})

	repo := repositories.NewNotificationRepository(pool)

	contains := func(items []repositories.MissingReportCandidate, userID string) bool {
		for _, item := range items {
			if item.UserID == userID && item.ProjectID == projectID {
				return true
			}
		}
		return false
	}

	weekly, err := repo.ListWorkersMissingWeeklyReport(ctx)
	if err != nil {
		t.Fatalf("list missing weekly: %v", err)
	}
	if !contains(weekly, workerID) {
		t.Fatal("expected worker without weekly report in reminder candidates")
	}

	var weekStart time.Time
	if err := pool.QueryRow(ctx, `SELECT date_trunc('week', timezone('UTC', NOW()))::date`).Scan(&weekStart); err != nil {
		t.Fatalf("local week start: %v", err)
	}
	weekEnd := weekStart.AddDate(0, 0, 6)
	if _, err := pool.Exec(ctx, `
		INSERT INTO reports_worker (project_id, worker_id, week_start, week_end, status)
		VALUES ($1, $2, $3, $4, 'review')
	`, projectID, workerID, weekStart, weekEnd); err != nil {
		t.Fatalf("insert weekly report: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(ctx, `DELETE FROM reports_worker WHERE project_id = $1 AND worker_id = $2`, projectID, workerID)
	})

	weekly, err = repo.ListWorkersMissingWeeklyReport(ctx)
	if err != nil {
		t.Fatalf("list missing weekly after report: %v", err)
	}
	if contains(weekly, workerID) {
		t.Fatal("worker with weekly report must not be reminded")
	}

	daily, err := repo.ListSupervisorsMissingDailyReport(ctx)
	if err != nil {
		t.Fatalf("list missing daily: %v", err)
	}
	if !contains(daily, supervisorID) {
		t.Fatal("expected supervisor without daily report in reminder candidates")
	}

	var utcToday time.Time
	if err := pool.QueryRow(ctx, `SELECT timezone('UTC', NOW())::date`).Scan(&utcToday); err != nil {
		t.Fatalf("utc today: %v", err)
	}
	if _, err := pool.Exec(ctx, `
		INSERT INTO reports_supervisor (project_id, supervisor_id, report_date, status)
		VALUES ($1, $2, $3, 'review')
	`, projectID, supervisorID, utcToday); err != nil {
		t.Fatalf("insert daily report: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(ctx, `DELETE FROM reports_supervisor WHERE project_id = $1 AND supervisor_id = $2`, projectID, supervisorID)
	})

	daily, err = repo.ListSupervisorsMissingDailyReport(ctx)
	if err != nil {
		t.Fatalf("list missing daily after report: %v", err)
	}
	if contains(daily, supervisorID) {
		t.Fatal("supervisor with today's report must not be reminded")
	}

	var kirToday time.Time
	if err := pool.QueryRow(ctx, `SELECT timezone('Pacific/Kiritimati', NOW())::date`).Scan(&kirToday); err != nil {
		t.Fatalf("kiritimati today: %v", err)
	}
	if kirToday.Equal(utcToday) {
		t.Log("UTC and Pacific/Kiritimati share the same date; skipping timezone boundary assertion")
		return
	}

	if _, err := pool.Exec(ctx, `UPDATE users SET timezone = 'Pacific/Kiritimati' WHERE id = $1`, supervisorID); err != nil {
		t.Fatalf("set supervisor timezone: %v", err)
	}

	daily, err = repo.ListSupervisorsMissingDailyReport(ctx)
	if err != nil {
		t.Fatalf("list missing daily after timezone change: %v", err)
	}
	if !contains(daily, supervisorID) {
		t.Fatal("expected supervisor to be reminded when existing report is for a different local date")
	}

	if _, err := pool.Exec(ctx, `
		INSERT INTO reports_supervisor (project_id, supervisor_id, report_date, status)
		VALUES ($1, $2, $3, 'review')
	`, projectID, supervisorID, kirToday); err != nil {
		t.Fatalf("insert local-today report: %v", err)
	}

	daily, err = repo.ListSupervisorsMissingDailyReport(ctx)
	if err != nil {
		t.Fatalf("list missing daily after local report: %v", err)
	}
	if contains(daily, supervisorID) {
		t.Fatal("supervisor with local-today report must not be reminded")
	}
}
