package repositories

import (
	"context"
	"fmt"

	"github.com/radar-crm/backend/internal/models/dto"
)

const workerFinanceReportAmountsCTE = `
WITH report_amounts AS (
	SELECT
		rw.id,
		rw.project_id,
		rw.status,
		rw.total_hours,
		(rw.total_hours * u.hourly_rate) AS labor,
		COALESCE(exp.expense_total, 0) AS expenses
	FROM reports_worker rw
	JOIN users u ON u.id = rw.worker_id
	JOIN project_workers pw ON pw.project_id = rw.project_id
		AND pw.user_id = rw.worker_id
		AND pw.confirmation_status = 'confirmed'
	LEFT JOIN LATERAL (
		SELECT COALESCE(SUM(re.amount), 0) AS expense_total
		FROM report_expenses re
		WHERE re.report_id = rw.id
	) exp ON TRUE
	WHERE rw.worker_id = $1 AND rw.status != 'draft'
)`

func (r *FinanceRepository) Mine(ctx context.Context, userID string) (*dto.WorkerFinanceMineResponse, error) {
	resp := &dto.WorkerFinanceMineResponse{
		Projects: []dto.WorkerProjectFinanceResponse{},
	}

	err := r.pool.QueryRow(ctx, workerFinanceReportAmountsCTE+`
		SELECT
			COALESCE(SUM(total_hours), 0)::text,
			COALESCE(SUM(total_hours) FILTER (WHERE status = 'accepted'), 0)::text,
			COALESCE(SUM(labor + expenses) FILTER (WHERE status = 'accepted'), 0)::text,
			COALESCE(SUM(labor + expenses) FILTER (WHERE status IN ('review', 'returned')), 0)::text
		FROM report_amounts`,
		userID,
	).Scan(&resp.TotalHours, &resp.ConfirmedHours, &resp.PaidAmount, &resp.RemainingAmount)
	if err != nil {
		return nil, fmt.Errorf("worker finance overview: %w", err)
	}

	rows, err := r.pool.Query(ctx, workerFinanceReportAmountsCTE+`
		SELECT
			p.id,
			p.name,
			COALESCE(SUM(ra.total_hours), 0)::text,
			COALESCE(SUM(ra.labor), 0)::text,
			COALESCE(SUM(ra.expenses), 0)::text,
			COALESCE(SUM(ra.labor + ra.expenses) FILTER (WHERE ra.status = 'accepted'), 0)::text,
			COALESCE(SUM(ra.labor + ra.expenses) FILTER (WHERE ra.status IN ('review', 'returned')), 0)::text
		FROM project_workers pw
		JOIN projects p ON p.id = pw.project_id AND p.deleted_at IS NULL
		JOIN report_amounts ra ON ra.project_id = p.id
		WHERE pw.user_id = $1 AND pw.confirmation_status = 'confirmed'
		GROUP BY p.id, p.name
		ORDER BY p.name ASC`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("worker finance projects: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var item dto.WorkerProjectFinanceResponse
		if err := rows.Scan(
			&item.ProjectID, &item.ProjectName, &item.TotalHours,
			&item.ProjectAmount, &item.ExtraExpenses, &item.PaidAmount, &item.RemainingAmount,
		); err != nil {
			return nil, err
		}
		resp.Projects = append(resp.Projects, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return resp, nil
}
