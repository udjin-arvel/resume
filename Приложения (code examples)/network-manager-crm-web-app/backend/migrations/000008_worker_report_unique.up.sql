ALTER TABLE reports_worker
    ADD CONSTRAINT uq_reports_worker_project_week
    UNIQUE (project_id, worker_id, week_start, week_end);
