-- +goose Up
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    barcode TEXT NOT NULL,
    product_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    idempotency_key TEXT,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    client_ts TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS scans_user_idempotency_key_idx
    ON scans (user_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS scans_user_scanned_at_idx
    ON scans (user_id, scanned_at DESC, id DESC);

-- +goose Down
DROP TABLE IF EXISTS scans;
