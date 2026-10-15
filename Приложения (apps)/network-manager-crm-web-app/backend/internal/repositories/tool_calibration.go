package repositories

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/radar-crm/backend/internal/models"
)

type ToolCalibrationRepository struct {
	pool *pgxpool.Pool
}

func NewToolCalibrationRepository(pool *pgxpool.Pool) *ToolCalibrationRepository {
	return &ToolCalibrationRepository{pool: pool}
}

func (r *ToolCalibrationRepository) Create(ctx context.Context, c *models.ToolCalibration) error {
	calibratedAt := c.CalibratedAt
	if calibratedAt.IsZero() {
		calibratedAt = time.Now()
	}
	query := `
		INSERT INTO tool_calibrations (tool_id, calibrated_at, next_due_at, performed_by, notes)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, calibrated_at, created_at`
	err := r.pool.QueryRow(ctx, query,
		c.ToolID, calibratedAt, c.NextDueAt, c.PerformedBy, c.Notes,
	).Scan(&c.ID, &c.CalibratedAt, &c.CreatedAt)
	if err != nil {
		return fmt.Errorf("create calibration: %w", err)
	}
	return nil
}

func (r *ToolCalibrationRepository) ListByToolID(ctx context.Context, toolID string, limit int) ([]models.ToolCalibration, error) {
	if limit <= 0 {
		limit = 5
	}
	rows, err := r.pool.Query(ctx, `
		SELECT tc.id, tc.tool_id, tc.calibrated_at, tc.next_due_at, tc.performed_by,
			TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
			tc.notes, tc.created_at
		FROM tool_calibrations tc
		LEFT JOIN users u ON u.id = tc.performed_by
		WHERE tc.tool_id = $1
		ORDER BY tc.calibrated_at DESC
		LIMIT $2`, toolID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.ToolCalibration
	for rows.Next() {
		var c models.ToolCalibration
		if err := rows.Scan(
			&c.ID, &c.ToolID, &c.CalibratedAt, &c.NextDueAt, &c.PerformedBy,
			&c.PerformerName, &c.Notes, &c.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, c)
	}
	return items, rows.Err()
}

func (r *ToolCalibrationRepository) ListDueWithin(ctx context.Context, before time.Time) ([]models.Tool, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT t.id, t.name, t.serial_number, t.tool_type, t.model, t.control_type::text, t.status::text,
			t.calibration_due_at, t.calibration_period_months, t.usage_limit, t.usage_count, t.usage_unit,
			t.cost_cents, t.purchase_date, t.comment, t.created_at, t.updated_at
		FROM tools t
		WHERE t.control_type IN ('calibration', 'expiry', 'combined')
			AND t.calibration_due_at IS NOT NULL
			AND t.calibration_due_at <= $1
			AND t.status != 'written_off'`, before)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Tool
	for rows.Next() {
		var t models.Tool
		if err := rows.Scan(
			&t.ID, &t.Name, &t.SerialNumber, &t.ToolType, &t.Model, &t.ControlType, &t.Status,
			&t.CalibrationDueAt, &t.CalibrationPeriodMonths, &t.UsageLimit, &t.UsageCount, &t.UsageUnit,
			&t.CostCents, &t.PurchaseDate, &t.Comment, &t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, t)
	}
	return items, rows.Err()
}
