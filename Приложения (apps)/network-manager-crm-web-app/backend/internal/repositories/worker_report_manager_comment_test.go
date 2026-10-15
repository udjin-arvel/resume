package repositories_test

import (
	"context"
	"os"
	"testing"

	"github.com/joho/godotenv"
	"github.com/radar-crm/backend/internal/database"
	"github.com/radar-crm/backend/internal/repositories"
)

func TestWorkerReportRejectStoresManagerComment(t *testing.T) {
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

	repo := repositories.NewWorkerReportRepository(pool)

	var reportID string
	err = pool.QueryRow(ctx, `
		SELECT id FROM reports_worker
		WHERE status = 'review'
		LIMIT 1`,
	).Scan(&reportID)
	if err != nil {
		t.Skip("no review worker report in seed data")
	}

	comment := "Добавить информацию о синих гномах"
	if err := repo.Reject(ctx, reportID, comment); err != nil {
		t.Fatalf("reject: %v", err)
	}

	report, err := repo.GetByID(ctx, reportID)
	if err != nil {
		t.Fatal(err)
	}
	if report.Status != "returned" {
		t.Fatalf("expected returned, got %s", report.Status)
	}
	if report.ManagerComment != comment {
		t.Fatalf("expected comment %q, got %q", comment, report.ManagerComment)
	}
}
