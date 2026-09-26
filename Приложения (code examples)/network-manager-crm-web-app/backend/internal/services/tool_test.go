package services_test

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/joho/godotenv"
	"github.com/radar-crm/backend/internal/database"
	"github.com/radar-crm/backend/internal/models/dto"
	"github.com/radar-crm/backend/internal/repositories"
	"github.com/radar-crm/backend/internal/services"
)

func setupToolService(t *testing.T) (*services.ToolService, context.Context, string) {
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

	toolRepo := repositories.NewToolRepository(pool)
	assignRepo := repositories.NewToolAssignmentRepository(pool)
	calRepo := repositories.NewToolCalibrationRepository(pool)
	projectRepo := repositories.NewProjectRepository(pool)
	userRepo := repositories.NewUserRepository(pool)
	activityRepo := repositories.NewActivityRepository(pool)
	activitySvc := services.NewActivityService(activityRepo)
	svc := services.NewToolService(toolRepo, assignRepo, calRepo, projectRepo, userRepo, nil, activitySvc)

	var projectID string
	err = pool.QueryRow(ctx, `SELECT id FROM projects WHERE status = 'active' AND deleted_at IS NULL LIMIT 1`).Scan(&projectID)
	if err != nil {
		t.Skip("no active project")
	}
	return svc, ctx, projectID
}

func TestToolServiceAssignReturnUsageLimit(t *testing.T) {
	svc, ctx, projectID := setupToolService(t)

	created, err := svc.Create(ctx, dto.CreateToolRequest{
		Name:        "svc-tool-usage",
		ControlType: "usage_limit",
		UsageLimit:  5,
	})
	if err != nil {
		t.Fatal(err)
	}

	_, err = svc.Assign(ctx, created.ID, dto.AssignToolRequest{ProjectID: projectID})
	if err != nil {
		t.Fatal(err)
	}

	detail, err := svc.Return(ctx, created.ID, dto.ReturnToolRequest{ConditionOnReturn: "ok"})
	if err != nil {
		t.Fatal(err)
	}
	if detail.Status != "available" {
		t.Fatalf("expected available, got %s", detail.Status)
	}
	if detail.UsageCount != 1 {
		t.Fatalf("expected usage 1, got %d", detail.UsageCount)
	}
}

func TestToolServiceCalibrateUpdatesDue(t *testing.T) {
	svc, ctx, _ := setupToolService(t)

	created, err := svc.Create(ctx, dto.CreateToolRequest{
		Name:        "svc-tool-cal",
		ControlType: "calibration",
	})
	if err != nil {
		t.Fatal(err)
	}

	nextDue := time.Now().Add(30 * 24 * time.Hour).Format("2006-01-02")
	detail, err := svc.Calibrate(ctx, created.ID, dto.CalibrateToolRequest{
		NextDueAt: nextDue,
		Notes:     "annual check",
	}, "")
	if err != nil {
		t.Fatal(err)
	}
	if detail.CalibrationDueAt == nil {
		t.Fatal("expected calibrationDueAt to be set")
	}
	if len(detail.Calibrations) == 0 {
		t.Fatal("expected calibration history")
	}
}

func TestToolServiceReportAndResolveProblem(t *testing.T) {
	svc, ctx, projectID := setupToolService(t)

	created, err := svc.Create(ctx, dto.CreateToolRequest{
		Name:        "svc-tool-problem",
		ControlType: "accounting_only",
	})
	if err != nil {
		t.Fatal(err)
	}

	if err := svc.ReportProblem(ctx, created.ID, "", dto.ReportToolProblemRequest{
		ProblemType: "malfunction",
		Comment:     "broken sensor",
	}); err != nil {
		t.Fatal(err)
	}

	detail, err := svc.GetByID(ctx, created.ID)
	if err != nil {
		t.Fatal(err)
	}
	if detail.Status != "needs_attention" {
		t.Fatalf("expected needs_attention, got %s", detail.Status)
	}
	if detail.ProblemType != "malfunction" {
		t.Fatalf("expected problem type malfunction, got %s", detail.ProblemType)
	}

	_, err = svc.Assign(ctx, created.ID, dto.AssignToolRequest{ProjectID: projectID})
	if err == nil {
		t.Fatal("expected assign to fail for needs_attention tool")
	}

	resolved, err := svc.ResolveProblem(ctx, created.ID, "")
	if err != nil {
		t.Fatal(err)
	}
	if resolved.Status != "available" {
		t.Fatalf("expected available after resolve, got %s", resolved.Status)
	}
}

