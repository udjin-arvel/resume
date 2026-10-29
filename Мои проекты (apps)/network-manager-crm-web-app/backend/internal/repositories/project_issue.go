package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/radar-crm/backend/internal/apperrors"
	"github.com/radar-crm/backend/internal/models"
)

type ProjectIssueRepository struct {
	pool *pgxpool.Pool
}

func NewProjectIssueRepository(pool *pgxpool.Pool) *ProjectIssueRepository {
	return &ProjectIssueRepository{pool: pool}
}

const projectIssueColumns = `id, project_id, number, title, category, description, status::text, source_report_id, created_at, updated_at`

func scanProjectIssue(row pgx.Row) (*models.ProjectIssue, error) {
	var i models.ProjectIssue
	err := row.Scan(
		&i.ID, &i.ProjectID, &i.Number, &i.Title, &i.Category, &i.Description,
		&i.Status, &i.SourceReportID, &i.CreatedAt, &i.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &i, nil
}

func (r *ProjectIssueRepository) GetByID(ctx context.Context, id string) (*models.ProjectIssue, error) {
	query := `SELECT ` + projectIssueColumns + ` FROM project_issues WHERE id = $1`
	issue, err := scanProjectIssue(r.pool.QueryRow(ctx, query, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get project issue: %w", err)
	}
	return issue, nil
}

func (r *ProjectIssueRepository) Create(ctx context.Context, issue *models.ProjectIssue) error {
	var nextNumber int
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(MAX(number), 0) + 1 FROM project_issues WHERE project_id = $1`,
		issue.ProjectID,
	).Scan(&nextNumber)
	if err != nil {
		return fmt.Errorf("next issue number: %w", err)
	}
	issue.Number = nextNumber

	query := `
		INSERT INTO project_issues (project_id, number, title, category, description, status, source_report_id)
		VALUES ($1, $2, $3, $4, $5, $6::project_issue_status, $7)
		RETURNING id, created_at, updated_at`
	err = r.pool.QueryRow(ctx, query,
		issue.ProjectID, issue.Number, issue.Title, issue.Category, issue.Description,
		issue.Status, issue.SourceReportID,
	).Scan(&issue.ID, &issue.CreatedAt, &issue.UpdatedAt)
	if err != nil {
		return fmt.Errorf("create project issue: %w", err)
	}
	return nil
}

func (r *ProjectIssueRepository) UpdateStatus(ctx context.Context, id, status string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE project_issues SET status = $2::project_issue_status, updated_at = NOW() WHERE id = $1`,
		id, status)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *ProjectIssueRepository) CountOpenByProject(ctx context.Context, projectID string) (int64, error) {
	var count int64
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM project_issues WHERE project_id = $1 AND status != 'resolved'`,
		projectID,
	).Scan(&count)
	return count, err
}

func (r *ProjectIssueRepository) ListByProjectID(ctx context.Context, projectID string, statuses []string) ([]models.ProjectIssue, error) {
	query := `SELECT ` + projectIssueColumns + ` FROM project_issues WHERE project_id = $1`
	args := []any{projectID}
	if len(statuses) > 0 {
		query += ` AND status = ANY($2::project_issue_status[])`
		args = append(args, statuses)
	}
	query += ` ORDER BY number DESC`

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list project issues: %w", err)
	}
	defer rows.Close()

	var items []models.ProjectIssue
	for rows.Next() {
		issue, err := scanProjectIssue(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *issue)
	}
	return items, rows.Err()
}

func (r *ProjectIssueRepository) ListByIDs(ctx context.Context, ids []string) ([]models.ProjectIssue, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	rows, err := r.pool.Query(ctx,
		`SELECT `+projectIssueColumns+` FROM project_issues WHERE id = ANY($1::uuid[]) ORDER BY number DESC`,
		ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.ProjectIssue
	for rows.Next() {
		issue, err := scanProjectIssue(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *issue)
	}
	return items, rows.Err()
}
