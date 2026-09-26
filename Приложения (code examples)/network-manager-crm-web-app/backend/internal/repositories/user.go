package repositories

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/models/dto"
)

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

const userColumns = `id, telegram_id, role, status, first_name, last_name, phone, email, country,
	password_hash, position, specialization, hourly_rate, language, timezone,
	internal_comment, telegram_username, block_reason, blocked_at, block_project_id,
	application_corrections_needed, application_feedback,
	created_at, updated_at, deleted_at`

func scanApplicationFeedback(raw []byte) (dto.ApplicationFeedback, error) {
	if len(raw) == 0 {
		return dto.ApplicationFeedback{}, nil
	}
	var fb dto.ApplicationFeedback
	if err := json.Unmarshal(raw, &fb); err != nil {
		return dto.ApplicationFeedback{}, fmt.Errorf("unmarshal application feedback: %w", err)
	}
	return fb, nil
}

func scanUser(row pgx.Row) (*models.User, error) {
	var u models.User
	var feedbackRaw []byte
	err := row.Scan(
		&u.ID, &u.TelegramID, &u.Role, &u.Status, &u.FirstName, &u.LastName, &u.Phone, &u.Email, &u.Country,
		&u.PasswordHash, &u.Position, &u.Specialization, &u.HourlyRate, &u.Language, &u.Timezone,
		&u.InternalComment, &u.TelegramUsername, &u.BlockReason, &u.BlockedAt, &u.BlockProjectID,
		&u.ApplicationCorrectionsNeeded, &feedbackRaw,
		&u.CreatedAt, &u.UpdatedAt, &u.DeletedAt,
	)
	if err != nil {
		return nil, err
	}
	u.ApplicationFeedback, err = scanApplicationFeedback(feedbackRaw)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id string) (*models.User, error) {
	query := `SELECT ` + userColumns + ` FROM users WHERE id = $1 AND deleted_at IS NULL`
	u, err := scanUser(r.pool.QueryRow(ctx, query, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find user by id: %w", err)
	}
	return u, nil
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `SELECT ` + userColumns + ` FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL`
	u, err := scanUser(r.pool.QueryRow(ctx, query, strings.TrimSpace(email)))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find user by email: %w", err)
	}
	return u, nil
}

func (r *UserRepository) FindByTelegramID(ctx context.Context, telegramID int64) (*models.User, error) {
	query := `SELECT ` + userColumns + ` FROM users WHERE telegram_id = $1 AND deleted_at IS NULL`
	u, err := scanUser(r.pool.QueryRow(ctx, query, telegramID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find user by telegram id: %w", err)
	}
	return u, nil
}

func (r *UserRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL)`,
		strings.TrimSpace(email),
	).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check email exists: %w", err)
	}
	return exists, nil
}

func (r *UserRepository) Create(ctx context.Context, u *models.User) error {
	hourlyRate := u.HourlyRate
	if hourlyRate == "" {
		hourlyRate = "0"
	}

	timezone := strings.TrimSpace(u.Timezone)
	if timezone == "" {
		timezone = "UTC"
	}

	query := `
		INSERT INTO users (
			telegram_id, role, status, first_name, last_name, phone, email, country,
			password_hash, position, specialization, hourly_rate, language, timezone
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING id, created_at, updated_at`

	err := r.pool.QueryRow(ctx, query,
		u.TelegramID, u.Role, u.Status, u.FirstName, u.LastName, u.Phone, u.Email, u.Country,
		u.PasswordHash, u.Position, u.Specialization, hourlyRate, u.Language, timezone,
	).Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return fmt.Errorf("create user: %w", err)
	}
	return nil
}

func (r *UserRepository) Update(ctx context.Context, u *models.User) error {
	query := `
		UPDATE users SET
			telegram_id = $2, role = $3, status = $4, first_name = $5, last_name = $6,
			phone = $7, email = $8, country = $9, password_hash = $10, position = $11,
			specialization = $12, hourly_rate = $13, language = $14, timezone = $15,
			internal_comment = $16, telegram_username = $17,
			block_reason = $18, blocked_at = $19, block_project_id = $20,
			application_corrections_needed = $21, application_feedback = $22,
			updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING updated_at`

	hourlyRate := u.HourlyRate
	if hourlyRate == "" {
		hourlyRate = "0"
	}
	timezone := strings.TrimSpace(u.Timezone)
	if timezone == "" {
		timezone = "UTC"
	}

	feedbackRaw, err := json.Marshal(u.ApplicationFeedback)
	if err != nil {
		return fmt.Errorf("marshal application feedback: %w", err)
	}

	err = r.pool.QueryRow(ctx, query,
		u.ID, u.TelegramID, u.Role, u.Status, u.FirstName, u.LastName,
		u.Phone, u.Email, u.Country, u.PasswordHash, u.Position, u.Specialization, hourlyRate, u.Language, timezone,
		u.InternalComment, u.TelegramUsername,
		u.BlockReason, u.BlockedAt, u.BlockProjectID,
		u.ApplicationCorrectionsNeeded, feedbackRaw,
	).Scan(&u.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return apperrors.ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("update user: %w", err)
	}
	return nil
}

func (r *UserRepository) SetApplicationReview(
	ctx context.Context,
	id string,
	status models.UserStatus,
	feedback dto.ApplicationFeedback,
	correctionsNeeded bool,
) error {
	feedbackRaw, err := json.Marshal(feedback)
	if err != nil {
		return fmt.Errorf("marshal application feedback: %w", err)
	}
	tag, err := r.pool.Exec(ctx, `
		UPDATE users SET
			status = $2,
			application_feedback = $3,
			application_corrections_needed = $4,
			updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL`,
		id, status, feedbackRaw, correctionsNeeded,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *UserRepository) ClearApplicationReview(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE users SET
			application_feedback = '{}'::jsonb,
			application_corrections_needed = false,
			updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *UserRepository) ResubmitApplication(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE users SET
			status = 'pending',
			application_feedback = '{}'::jsonb,
			application_corrections_needed = false,
			updated_at = NOW()
		WHERE id = $1 AND status = 'rejected' AND deleted_at IS NULL`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *UserRepository) ListWorkers(ctx context.Context, q dto.WorkerListQuery) ([]models.User, int64, error) {
	page, pageSize := normalizePagination(q.Page, q.PageSize)
	offset := (page - 1) * pageSize

	where := `WHERE deleted_at IS NULL AND role IN ('worker', 'supervisor')`
	args := []any{}
	argN := 1

	if q.Status != "" {
		where += fmt.Sprintf(` AND status = $%d`, argN)
		args = append(args, q.Status)
		argN++
	}
	if q.Specialization != "" {
		pattern := "%" + q.Specialization + "%"
		where += fmt.Sprintf(` AND (position ILIKE $%d OR specialization ILIKE $%d)`, argN, argN)
		args = append(args, pattern)
		argN++
	}
	if q.ProjectID != "" {
		where += fmt.Sprintf(` AND id IN (SELECT user_id FROM project_workers WHERE project_id = $%d)`, argN)
		args = append(args, q.ProjectID)
		argN++
	}
	if q.ClientID != "" {
		where += fmt.Sprintf(` AND id IN (
			SELECT pw.user_id FROM project_workers pw
			JOIN projects p ON p.id = pw.project_id
			WHERE p.client_id = $%d AND p.deleted_at IS NULL)`, argN)
		args = append(args, q.ClientID)
		argN++
	}

	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	listQuery := `SELECT ` + userColumns + ` FROM users ` + where +
		fmt.Sprintf(` ORDER BY last_name, first_name LIMIT $%d OFFSET $%d`, argN, argN+1)
	listArgs := append(args, pageSize, offset)

	rows, err := r.pool.Query(ctx, listQuery, listArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, *u)
	}
	return users, total, rows.Err()
}

