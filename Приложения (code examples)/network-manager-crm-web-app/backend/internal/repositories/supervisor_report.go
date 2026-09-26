package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/models"
	"github.com/radar-crm/backend/internal/models/dto"
)

type SupervisorReportRepository struct {
	pool *pgxpool.Pool
}

func NewSupervisorReportRepository(pool *pgxpool.Pool) *SupervisorReportRepository {
	return &SupervisorReportRepository{pool: pool}
}

const supervisorReportSelect = `
	rs.id, rs.project_id, p.name,
	rs.supervisor_id, TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
	rs.report_date, rs.site_status::text, rs.description, rs.transcription,
	rs.voice_document_id, rs.status::text, rs.manager_comment,
	rs.downtime_hours::text, rs.downtime_reason,
	rs.completed_works, rs.issue_category, rs.issue_description, rs.related_issue_id,
	rs.created_at, rs.updated_at`

func scanSupervisorReport(row pgx.Row) (*models.SupervisorReport, error) {
	var r models.SupervisorReport
	err := row.Scan(
		&r.ID, &r.ProjectID, &r.ProjectName,
		&r.SupervisorID, &r.SupervisorName,
		&r.ReportDate, &r.SiteStatus, &r.Description, &r.Transcription,
		&r.VoiceDocumentID, &r.Status, &r.ManagerComment,
		&r.DowntimeHours, &r.DowntimeReason,
		&r.CompletedWorks, &r.IssueCategory, &r.IssueDescription, &r.RelatedIssueID,
		&r.CreatedAt, &r.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &r, nil
}

func (r *SupervisorReportRepository) List(
	ctx context.Context, q dto.ReportListQuery, actorRole, actorID string,
) ([]models.SupervisorReport, int64, error) {
	page, pageSize := normalizePagination(q.Page, q.PageSize)
	offset := (page - 1) * pageSize

	where := `WHERE 1=1`
	args := []any{}
	argN := 1

	if actorRole != "manager" {
		where += fmt.Sprintf(` AND rs.supervisor_id = $%d`, argN)
		args = append(args, actorID)
		argN++
	}
	if q.ProjectID != "" {
		where += fmt.Sprintf(` AND rs.project_id = $%d`, argN)
		args = append(args, q.ProjectID)
		argN++
	}
	if q.SupervisorID != "" {
		where += fmt.Sprintf(` AND rs.supervisor_id = $%d`, argN)
		args = append(args, q.SupervisorID)
		argN++
	}
	if q.ClientID != "" {
		where += fmt.Sprintf(` AND p.client_id = $%d`, argN)
		args = append(args, q.ClientID)
		argN++
	}
	if q.Status != "" {
		status := q.Status
		if status == "approved" {
			status = "accepted"
		}
		where += fmt.Sprintf(` AND rs.status = $%d::supervisor_report_status`, argN)
		args = append(args, status)
		argN++
	}
	if q.SiteStatus != "" {
		where += fmt.Sprintf(` AND rs.site_status = $%d::site_status`, argN)
		args = append(args, q.SiteStatus)
		argN++
	}
	if q.From != "" {
		where += fmt.Sprintf(` AND rs.report_date >= $%d::date`, argN)
		args = append(args, q.From)
		argN++
	}
	if q.To != "" {
		where += fmt.Sprintf(` AND rs.report_date <= $%d::date`, argN)
		args = append(args, q.To)
		argN++
	}

	fromClause := `FROM reports_supervisor rs
		JOIN projects p ON p.id = rs.project_id AND p.deleted_at IS NULL
		JOIN users u ON u.id = rs.supervisor_id`

	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) `+fromClause+` `+where, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count supervisor reports: %w", err)
	}

	listQuery := `SELECT ` + supervisorReportSelect + ` ` + fromClause + ` ` + where +
		fmt.Sprintf(` ORDER BY rs.updated_at DESC, rs.created_at DESC LIMIT $%d OFFSET $%d`, argN, argN+1)
	listArgs := append(args, pageSize, offset)

	rows, err := r.pool.Query(ctx, listQuery, listArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("list supervisor reports: %w", err)
	}
	defer rows.Close()

	var items []models.SupervisorReport
	for rows.Next() {
		item, err := scanSupervisorReport(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, *item)
	}
	return items, total, rows.Err()
}

func (r *SupervisorReportRepository) GetByID(ctx context.Context, id string) (*models.SupervisorReport, error) {
	query := `SELECT ` + supervisorReportSelect + `
		FROM reports_supervisor rs
		JOIN projects p ON p.id = rs.project_id AND p.deleted_at IS NULL
		JOIN users u ON u.id = rs.supervisor_id
		WHERE rs.id = $1`
	report, err := scanSupervisorReport(r.pool.QueryRow(ctx, query, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get supervisor report: %w", err)
	}
	return report, nil
}

func (r *SupervisorReportRepository) Create(ctx context.Context, report *models.SupervisorReport) error {
	siteStatus := report.SiteStatus
	if siteStatus == "" {
		siteStatus = "ok"
	}
	query := `
		INSERT INTO reports_supervisor (
			project_id, supervisor_id, report_date, site_status, description,
			voice_document_id, status, downtime_hours, downtime_reason,
			completed_works, issue_category, issue_description, related_issue_id
		) VALUES ($1,$2,$3,$4,$5,$6,'review',$7,$8,$9,$10,$11,$12)
		RETURNING id, created_at, updated_at`
	err := r.pool.QueryRow(ctx, query,
		report.ProjectID, report.SupervisorID, report.ReportDate, siteStatus, report.Description,
		report.VoiceDocumentID,
		numericOrZero(report.DowntimeHours), report.DowntimeReason,
		report.CompletedWorks, report.IssueCategory, report.IssueDescription, report.RelatedIssueID,
	).Scan(&report.ID, &report.CreatedAt, &report.UpdatedAt)
	if err != nil {
		return fmt.Errorf("create supervisor report: %w", err)
	}
	report.Status = "review"
	return nil
}

func (r *SupervisorReportRepository) SetRelatedIssueID(ctx context.Context, reportID, issueID string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE reports_supervisor SET related_issue_id = $2, updated_at = NOW() WHERE id = $1`,
		reportID, issueID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *SupervisorReportRepository) UpdateFields(ctx context.Context, report *models.SupervisorReport) error {
	siteStatus := report.SiteStatus
	if siteStatus == "" {
		siteStatus = "ok"
	}
	tag, err := r.pool.Exec(ctx, `
		UPDATE reports_supervisor SET
			site_status = $2::site_status,
			description = $3,
			completed_works = $4,
			issue_category = $5,
			issue_description = $6,
			downtime_hours = $7,
			downtime_reason = $8,
			updated_at = NOW()
		WHERE id = $1`,
		report.ID, siteStatus, report.Description, report.CompletedWorks,
		report.IssueCategory, report.IssueDescription,
		numericOrZero(report.DowntimeHours), report.DowntimeReason,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *SupervisorReportRepository) SetLinkedIssues(ctx context.Context, reportID string, issueIDs []string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM reports_supervisor_linked_issues WHERE report_id = $1`, reportID); err != nil {
		return err
	}
	for _, issueID := range issueIDs {
		if issueID == "" {
			continue
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO reports_supervisor_linked_issues (report_id, issue_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
			reportID, issueID); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func (r *SupervisorReportRepository) ListLinkedIssueIDs(ctx context.Context, reportID string) ([]string, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT issue_id::text FROM reports_supervisor_linked_issues
		WHERE report_id = $1 ORDER BY issue_id`, reportID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (r *SupervisorReportRepository) SetVoiceDocumentID(ctx context.Context, id, voiceDocumentID string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE reports_supervisor SET voice_document_id = $2, updated_at = NOW() WHERE id = $1`,
		id, voiceDocumentID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *SupervisorReportRepository) SetCrew(ctx context.Context, reportID string, userIDs []string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM reports_supervisor_crew WHERE report_id = $1`, reportID); err != nil {
		return err
	}
	for _, uid := range userIDs {
		if uid == "" {
			continue
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO reports_supervisor_crew (report_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
			reportID, uid); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func (r *SupervisorReportRepository) ListCrew(ctx context.Context, reportID string) ([]dto.CrewMemberResponse, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT u.id, u.first_name, u.last_name
		FROM reports_supervisor_crew c
		JOIN users u ON u.id = c.user_id
		WHERE c.report_id = $1
		ORDER BY u.last_name, u.first_name`, reportID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var crew []dto.CrewMemberResponse
	for rows.Next() {
		var m dto.CrewMemberResponse
		if err := rows.Scan(&m.ID, &m.FirstName, &m.LastName); err != nil {
			return nil, err
		}
		crew = append(crew, m)
	}
	return crew, rows.Err()
}

func (r *SupervisorReportRepository) CountPhotosByReportIDs(ctx context.Context, reportIDs []string) (map[string]int, error) {
	result := make(map[string]int)
	if len(reportIDs) == 0 {
		return result, nil
	}
	rows, err := r.pool.Query(ctx, `
		SELECT entity_id::text, COUNT(*)
		FROM documents
		WHERE entity_type = 'supervisor_report'
		  AND entity_id = ANY($1::uuid[])
		  AND document_type = 'photo'
		GROUP BY entity_id`, reportIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var id string
		var count int
		if err := rows.Scan(&id, &count); err != nil {
			return nil, err
		}
		result[id] = count
	}
	return result, rows.Err()
}

func (r *SupervisorReportRepository) ListAttachmentPreviews(ctx context.Context, reportIDs []string, limitPerReport int) (map[string][]dto.AttachmentPreviewResponse, error) {
	result := make(map[string][]dto.AttachmentPreviewResponse)
	if len(reportIDs) == 0 || limitPerReport < 1 {
		return result, nil
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id, entity_id::text, filename, document_type
		FROM (
			SELECT id, entity_id, filename, document_type,
			       ROW_NUMBER() OVER (PARTITION BY entity_id ORDER BY created_at) AS rn
			FROM documents
			WHERE entity_type = 'supervisor_report'
			  AND entity_id = ANY($1::uuid[])
			  AND document_type IN ('photo', 'issue_attachment', 'downtime_attachment')
		) sub
		WHERE rn <= $2
		ORDER BY entity_id, rn`, reportIDs, limitPerReport)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var preview dto.AttachmentPreviewResponse
		var entityID string
		if err := rows.Scan(&preview.ID, &entityID, &preview.Filename, &preview.DocumentType); err != nil {
			return nil, err
		}
		result[entityID] = append(result[entityID], preview)
	}
	return result, rows.Err()
}

func (r *SupervisorReportRepository) UpdateTranscription(ctx context.Context, id, transcription string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE reports_supervisor SET transcription = $2, updated_at = NOW() WHERE id = $1`,
		id, transcription)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *SupervisorReportRepository) UpdateStatus(ctx context.Context, id, status string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE reports_supervisor SET status = $2::supervisor_report_status, updated_at = NOW() WHERE id = $1`, id, status)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *SupervisorReportRepository) SetManagerComment(ctx context.Context, id, comment string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE reports_supervisor SET manager_comment = $2, updated_at = NOW() WHERE id = $1`,
		id, comment)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *SupervisorReportRepository) Approve(ctx context.Context, id string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var projectID, siteStatus, downtimeHours, status string
	err = tx.QueryRow(ctx, `
		SELECT project_id, site_status::text, downtime_hours::text, status::text
		FROM reports_supervisor WHERE id = $1 FOR UPDATE`, id,
	).Scan(&projectID, &siteStatus, &downtimeHours, &status)
	if errors.Is(err, pgx.ErrNoRows) {
		return apperrors.ErrNotFound
	}
	if err != nil {
		return err
	}
	if status != "review" {
		return apperrors.New(apperrors.ErrValidation, "report cannot be approved in current status")
	}

	tag, err := tx.Exec(ctx,
		`UPDATE reports_supervisor SET status = 'accepted', updated_at = NOW() WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}

	_, err = tx.Exec(ctx, `
		UPDATE projects SET site_status = $2, updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL`, projectID, siteStatus)
	if err != nil {
		return err
	}

	if parseFloatOrZero(downtimeHours) > 0 {
		_, err = tx.Exec(ctx, `
			UPDATE projects SET downtime_hours = downtime_hours + $2::numeric, updated_at = NOW()
			WHERE id = $1 AND deleted_at IS NULL`, projectID, numericOrZero(downtimeHours))
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func parseFloatOrZero(s string) float64 {
	if s == "" {
		return 0
	}
	var v float64
	_, _ = fmt.Sscanf(s, "%f", &v)
	return v
}
