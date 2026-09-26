package product

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"scanme/backend/internal/analysis"
)

func TestProductHandlerFetchesFromOFFThenCache(t *testing.T) {
	var offHits int
	offServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		offHits++

		if r.URL.Path != "/api/v2/product/4601234567890.json" {
			t.Fatalf("unexpected OFF path: %s", r.URL.Path)
		}

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"status": 1,
			"product": {
				"code": "4601234567890",
				"product_name": "Cached Yogurt",
				"brands": "ScanMe",
				"ingredients": [
					{"id": "en:milk", "text": "Milk", "rank": 1, "percent_estimate": 70}
				]
			}
		}`))
	}))
	defer offServer.Close()

	repository := newMemoryProductRepository()
	service := NewService(repository, NewOFFClient(offServer.URL, time.Second), 30*24*time.Hour, 24*time.Hour)
	handler := NewHandler(service).Routes()

	first := performProductRequest(handler, "4601234567890")
	if first.Code != http.StatusOK {
		t.Fatalf("expected first status 200, got %d: %s", first.Code, first.Body.String())
	}

	var firstProduct Product
	if err := json.Unmarshal(first.Body.Bytes(), &firstProduct); err != nil {
		t.Fatalf("decode first product: %v", err)
	}
	if firstProduct.Source != "open_food_facts" {
		t.Fatalf("expected OFF source, got %q", firstProduct.Source)
	}

	second := performProductRequest(handler, "4601234567890")
	if second.Code != http.StatusOK {
		t.Fatalf("expected second status 200, got %d: %s", second.Code, second.Body.String())
	}

	var secondProduct Product
	if err := json.Unmarshal(second.Body.Bytes(), &secondProduct); err != nil {
		t.Fatalf("decode second product: %v", err)
	}
	if secondProduct.Source != "cache" {
		t.Fatalf("expected cache source, got %q", secondProduct.Source)
	}
	if offHits != 1 {
		t.Fatalf("expected one OFF hit, got %d", offHits)
	}
}

func TestProductHandlerReturnsProductNotFoundCode(t *testing.T) {
	offServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status": 0}`))
	}))
	defer offServer.Close()

	service := NewService(newMemoryProductRepository(), NewOFFClient(offServer.URL, time.Second), 30*24*time.Hour, 24*time.Hour)
	response := performProductRequest(NewHandler(service).Routes(), "missing")

	if response.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d: %s", response.Code, response.Body.String())
	}
	if body := response.Body.String(); body == "" || !json.Valid(response.Body.Bytes()) {
		t.Fatalf("expected valid json error body, got %q", body)
	}
	if !strings.Contains(response.Body.String(), "PRODUCT_NOT_FOUND") {
		t.Fatalf("expected PRODUCT_NOT_FOUND error, got %s", response.Body.String())
	}
}

func TestProductHandlerSkipsOFFAfterMissCached(t *testing.T) {
	var offHits int
	offServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		offHits++
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status": 0}`))
	}))
	defer offServer.Close()

	service := NewService(newMemoryProductRepository(), NewOFFClient(offServer.URL, time.Second), 30*24*time.Hour, 24*time.Hour)
	handler := NewHandler(service).Routes()

	first := performProductRequest(handler, "unknown-barcode")
	if first.Code != http.StatusNotFound {
		t.Fatalf("expected first status 404, got %d", first.Code)
	}
	second := performProductRequest(handler, "unknown-barcode")
	if second.Code != http.StatusNotFound {
		t.Fatalf("expected second status 404, got %d", second.Code)
	}
	if offHits != 1 {
		t.Fatalf("expected one OFF request (negative cache), got %d", offHits)
	}
}

