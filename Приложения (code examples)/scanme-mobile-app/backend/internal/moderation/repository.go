package moderation

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return Repository{db: db}
}

func (r Repository) CountsByStatus(ctx context.Context) (StatusCounts, error) {
	var out StatusCounts
	rows, err := r.db.Query(ctx, `
		SELECT status, COUNT(*)::bigint FROM substance_candidate_queue GROUP BY status
	`)
	if err != nil {
		return StatusCounts{}, err
	}
	defer rows.Close()

	for rows.Next() {
		var status string
		var n int64
		if err := rows.Scan(&status, &n); err != nil {
			return StatusCounts{}, err
		}
		switch status {
		case "pending":
			out.Pending = n
		case "approved":
			out.Approved = n
		case "rejected":
			out.Rejected = n
		}
	}
	return out, rows.Err()
}

func (r Repository) List(ctx context.Context, status string, limit int) ([]QueueItem, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	status = strings.TrimSpace(status)
	rows, err := r.db.Query(ctx, `
		SELECT id::text, source, barcode, candidate, normalized_key, status, created_at,
			reviewed_by::text, reviewed_at, reject_reason, resolved_substance_id::text
		FROM substance_candidate_queue
		WHERE ($1::text = '' OR status = $1)
		ORDER BY created_at ASC
		LIMIT $2
	`, status, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]QueueItem, 0)
	for rows.Next() {
		var item QueueItem
		var reviewedBy *string
		var reviewedAt *time.Time
		var rejectReason *string
		var resolved *string
		var cand []byte
		if err := rows.Scan(
			&item.ID,
			&item.Source,
			&item.Barcode,
			&cand,
			&item.NormalizedKey,
			&item.Status,
			&item.CreatedAt,
			&reviewedBy,
			&reviewedAt,
			&rejectReason,
			&resolved,
		); err != nil {
			return nil, err
		}
		if len(cand) > 0 {
			item.Candidate = append(json.RawMessage(nil), cand...)
		}
		item.ReviewedBy = reviewedBy
		item.ReviewedAt = reviewedAt
		item.RejectReason = rejectReason
		item.ResolvedSubstanceID = resolved
		out = append(out, item)
	}
	return out, rows.Err()
}

func (r Repository) GetPendingByID(ctx context.Context, id string) (QueueItem, error) {
	var item QueueItem
	var cand []byte
	err := r.db.QueryRow(ctx, `
		SELECT id::text, source, barcode, candidate, normalized_key, status, created_at
		FROM substance_candidate_queue
		WHERE id = $1::uuid AND status = 'pending'
	`, id).Scan(
		&item.ID,
		&item.Source,
		&item.Barcode,
		&cand,
		&item.NormalizedKey,
		&item.Status,
		&item.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return QueueItem{}, ErrNotFound
	}
	if err != nil {
		return QueueItem{}, err
	}
	if len(cand) > 0 {
		item.Candidate = append(json.RawMessage(nil), cand...)
	}
	return item, nil
}

func (r Repository) MarkApproved(ctx context.Context, queueID, adminID, substanceID string) error {
	tag, err := r.db.Exec(ctx, `
		UPDATE substance_candidate_queue SET
			status = 'approved',
			reviewed_by = $2::uuid,
			reviewed_at = now(),
			resolved_substance_id = $3::uuid
		WHERE id = $1::uuid AND status = 'pending'
	`, queueID, adminID, substanceID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotPending
	}
	return nil
}

func (r Repository) MarkRejected(ctx context.Context, queueID, adminID, reason string) error {
	tag, err := r.db.Exec(ctx, `
		UPDATE substance_candidate_queue SET
			status = 'rejected',
			reviewed_by = $2::uuid,
			reviewed_at = now(),
			reject_reason = NULLIF(trim($3), '')
		WHERE id = $1::uuid AND status = 'pending'
	`, queueID, adminID, reason)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotPending
	}
	return nil
}
