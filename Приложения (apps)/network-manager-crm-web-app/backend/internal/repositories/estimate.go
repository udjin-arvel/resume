package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/models/dto"
)

type EstimateRepository struct {
	pool *pgxpool.Pool
}

func NewEstimateRepository(pool *pgxpool.Pool) *EstimateRepository {
	return &EstimateRepository{pool: pool}
}

const estimateColumns = `id, client_id, created_by, name, company_name, contact_person, phone, email,
	country, city, comment, status, total_amount, created_at, updated_at`

const blockColumns = `id, estimate_id, block_type, sort_order, title, quantity, unit, unit_price,
	role, hours, rate, amount, comment`

func scanEstimate(row pgx.Row) (*models.Estimate, error) {
	var e models.Estimate
	err := row.Scan(
		&e.ID, &e.ClientID, &e.CreatedBy, &e.Name, &e.CompanyName, &e.ContactPerson, &e.Phone, &e.Email,
		&e.Country, &e.City, &e.Comment, &e.Status, &e.TotalAmount, &e.CreatedAt, &e.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func scanBlock(row pgx.Row) (*models.EstimateBlock, error) {
	var b models.EstimateBlock
	err := row.Scan(
		&b.ID, &b.EstimateID, &b.BlockType, &b.SortOrder, &b.Title, &b.Quantity, &b.Unit, &b.UnitPrice,
		&b.Role, &b.Hours, &b.Rate, &b.Amount, &b.Comment,
	)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *EstimateRepository) List(ctx context.Context, q dto.EstimateListQuery) ([]models.Estimate, int64, error) {
	page, pageSize := normalizePagination(q.Page, q.PageSize)
	offset := (page - 1) * pageSize

	where := `WHERE 1=1`
	args := []any{}
	argN := 1

	if q.Status != "" {
		where += fmt.Sprintf(` AND status = $%d`, argN)
		args = append(args, q.Status)
		argN++
	}

	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM estimates `+where, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count estimates: %w", err)
	}

	listQuery := `SELECT ` + estimateColumns + ` FROM estimates ` + where +
		fmt.Sprintf(` ORDER BY updated_at DESC LIMIT $%d OFFSET $%d`, argN, argN+1)
	listArgs := append(args, pageSize, offset)

	rows, err := r.pool.Query(ctx, listQuery, listArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("list estimates: %w", err)
	}
	defer rows.Close()

	var items []models.Estimate
	for rows.Next() {
		e, err := scanEstimate(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, *e)
	}
	return items, total, rows.Err()
}

func (r *EstimateRepository) GetByID(ctx context.Context, id string) (*models.Estimate, error) {
	query := `SELECT ` + estimateColumns + ` FROM estimates WHERE id = $1`
	e, err := scanEstimate(r.pool.QueryRow(ctx, query, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get estimate: %w", err)
	}
	return e, nil
}

func (r *EstimateRepository) GetBlocksByEstimateID(ctx context.Context, estimateID string) ([]models.EstimateBlock, error) {
	query := `SELECT ` + blockColumns + ` FROM estimate_blocks WHERE estimate_id = $1 ORDER BY sort_order ASC, created_at ASC`
	rows, err := r.pool.Query(ctx, query, estimateID)
	if err != nil {
		return nil, fmt.Errorf("list blocks: %w", err)
	}
	defer rows.Close()

	var blocks []models.EstimateBlock
	for rows.Next() {
		b, err := scanBlock(rows)
		if err != nil {
			return nil, err
		}
		blocks = append(blocks, *b)
	}
	return blocks, rows.Err()
}

func (r *EstimateRepository) Create(ctx context.Context, e *models.Estimate, blocks []models.EstimateBlock) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO estimates (
			client_id, created_by, name, company_name, contact_person, phone, email,
			country, city, comment, status, total_amount
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft',$11)
		RETURNING id, created_at, updated_at`
	err = tx.QueryRow(ctx, query,
		e.ClientID, e.CreatedBy, e.Name, e.CompanyName, e.ContactPerson, e.Phone, e.Email,
		e.Country, e.City, e.Comment, e.TotalAmount,
	).Scan(&e.ID, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return fmt.Errorf("create estimate: %w", err)
	}
	e.Status = "draft"

	if err := insertBlocks(ctx, tx, e.ID, blocks); err != nil {
		return err
	}
	if err := recalculateTotalTx(ctx, tx, e.ID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *EstimateRepository) Update(ctx context.Context, e *models.Estimate, blocks []models.EstimateBlock) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var status string
	err = tx.QueryRow(ctx, `SELECT status FROM estimates WHERE id = $1`, e.ID).Scan(&status)
	if errors.Is(err, pgx.ErrNoRows) {
		return apperrors.ErrNotFound
	}
	if err != nil {
		return err
	}
	if status != "draft" && status != "approved" {
		return apperrors.New(apperrors.ErrValidation, "only draft or approved estimates can be edited")
	}

	query := `
		UPDATE estimates SET
			client_id = $2, name = $3, company_name = $4, contact_person = $5, phone = $6, email = $7,
			country = $8, city = $9, comment = $10, updated_at = NOW()
		WHERE id = $1
		RETURNING created_by, status, total_amount, created_at, updated_at`
	err = tx.QueryRow(ctx, query,
		e.ID, e.ClientID, e.Name, e.CompanyName, e.ContactPerson, e.Phone, e.Email,
		e.Country, e.City, e.Comment,
	).Scan(&e.CreatedBy, &e.Status, &e.TotalAmount, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return fmt.Errorf("update estimate: %w", err)
	}

	if _, err := tx.Exec(ctx, `DELETE FROM estimate_blocks WHERE estimate_id = $1`, e.ID); err != nil {
		return err
	}
	if err := insertBlocks(ctx, tx, e.ID, blocks); err != nil {
		return err
	}
	if err := recalculateTotalTx(ctx, tx, e.ID); err != nil {
		return err
	}

	var total string
	if err := tx.QueryRow(ctx, `SELECT total_amount::text FROM estimates WHERE id = $1`, e.ID).Scan(&total); err != nil {
		return err
	}
	e.TotalAmount = total
	return tx.Commit(ctx)
}

func (r *EstimateRepository) Delete(ctx context.Context, id string) error {
	var status string
	err := r.pool.QueryRow(ctx, `SELECT status FROM estimates WHERE id = $1`, id).Scan(&status)
	if errors.Is(err, pgx.ErrNoRows) {
		return apperrors.ErrNotFound
	}
	if err != nil {
		return err
	}
	if status != "draft" {
		return apperrors.New(apperrors.ErrValidation, "only draft estimates can be deleted")
	}
	tag, err := r.pool.Exec(ctx, `DELETE FROM estimates WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *EstimateRepository) UpdateStatus(ctx context.Context, id, status string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE estimates SET status = $2, updated_at = NOW() WHERE id = $1`, id, status)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *EstimateRepository) SetClientID(ctx context.Context, id, clientID string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE estimates SET client_id = $2, updated_at = NOW() WHERE id = $1`, id, clientID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func insertBlocks(ctx context.Context, tx pgx.Tx, estimateID string, blocks []models.EstimateBlock) error {
	for _, b := range blocks {
		qty, unitPrice, hours, rate, amount := numericOrZero(b.Quantity), numericOrZero(b.UnitPrice),
			numericOrZero(b.Hours), numericOrZero(b.Rate), numericOrZero(b.Amount)
		_, err := tx.Exec(ctx, `
			INSERT INTO estimate_blocks (
				estimate_id, block_type, sort_order, title, quantity, unit, unit_price,
				role, hours, rate, amount, comment
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
			estimateID, b.BlockType, b.SortOrder, b.Title, qty, b.Unit, unitPrice,
			b.Role, hours, rate, amount, b.Comment,
		)
		if err != nil {
			return fmt.Errorf("insert block: %w", err)
		}
	}
	return nil
}

func recalculateTotalTx(ctx context.Context, tx pgx.Tx, estimateID string) error {
	_, err := tx.Exec(ctx, `
		UPDATE estimates SET total_amount = COALESCE((
			SELECT SUM(amount) FROM estimate_blocks WHERE estimate_id = $1
		), 0), updated_at = NOW() WHERE id = $1`, estimateID)
	return err
}

func numericOrZero(s string) string {
	if s == "" {
		return "0"
	}
	return s
}
