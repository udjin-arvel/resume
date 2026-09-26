ALTER TABLE users
    DROP COLUMN IF EXISTS application_corrections_needed,
    DROP COLUMN IF EXISTS application_feedback;
