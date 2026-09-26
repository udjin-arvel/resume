package repositories_test

import (
	"context"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/database"
	"github.com/radar-crm/backend/internal/repositories"
)

func connectPool(t *testing.T) (*pgxpool.Pool, context.Context) {
	t.Helper()
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
	return pool, ctx
}

func TestRejectPendingParticipation(t *testing.T) {
	pool, ctx := connectPool(t)
	repo := repositories.NewProjectWorkerRepository(pool)

	var projectID, userID string
	err := pool.QueryRow(ctx, `
		SELECT project_id, user_id
		FROM project_workers
		WHERE confirmation_status = 'pending'
		LIMIT 1`,
	).Scan(&projectID, &userID)
	if err != nil {
		t.Skip("no pending project_workers row in seed data")
	}

	if err := repo.Reject(ctx, projectID, userID); err != nil {
		t.Fatalf("reject: %v", err)
	}

	assigned, err := repo.IsAssigned(ctx, projectID, userID)
	if err != nil {
		t.Fatal(err)
	}
	if assigned {
		t.Fatal("rejected user should not be actively assigned")
	}

	rows, err := repo.ListProjectsByUser(ctx, userID, "", "")
	if err != nil {
		t.Fatal(err)
	}
	for _, row := range rows {
		if row.ProjectID == projectID {
			t.Fatal("rejected project should be excluded from /mine list")
		}
	}

	if err := repo.Reject(ctx, projectID, userID); err != apperrors.ErrNotFound {
		t.Fatalf("second reject should return not found, got %v", err)
	}
}

func TestRejectConfirmedReturnsNotFound(t *testing.T) {
	pool, ctx := connectPool(t)
	repo := repositories.NewProjectWorkerRepository(pool)

	var projectID, userID string
	err := pool.QueryRow(ctx, `
		SELECT project_id, user_id
		FROM project_workers
		WHERE confirmation_status = 'confirmed'
		LIMIT 1`,
	).Scan(&projectID, &userID)
	if err != nil {
		t.Skip("no confirmed project_workers row in seed data")
	}

	if err := repo.Reject(ctx, projectID, userID); err != apperrors.ErrNotFound {
		t.Fatalf("expected not found, got %v", err)
	}
}
