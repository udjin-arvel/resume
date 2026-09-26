package auth_test

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/radar-crm/backend/internal/auth"
)

func TestGenerateAndParseDocumentAccessToken(t *testing.T) {
	docID := "550e8400-e29b-41d4-a716-446655440001"
	userID := "550e8400-e29b-41d4-a716-446655440000"
	role := "manager"
	secret := "test-secret"

	token, expiresAt, err := auth.GenerateDocumentAccessToken(docID, userID, role, secret)
	if err != nil {
		t.Fatalf("generate: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}
	if expiresAt.Before(time.Now()) {
		t.Fatal("expected future expiry")
	}

	claims, err := auth.ParseDocumentAccessToken(token, secret)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if claims.DocumentID != docID {
		t.Fatalf("expected doc %s, got %s", docID, claims.DocumentID)
	}
	if claims.UserID != userID {
		t.Fatalf("expected user %s, got %s", userID, claims.UserID)
	}
	if claims.Role != role {
		t.Fatalf("expected role %s, got %s", role, claims.Role)
	}
}

func TestParseDocumentAccessTokenInvalidSecret(t *testing.T) {
	token, _, err := auth.GenerateDocumentAccessToken("doc-1", "user-1", "worker", "secret-a")
	if err != nil {
		t.Fatalf("generate: %v", err)
	}
	if _, err := auth.ParseDocumentAccessToken(token, "secret-b"); err == nil {
		t.Fatal("expected error for wrong secret")
	}
}

func TestParseDocumentAccessTokenExpired(t *testing.T) {
	claims := auth.DocumentAccessClaims{
		DocumentID: "doc-1",
		UserID:     "user-1",
		Role:       "worker",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte("test-secret"))
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	if _, err := auth.ParseDocumentAccessToken(signed, "test-secret"); err == nil {
		t.Fatal("expected error for expired token")
	}
}

func TestParseDocumentAccessTokenMissingDocumentID(t *testing.T) {
	claims := auth.DocumentAccessClaims{
		UserID: "user-1",
		Role:   "worker",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte("test-secret"))
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	if _, err := auth.ParseDocumentAccessToken(signed, "test-secret"); err == nil {
		t.Fatal("expected error for missing document id")
	}
}
