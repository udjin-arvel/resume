package product

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"scanme/backend/internal/analysis"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return Repository{db: db}
}

type persistedDeepSeekEnvelope struct {
	Raw            json.RawMessage `json:"raw"`
	MergedAnalysis analysis.Result `json:"mergedAnalysis"`
	AiInsight      AiInsight       `json:"aiInsight"`
	AnalysisSource string          `json:"analysisSource"`
}

func (r Repository) FindFresh(ctx context.Context, barcode string, now time.Time) (Product, bool, error) {
	var product Product
	var ingredientsJSON []byte
	var deepseekRaw []byte

	err := r.db.QueryRow(ctx, `
		SELECT barcode, name, COALESCE(brands, ''), COALESCE(image_url, ''), ingredients, fetched_at, expires_at,
			deepseek_analysis
		FROM products
		WHERE barcode = $1 AND expires_at > $2
	`, barcode, now).Scan(
		&product.Barcode,
		&product.Name,
		&product.Brands,
		&product.ImageURL,
		&ingredientsJSON,
		&product.FetchedAt,
		&product.CachedUntil,
		&deepseekRaw,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return Product{}, false, nil
		}
		return Product{}, false, err
	}

	product.Ingredients = parseIngredientsJSON(ingredientsJSON)
	product.Source = "cache"

	if len(deepseekRaw) > 0 {
		var env persistedDeepSeekEnvelope
		if err := json.Unmarshal(deepseekRaw, &env); err == nil && strings.TrimSpace(env.AnalysisSource) != "" {
			product.Analysis = env.MergedAnalysis
			product.AiInsight = env.AiInsight
			product.AnalysisSource = env.AnalysisSource
		}
	}

	return product, true, nil
}

func (r Repository) Upsert(ctx context.Context, product Product, raw json.RawMessage) error {
	ingredientsJSON, err := json.Marshal(product.Ingredients)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(ctx, `
		INSERT INTO products (
			barcode, name, brands, image_url, ingredients, raw_off_json, fetched_at, expires_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (barcode) DO UPDATE SET
			name = EXCLUDED.name,
			brands = EXCLUDED.brands,
			image_url = EXCLUDED.image_url,
			ingredients = EXCLUDED.ingredients,
			raw_off_json = EXCLUDED.raw_off_json,
			fetched_at = EXCLUDED.fetched_at,
			expires_at = EXCLUDED.expires_at,
			updated_at = now()
	`, product.Barcode, product.Name, product.Brands, product.ImageURL, ingredientsJSON, raw, product.FetchedAt, product.CachedUntil)
	if err != nil {
		return err
	}
	return r.DeleteOffMiss(ctx, product.Barcode)
}

