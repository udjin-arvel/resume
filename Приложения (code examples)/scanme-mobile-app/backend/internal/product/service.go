package product

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"sort"
	"strings"
	"time"

	"scanme/backend/internal/analysis"
	"scanme/backend/internal/deepseekanalysis"
	platformmetrics "scanme/backend/internal/platform/metrics"
	"scanme/backend/internal/substance"

	"github.com/jackc/pgx/v5"
	"golang.org/x/sync/singleflight"
)

var ErrInvalidProduct = errors.New("invalid product")

type productRepository interface {
	FindFresh(ctx context.Context, barcode string, now time.Time) (Product, bool, error)
	Upsert(ctx context.Context, product Product, raw json.RawMessage) error
	SaveAnalysis(ctx context.Context, barcode string, result analysis.Result) error
	SaveProductEnrichment(ctx context.Context, barcode string, envelope json.RawMessage, ingredients []Ingredient, result analysis.Result, candidates []json.RawMessage) error
	ClearDeepSeekAnalysis(ctx context.Context, barcode string) error
	IsOffMissActive(ctx context.Context, barcode string, now time.Time) (bool, error)
	UpsertOffMiss(ctx context.Context, barcode string, expiresAt time.Time) error
	DeleteOffMiss(ctx context.Context, barcode string) error
	ListAdmin(ctx context.Context, opts ListOptions) ([]Product, error)
	CreateAdmin(ctx context.Context, product Product, raw json.RawMessage, adminID string) (Product, error)
	UpdateAdmin(ctx context.Context, barcode string, product Product, raw json.RawMessage, adminID string) (Product, error)
	DeleteAdmin(ctx context.Context, barcode string, adminID string) error
}

type offFetcher interface {
	FetchProduct(ctx context.Context, barcode string, cacheTTL time.Duration) (Product, json.RawMessage, error)
}

type deepSeekCompleter interface {
	CompleteJSONObject(ctx context.Context, systemPrompt, userPrompt string) (string, error)
}

type Service struct {
	repository       productRepository
	offClient        offFetcher
	substanceService *substance.Service
	deepSeek         deepSeekCompleter
	cacheTTL         time.Duration
	offMissTTL       time.Duration
	group            singleflight.Group
}

func NewService(repository productRepository, offClient offFetcher, cacheTTL time.Duration, offMissTTL time.Duration) *Service {
	if cacheTTL <= 0 {
		cacheTTL = 30 * 24 * time.Hour
	}
	if offMissTTL <= 0 {
		offMissTTL = 7 * 24 * time.Hour
	}

	return &Service{
		repository: repository,
		offClient:  offClient,
		cacheTTL:   cacheTTL,
		offMissTTL: offMissTTL,
	}
}

func (s *Service) WithSubstances(substanceService *substance.Service) *Service {
	s.substanceService = substanceService
	return s
}

func (s *Service) WithDeepSeek(client deepSeekCompleter) *Service {
	s.deepSeek = client
	return s
}

func (s *Service) GetByBarcode(ctx context.Context, barcode string) (Product, error) {
	barcode = strings.TrimSpace(barcode)
	if barcode == "" {
		return Product{}, ErrProductNotFound
	}

	now := time.Now().UTC()
	if product, ok, err := s.repository.FindFresh(ctx, barcode, now); err != nil {
		return Product{}, err
	} else if ok {
		platformmetrics.ProductCacheHits.Inc()
		return s.withAnalysis(ctx, product)
	}

	blocked, err := s.repository.IsOffMissActive(ctx, barcode, now)
	if err != nil {
		return Product{}, err
	}
	if blocked {
		return Product{}, ErrProductNotFound
	}

	value, err, _ := s.group.Do(barcode, func() (any, error) {
		now := time.Now().UTC()
		if product, ok, err := s.repository.FindFresh(ctx, barcode, now); err != nil {
			return Product{}, err
		} else if ok {
			platformmetrics.ProductCacheHits.Inc()
			return product, nil
		}

		if blocked, err := s.repository.IsOffMissActive(ctx, barcode, now); err != nil {
			return Product{}, err
		} else if blocked {
			return Product{}, ErrProductNotFound
		}

		product, raw, err := s.offClient.FetchProduct(ctx, barcode, s.cacheTTL)
		if err != nil {
			if errors.Is(err, ErrProductNotFound) {
				_ = s.repository.UpsertOffMiss(ctx, barcode, now.Add(s.offMissTTL))
			}
			return Product{}, err
		}
		if err := s.repository.Upsert(ctx, product, raw); err != nil {
			return Product{}, err
		}
		platformmetrics.ProductCacheMisses.Inc()
		return product, nil
	})
	if err != nil {
		return Product{}, err
	}

	return s.withAnalysis(ctx, value.(Product))
}

