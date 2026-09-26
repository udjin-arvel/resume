ALTER TABLE tools
    DROP COLUMN IF EXISTS model,
    DROP COLUMN IF EXISTS cost_cents,
    DROP COLUMN IF EXISTS purchase_date,
    DROP COLUMN IF EXISTS usage_unit,
    DROP COLUMN IF EXISTS calibration_period_months;

-- PostgreSQL does not support removing enum values; new control types remain in tool_control_type.
