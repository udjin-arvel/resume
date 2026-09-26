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

type ProjectRepository struct {
	pool *pgxpool.Pool
}

func NewProjectRepository(pool *pgxpool.Pool) *ProjectRepository {
	return &ProjectRepository{pool: pool}
}

const projectColumns = `id, client_id, estimate_id, supervisor_id, name, location,
	start_date, end_date, status, type, site_status, downtime_hours, budget, spent,
	created_at, updated_at, deleted_at`

func scanProject(row pgx.Row) (*models.Project, error) {
	var p models.Project
	err := row.Scan(
		&p.ID, &p.ClientID, &p.EstimateID, &p.SupervisorID, &p.Name, &p.Location,
		&p.StartDate, &p.EndDate, &p.Status, &p.Type, &p.SiteStatus, &p.DowntimeHours, &p.Budget, &p.Spent,
		&p.CreatedAt, &p.UpdatedAt, &p.DeletedAt,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

type ProjectListFilter struct {
	Status   string
	ClientID string
	Search   string
}

func (r *ProjectRepository) List(ctx context.Context, q dto.ProjectListQuery) ([]models.Project, int64, error) {
	page, pageSize := normalizePagination(q.Page, q.PageSize)
	offset := (page - 1) * pageSize

	where := `WHERE deleted_at IS NULL`
	args := []any{}
	argN := 1

	if q.Status != "" {
		where += fmt.Sprintf(` AND status = $%d`, argN)
		args = append(args, q.Status)
		argN++
	}
	if q.ClientID != "" {
		where += fmt.Sprintf(` AND client_id = $%d`, argN)
		args = append(args, q.ClientID)
		argN++
	}
	if q.Search != "" {
		where += fmt.Sprintf(` AND (name ILIKE $%d OR COALESCE(location, '') ILIKE $%d)`, argN, argN)
		args = append(args, "%"+q.Search+"%")
		argN++
	}

	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM projects `+where, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count projects: %w", err)
	}

	listQuery := `SELECT ` + projectColumns + ` FROM projects ` + where +
		fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, argN, argN+1)
	listArgs := append(args, pageSize, offset)

	rows, err := r.pool.Query(ctx, listQuery, listArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("list projects: %w", err)
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		p, err := scanProject(rows)
		if err != nil {
			return nil, 0, fmt.Errorf("scan project: %w", err)
		}
		projects = append(projects, *p)
	}
	return projects, total, rows.Err()
}

func (r *ProjectRepository) GetByID(ctx context.Context, id string) (*models.Project, error) {
	query := `SELECT ` + projectColumns + ` FROM projects WHERE id = $1 AND deleted_at IS NULL`
	p, err := scanProject(r.pool.QueryRow(ctx, query, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get project: %w", err)
	}
	return p, nil
}

func (r *ProjectRepository) FindByEstimateID(ctx context.Context, estimateID string) (*models.Project, error) {
	query := `SELECT ` + projectColumns + ` FROM projects WHERE estimate_id = $1 AND deleted_at IS NULL LIMIT 1`
	p, err := scanProject(r.pool.QueryRow(ctx, query, estimateID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find project by estimate: %w", err)
	}
	return p, nil
}

func (r *ProjectRepository) MapProjectIDsByEstimateIDs(ctx context.Context, estimateIDs []string) (map[string]string, error) {
	result := make(map[string]string)
	if len(estimateIDs) == 0 {
		return result, nil
	}
	rows, err := r.pool.Query(ctx,
		`SELECT estimate_id, id FROM projects WHERE estimate_id = ANY($1) AND deleted_at IS NULL`,
		estimateIDs,
	)
	if err != nil {
		return nil, fmt.Errorf("map projects by estimate ids: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var estimateID, projectID string
		if err := rows.Scan(&estimateID, &projectID); err != nil {
			return nil, err
		}
		result[estimateID] = projectID
	}
	return result, rows.Err()
}

func (r *ProjectRepository) GetClientName(ctx context.Context, clientID string) (string, error) {
	var name string
	err := r.pool.QueryRow(ctx,
		`SELECT name FROM clients WHERE id = $1 AND deleted_at IS NULL`, clientID,
	).Scan(&name)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", apperrors.ErrNotFound
	}
	if err != nil {
		return "", fmt.Errorf("get client name: %w", err)
	}
	return name, nil
}

type ClientContactInfo struct {
	ContactPerson string
	Phone         string
}

func (r *ProjectRepository) GetClientContact(ctx context.Context, clientID string) (*ClientContactInfo, error) {
	var info ClientContactInfo
	err := r.pool.QueryRow(ctx,
		`SELECT contact_person, phone FROM clients WHERE id = $1 AND deleted_at IS NULL`, clientID,
	).Scan(&info.ContactPerson, &info.Phone)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get client contact: %w", err)
	}
	return &info, nil
}

func (r *ProjectRepository) Create(ctx context.Context, p *models.Project) error {
	query := `
		INSERT INTO projects (
			client_id, estimate_id, supervisor_id, name, location,
			start_date, end_date, status, type, site_status, downtime_hours, budget, spent
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, created_at, updated_at`
	err := r.pool.QueryRow(ctx, query,
		p.ClientID, p.EstimateID, p.SupervisorID, p.Name, p.Location,
		p.StartDate, p.EndDate, p.Status, p.Type, p.SiteStatus, p.DowntimeHours, p.Budget, p.Spent,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return fmt.Errorf("create project: %w", err)
	}
	return nil
}

func (r *ProjectRepository) Update(ctx context.Context, p *models.Project) error {
	query := `
		UPDATE projects SET
			client_id = $2, estimate_id = $3, supervisor_id = $4, name = $5, location = $6,
			start_date = $7, end_date = $8, status = $9, type = $10, site_status = $11,
			downtime_hours = $12, budget = $13, spent = $14, updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING updated_at`
	err := r.pool.QueryRow(ctx, query,
		p.ID, p.ClientID, p.EstimateID, p.SupervisorID, p.Name, p.Location,
		p.StartDate, p.EndDate, p.Status, p.Type, p.SiteStatus, p.DowntimeHours, p.Budget, p.Spent,
	).Scan(&p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return apperrors.ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("update project: %w", err)
	}
	return nil
}

func (r *ProjectRepository) SoftDelete(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE projects SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, id)
	if err != nil {
		return fmt.Errorf("delete project: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *ProjectRepository) ClientExists(ctx context.Context, clientID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM clients WHERE id = $1 AND deleted_at IS NULL)`, clientID,
	).Scan(&exists)
	return exists, err
}

func (r *ProjectRepository) EstimateExists(ctx context.Context, estimateID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM estimates WHERE id = $1)`, estimateID,
	).Scan(&exists)
	return exists, err
}

func (r *ProjectRepository) UpdateSupervisorID(ctx context.Context, projectID string, supervisorID *string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE projects SET supervisor_id = $2, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
		projectID, supervisorID)
	return err
}

func (r *ProjectRepository) GetEstimate(ctx context.Context, estimateID string) (*models.Estimate, error) {
	query := `SELECT id, client_id, created_by, name, company_name, contact_person, phone, email,
		country, city, comment, status, total_amount::text, created_at, updated_at
		FROM estimates WHERE id = $1`
	var e models.Estimate
	err := r.pool.QueryRow(ctx, query, estimateID).Scan(
		&e.ID, &e.ClientID, &e.CreatedBy, &e.Name, &e.CompanyName, &e.ContactPerson, &e.Phone, &e.Email,
		&e.Country, &e.City, &e.Comment, &e.Status, &e.TotalAmount, &e.CreatedAt, &e.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *ProjectRepository) UpdateSiteStatus(ctx context.Context, projectID, siteStatus string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE projects SET site_status = $2, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
		projectID, siteStatus)
	return err
}