func performProductRequest(handler http.Handler, barcode string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(http.MethodGet, "/"+barcode, nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	return response
}

type memoryProductRepository struct {
	mu       sync.Mutex
	products map[string]Product
	misses   map[string]time.Time
}

func newMemoryProductRepository() *memoryProductRepository {
	return &memoryProductRepository{
		products: make(map[string]Product),
		misses:   make(map[string]time.Time),
	}
}

func (r *memoryProductRepository) FindFresh(ctx context.Context, barcode string, now time.Time) (Product, bool, error) {
	_ = ctx

	r.mu.Lock()
	defer r.mu.Unlock()

	product, ok := r.products[barcode]
	if !ok || !product.CachedUntil.After(now) {
		return Product{}, false, nil
	}

	product.Source = "cache"
	return product, true, nil
}

func (r *memoryProductRepository) Upsert(ctx context.Context, product Product, raw json.RawMessage) error {
	_ = ctx
	_ = raw

	r.mu.Lock()
	defer r.mu.Unlock()

	r.products[product.Barcode] = product
	delete(r.misses, product.Barcode)
	return nil
}

func (r *memoryProductRepository) IsOffMissActive(ctx context.Context, barcode string, now time.Time) (bool, error) {
	_ = ctx

	r.mu.Lock()
	defer r.mu.Unlock()

	expiresAt, ok := r.misses[barcode]
	if !ok || !expiresAt.After(now) {
		delete(r.misses, barcode)
		return false, nil
	}
	return true, nil
}

func (r *memoryProductRepository) UpsertOffMiss(ctx context.Context, barcode string, expiresAt time.Time) error {
	_ = ctx

	r.mu.Lock()
	defer r.mu.Unlock()

	r.misses[barcode] = expiresAt
	return nil
}

func (r *memoryProductRepository) DeleteOffMiss(ctx context.Context, barcode string) error {
	_ = ctx

	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.misses, barcode)
	return nil
}

func (r *memoryProductRepository) SaveAnalysis(ctx context.Context, barcode string, result analysis.Result) error {
	_ = ctx
	_ = barcode
	_ = result
	return nil
}

func (r *memoryProductRepository) SaveProductEnrichment(ctx context.Context, barcode string, envelope json.RawMessage, ingredients []Ingredient, result analysis.Result, candidates []json.RawMessage) error {
	_ = ctx
	_ = envelope
	_ = result
	_ = candidates

	r.mu.Lock()
	defer r.mu.Unlock()

	p, ok := r.products[barcode]
	if !ok {
		return nil
	}
	p.Ingredients = ingredients
	r.products[barcode] = p
	return nil
}

func (r *memoryProductRepository) ClearDeepSeekAnalysis(ctx context.Context, barcode string) error {
	_ = ctx
	r.mu.Lock()
	defer r.mu.Unlock()
	p, ok := r.products[barcode]
	if !ok {
		return nil
	}
	p.AnalysisSource = ""
	p.AiInsight = AiInsight{}
	r.products[barcode] = p
	return nil
}

func (r *memoryProductRepository) ListAdmin(ctx context.Context, opts ListOptions) ([]Product, error) {
	_ = ctx
	_ = opts

	r.mu.Lock()
	defer r.mu.Unlock()

	items := make([]Product, 0, len(r.products))
	for _, product := range r.products {
		items = append(items, product)
	}
	return items, nil
}

func (r *memoryProductRepository) CreateAdmin(ctx context.Context, product Product, raw json.RawMessage, adminID string) (Product, error) {
	_ = ctx
	_ = raw
	_ = adminID

	r.mu.Lock()
	defer r.mu.Unlock()

	r.products[product.Barcode] = product
	delete(r.misses, product.Barcode)
	return product, nil
}

func (r *memoryProductRepository) UpdateAdmin(ctx context.Context, barcode string, product Product, raw json.RawMessage, adminID string) (Product, error) {
	_ = ctx
	_ = raw
	_ = adminID

	r.mu.Lock()
	defer r.mu.Unlock()

	product.Barcode = barcode
	r.products[barcode] = product
	delete(r.misses, barcode)
	return product, nil
}

func (r *memoryProductRepository) DeleteAdmin(ctx context.Context, barcode string, adminID string) error {
	_ = ctx
	_ = adminID

	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.products, barcode)
	delete(r.misses, barcode)
	return nil
}
