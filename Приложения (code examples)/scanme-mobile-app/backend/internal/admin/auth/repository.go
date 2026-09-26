package adminauth

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminUser struct {
	ID           uuid.UUID
	Email        string
	PasswordHash string
	Role         string
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return Repository{db: db}
}

func (r Repository) FindByEmail(ctx context.Context, email string) (AdminUser, error) {
	var user AdminUser
	err := r.db.QueryRow(ctx, `
		SELECT id, email, password_hash, role
		FROM admin_users
		WHERE email = $1
	`, email).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Role)
	return user, err
}

func (r Repository) UpsertInitialAdmin(ctx context.Context, email string, passwordHash string) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO admin_users (id, email, password_hash, role)
		VALUES ($1, $2, $3, 'admin')
		ON CONFLICT (email) DO NOTHING
	`, uuid.New(), email, passwordHash)
	return err
}

func (r Repository) MarkLastLogin(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `
		UPDATE admin_users
		SET last_login_at = $2, updated_at = $2
		WHERE id = $1
	`, id, time.Now().UTC())
	return err
}

func IsNotFound(err error) bool {
	return err == pgx.ErrNoRows
}
