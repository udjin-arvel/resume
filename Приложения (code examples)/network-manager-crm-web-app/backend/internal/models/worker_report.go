package models

import (
	"time"

	"github.com/radar-crm/backend/internal/models/dto"
)

type WorkerReport struct {
	ID          string
	ProjectID   string
	ProjectName string
	WorkerID    string
	WorkerName  string
	WeekStart   time.Time
	WeekEnd     time.Time
	HoursMon    string
	HoursTue    string
	HoursWed    string
	HoursThu    string
	HoursFri    string
	HoursSat    string
	HoursSun    string
	Description     string
	Status          string
	TotalHours      string
	TotalAmount     string
	ExpensesTotal   string
	ManagerComment  string
	HourlyRate      string
	CreatedAt       time.Time
	UpdatedAt       time.Time
	Expenses        []ReportExpense
}

func (r *WorkerReport) ToResponse() dto.WorkerReportResponse {
	resp := dto.WorkerReportResponse{
		ID:          r.ID,
		ProjectID:   r.ProjectID,
		ProjectName: r.ProjectName,
		WorkerID:    r.WorkerID,
		WorkerName:  r.WorkerName,
		WeekStart:   r.WeekStart.Format("2006-01-02"),
		WeekEnd:     r.WeekEnd.Format("2006-01-02"),
		HoursMon:    r.HoursMon,
		HoursTue:    r.HoursTue,
		HoursWed:    r.HoursWed,
		HoursThu:    r.HoursThu,
		HoursFri:    r.HoursFri,
		HoursSat:    r.HoursSat,
		HoursSun:    r.HoursSun,
		Description:     r.Description,
		Status:        r.Status,
		TotalHours:     r.TotalHours,
		TotalAmount:    r.TotalAmount,
		ExpensesTotal:  r.ExpensesTotal,
		ManagerComment: r.ManagerComment,
		HourlyRate:     r.HourlyRate,
	}
	if r.Status != "draft" {
		resp.SubmittedAt = r.UpdatedAt.UTC().Format(time.RFC3339)
	}
	if len(r.Expenses) > 0 {
		resp.Expenses = make([]dto.ReportExpenseResponse, 0, len(r.Expenses))
		for _, e := range r.Expenses {
			resp.Expenses = append(resp.Expenses, e.ToResponse())
		}
	}
	return resp
}