func (r Repository) IsOffMissActive(ctx context.Context, barcode string, now time.Time) (bool, error) {
	var dummy int
	err := r.db.QueryRow(ctx, `
		SELECT 1 FROM product_off_misses WHERE barcode = $1 AND expires_at > $2
	`, barcode, now).Scan(&dummy)
	if err != nil {
		if err == pgx.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (r Repository) UpsertOffMiss(ctx context.Context, barcode string, expiresAt time.Time) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO product_off_misses (barcode, expires_at)
		VALUES ($1, $2)
		ON CONFLICT (barcode) DO UPDATE SET expires_at = EXCLUDED.expires_at
	`, barcode, expiresAt)
	return err
}

func (r Repository) DeleteOffMiss(ctx context.Context, barcode string) error {
	_, err := r.db.Exec(ctx, `
		DELETE FROM product_off_misses WHERE barcode = $1
	`, barcode)
	return err
}

func (r Repository) ListAdmin(ctx context.Context, opts ListOptions) ([]Product, error) {
	if opts.Limit <= 0 || opts.Limit > 200 {
		opts.Limit = 100
	}

	rows, err := r.db.Query(ctx, `
		SELECT barcode, name, COALESCE(brands, ''), COALESCE(image_url, ''), ingredients, fetched_at, expires_at
		FROM products
		WHERE $1::text = ''
			OR barcode ILIKE '%' || $1 || '%'
			OR name ILIKE '%' || $1 || '%'
			OR COALESCE(brands, '') ILIKE '%' || $1 || '%'
		ORDER BY updated_at DESC, fetched_at DESC
		LIMIT $2
	`, strings.TrimSpace(opts.Query), opts.Limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanProducts(rows, "cache")
}

func (r Repository) CreateAdmin(ctx context.Context, product Product, raw json.RawMessage, adminID string) (Product, error) {
	ingredientsJSON, err := json.Marshal(product.Ingredients)
	if err != nil {
		return Product{}, err
	}

	var item Product
	var storedIngredients []byte
	err = r.db.QueryRow(ctx, `
		INSERT INTO products (
			barcode, name, brands, image_url, ingredients, raw_off_json, fetched_at, expires_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING barcode, name, COALESCE(brands, ''), COALESCE(image_url, ''), ingredients, fetched_at, expires_at
	`, product.Barcode, product.Name, product.Brands, product.ImageURL, ingredientsJSON, raw, product.FetchedAt, product.CachedUntil).Scan(
		&item.Barcode,
		&item.Name,
		&item.Brands,
		&item.ImageURL,
		&storedIngredients,
		&item.FetchedAt,
		&item.CachedUntil,
	)
	if err != nil {
		return Product{}, err
	}
	item.Ingredients = parseIngredientsJSON(storedIngredients)
	item.Source = "scanme_admin"
	if err := r.DeleteOffMiss(ctx, item.Barcode); err != nil {
		return Product{}, err
	}
	return item, r.writeAudit(ctx, adminID, "product.create", item.Barcode, item)
}

func (r Repository) UpdateAdmin(ctx context.Context, barcode string, product Product, raw json.RawMessage, adminID string) (Product, error) {
	ingredientsJSON, err := json.Marshal(product.Ingredients)
	if err != nil {
		return Product{}, err
	}

	var item Product
	var storedIngredients []byte
	err = r.db.QueryRow(ctx, `
		UPDATE products SET
			name = $2,
			brands = $3,
			image_url = $4,
			ingredients = $5,
			raw_off_json = $6,
			fetched_at = $7,
			expires_at = $8,
			updated_at = now()
		WHERE barcode = $1
		RETURNING barcode, name, COALESCE(brands, ''), COALESCE(image_url, ''), ingredients, fetched_at, expires_at
	`, barcode, product.Name, product.Brands, product.ImageURL, ingredientsJSON, raw, product.FetchedAt, product.CachedUntil).Scan(
		&item.Barcode,
		&item.Name,
		&item.Brands,
		&item.ImageURL,
		&storedIngredients,
		&item.FetchedAt,
		&item.CachedUntil,
	)
	if err != nil {
		return Product{}, err
	}
	item.Ingredients = parseIngredientsJSON(storedIngredients)
	item.Source = "scanme_admin"
	if err := r.DeleteOffMiss(ctx, item.Barcode); err != nil {
		return Product{}, err
	}
	return item, r.writeAudit(ctx, adminID, "product.update", item.Barcode, item)
}

func (r Repository) DeleteAdmin(ctx context.Context, barcode string, adminID string) error {
	commandTag, err := r.db.Exec(ctx, `
		DELETE FROM products
		WHERE barcode = $1
	`, barcode)
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	if err := r.DeleteOffMiss(ctx, barcode); err != nil {
		return err
	}
	return r.writeAudit(ctx, adminID, "product.delete", barcode, map[string]string{"barcode": barcode})
}

func (r Repository) SaveAnalysis(ctx context.Context, barcode string, result analysis.Result) error {
	substanceIDs := collectUUIDSubstanceIDs(result)

	_, err := r.db.Exec(ctx, `
		INSERT INTO product_analyses (product_barcode, substance_ids, overall_danger, computed_at)
		VALUES ($1, $2::uuid[], $3, now())
		ON CONFLICT (product_barcode) DO UPDATE SET
			substance_ids = EXCLUDED.substance_ids,
			overall_danger = EXCLUDED.overall_danger,
			computed_at = EXCLUDED.computed_at
	`, barcode, substanceIDs, result.OverallDanger)
	return err
}

func (r Repository) ClearDeepSeekAnalysis(ctx context.Context, barcode string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE products SET deepseek_analysis = NULL, updated_at = now()
		WHERE barcode = $1
	`, barcode)
	return err
}

// SaveProductEnrichment persists DeepSeek envelope, optional ingredient rewrite, merged analysis, and candidate queue rows in one transaction.
func (r Repository) SaveProductEnrichment(ctx context.Context, barcode string, envelope json.RawMessage, ingredients []Ingredient, result analysis.Result, candidates []json.RawMessage) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	ingredientsJSON, err := json.Marshal(ingredients)
	if err != nil {
		return err
	}

	if _, err := tx.Exec(ctx, `
		UPDATE products SET
			ingredients = $2::jsonb,
			deepseek_analysis = $3::jsonb,
			updated_at = now()
		WHERE barcode = $1
	`, barcode, ingredientsJSON, envelope); err != nil {
		return err
	}

	substanceIDs := collectUUIDSubstanceIDs(result)
	if _, err := tx.Exec(ctx, `
		INSERT INTO product_analyses (product_barcode, substance_ids, overall_danger, computed_at)
		VALUES ($1, $2::uuid[], $3, now())
		ON CONFLICT (product_barcode) DO UPDATE SET
			substance_ids = EXCLUDED.substance_ids,
			overall_danger = EXCLUDED.overall_danger,
			computed_at = EXCLUDED.computed_at
	`, barcode, substanceIDs, result.OverallDanger); err != nil {
		return err
	}

	for _, c := range candidates {
		key := normalizedKeyFromCandidateJSON(c)
		if key == "" {
			continue
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO substance_candidate_queue (barcode, candidate, source, normalized_key)
			VALUES ($1, $2, 'deepseek', $3)
			ON CONFLICT (normalized_key) WHERE (status = 'pending') DO NOTHING
		`, barcode, c, key); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func normalizedKeyFromCandidateJSON(raw json.RawMessage) string {
	var v struct {
		Name string `json:"name"`
	}
	if err := json.Unmarshal(raw, &v); err != nil {
		return ""
	}
	return analysis.NormalizeIngredientText(v.Name)
}

func collectUUIDSubstanceIDs(result analysis.Result) []string {
	substanceIDs := make([]string, 0)
	seen := make(map[string]struct{})
	for _, match := range result.Matches {
		for _, item := range match.Substances {
			id := strings.TrimSpace(item.ID)
			if id == "" {
				continue
			}
			if _, err := uuid.Parse(id); err != nil {
				continue
			}
			if _, ok := seen[id]; ok {
				continue
			}
			seen[id] = struct{}{}
			substanceIDs = append(substanceIDs, id)
		}
	}
	return substanceIDs
}

func scanProducts(rows pgx.Rows, source string) ([]Product, error) {
	items := make([]Product, 0)
	for rows.Next() {
		var item Product
		var ingredientsJSON []byte
		if err := rows.Scan(
			&item.Barcode,
			&item.Name,
			&item.Brands,
			&item.ImageURL,
			&ingredientsJSON,
			&item.FetchedAt,
			&item.CachedUntil,
		); err != nil {
			return nil, err
		}
		item.Ingredients = parseIngredientsJSON(ingredientsJSON)
		item.Source = source
		items = append(items, item)
	}
	return items, rows.Err()
}

func parseIngredientsJSON(data []byte) []Ingredient {
	if len(data) == 0 {
		return []Ingredient{}
	}
	var ingredients []Ingredient
	if err := json.Unmarshal(data, &ingredients); err != nil {
		return []Ingredient{}
	}
	return ingredients
}

func (r Repository) writeAudit(ctx context.Context, adminID string, action string, entityID string, diff any) error {
	payload, err := json.Marshal(diff)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(ctx, `
		INSERT INTO admin_audit (id, admin_user_id, action, entity_type, entity_id, diff)
		VALUES (gen_random_uuid(), $1::uuid, $2, 'product', $3, $4)
	`, adminID, action, entityID, payload)
	return err
}
