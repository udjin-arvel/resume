package services

import (
	"strings"
	"testing"

	"github.com/radar-crm/backend/internal/models"
)

func Test_buildEstimatePDF_cyrillic(t *testing.T) {
	estimate := &models.Estimate{
		ID:            "test-id",
		Name:          "Тестовая смета",
		CompanyName:   "ООО Радар",
		ContactPerson: "Иван Иванов",
		Phone:         "+7 900 000-00-00",
		Email:         "test@example.com",
		City:          "Москва",
		Country:       "Россия",
		Status:        "sent",
		TotalAmount:   "1000.00",
	}
	blocks := []models.EstimateBlock{
		{BlockType: "service", Title: "Монтаж", Amount: "1000.00"},
	}

	data, err := buildEstimatePDF(estimate, blocks)
	if err != nil {
		t.Fatalf("buildEstimatePDF: %v", err)
	}
	if len(data) < 1000 {
		t.Fatalf("pdf too small: %d bytes", len(data))
	}
	// Latin-1 mojibake for UTF-8 Cyrillic should not appear in the PDF stream.
	if strings.Contains(string(data), "Ð¢Ð") || strings.Contains(string(data), "Ñ") {
		t.Fatal("pdf contains mojibake instead of embedded UTF-8 text")
	}
}
