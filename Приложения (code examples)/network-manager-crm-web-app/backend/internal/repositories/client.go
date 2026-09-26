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

type ClientRepository struct {
	pool *pgxpool.Pool
}

func NewClientRepository(pool *pgxpool.Pool) *ClientRepository {
	return &ClientRepository{pool: pool}
}

const clientColumns = `id, name, country, city, contact_person, phone, email, comment, created_at, updated_at, deleted_at`

func scanClient(row pgx.Row) (*models.Client, error) {
	var c models.Client
	err := row.Scan(
		&c.ID, &c.Name, &c.Country, &c.City, &c.ContactPerson, &c.Phone, &c.Email, &c.Comment,
		&c.CreatedAt, &c.UpdatedAt, &c.DeletedAt,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *ClientRepository) List(ctx context.Context, q dto.PaginationQuery) ([]models.Client, int64, error) {
	page, pageSize := normalizePagination(q.Page, q.PageSize)
	offset := (page - 1) * pageSize

	where := `WHERE deleted_at IS NULL`
	args := []any{}
	if q.Search != "" {
		where += ` AND (name ILIKE $1 OR COALESCE(city, '') ILIKE $1 OR COALESCE(country, '') ILIKE $1)`
		args = append(args, "%"+q.Search+"%")
	}

	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM clients `+where, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count clients: %w", err)
	}

	listQuery := `SELECT ` + clientColumns + ` FROM clients ` + where
	listArgs := append([]any{}, args...)
	listQuery += fmt.Sprintf(` ORDER BY name ASC LIMIT $%d OFFSET $%d`, len(listArgs)+1, len(listArgs)+2)
	listArgs = append(listArgs, pageSize, offset)

	rows, err := r.pool.Query(ctx, listQuery, listArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("list clients: %w", err)
	}
	defer rows.Close()

	var clients []models.Client
	for rows.Next() {
		c, err := scanClient(rows)
		if err != nil {
			return nil, 0, fmt.Errorf("scan client: %w", err)
		}
		clients = append(clients, *c)
	}
	return clients, total, rows.Err()
}

func (r *ClientRepository) GetByID(ctx context.Context, id string) (*models.Client, error) {
	query := `SELECT ` + clientColumns + ` FROM clients WHERE id = $1 AND deleted_at IS NULL`
	c, err := scanClient(r.pool.QueryRow(ctx, query, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get client: %w", err)
	}
	return c, nil
}

func (r *ClientRepository) Create(ctx context.Context, c *models.Client) error {
	query := `
		INSERT INTO clients (name, country, city, contact_person, phone, email, comment)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at`
	err := r.pool.QueryRow(ctx, query,
		c.Name, c.Country, c.City, c.ContactPerson, c.Phone, c.Email, c.Comment,
	).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return fmt.Errorf("create client: %w", err)
	}
	return nil
}

func (r *ClientRepository) Update(ctx context.Context, c *models.Client) error {
	query := `
		UPDATE clients SET
			name = $2, country = $3, city = $4, contact_person = $5,
			phone = $6, email = $7, comment = $8, updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING updated_at`
	err := r.pool.QueryRow(ctx, query,
		c.ID, c.Name, c.Country, c.City, c.ContactPerson, c.Phone, c.Email, c.Comment,
	).Scan(&c.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return apperrors.ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("update client: %w", err)
	}
	return nil
}

func (r *ClientRepository) SoftDelete(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE clients SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, id)
	if err != nil {
		return fmt.Errorf("delete client: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}
