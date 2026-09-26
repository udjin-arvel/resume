package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/models/dto"
)

func (r *FinanceRepository) ClientByID(ctx context.Context, clientID string) (*dto.ClientFinanceResponse, error) {
	var item dto.ClientFinanceResponse
	err := r.pool.QueryRow(ctx, `
		SELECT
			$1::text,
			c.name,
			COALESCE(SUM(
				CASE
					WHEN p.budget > 0 THEN p.budget
					WHEN p.estimate_id IS NOT NULL THEN COALESCE(e.total_amount, 0)
					ELSE 0
				END
			), 0)::text,
			COALESCE(SUM(p.spent), 0)::text,
			COALESCE(SUM(labor.total), 0)::text,
			COALESCE(SUM(expenses.total), 0)::text
		FROM clients c
		LEFT JOIN projects p ON p.client_id = c.id AND p.deleted_at IS NULL
		LEFT JOIN estimates e ON e.id = p.estimate_id
		LEFT JOIN LATERAL (
			SELECT SUM(rw.total_amount) AS total
			FROM reports_worker rw
			WHERE rw.project_id = p.id AND rw.status = 'accepted'
		) labor ON TRUE
		LEFT JOIN LATERAL (
			SELECT SUM(re.amount) AS total
			FROM report_expenses re
			JOIN reports_worker rw ON rw.id = re.report_id
			WHERE rw.project_id = p.id AND rw.status = 'accepted'
		) expenses ON TRUE
		WHERE c.id = $1 AND c.deleted_at IS NULL
		GROUP BY c.id, c.name`,
		clientID).Scan(&item.ClientID, &item.ClientName, &item.Budget, &item.Spent, &item.LaborCost, &item.ExpenseCost)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("client finance: %w", err)
	}
	item.Remaining = subtractMoney(item.Budget, item.Spent)
	return &item, nil
}
