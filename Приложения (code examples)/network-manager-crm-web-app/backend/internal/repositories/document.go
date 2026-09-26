package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/models"
)

type DocumentRepository struct {
	pool *pgxpool.Pool
}

func NewDocumentRepository(pool *pgxpool.Pool) *DocumentRepository {
	return &DocumentRepository{pool: pool}
}

const documentColumns = `id, owner_id, entity_type, entity_id, document_type, filename,
	mime_type, size_bytes, storage_path, created_at, updated_at`

func scanDocument(row pgx.Row) (*models.Document, error) {
	var d models.Document
	err := row.Scan(
		&d.ID, &d.OwnerID, &d.EntityType, &d.EntityID, &d.DocumentType, &d.Filename,
		&d.MimeType, &d.SizeBytes, &d.StoragePath, &d.CreatedAt, &d.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *DocumentRepository) Create(ctx context.Context, d *models.Document) error {
	query := `
		INSERT INTO documents (
			owner_id, entity_type, entity_id, document_type, filename, mime_type, size_bytes, storage_path
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at, updated_at`
	err := r.pool.QueryRow(ctx, query,
		d.OwnerID, d.EntityType, d.EntityID, d.DocumentType, d.Filename, d.MimeType, d.SizeBytes, d.StoragePath,
	).Scan(&d.ID, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		return fmt.Errorf("create document: %w", err)
	}
	return nil
}

func (r *DocumentRepository) GetByID(ctx context.Context, id string) (*models.Document, error) {
	query := `SELECT ` + documentColumns + ` FROM documents WHERE id = $1`
	d, err := scanDocument(r.pool.QueryRow(ctx, query, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get document: %w", err)
	}
	return d, nil
}

func (r *DocumentRepository) Delete(ctx context.Context, id string) (*models.Document, error) {
	query := `DELETE FROM documents WHERE id = $1 RETURNING ` + documentColumns
	d, err := scanDocument(r.pool.QueryRow(ctx, query, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("delete document: %w", err)
	}
	return d, nil
}
