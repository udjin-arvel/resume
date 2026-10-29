package auth

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type User struct {
	ID       uuid.UUID
	DeviceID string
	Email    *string
}

type RefreshTokenRecord struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	ExpiresAt time.Time
	RevokedAt *time.Time
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return Repository{db: db}
}

func (r Repository) UpsertDeviceUser(ctx context.Context, deviceID string) (User, error) {
	var user User
	err := r.db.QueryRow(ctx, `
		INSERT INTO users (id, device_id)
		VALUES ($1, $2)
		ON CONFLICT (device_id) DO UPDATE SET updated_at = now()
		RETURNING id, device_id, email
	`, uuid.New(), deviceID).Scan(&user.ID, &user.DeviceID, &user.Email)
	return user, err
}

func (r Repository) StoreRefreshToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
		VALUES ($1, $2, $3, $4)
	`, uuid.New(), userID, tokenHash, expiresAt)
	return err
}

func (r Repository) FindActiveRefreshToken(ctx context.Context, tokenHash string) (RefreshTokenRecord, error) {
	var record RefreshTokenRecord
	err := r.db.QueryRow(ctx, `
		SELECT id, user_id, expires_at, revoked_at
		FROM refresh_tokens
		WHERE token_hash = $1
	`, tokenHash).Scan(&record.ID, &record.UserID, &record.ExpiresAt, &record.RevokedAt)
	if err != nil {
		return RefreshTokenRecord{}, err
	}
	if record.RevokedAt != nil || time.Now().UTC().After(record.ExpiresAt) {
		return RefreshTokenRecord{}, pgx.ErrNoRows
	}
	return record, nil
}

func (r Repository) RevokeRefreshToken(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `
		UPDATE refresh_tokens
		SET revoked_at = now()
		WHERE id = $1 AND revoked_at IS NULL
	`, id)
	return err
}
