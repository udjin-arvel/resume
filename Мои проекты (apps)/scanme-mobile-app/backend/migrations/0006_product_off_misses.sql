-- +goose Up
CREATE TABLE IF NOT EXISTS product_off_misses (
    barcode TEXT PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS product_off_misses_expires_at_idx ON product_off_misses (expires_at);

-- +goose Down
DROP TABLE IF EXISTS product_off_misses;
