-- Tool problem status and metadata

ALTER TYPE tool_status ADD VALUE IF NOT EXISTS 'needs_attention';

ALTER TABLE tools
    ADD COLUMN IF NOT EXISTS problem_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS problem_comment TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS problem_reported_at TIMESTAMPTZ;
