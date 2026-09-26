package product

import (
	"time"

	"scanme/backend/internal/analysis"
)

type Product struct {
	Barcode          string          `json:"barcode"`
	Name             string          `json:"name"`
	Brands           string          `json:"brands,omitempty"`
	ImageURL         string          `json:"imageUrl,omitempty"`
	Ingredients      []Ingredient    `json:"ingredients"`
	Source           string          `json:"source"`
	FetchedAt        time.Time       `json:"fetchedAt"`
	CachedUntil      time.Time       `json:"cachedUntil"`
	Analysis         analysis.Result `json:"analysis"`
	AiInsight        AiInsight       `json:"aiInsight,omitempty"`
	AnalysisSource   string          `json:"analysisSource,omitempty"`
}

// AiInsight is LLM-generated copy shown alongside dictionary analysis (Stage 10).
type AiInsight struct {
	ProductSummary      string `json:"productSummary,omitempty"`
	CompositionOverview string `json:"compositionOverview,omitempty"`
	Disclaimer          string `json:"disclaimer,omitempty"`
	Locale              string `json:"locale,omitempty"`
}

type ListOptions struct {
	Query string
	Limit int
}

type ListResponse struct {
	Items []Product `json:"items"`
}

type UpsertInput struct {
	Barcode     string       `json:"barcode"`
	Name        string       `json:"name"`
	Brands      string       `json:"brands"`
	ImageURL    string       `json:"imageUrl"`
	Ingredients []Ingredient `json:"ingredients"`
}

type Ingredient struct {
	ID         string `json:"id,omitempty"`
	Text       string `json:"text"`
	Percent    string `json:"percent,omitempty"`
	Rank       int    `json:"rank,omitempty"`
	Vegan      string `json:"vegan,omitempty"`
	Vegetarian string `json:"vegetarian,omitempty"`
}
