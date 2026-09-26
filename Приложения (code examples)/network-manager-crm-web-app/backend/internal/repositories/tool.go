package repositories

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/models/dto"
)

type ToolRepository struct {
	pool *pgxpool.Pool
}

func NewToolRepository(pool *pgxpool.Pool) *ToolRepository {
	return &ToolRepository{pool: pool}
}

const toolColumns = `t.id, t.name, t.serial_number, t.tool_type, t.model, t.control_type::text, t.status::text,
	t.calibration_due_at, t.calibration_period_months, t.usage_limit, t.usage_count, t.usage_unit,
	t.cost_cents, t.purchase_date, t.comment, t.problem_type, t.problem_comment, t.problem_reported_at,
	t.created_at, t.updated_at`

func scanTool(row pgx.Row) (*models.Tool, error) {
	var t models.Tool
	err := row.Scan(
		&t.ID, &t.Name, &t.SerialNumber, &t.ToolType, &t.Model, &t.ControlType, &t.Status,
		&t.CalibrationDueAt, &t.CalibrationPeriodMonths, &t.UsageLimit, &t.UsageCount, &t.UsageUnit,
		&t.CostCents, &t.PurchaseDate, &t.Comment, &t.ProblemType, &t.ProblemComment, &t.ProblemReportedAt,
		&t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *ToolRepository) List(ctx context.Context, q dto.ToolListQuery) ([]models.Tool, int64, error) {
	page, pageSize := normalizePagination(q.Page, q.PageSize)
	offset := (page - 1) * pageSize

	where := `WHERE 1=1`
	args := []any{}
	argN := 1

	switch q.Status {
	case "overdue":
		where += ` AND (t.status = 'overdue' OR (t.control_type IN ('calibration', 'expiry', 'combined') AND t.calibration_due_at < NOW()))`
	case "on_project", "assigned":
		where += ` AND t.status IN ('assigned', 'needs_attention')`
	case "available":
		where += ` AND t.status = 'available'`
	case "attention", "needs_attention":
		where += ` AND (
			t.status = 'needs_attention'
			OR t.status = 'overdue'
			OR (t.control_type IN ('calibration', 'expiry', 'combined') AND t.calibration_due_at IS NOT NULL AND t.calibration_due_at < NOW())
			OR (t.control_type IN ('usage_limit', 'combined') AND t.usage_limit > 0 AND t.usage_count >= t.usage_limit * 9 / 10)
		)`
	case "":
	default:
		where += fmt.Sprintf(` AND t.status = $%d::tool_status`, argN)
		args = append(args, q.Status)
		argN++
	}

	if q.ProjectID != "" {
		where += fmt.Sprintf(` AND EXISTS (
			SELECT 1 FROM tool_assignments ta
			WHERE ta.tool_id = t.id AND ta.project_id = $%d AND ta.returned_at IS NULL
		)`, argN)
		args = append(args, q.ProjectID)
		argN++
	}

	fromClause := `FROM tools t`

	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) `+fromClause+` `+where, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count tools: %w", err)
	}

	listQuery := `SELECT ` + toolColumns + ` ` + fromClause + ` ` + where +
		fmt.Sprintf(` ORDER BY t.name ASC LIMIT $%d OFFSET $%d`, argN, argN+1)
	listArgs := append(args, pageSize, offset)

	rows, err := r.pool.Query(ctx, listQuery, listArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("list tools: %w", err)
	}
	defer rows.Close()

	var items []models.Tool
	for rows.Next() {
		item, err := scanTool(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, *item)
	}
	return items, total, rows.Err()
}

const listItemSelect = toolColumns + `,
	ta.id, ta.project_id, p.name,
	ta.responsible_user_id,
	TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
	COALESCE(u.role::text, ''),
	ta.assigned_at, ta.returned_at, ta.condition_on_return, ta.used_in_report,
	p.end_date,
	lr.last_returned_at`

func scanToolListItem(row pgx.Row) (*models.ToolListItem, error) {
	var item models.ToolListItem
	var (
		assignID, projectID, projectName, responsibleName, responsibleRole *string
		responsibleUserID                                                    *string
		assignedAt, returnedAt, plannedReturn, lastReturned                  *time.Time
		conditionOnReturn                                                    *string
		usedInReport                                                         *bool
	)
	err := row.Scan(
		&item.ID, &item.Name, &item.SerialNumber, &item.ToolType, &item.Model, &item.ControlType, &item.Status,
		&item.CalibrationDueAt, &item.CalibrationPeriodMonths, &item.UsageLimit, &item.UsageCount, &item.UsageUnit,
		&item.CostCents, &item.PurchaseDate, &item.Comment, &item.ProblemType, &item.ProblemComment, &item.ProblemReportedAt,
		&item.CreatedAt, &item.UpdatedAt,
		&assignID, &projectID, &projectName, &responsibleUserID, &responsibleName, &responsibleRole,
		&assignedAt, &returnedAt, &conditionOnReturn, &usedInReport,
		&plannedReturn, &lastReturned,
	)
	if err != nil {
		return nil, err
	}
	item.LastReturnedAt = lastReturned
	item.PlannedReturnAt = plannedReturn
	if assignID != nil && *assignID != "" {
		a := models.ToolAssignment{
			ID:          *assignID,
			ToolID:      item.ID,
			ProjectID:   derefStr(projectID),
			ProjectName: derefStr(projectName),
			ResponsibleUserID: responsibleUserID,
			ResponsibleName:   derefStr(responsibleName),
			ResponsibleRole:   derefStr(responsibleRole),
		}
		if assignedAt != nil {
			a.AssignedAt = *assignedAt
		}
		if returnedAt != nil {
			a.ReturnedAt = returnedAt
		}
		if conditionOnReturn != nil {
			a.ConditionOnReturn = *conditionOnReturn
		}
		if usedInReport != nil {
			a.UsedInReport = *usedInReport
		}
		item.ActiveAssignment = &a
	}
	return &item, nil
}

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func (r *ToolRepository) ListItems(ctx context.Context, q dto.ToolListQuery) ([]models.ToolListItem, int64, error) {
	page, pageSize := normalizePagination(q.Page, q.PageSize)
	offset := (page - 1) * pageSize

	where := `WHERE 1=1`
	args := []any{}
	argN := 1

	switch q.Status {
	case "overdue":
		where += ` AND (t.status = 'overdue' OR (t.control_type IN ('calibration', 'expiry', 'combined') AND t.calibration_due_at < NOW()))`
	case "on_project", "assigned":
		where += ` AND t.status IN ('assigned', 'needs_attention')`
	case "available":
		where += ` AND t.status = 'available'`
	case "attention", "needs_attention":
		where += ` AND (
			t.status = 'needs_attention'
			OR t.status = 'overdue'
			OR (t.control_type IN ('calibration', 'expiry', 'combined') AND t.calibration_due_at IS NOT NULL AND t.calibration_due_at < NOW())
			OR (t.control_type IN ('usage_limit', 'combined') AND t.usage_limit > 0 AND t.usage_count >= t.usage_limit * 9 / 10)
		)`
	case "":
	default:
		where += fmt.Sprintf(` AND t.status = $%d::tool_status`, argN)
		args = append(args, q.Status)
		argN++
	}

	if q.ProjectID != "" {
		where += fmt.Sprintf(` AND EXISTS (
			SELECT 1 FROM tool_assignments ta2
			WHERE ta2.tool_id = t.id AND ta2.project_id = $%d AND ta2.returned_at IS NULL
		)`, argN)
		args = append(args, q.ProjectID)
		argN++
	}

	fromClause := `FROM tools t
		LEFT JOIN LATERAL (
			SELECT ta_inner.*
			FROM tool_assignments ta_inner
			WHERE ta_inner.tool_id = t.id AND ta_inner.returned_at IS NULL
			ORDER BY ta_inner.assigned_at DESC
			LIMIT 1
		) ta ON true
		LEFT JOIN projects p ON p.id = ta.project_id
		LEFT JOIN users u ON u.id = ta.responsible_user_id
		LEFT JOIN LATERAL (
			SELECT MAX(ta_lr.returned_at) AS last_returned_at
			FROM tool_assignments ta_lr
			WHERE ta_lr.tool_id = t.id AND ta_lr.returned_at IS NOT NULL
		) lr ON true`

	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM tools t `+where, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count tools: %w", err)
	}

	listQuery := `SELECT ` + listItemSelect + ` ` + fromClause + ` ` + where +
		fmt.Sprintf(` ORDER BY t.name ASC LIMIT $%d OFFSET $%d`, argN, argN+1)
	listArgs := append(args, pageSize, offset)

	rows, err := r.pool.Query(ctx, listQuery, listArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("list tools: %w", err)
	}
	defer rows.Close()

	var items []models.ToolListItem
	for rows.Next() {
		item, err := scanToolListItem(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, *item)
	}
	return items, total, rows.Err()
}

