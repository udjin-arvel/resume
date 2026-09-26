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
)

type ToolAssignmentRepository struct {
	pool *pgxpool.Pool
}

func NewToolAssignmentRepository(pool *pgxpool.Pool) *ToolAssignmentRepository {
	return &ToolAssignmentRepository{pool: pool}
}

func (r *ToolAssignmentRepository) MarkUsedInReport(ctx context.Context, projectID string, assignmentIDs []string) error {
	if len(assignmentIDs) == 0 {
		return nil
	}
	_, err := r.pool.Exec(ctx, `
		UPDATE tool_assignments
		SET used_in_report = TRUE
		WHERE project_id = $1 AND id = ANY($2::uuid[])`, projectID, assignmentIDs)
	if err != nil {
		return fmt.Errorf("mark tools used in report: %w", err)
	}
	return nil
}

func (r *ToolAssignmentRepository) Assign(ctx context.Context, toolID, projectID string, responsibleUserID *string) (*models.ToolAssignment, error) {
	var a models.ToolAssignment
	err := r.pool.QueryRow(ctx, `
		INSERT INTO tool_assignments (tool_id, project_id, responsible_user_id)
		VALUES ($1, $2, $3)
		RETURNING id, tool_id, project_id, responsible_user_id, assigned_at, returned_at, condition_on_return, used_in_report`,
		toolID, projectID, responsibleUserID,
	).Scan(&a.ID, &a.ToolID, &a.ProjectID, &a.ResponsibleUserID, &a.AssignedAt, &a.ReturnedAt, &a.ConditionOnReturn, &a.UsedInReport)
	if err != nil {
		return nil, fmt.Errorf("assign tool: %w", err)
	}
	return &a, nil
}

func (r *ToolAssignmentRepository) Return(ctx context.Context, assignmentID, condition string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE tool_assignments SET returned_at = NOW(), condition_on_return = $2
		WHERE id = $1 AND returned_at IS NULL`, assignmentID, condition)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func scanToolAssignment(row pgx.Row) (*models.ToolAssignment, error) {
	var a models.ToolAssignment
	err := row.Scan(
		&a.ID, &a.ToolID, &a.ProjectID, &a.ProjectName,
		&a.ResponsibleUserID, &a.ResponsibleName, &a.ResponsibleRole,
		&a.AssignedAt, &a.ReturnedAt, &a.ConditionOnReturn, &a.UsedInReport,
	)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *ToolAssignmentRepository) GetActiveByToolID(ctx context.Context, toolID string) (*models.ToolAssignment, *time.Time, error) {
	var a models.ToolAssignment
	var plannedReturn *time.Time
	err := r.pool.QueryRow(ctx, `
		SELECT ta.id, ta.tool_id, ta.project_id, p.name,
			ta.responsible_user_id,
			TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
			COALESCE(u.role::text, ''),
			ta.assigned_at, ta.returned_at, ta.condition_on_return, ta.used_in_report,
			p.end_date
		FROM tool_assignments ta
		JOIN projects p ON p.id = ta.project_id
		LEFT JOIN users u ON u.id = ta.responsible_user_id
		WHERE ta.tool_id = $1 AND ta.returned_at IS NULL
		ORDER BY ta.assigned_at DESC
		LIMIT 1`, toolID).Scan(
		&a.ID, &a.ToolID, &a.ProjectID, &a.ProjectName,
		&a.ResponsibleUserID, &a.ResponsibleName, &a.ResponsibleRole,
		&a.AssignedAt, &a.ReturnedAt, &a.ConditionOnReturn, &a.UsedInReport,
		&plannedReturn,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil, nil
	}
	if err != nil {
		return nil, nil, err
	}
	return &a, plannedReturn, nil
}

func (r *ToolAssignmentRepository) ListByToolID(ctx context.Context, toolID string, limit int) ([]models.ToolAssignment, error) {
	if limit <= 0 {
		limit = 20
	}
	rows, err := r.pool.Query(ctx, `
		SELECT ta.id, ta.tool_id, ta.project_id, p.name,
			ta.responsible_user_id,
			TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
			COALESCE(u.role::text, ''),
			ta.assigned_at, ta.returned_at, ta.condition_on_return, ta.used_in_report
		FROM tool_assignments ta
		JOIN projects p ON p.id = ta.project_id
		LEFT JOIN users u ON u.id = ta.responsible_user_id
		WHERE ta.tool_id = $1
		ORDER BY ta.assigned_at DESC
		LIMIT $2`, toolID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.ToolAssignment
	for rows.Next() {
		a, err := scanToolAssignment(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *a)
	}
	return items, rows.Err()
}

func (r *ToolAssignmentRepository) ListByProject(ctx context.Context, projectID string) ([]models.ToolAssignment, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT ta.id, ta.tool_id, ta.project_id, p.name,
			ta.responsible_user_id,
			TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
			ta.assigned_at, ta.returned_at, ta.condition_on_return, ta.used_in_report
		FROM tool_assignments ta
		JOIN projects p ON p.id = ta.project_id
		LEFT JOIN users u ON u.id = ta.responsible_user_id
		WHERE ta.project_id = $1 AND ta.returned_at IS NULL
		ORDER BY ta.assigned_at DESC`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.ToolAssignment
	for rows.Next() {
		var a models.ToolAssignment
		if err := rows.Scan(
			&a.ID, &a.ToolID, &a.ProjectID, &a.ProjectName,
			&a.ResponsibleUserID, &a.ResponsibleName,
			&a.AssignedAt, &a.ReturnedAt, &a.ConditionOnReturn, &a.UsedInReport,
		); err != nil {
			return nil, err
		}
		items = append(items, a)
	}
	return items, rows.Err()
}

func (r *ToolAssignmentRepository) MarkOverdueUnreturned(ctx context.Context, olderThan time.Time) (int64, error) {
	tag, err := r.pool.Exec(ctx, `
		UPDATE tools SET status = 'overdue', updated_at = NOW()
		WHERE id IN (
			SELECT ta.tool_id FROM tool_assignments ta
			WHERE ta.returned_at IS NULL AND ta.assigned_at < $1
		) AND status = 'assigned'`, olderThan)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}
