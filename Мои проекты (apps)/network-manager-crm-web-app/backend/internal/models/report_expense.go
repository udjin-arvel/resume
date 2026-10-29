package models

import (
	"time"

	"github.com/radar-crm/backend/internal/models/dto"
)

type ReportExpense struct {
	ID               string
	ReportID         string
	ExpenseType      string
	Amount           string
	Comment          string
	DocumentID       *string
	DocumentFilename *string
	CreatedAt        time.Time
}

func (e *ReportExpense) ToResponse() dto.ReportExpenseResponse {
	return dto.ReportExpenseResponse{
		ID:               e.ID,
		ExpenseType:      e.ExpenseType,
		Amount:           e.Amount,
		Comment:          e.Comment,
		DocumentID:       e.DocumentID,
		DocumentFilename: e.DocumentFilename,
	}
}
