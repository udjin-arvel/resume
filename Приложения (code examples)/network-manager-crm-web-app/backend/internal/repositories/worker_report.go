package repositories

import (
	"context"
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

type WorkerReportRepository struct {
	pool *pgxpool.Pool
}

func NewWorkerReportRepository(pool *pgxpool.Pool) *WorkerReportRepository {
	return &WorkerReportRepository{pool: pool}
}

const workerReportSelect = `
	rw.id, rw.project_id, p.name,
	rw.worker_id, TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
	rw.week_start, rw.week_end,
	rw.hours_mon::text, rw.hours_tue::text, rw.hours_wed::text, rw.hours_thu::text,
	rw.hours_fri::text, rw.hours_sat::text, rw.hours_sun::text,
	rw.description, rw.status::text,
	rw.total_hours::text, rw.total_amount::text, rw.manager_comment,
	(SELECT COALESCE(SUM(re.amount), 0)::text FROM report_expenses re WHERE re.report_id = rw.id),
	COALESCE(u.hourly_rate::text, '0'),
	rw.created_at, rw.updated_at`

func scanWorkerReport(row pgx.Row) (*models.WorkerReport, error) {
	var r models.WorkerReport
	err := row.Scan(
		&r.ID, &r.ProjectID, &r.ProjectName,
		&r.WorkerID, &r.WorkerName,
		&r.WeekStart, &r.WeekEnd,
		&r.HoursMon, &r.HoursTue, &r.HoursWed, &r.HoursThu,
		&r.HoursFri, &r.HoursSat, &r.HoursSun,
		&r.Description, &r.Status,
		&r.TotalHours, &r.TotalAmount, &r.ManagerComment, &r.ExpensesTotal,
		&r.HourlyRate,
		&r.CreatedAt, &r.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &r, nil
}

func (r *WorkerReportRepository) List(
	ctx context.Context, q dto.ReportListQuery, actorRole, actorID string,
) ([]models.WorkerReport, int64, error) {
	page, pageSize := normalizePagination(q.Page, q.PageSize)
	offset := (page - 1) * pageSize

	where := `WHERE 1=1`
	args := []any{}
	argN := 1

	if actorRole != "manager" {
		where += fmt.Sprintf(` AND rw.worker_id = $%d`, argN)
		args = append(args, actorID)
		argN++
	}
	if q.ProjectID != "" {
		where += fmt.Sprintf(` AND rw.project_id = $%d`, argN)
		args = append(args, q.ProjectID)
		argN++
	}
	if q.ClientID != "" {
		where += fmt.Sprintf(` AND p.client_id = $%d`, argN)
		args = append(args, q.ClientID)
		argN++
	}
	if q.WorkerID != "" {
		where += fmt.Sprintf(` AND rw.worker_id = $%d`, argN)
		args = append(args, q.WorkerID)
		argN++
	}
	if q.Status != "" {
		status := q.Status
		if status == "approved" {
			status = "accepted"
		}
		where += fmt.Sprintf(` AND rw.status = $%d::worker_report_status`, argN)
		args = append(args, status)
		argN++
	} else {
		where += ` AND rw.status != 'draft'::worker_report_status`
	}
	if q.From != "" {
		where += fmt.Sprintf(` AND rw.week_end >= $%d::date`, argN)
		args = append(args, q.From)
		argN++
	}
	if q.To != "" {
		where += fmt.Sprintf(` AND rw.week_start <= $%d::date`, argN)
		args = append(args, q.To)
		argN++
	}

	fromClause := `FROM reports_worker rw
		JOIN projects p ON p.id = rw.project_id AND p.deleted_at IS NULL
		JOIN users u ON u.id = rw.worker_id`

	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) `+fromClause+` `+where, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count worker reports: %w", err)
	}

	listQuery := `SELECT ` + workerReportSelect + ` ` + fromClause + ` ` + where +
		fmt.Sprintf(` ORDER BY rw.updated_at DESC, rw.created_at DESC LIMIT $%d OFFSET $%d`, argN, argN+1)
	listArgs := append(args, pageSize, offset)

	rows, err := r.pool.Query(ctx, listQuery, listArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("list worker reports: %w", err)
	}
	defer rows.Close()

	var items []models.WorkerReport
	for rows.Next() {
		item, err := scanWorkerReport(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, *item)
	}
	return items, total, rows.Err()
}

func (r *WorkerReportRepository) GetByID(ctx context.Context, id string) (*models.WorkerReport, error) {
	query := `SELECT ` + workerReportSelect + `
		FROM reports_worker rw
		JOIN projects p ON p.id = rw.project_id AND p.deleted_at IS NULL
		JOIN users u ON u.id = rw.worker_id
		WHERE rw.id = $1`
	report, err := scanWorkerReport(r.pool.QueryRow(ctx, query, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get worker report: %w", err)
	}
	expenses, err := r.GetExpensesByReportID(ctx, id)
	if err != nil {
		return nil, err
	}
	report.Expenses = expenses
	return report, nil
}

func (r *WorkerReportRepository) GetExpensesByReportID(ctx context.Context, reportID string) ([]models.ReportExpense, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT re.id, re.report_id, re.expense_type, re.amount::text, re.comment, re.document_id,
			d.filename, re.created_at
		FROM report_expenses re
		LEFT JOIN documents d ON d.id = re.document_id
		WHERE re.report_id = $1 ORDER BY re.created_at ASC`, reportID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.ReportExpense
	for rows.Next() {
		var e models.ReportExpense
		if err := rows.Scan(
			&e.ID, &e.ReportID, &e.ExpenseType, &e.Amount, &e.Comment, &e.DocumentID,
			&e.DocumentFilename, &e.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, e)
	}
	return items, rows.Err()
}

func (r *WorkerReportRepository) Create(ctx context.Context, report *models.WorkerReport, expenses []models.ReportExpense) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO reports_worker (
			project_id, worker_id, week_start, week_end,
			hours_mon, hours_tue, hours_wed, hours_thu, hours_fri, hours_sat, hours_sun,
			description, status, total_hours, total_amount
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
		RETURNING id, created_at, updated_at`
	err = tx.QueryRow(ctx, query,
		report.ProjectID, report.WorkerID, report.WeekStart, report.WeekEnd,
		numericOrZero(report.HoursMon), numericOrZero(report.HoursTue), numericOrZero(report.HoursWed),
		numericOrZero(report.HoursThu), numericOrZero(report.HoursFri), numericOrZero(report.HoursSat),
		numericOrZero(report.HoursSun),
		report.Description, report.Status, numericOrZero(report.TotalHours), numericOrZero(report.TotalAmount),
	).Scan(&report.ID, &report.CreatedAt, &report.UpdatedAt)
	if err != nil {
		if isUniqueViolation(err) {
			return apperrors.New(apperrors.ErrConflict, "report for this project and week already exists")
		}
		return fmt.Errorf("create worker report: %w", err)
	}

	if err := insertReportExpenses(ctx, tx, report.ID, expenses); err != nil {
		return err
	}
	report.Expenses = expenses
	return tx.Commit(ctx)
}

func (r *WorkerReportRepository) Update(ctx context.Context, report *models.WorkerReport, expenses []models.ReportExpense) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var status string
	err = tx.QueryRow(ctx, `SELECT status::text FROM reports_worker WHERE id = $1`, report.ID).Scan(&status)
	if errors.Is(err, pgx.ErrNoRows) {
		return apperrors.ErrNotFound
	}
	if err != nil {
		return err
	}
	if status != "review" && status != "returned" && status != "draft" {
		return apperrors.New(apperrors.ErrValidation, "report cannot be edited in current status")
	}

	query := `
		UPDATE reports_worker SET
			week_start = $2, week_end = $3,
			hours_mon = $4, hours_tue = $5, hours_wed = $6, hours_thu = $7,
			hours_fri = $8, hours_sat = $9, hours_sun = $10,
			description = $11, status = $14::worker_report_status,
			total_hours = $12, total_amount = $13, updated_at = NOW()
		WHERE id = $1
		RETURNING created_at, updated_at`
	err = tx.QueryRow(ctx, query,
		report.ID, report.WeekStart, report.WeekEnd,
		numericOrZero(report.HoursMon), numericOrZero(report.HoursTue), numericOrZero(report.HoursWed),
		numericOrZero(report.HoursThu), numericOrZero(report.HoursFri), numericOrZero(report.HoursSat),
		numericOrZero(report.HoursSun),
		report.Description, numericOrZero(report.TotalHours), numericOrZero(report.TotalAmount),
		report.Status,
	).Scan(&report.CreatedAt, &report.UpdatedAt)
	if err != nil {
		return fmt.Errorf("update worker report: %w", err)
	}

	if _, err := tx.Exec(ctx, `DELETE FROM report_expenses WHERE report_id = $1`, report.ID); err != nil {
		return err
	}
	if err := insertReportExpenses(ctx, tx, report.ID, expenses); err != nil {
		return err
	}
	report.Expenses = expenses
	return tx.Commit(ctx)
}

func insertReportExpenses(ctx context.Context, tx pgx.Tx, reportID string, expenses []models.ReportExpense) error {
	for _, e := range expenses {
		_, err := tx.Exec(ctx, `
			INSERT INTO report_expenses (report_id, expense_type, amount, comment, document_id)
			VALUES ($1, $2, $3, $4, $5)`,
			reportID, e.ExpenseType, numericOrZero(e.Amount), e.Comment, e.DocumentID,
		)
		if err != nil {
			return fmt.Errorf("insert expense: %w", err)
		}
	}
	return nil
}

func (r *WorkerReportRepository) Reject(ctx context.Context, id, comment string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE reports_worker
		SET status = 'returned'::worker_report_status,
		    manager_comment = $2,
		    updated_at = NOW()
		WHERE id = $1`, id, comment)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *WorkerReportRepository) RevertReturn(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE reports_worker
		SET status = 'review'::worker_report_status,
		    manager_comment = '',
		    updated_at = NOW()
		WHERE id = $1 AND status = 'returned'::worker_report_status`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.New(apperrors.ErrValidation, "report cannot be reverted in current status")
	}
	return nil
}

func (r *WorkerReportRepository) UpdateStatus(ctx context.Context, id, status string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE reports_worker SET status = $2::worker_report_status, updated_at = NOW() WHERE id = $1`, id, status)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *WorkerReportRepository) Approve(ctx context.Context, id string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var projectID, totalAmount, status string
	err = tx.QueryRow(ctx, `
		SELECT project_id, total_amount::text, status::text
		FROM reports_worker WHERE id = $1 FOR UPDATE`, id,
	).Scan(&projectID, &totalAmount, &status)
	if errors.Is(err, pgx.ErrNoRows) {
		return apperrors.ErrNotFound
	}
	if err != nil {
		return err
	}
	if status != "review" && status != "returned" && status != "overdue" {
		return apperrors.New(apperrors.ErrValidation, "report cannot be approved in current status")
	}

	tag, err := tx.Exec(ctx,
		`UPDATE reports_worker SET status = 'accepted', updated_at = NOW() WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}

	_, err = tx.Exec(ctx, `
		UPDATE projects SET spent = spent + $2::numeric, updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL`, projectID, numericOrZero(totalAmount))
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *WorkerReportRepository) MarkOverdue(ctx context.Context, beforeDate time.Time) (int64, error) {
	tag, err := r.pool.Exec(ctx, `
		UPDATE reports_worker SET status = 'overdue', updated_at = NOW()
		WHERE status IN ('draft', 'review') AND week_end < $1::date`, beforeDate)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

func (r *WorkerReportRepository) CountByProjectAndStatus(ctx context.Context, projectID, status string) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*)::int FROM reports_worker WHERE project_id = $1 AND status = $2::worker_report_status`,
		projectID, status,
	).Scan(&count)
	return count, err
}

