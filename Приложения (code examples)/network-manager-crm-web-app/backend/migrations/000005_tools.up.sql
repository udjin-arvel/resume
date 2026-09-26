-- Tools, assignments, calibrations

CREATE TYPE tool_control_type AS ENUM ('calibration', 'usage_limit');
CREATE TYPE tool_status AS ENUM ('available', 'assigned', 'overdue', 'written_off');

CREATE TABLE tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(120) NOT NULL DEFAULT '',
    tool_type VARCHAR(120) NOT NULL DEFAULT '',
    control_type tool_control_type NOT NULL DEFAULT 'calibration',
    status tool_status NOT NULL DEFAULT 'available',
    calibration_due_at TIMESTAMPTZ,
    usage_limit INT NOT NULL DEFAULT 0,
    usage_count INT NOT NULL DEFAULT 0,
    comment TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tools_status ON tools (status);
CREATE INDEX idx_tools_serial_number ON tools (serial_number);
CREATE INDEX idx_tools_calibration_due_at ON tools (calibration_due_at);

CREATE TABLE tool_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id UUID NOT NULL REFERENCES tools (id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    responsible_user_id UUID REFERENCES users (id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    returned_at TIMESTAMPTZ,
    condition_on_return TEXT NOT NULL DEFAULT '',
  used_in_report BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_tool_assignments_tool_id ON tool_assignments (tool_id);
CREATE INDEX idx_tool_assignments_project_id ON tool_assignments (project_id);
CREATE INDEX idx_tool_assignments_responsible_user_id ON tool_assignments (responsible_user_id);

CREATE TABLE tool_calibrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id UUID NOT NULL REFERENCES tools (id) ON DELETE CASCADE,
    calibrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_due_at TIMESTAMPTZ,
    performed_by UUID REFERENCES users (id) ON DELETE SET NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tool_calibrations_tool_id ON tool_calibrations (tool_id);
