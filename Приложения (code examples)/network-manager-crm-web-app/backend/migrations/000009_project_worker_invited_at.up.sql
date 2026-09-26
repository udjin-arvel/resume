ALTER TABLE project_workers
    ADD COLUMN invited_at TIMESTAMPTZ;

UPDATE project_workers
SET invited_at = assigned_at
WHERE invited_at IS NULL;
