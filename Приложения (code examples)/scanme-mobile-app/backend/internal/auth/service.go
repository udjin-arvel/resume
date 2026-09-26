package auth

import (
	"context"
	"errors"
	"time"
)

var ErrInvalidRefreshToken = errors.New("invalid refresh token")

type Service struct {
	repository      Repository
	tokens          TokenService
	accessTokenTTL  time.Duration
	refreshTokenTTL time.Duration
}

type TokenPair struct {
	AccessToken  string    `json:"accessToken"`
	RefreshToken string    `json:"refreshToken"`
	ExpiresAt    time.Time `json:"expiresAt"`
}

func NewService(repository Repository, tokens TokenService, accessTokenTTL time.Duration, refreshTokenTTL time.Duration) Service {
	return Service{
		repository:      repository,
		tokens:          tokens,
		accessTokenTTL:  accessTokenTTL,
		refreshTokenTTL: refreshTokenTTL,
	}
}

func (s Service) AuthenticateDevice(ctx context.Context, deviceID string) (TokenPair, error) {
	user, err := s.repository.UpsertDeviceUser(ctx, deviceID)
	if err != nil {
		return TokenPair{}, err
	}

	return s.issuePair(ctx, user.ID.String())
}

func (s Service) Refresh(ctx context.Context, refreshToken string) (TokenPair, error) {
	tokenHash := HashToken(refreshToken)
	record, err := s.repository.FindActiveRefreshToken(ctx, tokenHash)
	if err != nil {
		return TokenPair{}, ErrInvalidRefreshToken
	}

	if err := s.repository.RevokeRefreshToken(ctx, record.ID); err != nil {
		return TokenPair{}, err
	}

	return s.issuePair(ctx, record.UserID.String())
}

func (s Service) issuePair(ctx context.Context, userID string) (TokenPair, error) {
	expiresAt := time.Now().UTC().Add(s.accessTokenTTL)

	accessToken, err := s.tokens.IssueAccessToken(userID, "user", s.accessTokenTTL)
	if err != nil {
		return TokenPair{}, err
	}

	refreshToken, refreshTokenHash, err := NewRefreshToken()
	if err != nil {
		return TokenPair{}, err
	}

	if err := s.repository.StoreRefreshToken(ctx, mustUUID(userID), refreshTokenHash, time.Now().UTC().Add(s.refreshTokenTTL)); err != nil {
		return TokenPair{}, err
	}

	return TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt,
	}, nil
}
