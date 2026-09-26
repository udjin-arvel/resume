-- Estimates and templates

CREATE TYPE estimate_status AS ENUM ('draft', 'sent', 'approved', 'rejected');
CREATE TYPE estimate_block_type AS ENUM ('service', 'resource', 'expense');

CREATE TABLE estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients (id) ON DELETE SET NULL,
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL DEFAULT '',
    contact_person VARCHAR(150) NOT NULL DEFAULT '',
    phone VARCHAR(32) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL DEFAULT '',
    country VARCHAR(100) NOT NULL DEFAULT '',
    city VARCHAR(100) NOT NULL DEFAULT '',
    comment TEXT NOT NULL DEFAULT '',
    status estimate_status NOT NULL DEFAULT 'draft',
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_estimates_status ON estimates (status);
CREATE INDEX idx_estimates_client_id ON estimates (client_id);
CREATE INDEX idx_estimates_created_by ON estimates (created_by);

CREATE TABLE estimate_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id UUID NOT NULL REFERENCES estimates (id) ON DELETE CASCADE,
    block_type estimate_block_type NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    title VARCHAR(255) NOT NULL DEFAULT '',
    quantity NUMERIC(15, 3) NOT NULL DEFAULT 0,
    unit VARCHAR(32) NOT NULL DEFAULT '',
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    role VARCHAR(120) NOT NULL DEFAULT '',
    hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
    rate NUMERIC(15, 2) NOT NULL DEFAULT 0,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    comment TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_estimate_blocks_estimate_id ON estimate_blocks (estimate_id);

CREATE TABLE estimate_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE estimate_template_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES estimate_templates (id) ON DELETE CASCADE,
    block_type estimate_block_type NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    title VARCHAR(255) NOT NULL DEFAULT '',
    quantity NUMERIC(15, 3) NOT NULL DEFAULT 0,
    unit VARCHAR(32) NOT NULL DEFAULT '',
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    role VARCHAR(120) NOT NULL DEFAULT '',
    hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
    rate NUMERIC(15, 2) NOT NULL DEFAULT 0,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    comment TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_estimate_template_blocks_template_id ON estimate_template_blocks (template_id);
