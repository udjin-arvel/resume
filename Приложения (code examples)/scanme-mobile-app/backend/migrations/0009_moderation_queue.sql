-- +goose Up
ALTER TABLE substance_candidate_queue
	ADD COLUMN IF NOT EXISTS normalized_key TEXT NOT NULL DEFAULT '';

ALTER TABLE substance_candidate_queue
	ADD COLUMN IF NOT EXISTS resolved_substance_id UUID REFERENCES substances(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS substance_candidate_queue_pending_norm_uidx
	ON substance_candidate_queue (normalized_key)
	WHERE status = 'pending';

COMMENT ON COLUMN substance_candidate_queue.normalized_key IS 'Dedup key (analyzer-normalized name) for pending items';

-- +goose Down
DROP INDEX IF EXISTS substance_candidate_queue_pending_norm_uidx;
ALTER TABLE substance_candidate_queue DROP COLUMN IF EXISTS resolved_substance_id;
ALTER TABLE substance_candidate_queue DROP COLUMN IF EXISTS normalized_key;
