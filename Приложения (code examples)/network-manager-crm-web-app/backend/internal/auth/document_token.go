package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const DocumentAccessTokenTTL = 15 * time.Minute

type DocumentAccessClaims struct {
	DocumentID string `json:"doc"`
	UserID     string `json:"sub"`
	Role       string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateDocumentAccessToken(docID, userID, role, secret string) (string, time.Time, error) {
	now := time.Now()
	expiresAt := now.Add(DocumentAccessTokenTTL)
	claims := DocumentAccessClaims{
		DocumentID: docID,
		UserID:     userID,
		Role:       role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", time.Time{}, fmt.Errorf("sign document access token: %w", err)
	}
	return signed, expiresAt, nil
}

func ParseDocumentAccessToken(tokenString, secret string) (*DocumentAccessClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &DocumentAccessClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("parse document access token: %w", err)
	}

	claims, ok := token.Claims.(*DocumentAccessClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid document access token")
	}
	if claims.DocumentID == "" {
		return nil, fmt.Errorf("document access token missing document id")
	}
	return claims, nil
}
