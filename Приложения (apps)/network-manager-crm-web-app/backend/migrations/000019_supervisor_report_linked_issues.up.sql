CREATE TABLE reports_supervisor_linked_issues (
    report_id UUID NOT NULL REFERENCES reports_supervisor (id) ON DELETE CASCADE,
    issue_id UUID NOT NULL REFERENCES project_issues (id) ON DELETE CASCADE,
    PRIMARY KEY (report_id, issue_id)
);

CREATE INDEX idx_reports_supervisor_linked_issues_issue_id ON reports_supervisor_linked_issues (issue_id);
