-- +goose Up
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    props JSONB NOT NULL DEFAULT '{}'::jsonb,
    ts TIMESTAMPTZ NOT NULL,
    client_event_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_ts_idx ON analytics_events (ts DESC);
CREATE INDEX IF NOT EXISTS analytics_events_user_ts_idx ON analytics_events (user_id, ts DESC);
CREATE INDEX IF NOT EXISTS analytics_events_name_ts_idx ON analytics_events (name, ts DESC);

CREATE UNIQUE INDEX IF NOT EXISTS analytics_events_user_client_event_unique
    ON analytics_events (user_id, client_event_id)
    WHERE client_event_id IS NOT NULL AND client_event_id <> '';

-- +goose Down
DROP TABLE IF EXISTS analytics_events;
