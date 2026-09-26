package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type TokenService struct {
	secret []byte
}

type Claims struct {
	UserID string `json:"user_id,omitempty"`
	Role   string `json:"role,omitempty"`
	jwt.RegisteredClaims
}

func NewTokenService(secret string) TokenService {
	return TokenService{secret: []byte(secret)}
}

func (s TokenService) IssueAccessToken(subject string, role string, ttl time.Duration) (string, error) {
	now := time.Now().UTC()
	claims := Claims{
		UserID: subject,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   subject,
			Issuer:    "scanme",
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
			ID:        uuid.NewString(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.secret)
}

func (s TokenService) Parse(tokenString string) (Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing method: %s", token.Header["alg"])
		}
		return s.secret, nil
	})
	if err != nil {
		return Claims{}, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return Claims{}, jwt.ErrTokenInvalidClaims
	}

	return *claims, nil
}

func NewRefreshToken() (plain string, hash string, err error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", "", err
	}

	plain = base64.RawURLEncoding.EncodeToString(bytes)
	return plain, HashToken(plain), nil
}

func HashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}
