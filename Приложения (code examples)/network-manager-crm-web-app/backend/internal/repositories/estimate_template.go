package repositories

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/models"
)

type EstimateTemplateRepository struct {
	pool *pgxpool.Pool
}

func NewEstimateTemplateRepository(pool *pgxpool.Pool) *EstimateTemplateRepository {
	return &EstimateTemplateRepository{pool: pool}
}

const templateBlockColumns = `id, template_id, block_type, sort_order, title, quantity, unit, unit_price,
	role, hours, rate, amount, comment`

func scanTemplateBlock(row pgx.Row) (*models.EstimateTemplateBlock, error) {
	var b models.EstimateTemplateBlock
	err := row.Scan(
		&b.ID, &b.TemplateID, &b.BlockType, &b.SortOrder, &b.Title, &b.Quantity, &b.Unit, &b.UnitPrice,
		&b.Role, &b.Hours, &b.Rate, &b.Amount, &b.Comment,
	)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *EstimateTemplateRepository) List(ctx context.Context) ([]models.EstimateTemplate, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, created_by, created_at, updated_at
		FROM estimate_templates ORDER BY name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.EstimateTemplate
	for rows.Next() {
		var t models.EstimateTemplate
		var createdAt, updatedAt interface{}
		if err := rows.Scan(&t.ID, &t.Name, &t.CreatedBy, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		items = append(items, t)
	}
	return items, rows.Err()
}

func (r *EstimateTemplateRepository) GetByID(ctx context.Context, id string) (*models.EstimateTemplate, error) {
	var t models.EstimateTemplate
	err := r.pool.QueryRow(ctx,
		`SELECT id, name, created_by FROM estimate_templates WHERE id = $1`, id,
	).Scan(&t.ID, &t.Name, &t.CreatedBy)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	rows, err := r.pool.Query(ctx,
		`SELECT `+templateBlockColumns+` FROM estimate_template_blocks WHERE template_id = $1 ORDER BY sort_order`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		b, err := scanTemplateBlock(rows)
		if err != nil {
			return nil, err
		}
		t.Blocks = append(t.Blocks, *b)
	}
	return &t, rows.Err()
}

func (r *EstimateTemplateRepository) CreateFromEstimate(ctx context.Context, estimateID, name string, createdBy *string) (string, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)

	var templateID string
	err = tx.QueryRow(ctx,
		`INSERT INTO estimate_templates (name, created_by) VALUES ($1, $2) RETURNING id`,
		name, createdBy,
	).Scan(&templateID)
	if err != nil {
		return "", err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO estimate_template_blocks (
			template_id, block_type, sort_order, title, quantity, unit, unit_price,
			role, hours, rate, amount, comment
		)
		SELECT $1, block_type, sort_order, title, quantity, unit, unit_price,
			role, hours, rate, amount, comment
		FROM estimate_blocks WHERE estimate_id = $2`, templateID, estimateID)
	if err != nil {
		return "", err
	}

	if err := tx.Commit(ctx); err != nil {
		return "", err
	}
	return templateID, nil
}

func (r *EstimateTemplateRepository) CreateEstimateFromTemplate(ctx context.Context, templateID, name string, createdBy *string) (string, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)

	tpl, err := r.GetByID(ctx, templateID)
	if err != nil {
		return "", err
	}
	estimateName := name
	if estimateName == "" {
		estimateName = tpl.Name
	}

	var estimateID string
	err = tx.QueryRow(ctx, `
		INSERT INTO estimates (created_by, name, status, total_amount)
		VALUES ($1, $2, 'draft', 0) RETURNING id`, createdBy, estimateName,
	).Scan(&estimateID)
	if err != nil {
		return "", err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO estimate_blocks (
			estimate_id, block_type, sort_order, title, quantity, unit, unit_price,
			role, hours, rate, amount, comment
		)
		SELECT $1, block_type, sort_order, title, quantity, unit, unit_price,
			role, hours, rate, amount, comment
		FROM estimate_template_blocks WHERE template_id = $2`, estimateID, templateID)
	if err != nil {
		return "", err
	}

	if err := recalculateTotalTx(ctx, tx, estimateID); err != nil {
		return "", err
	}
	return estimateID, tx.Commit(ctx)
}
