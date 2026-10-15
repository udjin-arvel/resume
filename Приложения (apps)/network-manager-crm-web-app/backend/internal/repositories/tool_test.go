package repositories_test

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/joho/godotenv"
	"github.com/radar-crm/backend/internal/database"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/repositories"
)

func TestMarkOverdueCalibration(t *testing.T) {
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

	repo := repositories.NewToolRepository(pool)
	past := time.Now().Add(-24 * time.Hour)
	tool := &models.Tool{
		Name:        "overdue-cal-tool",
		ControlType: "calibration",
	}
	if err := repo.Create(ctx, tool); err != nil {
		t.Fatal(err)
	}
	if err := repo.UpdateCalibrationDue(ctx, tool.ID, &past); err != nil {
		t.Fatal(err)
	}

	count, err := repo.MarkOverdueCalibration(ctx, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if count < 1 {
		t.Fatalf("expected at least 1 overdue calibration, got %d", count)
	}

	got, err := repo.GetByID(ctx, tool.ID)
	if err != nil {
		t.Fatal(err)
	}
	if got.Status != "overdue" {
		t.Fatalf("expected overdue status, got %s", got.Status)
	}
}
