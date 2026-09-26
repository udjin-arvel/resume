ALTER TABLE users
    ADD COLUMN IF NOT EXISTS application_corrections_needed BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS application_feedback JSONB NOT NULL DEFAULT '{}'::jsonb;
