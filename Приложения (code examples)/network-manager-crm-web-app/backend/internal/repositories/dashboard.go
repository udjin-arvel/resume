package repositories

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/radar-crm/backend/internal/models/dto"
)

type DashboardRepository struct {
	pool *pgxpool.Pool
}

func NewDashboardRepository(pool *pgxpool.Pool) *DashboardRepository {
	return &DashboardRepository{pool: pool}
}

type UrgentPreviewRow struct {
	ID    string
	Name  string
	Label string
}

func (r *DashboardRepository) CountPendingWorkers(ctx context.Context) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*)::int FROM users
		WHERE status = 'pending' AND deleted_at IS NULL AND role IN ('worker', 'supervisor')`).Scan(&n)
	return n, err
}

func (r *DashboardRepository) PreviewPendingWorkers(ctx context.Context, limit int) ([]UrgentPreviewRow, error) {
	return r.previewUsers(ctx, `status = 'pending' AND deleted_at IS NULL AND role IN ('worker', 'supervisor')`, limit)
}

func (r *DashboardRepository) CountUnconfirmedWorkers(ctx context.Context) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*)::int FROM project_workers pw
		JOIN projects p ON p.id = pw.project_id AND p.deleted_at IS NULL AND p.status = 'active'
		WHERE pw.confirmation_status != 'confirmed'`).Scan(&n)
	return n, err
}

func (r *DashboardRepository) PreviewUnconfirmedWorkers(ctx context.Context, limit int) ([]UrgentPreviewRow, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT u.id, TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), p.name
		FROM project_workers pw
		JOIN users u ON u.id = pw.user_id
		JOIN projects p ON p.id = pw.project_id AND p.deleted_at IS NULL AND p.status = 'active'
		WHERE pw.confirmation_status != 'confirmed'
		ORDER BY pw.assigned_at DESC
		LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanPreviewRows(rows)
}

func (r *DashboardRepository) CountSupervisorReportsReview(ctx context.Context) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*)::int FROM reports_supervisor WHERE status = 'review'`).Scan(&n)
	return n, err
}

func (r *DashboardRepository) PreviewSupervisorReportsReview(ctx context.Context, limit int) ([]UrgentPreviewRow, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT rs.id, p.name, TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,''))
		FROM reports_supervisor rs
		JOIN projects p ON p.id = rs.project_id
		JOIN users u ON u.id = rs.supervisor_id
		WHERE rs.status = 'review'
		ORDER BY rs.report_date DESC
		LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanPreviewRows(rows)
}

func (r *DashboardRepository) CountWorkerReportsReview(ctx context.Context) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*)::int FROM reports_worker WHERE status = 'review'`).Scan(&n)
	return n, err
}

func (r *DashboardRepository) PreviewWorkerReportsReview(ctx context.Context, limit int) ([]UrgentPreviewRow, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT rw.id, p.name, TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,''))
		FROM reports_worker rw
		JOIN projects p ON p.id = rw.project_id
		JOIN users u ON u.id = rw.worker_id
		WHERE rw.status = 'review'
		ORDER BY rw.week_start DESC
		LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanPreviewRows(rows)
}

func (r *DashboardRepository) CountSiteIssue(ctx context.Context) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*)::int FROM projects WHERE deleted_at IS NULL AND status = 'active' AND site_status = 'issue'`).Scan(&n)
	return n, err
}

func (r *DashboardRepository) PreviewSiteIssue(ctx context.Context, limit int) ([]UrgentPreviewRow, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, 'site issue'
		FROM projects WHERE deleted_at IS NULL AND status = 'active' AND site_status = 'issue'
		ORDER BY updated_at DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanPreviewRows(rows)
}

func (r *DashboardRepository) CountSiteDowntime(ctx context.Context) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*)::int FROM projects
		WHERE deleted_at IS NULL AND status = 'active'
			AND (site_status = 'downtime' OR downtime_hours > 0)`).Scan(&n)
	return n, err
}

func (r *DashboardRepository) PreviewSiteDowntime(ctx context.Context, limit int) ([]UrgentPreviewRow, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, downtime_hours::text || ' h downtime'
		FROM projects
		WHERE deleted_at IS NULL AND status = 'active'
			AND (site_status = 'downtime' OR downtime_hours > 0)
		ORDER BY downtime_hours DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanPreviewRows(rows)
}

