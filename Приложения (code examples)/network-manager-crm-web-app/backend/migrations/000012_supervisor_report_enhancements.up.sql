CREATE TYPE project_issue_status AS ENUM ('open', 'in_progress', 'resolved');

CREATE TABLE project_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT '',
    category VARCHAR(255) NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    status project_issue_status NOT NULL DEFAULT 'open',
    source_report_id UUID REFERENCES reports_supervisor (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, number)
);

CREATE INDEX idx_project_issues_project_id ON project_issues (project_id);
CREATE INDEX idx_project_issues_status ON project_issues (status);

ALTER TABLE reports_supervisor
    ADD COLUMN completed_works TEXT NOT NULL DEFAULT '',
    ADD COLUMN issue_category VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN issue_description TEXT NOT NULL DEFAULT '',
    ADD COLUMN related_issue_id UUID REFERENCES project_issues (id) ON DELETE SET NULL;

CREATE TABLE reports_supervisor_crew (
    report_id UUID NOT NULL REFERENCES reports_supervisor (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    PRIMARY KEY (report_id, user_id)
);

CREATE INDEX idx_reports_supervisor_crew_user_id ON reports_supervisor_crew (user_id);
