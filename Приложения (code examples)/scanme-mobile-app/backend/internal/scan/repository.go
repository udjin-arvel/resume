package scan

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return Repository{db: db}
}

func (r Repository) Create(ctx context.Context, userID string, req CreateScanRequest, idempotencyKey string) (Scan, error) {
	snapshotJSON, err := json.Marshal(req.ProductSnapshot)
	if err != nil {
		return Scan{}, err
	}

	var item Scan
	var snapshotData []byte
	err = r.db.QueryRow(ctx, `
		INSERT INTO scans (user_id, barcode, product_snapshot, idempotency_key, client_ts)
		VALUES ($1, $2, $3, NULLIF($4, ''), $5)
		ON CONFLICT (user_id, idempotency_key)
		WHERE idempotency_key IS NOT NULL
		DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
		RETURNING id, barcode, product_snapshot, scanned_at, client_ts
	`, userID, req.Barcode, snapshotJSON, idempotencyKey, req.ClientTS).Scan(
		&item.ID,
		&item.Barcode,
		&snapshotData,
		&item.ScannedAt,
		&item.ClientTS,
	)
	if err != nil {
		return Scan{}, err
	}

	item.ProductSnapshot, err = snapshotFromJSON(snapshotData)
	if err != nil {
		return Scan{}, err
	}
	return item, nil
}

func (r Repository) List(ctx context.Context, userID string, limit int, cursor *time.Time) ([]Scan, error) {
	args := []any{userID, limit}
	whereCursor := ""
	if cursor != nil {
		args = append(args, *cursor)
		whereCursor = "AND scanned_at < $3"
	}

	rows, err := r.db.Query(ctx, `
		SELECT id, barcode, product_snapshot, scanned_at, client_ts
		FROM scans
		WHERE user_id = $1 `+whereCursor+`
		ORDER BY scanned_at DESC, id DESC
		LIMIT $2
	`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Scan, 0, limit)
	for rows.Next() {
		var item Scan
		var snapshotData []byte
		if err := rows.Scan(&item.ID, &item.Barcode, &snapshotData, &item.ScannedAt, &item.ClientTS); err != nil {
			return nil, err
		}
		item.ProductSnapshot, err = snapshotFromJSON(snapshotData)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r Repository) Delete(ctx context.Context, userID string, id string) error {
	scanID, err := uuid.Parse(id)
	if err != nil {
		return pgx.ErrNoRows
	}

	_, err = r.db.Exec(ctx, `
		DELETE FROM scans
		WHERE id = $1 AND user_id = $2
	`, scanID, userID)
	return err
}
