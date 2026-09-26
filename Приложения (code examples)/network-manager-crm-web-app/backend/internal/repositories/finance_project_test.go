package repositories_test

import (
	"context"
	"os"
	"testing"

	"github.com/joho/godotenv"
	"github.com/radar-crm/backend/internal/database"
	"github.com/radar-crm/backend/internal/repositories"
)

func TestProjectFinanceDetailAggregates(t *testing.T) {
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

	var projectID string
	err = pool.QueryRow(ctx, `
		SELECT id FROM projects WHERE deleted_at IS NULL LIMIT 1`,
	).Scan(&projectID)
	if err != nil {
		t.Skip("no projects in seed data")
	}

	resp, err := repo.ProjectByID(ctx, projectID)
	if err != nil {
		t.Fatalf("project finance: %v", err)
	}
	if resp.Budget == "" {
		t.Fatal("expected budget")
	}
	if resp.PendingReviewAmount == "" {
		t.Fatal("expected pendingReviewAmount")
	}
	if resp.Workers == nil {
		t.Fatal("expected workers slice")
	}
	if resp.Categories == nil {
		t.Fatal("expected categories slice")
	}
	if resp.Losses == nil {
		t.Fatal("expected losses slice")
	}
	if resp.TotalLossAmount == "" {
		t.Fatal("expected totalLossAmount")
	}
}
