-- Worker and supervisor reports

CREATE TYPE worker_report_status AS ENUM ('draft', 'review', 'accepted', 'returned', 'overdue');
CREATE TYPE supervisor_report_status AS ENUM ('review', 'accepted', 'attention');

CREATE TABLE reports_worker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    hours_mon NUMERIC(6, 2) NOT NULL DEFAULT 0,
    hours_tue NUMERIC(6, 2) NOT NULL DEFAULT 0,
    hours_wed NUMERIC(6, 2) NOT NULL DEFAULT 0,
    hours_thu NUMERIC(6, 2) NOT NULL DEFAULT 0,
    hours_fri NUMERIC(6, 2) NOT NULL DEFAULT 0,
    hours_sat NUMERIC(6, 2) NOT NULL DEFAULT 0,
    hours_sun NUMERIC(6, 2) NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    status worker_report_status NOT NULL DEFAULT 'draft',
    total_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_worker_project_id ON reports_worker (project_id);
CREATE INDEX idx_reports_worker_worker_id ON reports_worker (worker_id);
CREATE INDEX idx_reports_worker_status ON reports_worker (status);
CREATE INDEX idx_reports_worker_week ON reports_worker (week_start, week_end);

CREATE TABLE report_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports_worker (id) ON DELETE CASCADE,
    expense_type VARCHAR(100) NOT NULL DEFAULT '',
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    comment TEXT NOT NULL DEFAULT '',
    document_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_report_expenses_report_id ON report_expenses (report_id);

CREATE TABLE reports_supervisor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    site_status site_status NOT NULL DEFAULT 'ok',
    description TEXT NOT NULL DEFAULT '',
    transcription TEXT NOT NULL DEFAULT '',
    voice_document_id UUID,
    status supervisor_report_status NOT NULL DEFAULT 'review',
    manager_comment TEXT NOT NULL DEFAULT '',
    downtime_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
    downtime_reason TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_supervisor_project_id ON reports_supervisor (project_id);
CREATE INDEX idx_reports_supervisor_supervisor_id ON reports_supervisor (supervisor_id);
CREATE INDEX idx_reports_supervisor_status ON reports_supervisor (status);
CREATE INDEX idx_reports_supervisor_report_date ON reports_supervisor (report_date);