func (r *ToolRepository) GetByID(ctx context.Context, id string) (*models.Tool, error) {
	query := `SELECT ` + toolColumns + ` FROM tools t WHERE t.id = $1`
	tool, err := scanTool(r.pool.QueryRow(ctx, query, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get tool: %w", err)
	}
	return tool, nil
}

func (r *ToolRepository) Create(ctx context.Context, t *models.Tool) error {
	controlType := t.ControlType
	if controlType == "" {
		controlType = "calibration"
	}
	usageCount := t.UsageCount
	query := `
		INSERT INTO tools (
			name, serial_number, tool_type, model, control_type, status,
			usage_limit, usage_count, usage_unit, cost_cents, purchase_date,
			calibration_period_months, comment
		)
		VALUES ($1, $2, $3, $4, $5, 'available', $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, created_at, updated_at`
	err := r.pool.QueryRow(ctx, query,
		t.Name, t.SerialNumber, t.ToolType, t.Model, controlType,
		t.UsageLimit, usageCount, t.UsageUnit, t.CostCents, t.PurchaseDate,
		t.CalibrationPeriodMonths, t.Comment,
	).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return fmt.Errorf("create tool: %w", err)
	}
	t.Status = "available"
	t.ControlType = controlType
	t.UsageCount = usageCount
	return nil
}

