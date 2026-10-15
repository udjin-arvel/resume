package auth_test

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/radar-crm/backend/internal/auth"
	"github.com/radar-crm/backend/internal/models"
)

func TestGenerateAndParseToken(t *testing.T) {
	user := &models.User{
		ID:   "550e8400-e29b-41d4-a716-446655440000",
		Role: models.UserRoleManager,
	}

	secret := "test-secret"
	token, err := auth.GenerateToken(user, secret)
	if err != nil {
		t.Fatalf("generate token: %v", err)
	}

	claims, err := auth.ParseToken(token, secret)
	if err != nil {
		t.Fatalf("parse token: %v", err)
	}
	if claims.UserID != user.ID {
		t.Fatalf("expected user id %s, got %s", user.ID, claims.UserID)
	}
	if claims.Role != string(user.Role) {
		t.Fatalf("expected role %s, got %s", user.Role, claims.Role)
	}
}

func TestParseTokenInvalidSecret(t *testing.T) {
	user := &models.User{ID: "550e8400-e29b-41d4-a716-446655440000", Role: models.UserRoleWorker}
	token, err := auth.GenerateToken(user, "secret-a")
	if err != nil {
		t.Fatalf("generate token: %v", err)
	}
	if _, err := auth.ParseToken(token, "secret-b"); err == nil {
		t.Fatal("expected error for wrong secret")
	}
}

func TestParseTokenExpired(t *testing.T) {
	claims := auth.Claims{
		UserID: "550e8400-e29b-41d4-a716-446655440000",
		Role:   "worker",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte("test-secret"))
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	if _, err := auth.ParseToken(signed, "test-secret"); err == nil {
		t.Fatal("expected error for expired token")
	}
}
