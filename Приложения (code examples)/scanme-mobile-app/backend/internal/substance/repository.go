package substance

import (
	"context"
	"encoding/json"
	"strings"
	"time"
	"unicode"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return Repository{db: db}
}

func (r Repository) List(ctx context.Context, opts ListOptions) ([]Substance, error) {
	if opts.Limit <= 0 || opts.Limit > 200 {
		opts.Limit = 100
	}

	query := `
		SELECT id::text, COALESCE(code, ''), name, aliases, category, danger_level,
			description, sources, is_active, version, created_at, updated_at
		FROM substances
		WHERE deleted_at IS NULL
			AND ($1::bigint = 0 OR version > $1)
			AND ($2::text = '' OR search_vector @@ plainto_tsquery('simple', $2))
			AND ($3::text = '' OR category = $3)
			AND ($4::text = '' OR danger_level = $4)
			AND ($5::boolean IS NULL OR is_active = $5)
		ORDER BY version ASC
		LIMIT $6
	`

	rows, err := r.db.Query(
		ctx,
		query,
		opts.Since,
		strings.TrimSpace(opts.Query),
		strings.TrimSpace(opts.Category),
		strings.TrimSpace(opts.DangerLevel),
		opts.IsActive,
		opts.Limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanSubstances(rows)
}

func (r Repository) Create(ctx context.Context, input UpsertInput, adminID string) (Substance, error) {
	var item Substance
	err := r.db.QueryRow(ctx, `
		INSERT INTO substances (
			code, name, aliases, category, danger_level, description, sources,
			is_active, created_by, updated_by
		)
		VALUES (NULLIF($1, ''), $2, $3, $4, $5, $6, $7, $8, $9::uuid, $9::uuid)
		RETURNING id::text, COALESCE(code, ''), name, aliases, category, danger_level,
			description, sources, is_active, version, created_at, updated_at
	`, input.Code, input.Name, input.Aliases, input.Category, input.DangerLevel, input.Description, input.Sources, input.isActive(), adminID).Scan(
		&item.ID,
		&item.Code,
		&item.Name,
		&item.Aliases,
		&item.Category,
		&item.DangerLevel,
		&item.Description,
		&item.Sources,
		&item.IsActive,
		&item.Version,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		return Substance{}, err
	}
	return item, r.writeAudit(ctx, adminID, "substance.create", item.ID, item)
}

func (r Repository) Update(ctx context.Context, id string, input UpsertInput, adminID string) (Substance, error) {
	var item Substance
	err := r.db.QueryRow(ctx, `
		UPDATE substances SET
			code = NULLIF($2, ''),
			name = $3,
			aliases = $4,
			category = $5,
			danger_level = $6,
			description = $7,
			sources = $8,
			is_active = $9,
			updated_by = $10::uuid,
			version = nextval('substances_version_seq'),
			updated_at = now()
		WHERE id = $1::uuid AND deleted_at IS NULL
		RETURNING id::text, COALESCE(code, ''), name, aliases, category, danger_level,
			description, sources, is_active, version, created_at, updated_at
	`, id, input.Code, input.Name, input.Aliases, input.Category, input.DangerLevel, input.Description, input.Sources, input.isActive(), adminID).Scan(
		&item.ID,
		&item.Code,
		&item.Name,
		&item.Aliases,
		&item.Category,
		&item.DangerLevel,
		&item.Description,
		&item.Sources,
		&item.IsActive,
		&item.Version,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		return Substance{}, err
	}
	return item, r.writeAudit(ctx, adminID, "substance.update", item.ID, item)
}

func (r Repository) Delete(ctx context.Context, id string, adminID string) error {
	commandTag, err := r.db.Exec(ctx, `
		UPDATE substances SET
			is_active = false,
			deleted_at = now(),
			updated_by = $2::uuid,
			version = nextval('substances_version_seq'),
			updated_at = now()
		WHERE id = $1::uuid AND deleted_at IS NULL
	`, id, adminID)
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return r.writeAudit(ctx, adminID, "substance.delete", id, map[string]string{"id": id})
}

func (r Repository) GetByID(ctx context.Context, id string) (Substance, error) {
	var item Substance
	err := r.db.QueryRow(ctx, `
		SELECT id::text, COALESCE(code, ''), name, aliases, category, danger_level,
			description, sources, is_active, version, created_at, updated_at
		FROM substances
		WHERE id = $1::uuid AND deleted_at IS NULL
	`, id).Scan(
		&item.ID,
		&item.Code,
		&item.Name,
		&item.Aliases,
		&item.Category,
		&item.DangerLevel,
		&item.Description,
		&item.Sources,
		&item.IsActive,
		&item.Version,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		return Substance{}, err
	}
	return item, nil
}

// FindMergeCandidate returns an existing substance id when code matches or normalized name/alias matches candidate name.
func (r Repository) FindMergeCandidate(ctx context.Context, code string, rawName string) (string, bool, error) {
	code = strings.TrimSpace(code)
	if code != "" {
		var id string
		err := r.db.QueryRow(ctx, `
			SELECT id::text FROM substances
			WHERE deleted_at IS NULL AND lower(trim(code)) = lower(trim($1))
			LIMIT 1
		`, code).Scan(&id)
		if err == nil {
			return id, true, nil
		}
		if err != pgx.ErrNoRows {
			return "", false, err
		}
	}

	key := ingredientMatchKey(rawName)
	if key == "" {
		return "", false, nil
	}

	rows, err := r.db.Query(ctx, `
		SELECT id::text, name, aliases FROM substances WHERE deleted_at IS NULL AND is_active = true
	`)
	if err != nil {
		return "", false, err
	}
	defer rows.Close()

	for rows.Next() {
		var id, name string
		var aliases []string
		if err := rows.Scan(&id, &name, &aliases); err != nil {
			return "", false, err
		}
		if ingredientMatchKey(name) == key {
			return id, true, nil
		}
		for _, a := range aliases {
			if ingredientMatchKey(a) == key {
				return id, true, nil
			}
		}
	}
	return "", false, rows.Err()
}

func ingredientMatchKey(value string) string {
	return strings.Join(strings.FieldsFunc(strings.ToLower(value), func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsNumber(r)
	}), " ")
}

