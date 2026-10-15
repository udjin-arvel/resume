package repositories

import (
	"context"
	"fmt"

	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/models/dto"
)

func (r *DocumentRepository) List(ctx context.Context, q dto.DocumentListQuery) ([]models.Document, error) {
	where := `WHERE 1=1`
	args := []any{}
	argN := 1

	if q.EntityType != "" {
		where += fmt.Sprintf(` AND entity_type = $%d`, argN)
		args = append(args, q.EntityType)
		argN++
	}
	if q.EntityID != "" {
		where += fmt.Sprintf(` AND entity_id = $%d`, argN)
		args = append(args, q.EntityID)
		argN++
	}

	query := `SELECT ` + documentColumns + ` FROM documents ` + where + ` ORDER BY created_at DESC LIMIT 100`
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list documents: %w", err)
	}
	defer rows.Close()

	var items []models.Document
	for rows.Next() {
		d, err := scanDocument(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *d)
	}
	return items, rows.Err()
}

func (r *DocumentRepository) UpdateFile(ctx context.Context, d *models.Document) error {
	query := `
		UPDATE documents SET
			filename = $2, mime_type = $3, size_bytes = $4, storage_path = $5, updated_at = NOW()
		WHERE id = $1
		RETURNING updated_at`
	return r.pool.QueryRow(ctx, query,
		d.ID, d.Filename, d.MimeType, d.SizeBytes, d.StoragePath,
	).Scan(&d.UpdatedAt)
}

func (r *DocumentRepository) ListByOwner(ctx context.Context, ownerID string) ([]models.Document, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+documentColumns+` FROM documents WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 100`, ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []models.Document
	for rows.Next() {
		d, err := scanDocument(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *d)
	}
	return items, rows.Err()
}
