package repositories_test

import (
	"context"
	"os"
	"testing"

	"github.com/joho/godotenv"
	"github.com/radar-crm/backend/internal/database"
	"github.com/radar-crm/backend/internal/repositories"
)

func TestWorkerFinanceMineAggregatesReports(t *testing.T) {
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

	repo := repositories.NewFinanceRepository(pool)

	var workerID string
	err = pool.QueryRow(ctx, `
		SELECT rw.worker_id
		FROM reports_worker rw
		JOIN project_workers pw ON pw.project_id = rw.project_id
			AND pw.user_id = rw.worker_id
			AND pw.confirmation_status = 'confirmed'
		WHERE rw.status != 'draft'
		LIMIT 1`,
	).Scan(&workerID)
	if err != nil {
		t.Skip("no worker reports in seed data")
	}

	resp, err := repo.Mine(ctx, workerID)
	if err != nil {
		t.Fatalf("mine: %v", err)
	}
	if resp.TotalHours == "" {
		t.Fatal("expected totalHours")
	}
	if resp.Projects == nil {
		t.Fatal("expected projects slice")
	}
}