func TestToolServiceResolveProblemKeepsAssignedStatus(t *testing.T) {
	svc, ctx, projectID := setupToolService(t)

	created, err := svc.Create(ctx, dto.CreateToolRequest{
		Name:        "svc-tool-problem-assigned",
		ControlType: "accounting_only",
	})
	if err != nil {
		t.Fatal(err)
	}

	_, err = svc.Assign(ctx, created.ID, dto.AssignToolRequest{ProjectID: projectID})
	if err != nil {
		t.Fatal(err)
	}

	if err := svc.ReportProblem(ctx, created.ID, "", dto.ReportToolProblemRequest{
		ProblemType: "other",
		Comment:     "issue on site",
	}); err != nil {
		t.Fatal(err)
	}

	resolved, err := svc.ResolveProblem(ctx, created.ID, "")
	if err != nil {
		t.Fatal(err)
	}
	if resolved.Status != "assigned" {
		t.Fatalf("expected assigned after resolve with active assignment, got %s", resolved.Status)
	}
}

func TestDashboardCountToolsAttentionIncludesReportedProblems(t *testing.T) {
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

	toolRepo := repositories.NewToolRepository(pool)
	assignRepo := repositories.NewToolAssignmentRepository(pool)
	calRepo := repositories.NewToolCalibrationRepository(pool)
	projectRepo := repositories.NewProjectRepository(pool)
	userRepo := repositories.NewUserRepository(pool)
	activityRepo := repositories.NewActivityRepository(pool)
	dashRepo := repositories.NewDashboardRepository(pool)
	activitySvc := services.NewActivityService(activityRepo)
	svc := services.NewToolService(toolRepo, assignRepo, calRepo, projectRepo, userRepo, nil, activitySvc)
	dashSvc := services.NewDashboardService(dashRepo, activityRepo)

	before, err := dashRepo.CountToolsAttention(ctx)
	if err != nil {
		t.Fatal(err)
	}

	created, err := svc.Create(ctx, dto.CreateToolRequest{
		Name:        "dash-attention-tool",
		ControlType: "accounting_only",
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := svc.ReportProblem(ctx, created.ID, "", dto.ReportToolProblemRequest{
		ProblemType: "malfunction",
		Comment:     "test",
	}); err != nil {
		t.Fatal(err)
	}

	after, err := dashRepo.CountToolsAttention(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if after < before+1 {
		t.Fatalf("expected attention count to increase, before=%d after=%d", before, after)
	}

	items, err := dashSvc.Urgent(ctx, "ru")
	if err != nil {
		t.Fatal(err)
	}
	var toolsBlock *dto.UrgentActionResponse
	for i := range items {
		if items[i].Key == "tools_attention" {
			toolsBlock = &items[i]
			break
		}
	}
	if toolsBlock == nil {
		t.Fatal("tools_attention block missing")
	}
	if toolsBlock.Count < 1 {
		t.Fatalf("expected tools_attention count >= 1, got %d", toolsBlock.Count)
	}

	_, _ = svc.ResolveProblem(ctx, created.ID, "")
}

func TestDashboardServiceUrgentReturnsEightBlocks(t *testing.T) {
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

	dashRepo := repositories.NewDashboardRepository(pool)
	activityRepo := repositories.NewActivityRepository(pool)
	svc := services.NewDashboardService(dashRepo, activityRepo)

	items, err := svc.Urgent(ctx, "ru")
	if err != nil {
		t.Fatal(err)
	}
	if len(items) != 8 {
		t.Fatalf("expected 8 urgent blocks, got %d", len(items))
	}
	for _, item := range items {
		if item.Key == "" || item.Title == "" {
			t.Fatalf("unexpected empty key/title: %+v", item)
		}
	}
}

func TestSchedulerMarkOverdueReports(t *testing.T) {
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

	workerReportRepo := repositories.NewWorkerReportRepository(pool)
	count, err := workerReportRepo.MarkOverdue(ctx, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if count < 0 {
		t.Fatalf("unexpected count %d", count)
	}
}
