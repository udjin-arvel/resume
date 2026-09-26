DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS notifications;

ALTER TABLE reports_supervisor DROP CONSTRAINT IF EXISTS fk_reports_supervisor_voice_document;
ALTER TABLE report_expenses DROP CONSTRAINT IF EXISTS fk_report_expenses_document;

DROP TABLE IF EXISTS documents;
