package repositories

import (
	"context"
	"errors"
	"fmt"
	"math"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/models/dto"
)

type FinanceRepository struct {
	pool *pgxpool.Pool
}

func NewFinanceRepository(pool *pgxpool.Pool) *FinanceRepository {
	return &FinanceRepository{pool: pool}
}

func (r *FinanceRepository) Overview(ctx context.Context, q dto.FinanceScopeQuery) (*dto.FinanceOverviewResponse, error) {
	var resp dto.FinanceOverviewResponse
	projectWhere, args, _ := buildProjectScopeFilter("p", q, 1)
	query := `
		WITH project_scope AS (
			SELECT
				p.id,
				p.status,
				CASE
					WHEN p.budget > 0 THEN p.budget
					WHEN p.estimate_id IS NOT NULL THEN COALESCE(e.total_amount, 0)
					ELSE 0
				END AS budget,
				p.spent
			FROM projects p
			LEFT JOIN estimates e ON e.id = p.estimate_id
			WHERE p.deleted_at IS NULL` + projectWhere + `
		), pending_review AS (
			SELECT COALESCE(SUM((rw.total_hours * u.hourly_rate) + COALESCE(exp.expense_total, 0)), 0)::text AS amount
			FROM reports_worker rw
			JOIN users u ON u.id = rw.worker_id
			JOIN project_scope ps ON ps.id = rw.project_id
			LEFT JOIN LATERAL (
				SELECT COALESCE(SUM(re.amount), 0) AS expense_total
				FROM report_expenses re
				WHERE re.report_id = rw.id
			) exp ON TRUE
			WHERE rw.status IN ('review', 'returned')
		)
		SELECT
			COALESCE(SUM(ps.budget), 0)::text,
			COALESCE(SUM(ps.spent), 0)::text,
			COALESCE((SELECT amount FROM pending_review), '0'),
			COUNT(*) FILTER (WHERE ps.status = 'active')::int
		FROM project_scope ps`
	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&resp.TotalBudget, &resp.TotalSpent, &resp.PendingReview, &resp.ActiveProjects,
	)
	if err != nil {
		return nil, fmt.Errorf("finance overview: %w", err)
	}
	resp.TotalRemaining = subtractMoney(resp.TotalBudget, resp.TotalSpent)
	return &resp, nil
}