func (r *WorkerReportRepository) CountByProjectsAndStatus(ctx context.Context, projectIDs []string, status string) (map[string]int, error) {
	result := make(map[string]int, len(projectIDs))
	if len(projectIDs) == 0 {
		return result, nil
	}

	rows, err := r.pool.Query(ctx, `
		SELECT project_id, COUNT(*)::int
		FROM reports_worker
		WHERE project_id = ANY($1) AND status = $2::worker_report_status
		GROUP BY project_id`, projectIDs, status)
	if err != nil {
		return nil, fmt.Errorf("count project reports: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var projectID string
		var count int
		if err := rows.Scan(&projectID, &count); err != nil {
			return nil, fmt.Errorf("scan project report count: %w", err)
		}
		result[projectID] = count
	}
	return result, rows.Err()
}

func isUniqueViolation(err error) bool {
	return err != nil && strings.Contains(err.Error(), "uq_reports_worker_project_week")
}

type WorkerExpenseDocumentRow struct {
	WorkerID    string
	FirstName   string
	LastName    string
	DocumentID  *string
	Filename    *string
	ExpenseType *string
	CreatedAt   *time.Time
}

func (r *WorkerReportRepository) ListExpenseDocumentsByProject(ctx context.Context, projectID string) ([]WorkerExpenseDocumentRow, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT pw.user_id, u.first_name, u.last_name,
			d.id, d.filename, re.expense_type, d.created_at
		FROM project_workers pw
		JOIN users u ON u.id = pw.user_id
		LEFT JOIN reports_worker rw ON rw.worker_id = pw.user_id AND rw.project_id = pw.project_id
		LEFT JOIN report_expenses re ON re.report_id = rw.id AND re.document_id IS NOT NULL
		LEFT JOIN documents d ON d.id = re.document_id
		WHERE pw.project_id = $1 AND u.deleted_at IS NULL
		ORDER BY u.last_name, u.first_name, d.created_at ASC NULLS LAST`, projectID)
	if err != nil {
		return nil, fmt.Errorf("list worker expense documents: %w", err)
	}
	defer rows.Close()

	var items []WorkerExpenseDocumentRow
	for rows.Next() {
		var row WorkerExpenseDocumentRow
		if err := rows.Scan(
			&row.WorkerID, &row.FirstName, &row.LastName,
			&row.DocumentID, &row.Filename, &row.ExpenseType, &row.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, row)
	}
	return items, rows.Err()
}
