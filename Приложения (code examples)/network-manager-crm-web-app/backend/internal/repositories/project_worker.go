package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/models"
)

type ProjectWorkerRepository struct {
	pool *pgxpool.Pool
}

func NewProjectWorkerRepository(pool *pgxpool.Pool) *ProjectWorkerRepository {
	return &ProjectWorkerRepository{pool: pool}
}

func (r *ProjectWorkerRepository) ListByProject(ctx context.Context, projectID string) ([]models.ProjectWorker, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT pw.id, pw.project_id, pw.user_id, pw.role, pw.confirmation_status, pw.assigned_at, pw.invited_at,
			u.first_name, u.last_name, COALESCE(u.hourly_rate::text, '0'),
			COALESCE(u.specialization, ''), COALESCE(u.position, '')
		FROM project_workers pw
		JOIN users u ON u.id = pw.user_id
		WHERE pw.project_id = $1 AND u.deleted_at IS NULL
		ORDER BY pw.assigned_at ASC`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.ProjectWorker
	for rows.Next() {
		var pw models.ProjectWorker
		if err := rows.Scan(
			&pw.ID, &pw.ProjectID, &pw.UserID, &pw.Role, &pw.ConfirmationStatus, &pw.AssignedAt, &pw.InvitedAt,
			&pw.FirstName, &pw.LastName, &pw.HourlyRate, &pw.Specialization, &pw.Position,
		); err != nil {
			return nil, err
		}
		items = append(items, pw)
	}
	return items, rows.Err()
}

func (r *ProjectWorkerRepository) CountByProject(ctx context.Context, projectID string) (models.ProjectStats, error) {
	var stats models.ProjectStats
	err := r.pool.QueryRow(ctx, `
		SELECT
			COUNT(*)::int,
			COUNT(*) FILTER (WHERE confirmation_status = 'confirmed')::int
		FROM project_workers WHERE project_id = $1`, projectID,
	).Scan(&stats.Workers, &stats.Confirmed)
	return stats, err
}

func (r *ProjectWorkerRepository) CountByProjects(ctx context.Context, projectIDs []string) (map[string]models.ProjectStats, error) {
	result := make(map[string]models.ProjectStats, len(projectIDs))
	if len(projectIDs) == 0 {
		return result, nil
	}

	rows, err := r.pool.Query(ctx, `
		SELECT project_id,
			COUNT(*)::int,
			COUNT(*) FILTER (WHERE confirmation_status = 'confirmed')::int
		FROM project_workers
		WHERE project_id = ANY($1)
		GROUP BY project_id`, projectIDs)
	if err != nil {
		return nil, fmt.Errorf("count project workers: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var projectID string
		var stats models.ProjectStats
		if err := rows.Scan(&projectID, &stats.Workers, &stats.Confirmed); err != nil {
			return nil, fmt.Errorf("scan project worker stats: %w", err)
		}
		result[projectID] = stats
	}
	return result, rows.Err()
}

func (r *ProjectWorkerRepository) Assign(ctx context.Context, projectID, userID, role string) (*models.ProjectWorker, error) {
	var pw models.ProjectWorker
	err := r.pool.QueryRow(ctx, `
		INSERT INTO project_workers (project_id, user_id, role)
		VALUES ($1, $2, $3)
		RETURNING id, project_id, user_id, role, confirmation_status, assigned_at`,
		projectID, userID, role,
	).Scan(&pw.ID, &pw.ProjectID, &pw.UserID, &pw.Role, &pw.ConfirmationStatus, &pw.AssignedAt)
	if err != nil {
		return nil, fmt.Errorf("assign worker: %w", err)
	}
	return &pw, nil
}

func (r *ProjectWorkerRepository) Remove(ctx context.Context, projectID, workerID string) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM project_workers WHERE project_id = $1 AND user_id = $2`, projectID, workerID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *ProjectWorkerRepository) ChangeRole(ctx context.Context, projectID, workerID, role string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE project_workers SET role = $3 WHERE project_id = $1 AND user_id = $2`, projectID, workerID, role)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *ProjectWorkerRepository) IsAssigned(ctx context.Context, projectID, userID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(
			SELECT 1 FROM project_workers
			WHERE project_id = $1 AND user_id = $2 AND confirmation_status != 'rejected'
		)`,
		projectID, userID,
	).Scan(&exists)
	return exists, err
}

