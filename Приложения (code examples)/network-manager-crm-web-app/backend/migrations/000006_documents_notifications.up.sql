-- Documents, notifications, activity logs

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users (id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    document_type VARCHAR(100) NOT NULL DEFAULT '',
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(120) NOT NULL DEFAULT '',
    size_bytes BIGINT NOT NULL DEFAULT 0,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_entity ON documents (entity_type, entity_id);
CREATE INDEX idx_documents_owner_id ON documents (owner_id);

ALTER TABLE report_expenses
    ADD CONSTRAINT fk_report_expenses_document
    FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE SET NULL;

ALTER TABLE reports_supervisor
    ADD CONSTRAINT fk_reports_supervisor_voice_document
    FOREIGN KEY (voice_document_id) REFERENCES documents (id) ON DELETE SET NULL;

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    notification_type VARCHAR(100) NOT NULL DEFAULT '',
    link TEXT NOT NULL DEFAULT '',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_read_at ON notifications (read_at);
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users (id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_actor_id ON activity_logs (actor_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs (entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs (created_at DESC);
