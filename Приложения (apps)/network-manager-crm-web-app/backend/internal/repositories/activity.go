package repositories

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/radar-crm/backend/internal/models"
)

type ActivityRepository struct {
	pool *pgxpool.Pool
}

func NewActivityRepository(pool *pgxpool.Pool) *ActivityRepository {
	return &ActivityRepository{pool: pool}
}

func (r *ActivityRepository) Create(ctx context.Context, actorID, action, entityType, entityID string, metadata map[string]any) error {
	metaJSON, err := json.Marshal(metadata)
	if err != nil {
		metaJSON = []byte("{}")
	}
	var actor *string
	if actorID != "" {
		actor = &actorID
	}
	var entity *string
	if entityID != "" {
		entity = &entityID
	}
	_, err = r.pool.Exec(ctx, `
		INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, metadata)
		VALUES ($1, $2, $3, $4, $5)`,
		actor, action, entityType, entity, metaJSON)
	if err != nil {
		return fmt.Errorf("create activity: %w", err)
	}
	return nil
}

func (r *ActivityRepository) ListRecent(ctx context.Context, limit int) ([]models.ActivityLog, error) {
	items, _, err := r.ListPaginated(ctx, 1, limit)
	return items, err
}

func (r *ActivityRepository) ListPaginated(ctx context.Context, page, pageSize int) ([]models.ActivityLog, int64, error) {
	page, pageSize = normalizePagination(page, pageSize)
	offset := (page - 1) * pageSize

	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM activity_logs`).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := r.pool.Query(ctx, `
		SELECT al.id, al.actor_id,
			TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
			al.action, al.entity_type, COALESCE(al.entity_id::text, ''),
			al.metadata, al.created_at
		FROM activity_logs al
		LEFT JOIN users u ON u.id = al.actor_id
		ORDER BY al.created_at DESC
		LIMIT $1 OFFSET $2`, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []models.ActivityLog
	for rows.Next() {
		var a models.ActivityLog
		if err := rows.Scan(
			&a.ID, &a.ActorID, &a.ActorName, &a.Action, &a.EntityType, &a.EntityID, &a.Metadata, &a.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, a)
	}
	return items, total, rows.Err()
}

func (r *ActivityRepository) ListByProject(ctx context.Context, projectID string, limit int) ([]models.ActivityLog, error) {
	if limit <= 0 {
		limit = 100
	}
	rows, err := r.pool.Query(ctx, `
		SELECT al.id, al.actor_id,
			TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
			al.action, al.entity_type, COALESCE(al.entity_id::text, ''),
			al.metadata, al.created_at
		FROM activity_logs al
		LEFT JOIN users u ON u.id = al.actor_id
		WHERE (
			(al.entity_type = 'project' AND al.entity_id = $1)
			OR (al.metadata->>'projectId' = $1::text)
			OR (
				al.action = 'document_uploaded'
				AND al.entity_id IN (
					SELECT d.id FROM documents d
					WHERE d.entity_type = 'project' AND d.entity_id = $1
				)
			)
			OR (
				al.entity_type = 'supervisor_report'
				AND al.entity_id IN (
					SELECT rs.id FROM reports_supervisor rs WHERE rs.project_id = $1
				)
			)
			OR (
				al.entity_type = 'worker_report'
				AND al.entity_id IN (
					SELECT rw.id FROM reports_worker rw WHERE rw.project_id = $1
				)
			)
		)
		ORDER BY al.created_at DESC
		LIMIT $2`, projectID, limit)
	if err != nil {
		return nil, fmt.Errorf("list project activity: %w", err)
	}
	defer rows.Close()

	var items []models.ActivityLog
	for rows.Next() {
		var a models.ActivityLog
		if err := rows.Scan(
			&a.ID, &a.ActorID, &a.ActorName, &a.Action, &a.EntityType, &a.EntityID, &a.Metadata, &a.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, a)
	}
	return items, rows.Err()
}
