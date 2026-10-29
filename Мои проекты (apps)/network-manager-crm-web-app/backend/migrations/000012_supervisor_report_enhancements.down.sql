DROP TABLE IF EXISTS reports_supervisor_crew;

ALTER TABLE reports_supervisor
    DROP COLUMN IF EXISTS related_issue_id,
    DROP COLUMN IF EXISTS issue_description,
    DROP COLUMN IF EXISTS issue_category,
    DROP COLUMN IF EXISTS completed_works;

DROP TABLE IF EXISTS project_issues;
DROP TYPE IF EXISTS project_issue_status;
