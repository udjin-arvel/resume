ALTER TABLE users
    DROP COLUMN IF EXISTS block_reason,
    DROP COLUMN IF EXISTS blocked_at,
    DROP COLUMN IF EXISTS block_project_id;