type AuditHistoryRow struct {
	ID        string          `json:"id"`
	Action    string          `json:"action"`
	CreatedAt time.Time       `json:"createdAt"`
	Diff      json.RawMessage `json:"diff,omitempty"`
}

func (r Repository) ListAuditHistoryForSubstance(ctx context.Context, substanceID string, limit int) ([]AuditHistoryRow, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	rows, err := r.db.Query(ctx, `
		SELECT id::text, action, diff, created_at FROM admin_audit
		WHERE entity_type = 'substance' AND entity_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`, substanceID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]AuditHistoryRow, 0)
	for rows.Next() {
		var row AuditHistoryRow
		var diff []byte
		if err := rows.Scan(&row.ID, &row.Action, &diff, &row.CreatedAt); err != nil {
			return nil, err
		}
		if len(diff) > 0 {
			row.Diff = append(json.RawMessage(nil), diff...)
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r Repository) GetAuditDiffByID(ctx context.Context, auditID, substanceID string) ([]byte, error) {
	var diff []byte
	err := r.db.QueryRow(ctx, `
		SELECT diff FROM admin_audit
		WHERE id = $1::uuid AND entity_type = 'substance' AND entity_id = $2
	`, auditID, substanceID).Scan(&diff)
	return diff, err
}

func (r Repository) RestoreSubstanceSnapshot(ctx context.Context, snapshot Substance, adminID string) error {
	tag, err := r.db.Exec(ctx, `
		UPDATE substances SET
			code = NULLIF($2, ''),
			name = $3,
			aliases = $4,
			category = $5,
			danger_level = $6,
			description = $7,
			sources = $8,
			is_active = $9,
			deleted_at = NULL,
			updated_by = $10::uuid,
			version = nextval('substances_version_seq'),
			updated_at = now()
		WHERE id = $1::uuid
	`, snapshot.ID, snapshot.Code, snapshot.Name, snapshot.Aliases, snapshot.Category, snapshot.DangerLevel,
		snapshot.Description, snapshot.Sources, snapshot.IsActive, adminID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return r.writeAudit(ctx, adminID, "substance.rollback", snapshot.ID, snapshot)
}

func scanSubstances(rows pgx.Rows) ([]Substance, error) {
	items := make([]Substance, 0)
	for rows.Next() {
		var item Substance
		if err := rows.Scan(
			&item.ID,
			&item.Code,
			&item.Name,
			&item.Aliases,
			&item.Category,
			&item.DangerLevel,
			&item.Description,
			&item.Sources,
			&item.IsActive,
			&item.Version,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (input UpsertInput) isActive() bool {
	if input.IsActive == nil {
		return true
	}
	return *input.IsActive
}

func (r Repository) writeAudit(ctx context.Context, adminID string, action string, entityID string, diff any) error {
	payload, err := json.Marshal(diff)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(ctx, `
		INSERT INTO admin_audit (id, admin_user_id, action, entity_type, entity_id, diff)
		VALUES (gen_random_uuid(), $1::uuid, $2, 'substance', $3, $4)
	`, adminID, action, entityID, payload)
	return err
}