func (r *FinanceRepository) Projects(ctx context.Context, q dto.FinanceScopeQuery) ([]dto.ProjectFinanceResponse, error) {
	projectWhere, args, _ := buildProjectScopeFilter("p", q, 1)
	rows, err := r.pool.Query(ctx, `
		SELECT
			p.id,
			p.name,
			p.status::text,
			CASE
				WHEN p.budget > 0 THEN p.budget::text
				WHEN p.estimate_id IS NOT NULL THEN COALESCE(e.total_amount, 0)::text
				ELSE '0'
			END,
			p.spent::text,
			COALESCE(labor.total, 0)::text,
			COALESCE(expenses.total, 0)::text
		FROM projects p
		LEFT JOIN estimates e ON e.id = p.estimate_id
		LEFT JOIN LATERAL (
			SELECT SUM(rw.total_hours * u.hourly_rate) AS total
			FROM reports_worker rw
			JOIN users u ON u.id = rw.worker_id
			WHERE rw.project_id = p.id AND rw.status = 'accepted'
		) labor ON TRUE
		LEFT JOIN LATERAL (
			SELECT SUM(re.amount) AS total
			FROM report_expenses re
			JOIN reports_worker rw ON rw.id = re.report_id
			WHERE rw.project_id = p.id AND rw.status = 'accepted'
		) expenses ON TRUE
		WHERE p.deleted_at IS NULL`+projectWhere+`
		ORDER BY p.name ASC`, args...)
	if err != nil {
		return nil, fmt.Errorf("finance projects: %w", err)
	}
	defer rows.Close()

	var items = make([]dto.ProjectFinanceResponse, 0)
	for rows.Next() {
		var item dto.ProjectFinanceResponse
		if err := rows.Scan(
			&item.ProjectID, &item.ProjectName, &item.ProjectStatus, &item.Budget, &item.Spent,
			&item.LaborCost, &item.ExpenseCost,
		); err != nil {
			return nil, err
		}
		item.Remaining = subtractMoney(item.Budget, item.Spent)
		item.Workers = []dto.ProjectWorkerFinanceItem{}
		item.Categories = []dto.FinanceCategoryItem{}
		item.Losses = []dto.ProjectFinanceLossItem{}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *FinanceRepository) ProjectByID(ctx context.Context, id string) (*dto.ProjectFinanceResponse, error) {
	var item dto.ProjectFinanceResponse
	err := r.pool.QueryRow(ctx, `
		SELECT
			p.id,
			p.name,
			p.status::text,
			CASE
				WHEN p.budget > 0 THEN p.budget::text
				WHEN p.estimate_id IS NOT NULL THEN COALESCE(e.total_amount, 0)::text
				ELSE '0'
			END,
			p.spent::text,
			COALESCE(labor.total, 0)::text,
			COALESCE(expenses.total, 0)::text
		FROM projects p
		LEFT JOIN estimates e ON e.id = p.estimate_id
		LEFT JOIN LATERAL (
			SELECT SUM(rw.total_hours * u.hourly_rate) AS total
			FROM reports_worker rw
			JOIN users u ON u.id = rw.worker_id
			WHERE rw.project_id = p.id AND rw.status = 'accepted'
		) labor ON TRUE
		LEFT JOIN LATERAL (
			SELECT SUM(re.amount) AS total
			FROM report_expenses re
			JOIN reports_worker rw ON rw.id = re.report_id
			WHERE rw.project_id = p.id AND rw.status = 'accepted'
		) expenses ON TRUE
		WHERE p.id = $1 AND p.deleted_at IS NULL`, id).Scan(
		&item.ProjectID, &item.ProjectName, &item.ProjectStatus, &item.Budget, &item.Spent,
		&item.LaborCost, &item.ExpenseCost,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("finance project: %w", err)
	}
	item.Remaining = subtractMoney(item.Budget, item.Spent)
	item.Workers = []dto.ProjectWorkerFinanceItem{}
	item.Categories = []dto.FinanceCategoryItem{}
	item.Losses = []dto.ProjectFinanceLossItem{}

	if err := r.enrichProjectFinanceDetail(ctx, id, &item); err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *FinanceRepository) enrichProjectFinanceDetail(ctx context.Context, projectID string, item *dto.ProjectFinanceResponse) error {
	pending, err := r.projectPendingReviewAmount(ctx, projectID)
	if err != nil {
		return err
	}
	item.PendingReviewAmount = pending

	workers, err := r.projectWorkersFinance(ctx, projectID)
	if err != nil {
		return err
	}
	item.Workers = workers

	categories, err := r.projectFinanceCategories(ctx, projectID, item.LaborCost, item.Spent)
	if err != nil {
		return err
	}
	item.Categories = categories

	avgRate, err := r.projectAvgHourlyRate(ctx, projectID)
	if err != nil {
		return err
	}
	losses, totalLoss, err := r.projectFinanceLosses(ctx, projectID, avgRate)
	if err != nil {
		return err
	}
	item.Losses = losses
	item.TotalLossAmount = totalLoss
	return nil
}

func (r *FinanceRepository) projectPendingReviewAmount(ctx context.Context, projectID string) (string, error) {
	var amount string
	err := r.pool.QueryRow(ctx, `
		WITH report_amounts AS (
			SELECT
				(rw.total_hours * u.hourly_rate) AS labor,
				COALESCE(exp.expense_total, 0) AS expenses
			FROM reports_worker rw
			JOIN users u ON u.id = rw.worker_id
			LEFT JOIN LATERAL (
				SELECT COALESCE(SUM(re.amount), 0) AS expense_total
				FROM report_expenses re
				WHERE re.report_id = rw.id
			) exp ON TRUE
			WHERE rw.project_id = $1 AND rw.status IN ('review', 'returned')
		)
		SELECT COALESCE(SUM(labor + expenses), 0)::text
		FROM report_amounts`,
		projectID,
	).Scan(&amount)
	if err != nil {
		return "", fmt.Errorf("project pending review amount: %w", err)
	}
	return amount, nil
}

func (r *FinanceRepository) projectWorkersFinance(ctx context.Context, projectID string) ([]dto.ProjectWorkerFinanceItem, error) {
	rows, err := r.pool.Query(ctx, `
		WITH report_amounts AS (
			SELECT
				rw.worker_id,
				rw.status,
				rw.total_hours,
				(rw.total_hours * u.hourly_rate) AS labor,
				COALESCE(exp.expense_total, 0) AS expenses
			FROM reports_worker rw
			JOIN users u ON u.id = rw.worker_id
			LEFT JOIN LATERAL (
				SELECT COALESCE(SUM(re.amount), 0) AS expense_total
				FROM report_expenses re
				WHERE re.report_id = rw.id
			) exp ON TRUE
			WHERE rw.project_id = $1 AND rw.status != 'draft'
		)
		SELECT
			pw.user_id,
			TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
			COALESCE(SUM(ra.total_hours), 0)::text,
			COALESCE(SUM(ra.labor), 0)::text,
			COALESCE(SUM(ra.expenses), 0)::text,
			COALESCE(SUM(ra.labor + ra.expenses) FILTER (WHERE ra.status = 'accepted'), 0)::text,
			COALESCE(SUM(ra.labor + ra.expenses) FILTER (WHERE ra.status IN ('review', 'returned')), 0)::text
		FROM project_workers pw
		JOIN users u ON u.id = pw.user_id
		LEFT JOIN report_amounts ra ON ra.worker_id = pw.user_id
		WHERE pw.project_id = $1 AND pw.confirmation_status = 'confirmed'
		GROUP BY pw.user_id, u.first_name, u.last_name
		HAVING COALESCE(SUM(ra.total_hours), 0) > 0
			OR COALESCE(SUM(ra.labor + ra.expenses), 0) > 0
		ORDER BY u.last_name, u.first_name`,
		projectID,
	)
	if err != nil {
		return nil, fmt.Errorf("project workers finance: %w", err)
	}
	defer rows.Close()

	items := []dto.ProjectWorkerFinanceItem{}
	for rows.Next() {
		var item dto.ProjectWorkerFinanceItem
		if err := rows.Scan(
			&item.WorkerID, &item.WorkerName, &item.TotalHours,
			&item.TotalAmount, &item.ExtraExpenses, &item.PaidAmount, &item.RemainingAmount,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *FinanceRepository) projectFinanceCategories(ctx context.Context, projectID, laborCost, spent string) ([]dto.FinanceCategoryItem, error) {
	expenses, err := r.Categories(ctx, dto.FinanceCategoryQuery{
		FinanceScopeQuery: dto.FinanceScopeQuery{ProjectID: projectID},
	})
	if err != nil {
		return nil, err
	}

	spentVal := parseFloatOrZero(spent)
	items := []dto.FinanceCategoryItem{}

	laborVal := parseFloatOrZero(laborCost)
	if laborVal > 0 || spentVal == 0 {
		items = append(items, dto.FinanceCategoryItem{
			Category:   "labor",
			Amount:     laborCost,
			Percentage: categoryPercentage(laborVal, spentVal),
		})
	}

	for _, exp := range expenses {
		amt := parseFloatOrZero(exp.Amount)
		if amt <= 0 {
			continue
		}
		items = append(items, dto.FinanceCategoryItem{
			Category:   exp.Category,
			Amount:     exp.Amount,
			Count:      exp.Count,
			Percentage: categoryPercentage(amt, spentVal),
		})
	}
	return items, nil
}

func (r *FinanceRepository) projectAvgHourlyRate(ctx context.Context, projectID string) (float64, error) {
	var avg float64
	err := r.pool.QueryRow(ctx, `
		SELECT COALESCE(AVG(u.hourly_rate), 0)
		FROM project_workers pw
		JOIN users u ON u.id = pw.user_id
		WHERE pw.project_id = $1 AND pw.confirmation_status = 'confirmed'`,
		projectID,
	).Scan(&avg)
	if err != nil {
		return 0, fmt.Errorf("project avg hourly rate: %w", err)
	}
	return avg, nil
}

func (r *FinanceRepository) projectFinanceLosses(ctx context.Context, projectID string, avgRate float64) ([]dto.ProjectFinanceLossItem, string, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT
			rs.id,
			COALESCE(
				NULLIF(TRIM(rs.downtime_reason), ''),
				NULLIF(TRIM(rs.issue_description), ''),
				NULLIF(TRIM(pi.title), ''),
				'Простой'
			),
			rs.report_date::text,
			rs.downtime_hours::text,
			rs.site_status::text,
			COALESCE(pi.status::text, '')
		FROM reports_supervisor rs
		LEFT JOIN project_issues pi ON pi.id = rs.related_issue_id
		WHERE rs.project_id = $1
			AND rs.site_status IN ('downtime', 'issue')
			AND rs.downtime_hours > 0
		ORDER BY rs.report_date DESC`,
		projectID,
	)
	if err != nil {
		return nil, "", fmt.Errorf("project finance losses: %w", err)
	}
	defer rows.Close()

	items := []dto.ProjectFinanceLossItem{}
	var totalLoss float64
	for rows.Next() {
		var item dto.ProjectFinanceLossItem
		var issueStatus string
		if err := rows.Scan(
			&item.ID, &item.Title, &item.DateFrom, &item.DowntimeHours,
			&item.SiteStatus, &issueStatus,
		); err != nil {
			return nil, "", err
		}
		item.DateTo = item.DateFrom
		item.IssueStatus = issueStatus
		hours := parseFloatOrZero(item.DowntimeHours)
		loss := hours * avgRate
		item.LossAmount = formatSignedMoneyRepo(-loss)
		totalLoss += loss
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, "", err
	}
	return items, formatSignedMoneyRepo(-totalLoss), nil
}

func categoryPercentage(amount, total float64) int {
	if total <= 0 {
		return 0
	}
	return int(math.Round(amount / total * 100))
}

func formatSignedMoneyRepo(v float64) string {
	return fmt.Sprintf("%.2f", v)
}

func (r *FinanceRepository) Workers(ctx context.Context, q dto.FinanceScopeQuery) ([]dto.WorkerFinanceResponse, error) {
	projectWhere, args, _ := buildProjectScopeFilter("p", q, 1)
	rows, err := r.pool.Query(ctx, `
		SELECT
			u.id,
			TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
			COALESCE(SUM(rw.total_hours), 0)::text,
			COALESCE(SUM(rw.total_amount), 0)::text,
			COUNT(DISTINCT rw.project_id) FILTER (WHERE p.status = 'active')::int
		FROM users u
		JOIN reports_worker rw ON rw.worker_id = u.id AND rw.status = 'accepted'
		JOIN projects p ON p.id = rw.project_id AND p.deleted_at IS NULL
		WHERE u.deleted_at IS NULL`+projectWhere+`
		GROUP BY u.id, u.first_name, u.last_name
		ORDER BY u.last_name, u.first_name`, args...)
	if err != nil {
		return nil, fmt.Errorf("finance workers: %w", err)
	}
	defer rows.Close()

	var items = make([]dto.WorkerFinanceResponse, 0)
	for rows.Next() {
		var item dto.WorkerFinanceResponse
		if err := rows.Scan(
			&item.WorkerID, &item.WorkerName, &item.TotalHours, &item.TotalPaid, &item.ActiveProjects,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *FinanceRepository) WorkerByID(ctx context.Context, id string) (*dto.WorkerFinanceResponse, error) {
	var item dto.WorkerFinanceResponse
	err := r.pool.QueryRow(ctx, `
		SELECT
			u.id,
			TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
			COALESCE(SUM(rw.total_hours), 0)::text,
			COALESCE(SUM(rw.total_amount), 0)::text,
			COUNT(DISTINCT rw.project_id) FILTER (WHERE p.status = 'active')::int
		FROM users u
		LEFT JOIN reports_worker rw ON rw.worker_id = u.id AND rw.status = 'accepted'
		LEFT JOIN projects p ON p.id = rw.project_id AND p.deleted_at IS NULL
		WHERE u.id = $1 AND u.deleted_at IS NULL
		GROUP BY u.id, u.first_name, u.last_name`, id).Scan(
		&item.WorkerID, &item.WorkerName, &item.TotalHours, &item.TotalPaid, &item.ActiveProjects,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("finance worker: %w", err)
	}
	return &item, nil
}

func (r *FinanceRepository) Categories(ctx context.Context, q dto.FinanceCategoryQuery) ([]dto.ExpenseCategoryResponse, error) {
	where := `WHERE rw.status = 'accepted'`
	args := []any{}
	argN := 1

	if q.ProjectID != "" {
		where += fmt.Sprintf(` AND rw.project_id = $%d`, argN)
		args = append(args, q.ProjectID)
		argN++
	}
	if q.ProjectStatus == "active" {
		where += ` AND p.status = 'active'`
	} else if q.ProjectStatus == "completed" {
		where += ` AND p.status IN ('done', 'archive')`
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

	query := `
		SELECT re.expense_type, COALESCE(SUM(re.amount), 0)::text, COUNT(*)::int
		FROM report_expenses re
		JOIN reports_worker rw ON rw.id = re.report_id
		JOIN projects p ON p.id = rw.project_id AND p.deleted_at IS NULL
		` + where + `
		GROUP BY re.expense_type
		ORDER BY SUM(re.amount) DESC`

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("finance categories: %w", err)
	}
	defer rows.Close()

	var items = make([]dto.ExpenseCategoryResponse, 0)
	for rows.Next() {
		var item dto.ExpenseCategoryResponse
		if err := rows.Scan(&item.Category, &item.Amount, &item.Count); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func subtractMoney(a, b string) string {
	av := parseFloatOrZero(a)
	bv := parseFloatOrZero(b)
	return formatMoneyRepo(av - bv)
}

func formatMoneyRepo(v float64) string {
	if v < 0 {
		v = 0
	}
	return fmt.Sprintf("%.2f", v)
}

func buildProjectScopeFilter(alias string, q dto.FinanceScopeQuery, startArg int) (string, []any, int) {
	where := ""
	args := make([]any, 0, 2)
	argN := startArg
	if q.ProjectID != "" {
		where += fmt.Sprintf(" AND %s.id = $%d", alias, argN)
		args = append(args, q.ProjectID)
		argN++
	}
	if q.ProjectStatus == "active" {
		where += fmt.Sprintf(" AND %s.status = 'active'", alias)
	}
	if q.ProjectStatus == "completed" {
		where += fmt.Sprintf(" AND %s.status IN ('done', 'archive')", alias)
	}
	return where, args, argN
}