func (s *Service) ListAdmin(ctx context.Context, opts ListOptions) (ListResponse, error) {
	items, err := s.repository.ListAdmin(ctx, opts)
	if err != nil {
		return ListResponse{}, err
	}
	return ListResponse{Items: items}, nil
}

func (s *Service) CreateAdmin(ctx context.Context, input UpsertInput, adminID string) (Product, error) {
	product, raw, err := s.productFromInput(input, "")
	if err != nil {
		return Product{}, err
	}
	return s.repository.CreateAdmin(ctx, product, raw, adminID)
}

func (s *Service) UpdateAdmin(ctx context.Context, barcode string, input UpsertInput, adminID string) (Product, error) {
	product, raw, err := s.productFromInput(input, barcode)
	if err != nil {
		return Product{}, err
	}
	item, err := s.repository.UpdateAdmin(ctx, strings.TrimSpace(barcode), product, raw, adminID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Product{}, ErrProductNotFound
	}
	return item, err
}

func (s *Service) DeleteAdmin(ctx context.Context, barcode string, adminID string) error {
	if err := s.repository.DeleteAdmin(ctx, strings.TrimSpace(barcode), adminID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrProductNotFound
		}
		return err
	}
	return nil
}

func (s *Service) withAnalysis(ctx context.Context, product Product) (Product, error) {
	if s.substanceService == nil {
		product.Analysis = analysis.Result{OverallDanger: "safe"}
		return product, nil
	}

	if strings.TrimSpace(product.AnalysisSource) != "" {
		return product, nil
	}

	result, err := s.substanceService.List(ctx, substance.ListOptions{Limit: 200})
	if err != nil {
		return Product{}, err
	}

	ingredientTexts := make([]string, 0, len(product.Ingredients))
	for _, ingredient := range product.Ingredients {
		ingredientTexts = append(ingredientTexts, ingredient.Text)
	}
	local := analysis.AnalyzeIngredients(ingredientTexts, result.Items)
	product.Analysis = local

	if s.deepSeek == nil {
		if err := s.repository.SaveAnalysis(ctx, product.Barcode, product.Analysis); err != nil {
			return Product{}, err
		}
		return product, nil
	}

	userJSON, err := deepseekanalysis.BuildUserPayloadJSON(product.Barcode, product.Name, product.Brands, ingredientTexts, local)
	if err != nil {
		return Product{}, err
	}

	dsStart := time.Now()
	reply, dsErr := s.deepSeek.CompleteJSONObject(ctx, deepseekanalysis.SystemPrompt(), string(userJSON))
	platformmetrics.DeepSeekRequestDurationSeconds.Observe(time.Since(dsStart).Seconds())

	if dsErr != nil {
		slog.WarnContext(ctx, "deepseek_enrich_failed", "barcode", product.Barcode, "error", dsErr)
		if err := s.repository.ClearDeepSeekAnalysis(ctx, product.Barcode); err != nil {
			return Product{}, err
		}
		if err := s.repository.SaveAnalysis(ctx, product.Barcode, product.Analysis); err != nil {
			return Product{}, err
		}
		return product, nil
	}

	model, err := deepseekanalysis.ParseModelResponse([]byte(reply))
	if err != nil {
		slog.WarnContext(ctx, "deepseek_json_invalid", "barcode", product.Barcode, "error", err)
		if err := s.repository.ClearDeepSeekAnalysis(ctx, product.Barcode); err != nil {
			return Product{}, err
		}
		if err := s.repository.SaveAnalysis(ctx, product.Barcode, product.Analysis); err != nil {
			return Product{}, err
		}
		return product, nil
	}

	out := deepseekanalysis.MergeModel(local, result.Items, model)
	ingredients := applyIngredientPatch(product.Ingredients, out.IngredientPatch)

	env := persistedEnvelopeForSave{
		Raw:            json.RawMessage(reply),
		MergedAnalysis: out.MergedAnalysis,
		AiInsight: AiInsight{
			ProductSummary:      out.Insight.ProductSummary,
			CompositionOverview: out.Insight.CompositionOverview,
			Disclaimer:          out.Insight.Disclaimer,
			Locale:              out.Insight.Locale,
		},
		AnalysisSource: out.AnalysisSource,
	}
	envBytes, err := json.Marshal(env)
	if err != nil {
		return Product{}, err
	}

	if err := s.repository.SaveProductEnrichment(ctx, product.Barcode, envBytes, ingredients, out.MergedAnalysis, out.Candidates); err != nil {
		return Product{}, err
	}

	product.Ingredients = ingredients
	product.Analysis = out.MergedAnalysis
	product.AiInsight = env.AiInsight
	product.AnalysisSource = out.AnalysisSource
	return product, nil
}

