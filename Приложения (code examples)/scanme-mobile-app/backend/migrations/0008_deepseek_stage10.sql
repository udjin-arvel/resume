-- +goose Up
ALTER TABLE products ADD COLUMN IF NOT EXISTS deepseek_analysis JSONB;

CREATE TABLE IF NOT EXISTS deepseek_cache (
    request_hash TEXT PRIMARY KEY,
    response JSONB NOT NULL,
    model TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS substance_candidate_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL DEFAULT 'deepseek',
    barcode TEXT NOT NULL REFERENCES products(barcode) ON DELETE CASCADE,
    candidate JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    reject_reason TEXT
);

CREATE INDEX IF NOT EXISTS substance_candidate_queue_status_idx ON substance_candidate_queue (status, created_at DESC);
CREATE INDEX IF NOT EXISTS substance_candidate_queue_barcode_idx ON substance_candidate_queue (barcode);

-- +goose Down
DROP TABLE IF EXISTS substance_candidate_queue;
DROP TABLE IF EXISTS deepseek_cache;
ALTER TABLE products DROP COLUMN IF EXISTS deepseek_analysis;
