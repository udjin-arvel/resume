package adminauth

import (
	"context"
	"errors"
	"strings"
	"time"

	"scanme/backend/internal/auth"
)

var ErrInvalidCredentials = errors.New("invalid admin credentials")

type Service struct {
	repository Repository
	tokens     auth.TokenService
	ttl        time.Duration
	pepper     string
}

type LoginResult struct {
	AccessToken string    `json:"accessToken"`
	ExpiresAt   time.Time `json:"expiresAt"`
	Role        string    `json:"role"`
}

func NewService(repository Repository, tokens auth.TokenService, ttl time.Duration, pepper string) Service {
	return Service{
		repository: repository,
		tokens:     tokens,
		ttl:        ttl,
		pepper:     pepper,
	}
}

func (s Service) Login(ctx context.Context, email string, password string) (LoginResult, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || password == "" {
		return LoginResult{}, ErrInvalidCredentials
	}

	admin, err := s.repository.FindByEmail(ctx, email)
	if err != nil {
		if IsNotFound(err) {
			return LoginResult{}, ErrInvalidCredentials
		}
		return LoginResult{}, err
	}

	ok, err := VerifyPassword(password, s.pepper, admin.PasswordHash)
	if err != nil || !ok {
		return LoginResult{}, ErrInvalidCredentials
	}

	token, err := s.tokens.IssueAccessToken(admin.ID.String(), admin.Role, s.ttl)
	if err != nil {
		return LoginResult{}, err
	}

	if err := s.repository.MarkLastLogin(ctx, admin.ID); err != nil {
		return LoginResult{}, err
	}

	return LoginResult{
		AccessToken: token,
		ExpiresAt:   time.Now().UTC().Add(s.ttl),
		Role:        admin.Role,
	}, nil
}

func (s Service) EnsureInitialAdmin(ctx context.Context, email string, password string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || password == "" {
		return nil
	}

	hash, err := HashPassword(password, s.pepper)
	if err != nil {
		return err
	}

	return s.repository.UpsertInitialAdmin(ctx, email, hash)
}
