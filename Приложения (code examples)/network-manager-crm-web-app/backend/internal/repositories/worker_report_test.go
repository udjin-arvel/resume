package repositories_test

import (
	"context"
	"os"
	"testing"

	"github.com/joho/godotenv"
	"github.com/radar-crm/backend/internal/database"
	"github.com/radar-crm/backend/internal/repositories"
)

func TestCountByProjectAndStatus(t *testing.T) {
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

	var projectID string
	err = pool.QueryRow(ctx, `SELECT id FROM projects WHERE deleted_at IS NULL LIMIT 1`).Scan(&projectID)
	if err != nil {
		t.Skip("no projects in database")
	}

	repo := repositories.NewWorkerReportRepository(pool)
	count, err := repo.CountByProjectAndStatus(ctx, projectID, "review")
	if err != nil {
		t.Fatalf("count: %v", err)
	}
	if count < 0 {
		t.Fatalf("unexpected count %d", count)
	}
}
