package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/models"
)

func (r *NotificationRepository) ListByUser(ctx context.Context, userID string, unreadOnly bool) ([]models.Notification, error) {
	where := `WHERE user_id = $1`
	args := []any{userID}
	if unreadOnly {
		where += ` AND read_at IS NULL`
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id, user_id, title, body, notification_type, link, read_at, created_at
		FROM notifications `+where+`
		ORDER BY created_at DESC
		LIMIT 100`, args...)
	if err != nil {
		return nil, fmt.Errorf("list notifications: %w", err)
	}
	defer rows.Close()

	var items []models.Notification
	for rows.Next() {
		var n models.Notification
		if err := rows.Scan(&n.ID, &n.UserID, &n.Title, &n.Body, &n.NotificationType, &n.Link, &n.ReadAt, &n.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, n)
	}
	return items, rows.Err()
}

func (r *NotificationRepository) GetByID(ctx context.Context, id string) (*models.Notification, error) {
	var n models.Notification
	err := r.pool.QueryRow(ctx, `
		SELECT id, user_id, title, body, notification_type, link, read_at, created_at
		FROM notifications WHERE id = $1`, id).Scan(
		&n.ID, &n.UserID, &n.Title, &n.Body, &n.NotificationType, &n.Link, &n.ReadAt, &n.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (r *NotificationRepository) MarkRead(ctx context.Context, id, userID string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE notifications SET read_at = NOW()
		WHERE id = $1 AND user_id = $2 AND read_at IS NULL`, id, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

type MissingReportCandidate struct {
	UserID      string
	ProjectID   string
	ProjectName string
}

const userLocalTZ = `COALESCE(NULLIF(btrim(u.timezone), ''), 'UTC')`

func (r *NotificationRepository) ListWorkersMissingWeeklyReport(ctx context.Context) ([]MissingReportCandidate, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT pw.user_id, p.id, p.name
		FROM project_workers pw
		JOIN projects p ON p.id = pw.project_id
		JOIN users u ON u.id = pw.user_id
		WHERE p.deleted_at IS NULL AND p.status = 'active'
			AND u.deleted_at IS NULL AND u.status = 'active'
			AND pw.role = 'worker'
			AND pw.confirmation_status = 'confirmed'
			AND NOT EXISTS (
				SELECT 1
				FROM reports_worker rw
				WHERE rw.worker_id = pw.user_id
					AND rw.project_id = pw.project_id
					AND rw.status <> 'draft'
					AND rw.week_start = date_trunc(
						'week',
						timezone(`+userLocalTZ+`, NOW())
					)::date
			)
		ORDER BY pw.user_id, p.name`)
	if err != nil {
		return nil, fmt.Errorf("list workers missing weekly report: %w", err)
	}
	defer rows.Close()
	return scanMissingReportCandidates(rows)
}

func (r *NotificationRepository) ListSupervisorsMissingDailyReport(ctx context.Context) ([]MissingReportCandidate, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT pw.user_id, p.id, p.name
		FROM project_workers pw
		JOIN projects p ON p.id = pw.project_id
		JOIN users u ON u.id = pw.user_id
		WHERE p.deleted_at IS NULL AND p.status = 'active'
			AND u.deleted_at IS NULL AND u.status = 'active'
			AND pw.role = 'supervisor'
			AND pw.confirmation_status = 'confirmed'
			AND NOT EXISTS (
				SELECT 1
				FROM reports_supervisor rs
				WHERE rs.supervisor_id = pw.user_id
					AND rs.project_id = pw.project_id
					AND rs.report_date = timezone(`+userLocalTZ+`, NOW())::date
			)
		ORDER BY pw.user_id, p.name`)
	if err != nil {
		return nil, fmt.Errorf("list supervisors missing daily report: %w", err)
	}
	defer rows.Close()
	return scanMissingReportCandidates(rows)
}

func scanMissingReportCandidates(rows pgx.Rows) ([]MissingReportCandidate, error) {
	var items []MissingReportCandidate
	for rows.Next() {
		var item MissingReportCandidate
		if err := rows.Scan(&item.UserID, &item.ProjectID, &item.ProjectName); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}
