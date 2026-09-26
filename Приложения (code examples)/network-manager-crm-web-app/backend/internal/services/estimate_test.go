package services_test

import (
	"testing"

	"github.com/radar-crm/backend/internal/services"
)

func TestCalcBlockAmount(t *testing.T) {
	tests := []struct {
		blockType string
		quantity  string
		unitPrice string
		hours     string
		rate      string
		amount    string
		want      string
	}{
		{"service", "2", "100", "", "", "", "200.00"},
		{"resource", "", "", "8", "50", "", "400.00"},
		{"expense", "", "", "", "", "150.5", "150.50"},
	}
	for _, tt := range tests {
		got := services.CalcBlockAmount(tt.blockType, tt.quantity, tt.unitPrice, tt.hours, tt.rate, tt.amount)
		if got != tt.want {
			t.Fatalf("calcBlockAmount(%s) = %s, want %s", tt.blockType, got, tt.want)
		}
	}
}

func TestIsValidStatusTransition(t *testing.T) {
	if !services.IsValidStatusTransition("draft", "sent") {
		t.Fatal("draft -> sent should be valid")
	}
	if services.IsValidStatusTransition("draft", "approved") {
		t.Fatal("draft -> approved should be invalid")
	}
	if !services.IsValidStatusTransition("sent", "approved") {
		t.Fatal("sent -> approved should be valid")
	}
}
