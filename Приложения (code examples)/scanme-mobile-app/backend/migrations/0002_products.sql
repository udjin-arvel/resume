-- +goose Up
CREATE TABLE IF NOT EXISTS products (
    barcode TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brands TEXT,
    image_url TEXT,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_off_json JSONB NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_expires_at_idx ON products (expires_at);

CREATE TABLE IF NOT EXISTS product_analyses (
    product_barcode TEXT PRIMARY KEY REFERENCES products(barcode) ON DELETE CASCADE,
    substance_ids UUID[] NOT NULL DEFAULT '{}',
    overall_danger TEXT NOT NULL DEFAULT 'unknown',
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE IF EXISTS product_analyses;
DROP TABLE IF EXISTS products;