func (r *DashboardRepository) CountOverdueReports(ctx context.Context) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*)::int FROM reports_worker WHERE status = 'overdue'`).Scan(&n)
	return n, err
}

func (r *DashboardRepository) PreviewOverdueReports(ctx context.Context, limit int) ([]UrgentPreviewRow, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT rw.id, p.name, 'week ending ' || rw.week_end::text
		FROM reports_worker rw
		JOIN projects p ON p.id = rw.project_id
		WHERE rw.status = 'overdue'
		ORDER BY rw.week_end ASC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanPreviewRows(rows)
}

func (r *DashboardRepository) CountToolsAttention(ctx context.Context) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*)::int FROM tools t
		WHERE t.status != 'written_off'
			AND (
				t.status = 'needs_attention'
				OR t.status = 'overdue'
				OR (t.control_type = 'calibration' AND t.calibration_due_at IS NOT NULL AND t.calibration_due_at < NOW() + interval '7 days')
				OR (t.control_type = 'usage_limit' AND t.usage_limit > 0 AND t.usage_count >= t.usage_limit * 9 / 10)
			)`).Scan(&n)
	return n, err
}

func (r *DashboardRepository) PreviewToolsAttention(ctx context.Context, limit int) ([]UrgentPreviewRow, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT t.id, t.name,
			CASE
				WHEN t.status = 'needs_attention' THEN 'reported problem'
				WHEN t.status = 'overdue' THEN 'overdue'
				WHEN t.calibration_due_at IS NOT NULL AND t.calibration_due_at < NOW() THEN 'calibration overdue'
				ELSE 'needs attention'
			END
		FROM tools t
		WHERE t.status != 'written_off'
			AND (
				t.status = 'needs_attention'
				OR t.status = 'overdue'
				OR (t.control_type = 'calibration' AND t.calibration_due_at IS NOT NULL AND t.calibration_due_at < NOW() + interval '7 days')
				OR (t.control_type = 'usage_limit' AND t.usage_limit > 0 AND t.usage_count >= t.usage_limit * 9 / 10)
			)
		ORDER BY t.calibration_due_at ASC NULLS LAST
		LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanPreviewRows(rows)
}

func (r *DashboardRepository) ListProblemProjects(ctx context.Context, limit int) ([]dto.ProblemProjectResponse, error) {
	if limit <= 0 {
		limit = 10
	}
	rows, err := r.pool.Query(ctx, `
		SELECT p.id, p.name, p.site_status::text, p.downtime_hours::text,
			CASE
				WHEN p.site_status = 'downtime' THEN 'downtime on site'
				WHEN p.site_status = 'issue' THEN 'issue on site'
				WHEN tp.cnt > 0 THEN 'tool problem'
				WHEN p.spent > p.budget AND p.budget > 0 THEN 'budget overrun'
				ELSE COALESCE(ov.cnt::text || ' overdue reports', 'problem')
			END
		FROM projects p
		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS cnt FROM reports_worker rw
			WHERE rw.project_id = p.id AND rw.status = 'overdue'
		) ov ON TRUE
		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS cnt
			FROM tool_assignments ta
			JOIN tools t ON t.id = ta.tool_id
			WHERE ta.project_id = p.id
				AND ta.returned_at IS NULL
				AND t.status = 'needs_attention'
		) tp ON TRUE
		WHERE p.deleted_at IS NULL AND p.status = 'active'
			AND (
				p.site_status IN ('issue', 'downtime')
				OR p.downtime_hours > 0
				OR (p.budget > 0 AND p.spent > p.budget * 1.05)
				OR ov.cnt > 0
				OR tp.cnt > 0
			)
		ORDER BY p.updated_at DESC
		LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []dto.ProblemProjectResponse
	for rows.Next() {
		var item dto.ProblemProjectResponse
		if err := rows.Scan(&item.ID, &item.Name, &item.SiteStatus, &item.DowntimeHours, &item.Issue); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *DashboardRepository) previewUsers(ctx context.Context, where string, limit int) ([]UrgentPreviewRow, error) {
	rows, err := r.pool.Query(ctx, fmt.Sprintf(`
		SELECT id, TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')), email
		FROM users WHERE %s ORDER BY created_at DESC LIMIT $1`, where), limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanPreviewRows(rows)
}

func scanPreviewRows(rows pgx.Rows) ([]UrgentPreviewRow, error) {
	var items []UrgentPreviewRow
	for rows.Next() {
		var row UrgentPreviewRow
		if err := rows.Scan(&row.ID, &row.Name, &row.Label); err != nil {
			return nil, err
		}
		items = append(items, row)
	}
	return items, rows.Err()
}
