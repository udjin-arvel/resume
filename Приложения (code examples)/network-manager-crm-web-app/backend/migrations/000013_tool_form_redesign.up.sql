-- Tool form redesign: new control types and fields

ALTER TYPE tool_control_type ADD VALUE IF NOT EXISTS 'accounting_only';
ALTER TYPE tool_control_type ADD VALUE IF NOT EXISTS 'expiry';
ALTER TYPE tool_control_type ADD VALUE IF NOT EXISTS 'combined';

ALTER TABLE tools
    ADD COLUMN IF NOT EXISTS model VARCHAR(120) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS cost_cents INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS purchase_date DATE,
    ADD COLUMN IF NOT EXISTS usage_unit VARCHAR(50) NOT NULL DEFAULT 'tests',
    ADD COLUMN IF NOT EXISTS calibration_period_months INT NOT NULL DEFAULT 12;
