package services

import (
	"testing"

	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/models/dto"
)

func TestCalcReportTotalHours(t *testing.T) {
	req := dto.CreateWorkerReportRequest{
		HoursMon: "8",
		HoursTue: "7.5",
		HoursWed: "0",
		HoursThu: "8",
		HoursFri: "8",
		HoursSat: "4",
		HoursSun: "0",
	}
	got := calcReportTotalHours(req)
	if got != "35.50" {
		t.Fatalf("expected 35.50, got %s", got)
	}
}

func TestCalcWorkerReportAmount(t *testing.T) {
	expenses := []models.ReportExpense{
		{Amount: "100"},
		{Amount: "50.25"},
	}
	got := calcWorkerReportAmount("40", "25", expenses)
	if got != "1150.25" {
		t.Fatalf("expected 1150.25, got %s", got)
	}
}

func TestParseWeekDates(t *testing.T) {
	start, end, err := parseWeekDates("2026-06-09", "2026-06-15")
	if err != nil {
		t.Fatal(err)
	}
	if start.Format("2006-01-02") != "2026-06-09" {
		t.Fatalf("unexpected start: %s", start)
	}
	if end.Format("2006-01-02") != "2026-06-15" {
		t.Fatalf("unexpected end: %s", end)
	}

	_, _, err = parseWeekDates("2026-06-15", "2026-06-09")
	if err == nil {
		t.Fatal("expected error when weekEnd before weekStart")
	}
}
