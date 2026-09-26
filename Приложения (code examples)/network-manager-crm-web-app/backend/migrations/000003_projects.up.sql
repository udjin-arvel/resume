-- Projects and worker assignments

CREATE TYPE project_status AS ENUM ('active', 'done', 'archive');
CREATE TYPE project_type AS ENUM ('estimate', 'outstaff');
CREATE TYPE site_status AS ENUM ('ok', 'issue', 'downtime');
CREATE TYPE project_worker_role AS ENUM ('worker', 'supervisor');
CREATE TYPE confirmation_status AS ENUM ('pending', 'confirmed');

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients (id) ON DELETE RESTRICT,
    estimate_id UUID REFERENCES estimates (id) ON DELETE SET NULL,
    supervisor_id UUID REFERENCES users (id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL DEFAULT '',
    start_date DATE,
    end_date DATE,
    status project_status NOT NULL DEFAULT 'active',
    type project_type NOT NULL DEFAULT 'estimate',
    site_status site_status NOT NULL DEFAULT 'ok',
    downtime_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
    budget NUMERIC(15, 2) NOT NULL DEFAULT 0,
    spent NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_client_id ON projects (client_id);
CREATE INDEX idx_projects_status ON projects (status);
CREATE INDEX idx_projects_site_status ON projects (site_status);
CREATE INDEX idx_projects_estimate_id ON projects (estimate_id);

CREATE TABLE project_workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role project_worker_role NOT NULL DEFAULT 'worker',
    confirmation_status confirmation_status NOT NULL DEFAULT 'pending',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, user_id)
);

CREATE INDEX idx_project_workers_project_id ON project_workers (project_id);
CREATE INDEX idx_project_workers_user_id ON project_workers (user_id);