func (r *ProjectWorkerRepository) ListUserIDsOnActiveProjects(ctx context.Context) (map[string]struct{}, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT DISTINCT pw.user_id
		FROM project_workers pw
		JOIN projects p ON p.id = pw.project_id
		WHERE p.deleted_at IS NULL AND p.status = 'active'`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]struct{})
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		result[id] = struct{}{}
	}
	return result, rows.Err()
}

type UserLatestProject struct {
	UserID        string
	ProjectID     string
	ProjectName   string
	ProjectStatus string
}

func (r *ProjectWorkerRepository) LatestProjectsByUsers(ctx context.Context, userIDs []string) (map[string]UserLatestProject, error) {
	result := make(map[string]UserLatestProject)
	if len(userIDs) == 0 {
		return result, nil
	}

	rows, err := r.pool.Query(ctx, `
		SELECT DISTINCT ON (pw.user_id)
			pw.user_id, p.id, p.name, p.status
		FROM project_workers pw
		JOIN projects p ON p.id = pw.project_id AND p.deleted_at IS NULL
		WHERE pw.user_id = ANY($1)
			AND pw.confirmation_status != 'rejected'
			AND p.status = 'active'
		ORDER BY pw.user_id, pw.assigned_at DESC`,
		userIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var item UserLatestProject
		if err := rows.Scan(&item.UserID, &item.ProjectID, &item.ProjectName, &item.ProjectStatus); err != nil {
			return nil, err
		}
		result[item.UserID] = item
	}
	return result, rows.Err()
}

func (r *ProjectWorkerRepository) ListUserIDsOnProject(ctx context.Context, projectID string) (map[string]struct{}, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT user_id FROM project_workers WHERE project_id = $1`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]struct{})
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		result[id] = struct{}{}
	}
	return result, rows.Err()
}

func (r *ProjectWorkerRepository) TouchInvitedAt(ctx context.Context, projectID, userID string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE project_workers SET invited_at = NOW()
		WHERE project_id = $1 AND user_id = $2`,
		projectID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *ProjectWorkerRepository) Confirm(ctx context.Context, projectID, userID string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE project_workers SET confirmation_status = 'confirmed'
		WHERE project_id = $1 AND user_id = $2 AND confirmation_status = 'pending'`,
		projectID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *ProjectWorkerRepository) Reject(ctx context.Context, projectID, userID string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE project_workers SET confirmation_status = 'rejected'
		WHERE project_id = $1 AND user_id = $2 AND confirmation_status = 'pending'`,
		projectID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

type UserProjectRow struct {
	ProjectID          string
	Name               string
	Location           string
	ClientName         string
	Status             string
	SiteStatus         string
	StartDate          *string
	EndDate            *string
	Role               string
	ConfirmationStatus string
	AssignedAt         string
}

func (r *ProjectWorkerRepository) ListProjectsByUser(
	ctx context.Context, userID string, status, confirmationStatus string,
) ([]UserProjectRow, error) {
	where := `WHERE pw.user_id = $1 AND p.deleted_at IS NULL AND pw.confirmation_status != 'rejected'`
	args := []any{userID}
	argN := 2
	if status != "" {
		where += fmt.Sprintf(` AND p.status = $%d`, argN)
		args = append(args, status)
		argN++
	}
	if confirmationStatus != "" {
		where += fmt.Sprintf(` AND pw.confirmation_status = $%d`, argN)
		args = append(args, confirmationStatus)
		argN++
	}
	_ = argN

	query := `
		SELECT p.id, p.name, p.location, COALESCE(c.name, ''),
			p.status, p.site_status,
			TO_CHAR(p.start_date, 'YYYY-MM-DD'), TO_CHAR(p.end_date, 'YYYY-MM-DD'),
			pw.role, pw.confirmation_status,
			TO_CHAR(pw.assigned_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		FROM project_workers pw
		JOIN projects p ON p.id = pw.project_id
		LEFT JOIN clients c ON c.id = p.client_id AND c.deleted_at IS NULL
		` + where + `
		ORDER BY pw.assigned_at DESC`

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []UserProjectRow
	for rows.Next() {
		var row UserProjectRow
		var startDate, endDate *string
		if err := rows.Scan(
			&row.ProjectID, &row.Name, &row.Location, &row.ClientName,
			&row.Status, &row.SiteStatus, &startDate, &endDate,
			&row.Role, &row.ConfirmationStatus, &row.AssignedAt,
		); err != nil {
			return nil, err
		}
		row.StartDate = startDate
		row.EndDate = endDate
		items = append(items, row)
	}
	return items, rows.Err()
}

func (r *ProjectWorkerRepository) GetAssignment(ctx context.Context, projectID, userID string) (*models.ProjectWorker, error) {
	var pw models.ProjectWorker
	err := r.pool.QueryRow(ctx, `
		SELECT pw.id, pw.project_id, pw.user_id, pw.role, pw.confirmation_status, pw.assigned_at, pw.invited_at,
			u.first_name, u.last_name, COALESCE(u.hourly_rate::text, '0'),
			COALESCE(u.specialization, ''), COALESCE(u.position, '')
		FROM project_workers pw
		JOIN users u ON u.id = pw.user_id
		WHERE pw.project_id = $1 AND pw.user_id = $2 AND u.deleted_at IS NULL`,
		projectID, userID,
	).Scan(
		&pw.ID, &pw.ProjectID, &pw.UserID, &pw.Role, &pw.ConfirmationStatus, &pw.AssignedAt, &pw.InvitedAt,
		&pw.FirstName, &pw.LastName, &pw.HourlyRate, &pw.Specialization, &pw.Position,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &pw, nil
}
