package services_test

import (
	"testing"

	"github.com/radar-crm/backend/internal/services"
)

func TestIsViewableMIME(t *testing.T) {
	cases := []struct {
		mime string
		want bool
	}{
		{"image/jpeg", true},
		{"image/png", true},
		{"application/pdf", true},
		{"audio/mpeg", true},
		{"audio/webm", true},
		{"application/octet-stream", false},
		{"text/plain", false},
		{"", false},
	}
	for _, tc := range cases {
		if got := services.IsViewableMIME(tc.mime); got != tc.want {
			t.Fatalf("IsViewableMIME(%q)=%v, want %v", tc.mime, got, tc.want)
		}
	}
}

func TestResolveDisposition(t *testing.T) {
	cases := []struct {
		mime, requested, want string
	}{
		{"image/jpeg", "inline", services.DispositionInline},
		{"image/jpeg", "", services.DispositionInline},
		{"application/pdf", "attachment", services.DispositionAttachment},
		{"application/octet-stream", "inline", services.DispositionAttachment},
		{"application/octet-stream", "", services.DispositionAttachment},
		{"audio/mpeg", "inline", services.DispositionInline},
	}
	for _, tc := range cases {
		got := services.ResolveDisposition(tc.mime, tc.requested)
		if got != tc.want {
			t.Fatalf("ResolveDisposition(%q, %q)=%q, want %q", tc.mime, tc.requested, got, tc.want)
		}
	}
}