func (r *ToolRepository) Update(ctx context.Context, t *models.Tool) error {
	controlType := t.ControlType
	if controlType == "" {
		controlType = "calibration"
	}
	query := `
		UPDATE tools SET
			name = $2, serial_number = $3, tool_type = $4, model = $5, control_type = $6,
			usage_limit = $7, usage_unit = $8, cost_cents = $9, purchase_date = $10,
			calibration_period_months = $11, comment = $12, updated_at = NOW()
		WHERE id = $1
		RETURNING status::text, usage_count, calibration_due_at, created_at, updated_at`
	err := r.pool.QueryRow(ctx, query,
		t.ID, t.Name, t.SerialNumber, t.ToolType, t.Model, controlType,
		t.UsageLimit, t.UsageUnit, t.CostCents, t.PurchaseDate,
		t.CalibrationPeriodMonths, t.Comment,
	).Scan(&t.Status, &t.UsageCount, &t.CalibrationDueAt, &t.CreatedAt, &t.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return apperrors.ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("update tool: %w", err)
	}
	t.ControlType = controlType
	return nil
}

func (r *ToolRepository) UpdateStatus(ctx context.Context, id, status string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE tools SET status = $2::tool_status, updated_at = NOW() WHERE id = $1`, id, status)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *ToolRepository) UpdateProblem(ctx context.Context, id, problemType, comment string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE tools SET
			status = 'needs_attention'::tool_status,
			problem_type = $2,
			problem_comment = $3,
			problem_reported_at = NOW(),
			updated_at = NOW()
		WHERE id = $1 AND status != 'written_off'`, id, problemType, comment)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *ToolRepository) ClearProblem(ctx context.Context, id, status string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE tools SET
			status = $2::tool_status,
			problem_type = NULL,
			problem_comment = '',
			problem_reported_at = NULL,
			updated_at = NOW()
		WHERE id = $1 AND status = 'needs_attention'`, id, status)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *ToolRepository) UpdateCalibrationDue(ctx context.Context, id string, dueAt *time.Time) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE tools SET calibration_due_at = $2, status = CASE WHEN status = 'overdue' THEN 'available'::tool_status ELSE status END, updated_at = NOW() WHERE id = $1`,
		id, dueAt)
	return err
}

func (r *ToolRepository) IncrementUsageCount(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE tools SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = $1`, id)
	return err
}

func (r *ToolRepository) MarkOverdueCalibration(ctx context.Context, before time.Time) (int64, error) {
	tag, err := r.pool.Exec(ctx, `
		UPDATE tools SET status = 'overdue', updated_at = NOW()
		WHERE control_type IN ('calibration', 'expiry', 'combined')
			AND calibration_due_at IS NOT NULL
			AND calibration_due_at < $1
			AND status != 'written_off'`, before)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

func (r *ToolRepository) ListNeedingCalibrationAttention(ctx context.Context, withinDays int) ([]models.Tool, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT `+toolColumns+`
		FROM tools t
		WHERE t.status != 'written_off'
			AND (
				t.status = 'needs_attention'
				OR t.status = 'overdue'
				OR (t.control_type IN ('calibration', 'expiry', 'combined') AND t.calibration_due_at IS NOT NULL AND t.calibration_due_at < NOW() + ($1 || ' days')::interval)
				OR (t.control_type IN ('usage_limit', 'combined') AND t.usage_limit > 0 AND t.usage_count >= t.usage_limit * 9 / 10)
			)
		ORDER BY t.calibration_due_at ASC NULLS LAST
		LIMIT 50`, fmt.Sprintf("%d", withinDays))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Tool
	for rows.Next() {
		item, err := scanTool(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *item)
	}
	return items, rows.Err()
}

func (r *ToolRepository) CountAttention(ctx context.Context) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*)::int FROM tools t
		WHERE t.status != 'written_off'
			AND (
				t.status = 'needs_attention'
				OR (t.control_type IN ('calibration', 'expiry', 'combined') AND t.calibration_due_at IS NOT NULL AND t.calibration_due_at < NOW() + interval '7 days')
				OR t.status = 'overdue'
				OR (t.control_type IN ('usage_limit', 'combined') AND t.usage_limit > 0 AND t.usage_count >= t.usage_limit * 9 / 10)
			)`).Scan(&count)
	return count, err
}