type persistedEnvelopeForSave struct {
	Raw            json.RawMessage `json:"raw"`
	MergedAnalysis analysis.Result `json:"mergedAnalysis"`
	AiInsight      AiInsight       `json:"aiInsight"`
	AnalysisSource string          `json:"analysisSource"`
}

func applyIngredientPatch(base []Ingredient, patch []deepseekanalysis.IngredientNormalized) []Ingredient {
	if len(patch) == 0 {
		return base
	}
	out := make([]Ingredient, 0, len(patch))
	for i, p := range patch {
		rank := p.Rank
		if rank <= 0 {
			rank = i + 1
		}
		out = append(out, Ingredient{
			ID:         strings.TrimSpace(p.ID),
			Text:       strings.TrimSpace(p.Text),
			Percent:    strings.TrimSpace(p.Percent),
			Rank:       rank,
			Vegan:      strings.TrimSpace(p.Vegan),
			Vegetarian: strings.TrimSpace(p.Vegetarian),
		})
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Rank == out[j].Rank {
			return out[i].Text < out[j].Text
		}
		return out[i].Rank < out[j].Rank
	})
	return out
}

func (s *Service) productFromInput(input UpsertInput, fallbackBarcode string) (Product, json.RawMessage, error) {
	barcode := strings.TrimSpace(input.Barcode)
	if barcode == "" {
		barcode = strings.TrimSpace(fallbackBarcode)
	}
	name := strings.TrimSpace(input.Name)
	if barcode == "" || len(barcode) > 64 || name == "" {
		return Product{}, nil, ErrInvalidProduct
	}

	now := time.Now().UTC()
	product := Product{
		Barcode:     barcode,
		Name:        name,
		Brands:      strings.TrimSpace(input.Brands),
		ImageURL:    strings.TrimSpace(input.ImageURL),
		Ingredients: normalizeAdminIngredients(input.Ingredients),
		Source:      "scanme_admin",
		FetchedAt:   now,
		CachedUntil: now.Add(3650 * 24 * time.Hour),
		Analysis:    analysis.Result{OverallDanger: "safe"},
	}

	raw, err := json.Marshal(map[string]any{
		"source":      "scanme_admin",
		"adminEdited": true,
		"savedAt":     now,
	})
	if err != nil {
		return Product{}, nil, err
	}

	return product, raw, nil
}

func normalizeAdminIngredients(items []Ingredient) []Ingredient {
	normalized := make([]Ingredient, 0, len(items))
	for index, item := range items {
		text := strings.TrimSpace(item.Text)
		if text == "" {
			continue
		}
		rank := item.Rank
		if rank <= 0 {
			rank = index + 1
		}
		normalized = append(normalized, Ingredient{
			ID:         strings.TrimSpace(item.ID),
			Text:       text,
			Percent:    strings.TrimSpace(item.Percent),
			Rank:       rank,
			Vegan:      strings.TrimSpace(item.Vegan),
			Vegetarian: strings.TrimSpace(item.Vegetarian),
		})
	}
	return normalized
}