func (r *UserRepository) ListActiveWorkers(ctx context.Context) ([]models.User, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT `+userColumns+`
		FROM users
		WHERE deleted_at IS NULL AND role IN ('worker', 'supervisor') AND status = 'active'
		ORDER BY last_name, first_name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, err
		}
		users = append(users, *u)
	}
	return users, rows.Err()
}

func (r *UserRepository) UpdateStatus(ctx context.Context, id string, status models.UserStatus) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE users SET status = $2, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, id, status)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *UserRepository) BlockUser(
	ctx context.Context, id, reason string, projectID *string, blockedAt time.Time,
) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE users SET
			status = 'blocked',
			block_reason = $2,
			blocked_at = $3,
			block_project_id = $4,
			updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL`,
		id, reason, blockedAt, projectID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *UserRepository) UnblockUser(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE users SET
			status = 'active',
			block_reason = '',
			blocked_at = NULL,
			block_project_id = NULL,
			updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *UserRepository) GetProjectName(ctx context.Context, projectID string) (string, error) {
	var name string
	err := r.pool.QueryRow(ctx,
		`SELECT name FROM projects WHERE id = $1 AND deleted_at IS NULL`, projectID,
	).Scan(&name)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", apperrors.ErrNotFound
	}
	if err != nil {
		return "", fmt.Errorf("get project name: %w", err)
	}
	return name, nil
}

func (r *UserRepository) WorkerResourceStats(ctx context.Context) ([]dto.WorkerResourceStat, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT
			COALESCE(NULLIF(position, ''), 'unspecified') AS specialization,
			COUNT(*)::int AS total,
			COUNT(*) FILTER (WHERE status = 'active' AND id NOT IN (
				SELECT pw.user_id FROM project_workers pw
				JOIN projects p ON p.id = pw.project_id
				WHERE p.deleted_at IS NULL AND p.status = 'active'
			))::int AS available,
			COUNT(*) FILTER (WHERE id IN (
				SELECT pw.user_id FROM project_workers pw
				JOIN projects p ON p.id = pw.project_id
				WHERE p.deleted_at IS NULL AND p.status = 'active'
			))::int AS on_project
		FROM users
		WHERE deleted_at IS NULL AND role IN ('worker', 'supervisor')
		GROUP BY COALESCE(NULLIF(position, ''), 'unspecified')
		ORDER BY specialization`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []dto.WorkerResourceStat
	for rows.Next() {
		var s dto.WorkerResourceStat
		if err := rows.Scan(&s.Specialization, &s.Total, &s.Available, &s.OnProject); err != nil {
			return nil, err
		}
		stats = append(stats, s)
	}
	return stats, rows.Err()
}

func (r *UserRepository) ListActiveManagerIDs(ctx context.Context) ([]string, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id FROM users
		WHERE role = 'manager' AND status = 'active' AND deleted_at IS NULL`)
	if err != nil {
		return nil, fmt.Errorf("list active managers: %w", err)
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}
