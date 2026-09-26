-- +goose Up
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SEQUENCE IF NOT EXISTS substances_version_seq AS BIGINT START WITH 1;

CREATE TABLE IF NOT EXISTS substances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    aliases TEXT[] NOT NULL DEFAULT '{}',
    category TEXT NOT NULL DEFAULT 'other',
    danger_level TEXT NOT NULL CHECK (danger_level IN ('safe', 'controversial', 'dangerous')),
    description TEXT NOT NULL DEFAULT '',
    sources TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    version BIGINT NOT NULL DEFAULT nextval('substances_version_seq'),
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    search_vector TSVECTOR NOT NULL DEFAULT ''::tsvector
);

ALTER TABLE substances
    ADD COLUMN IF NOT EXISTS search_vector TSVECTOR NOT NULL DEFAULT ''::tsvector;

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION update_substances_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector(
        'simple',
        coalesce(NEW.code, '') || ' ' || NEW.name || ' ' || array_to_string(NEW.aliases, ' ')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

DROP TRIGGER IF EXISTS substances_search_vector_update ON substances;

CREATE TRIGGER substances_search_vector_update
BEFORE INSERT OR UPDATE OF code, name, aliases
ON substances
FOR EACH ROW
EXECUTE FUNCTION update_substances_search_vector();

CREATE INDEX IF NOT EXISTS substances_version_idx ON substances (version);
CREATE INDEX IF NOT EXISTS substances_active_idx ON substances (is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS substances_search_idx ON substances USING GIN (search_vector);

-- +goose Down
DROP TRIGGER IF EXISTS substances_search_vector_update ON substances;
DROP FUNCTION IF EXISTS update_substances_search_vector();
DROP TABLE IF EXISTS substances;
DROP SEQUENCE IF EXISTS substances_version_seq;
