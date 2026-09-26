package product

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"
)

var ErrProductNotFound = errors.New("product not found")

type OFFClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewOFFClient(baseURL string, timeout time.Duration) OFFClient {
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if baseURL == "" {
		baseURL = "https://world.openfoodfacts.org"
	}
	if timeout <= 0 {
		timeout = 8 * time.Second
	}

	return OFFClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

func (c OFFClient) FetchProduct(ctx context.Context, barcode string, cacheTTL time.Duration) (Product, json.RawMessage, error) {
	endpoint, err := url.JoinPath(c.baseURL, "api", "v2", "product", barcode+".json")
	if err != nil {
		return Product{}, nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return Product{}, nil, err
	}
	req.URL.RawQuery = url.Values{
		"fields": []string{
			"code,product_name,brands,image_front_url,image_url,ingredients_text,ingredients",
		},
	}.Encode()
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "ScanMe/0.1 (+https://scanme.local)")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return Product{}, nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return Product{}, nil, ErrProductNotFound
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return Product{}, nil, fmt.Errorf("open food facts returned status %d", resp.StatusCode)
	}

	var payload offProductResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return Product{}, nil, err
	}
	if payload.Status != 1 || payload.Product.Code == "" {
		return Product{}, nil, ErrProductNotFound
	}

	raw, err := json.Marshal(payload.Product.Raw)
	if err != nil {
		return Product{}, nil, err
	}

	product := productFromOFF(payload.Product, cacheTTL)
	return product, raw, nil
}

type offProductResponse struct {
	Status  int               `json:"status"`
	Product offProductPayload `json:"product"`
}

type offProductPayload struct {
	Code            string                 `json:"code"`
	ProductName     string                 `json:"product_name"`
	Brands          string                 `json:"brands"`
	ImageFrontURL   string                 `json:"image_front_url"`
	ImageURL        string                 `json:"image_url"`
	IngredientsText string                 `json:"ingredients_text"`
	Ingredients     []offIngredientPayload `json:"ingredients"`
	Raw             map[string]any         `json:"-"`
}

func (p *offProductPayload) UnmarshalJSON(data []byte) error {
	type alias offProductPayload
	var decoded alias
	if err := json.Unmarshal(data, &decoded); err != nil {
		return err
	}
	if err := json.Unmarshal(data, &decoded.Raw); err != nil {
		return err
	}
	*p = offProductPayload(decoded)
	return nil
}

type offIngredientPayload struct {
	ID         string  `json:"id"`
	Text       string  `json:"text"`
	Percent    float64 `json:"percent_estimate"`
	Rank       int     `json:"rank"`
	Vegan      string  `json:"vegan"`
	Vegetarian string  `json:"vegetarian"`
}

func productFromOFF(payload offProductPayload, cacheTTL time.Duration) Product {
	now := time.Now().UTC()
	name := firstNonEmpty(payload.ProductName, "Без названия")
	imageURL := firstNonEmpty(payload.ImageFrontURL, payload.ImageURL)
	ingredients := normalizeIngredients(payload.Ingredients, payload.IngredientsText)

	return Product{
		Barcode:     strings.TrimSpace(payload.Code),
		Name:        strings.TrimSpace(name),
		Brands:      strings.TrimSpace(payload.Brands),
		ImageURL:    strings.TrimSpace(imageURL),
		Ingredients: ingredients,
		Source:      "open_food_facts",
		FetchedAt:   now,
		CachedUntil: now.Add(cacheTTL),
	}
}

func normalizeIngredients(items []offIngredientPayload, fallbackText string) []Ingredient {
	ingredients := make([]Ingredient, 0, len(items))
	seen := make(map[string]struct{}, len(items))

	sort.SliceStable(items, func(i, j int) bool {
		return items[i].Rank < items[j].Rank
	})

	for _, item := range items {
		text := strings.TrimSpace(item.Text)
		id := strings.TrimSpace(strings.TrimPrefix(item.ID, "en:"))
		if text == "" {
			text = id
		}
		if text == "" {
			continue
		}

		key := strings.ToLower(text)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}

		ingredients = append(ingredients, Ingredient{
			ID:         id,
			Text:       text,
			Percent:    formatPercent(item.Percent),
			Rank:       item.Rank,
			Vegan:      strings.TrimSpace(item.Vegan),
			Vegetarian: strings.TrimSpace(item.Vegetarian),
		})
	}

	if len(ingredients) > 0 {
		return ingredients
	}

	for index, part := range strings.Split(fallbackText, ",") {
		text := strings.TrimSpace(part)
		if text == "" {
			continue
		}
		ingredients = append(ingredients, Ingredient{
			Text: text,
			Rank: index + 1,
		})
	}

	return ingredients
}

func formatPercent(value float64) string {
	if value <= 0 {
		return ""
	}
	if value == float64(int(value)) {
		return fmt.Sprintf("%d%%", int(value))
	}
	return fmt.Sprintf("%.1f%%", value)
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			return value
		}
	}
	return ""
}
