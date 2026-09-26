ALTER TABLE tools
    DROP COLUMN IF EXISTS problem_reported_at,
    DROP COLUMN IF EXISTS problem_comment,
    DROP COLUMN IF EXISTS problem_type;

-- PostgreSQL does not support removing enum values; needs_attention remains in tool_status.
