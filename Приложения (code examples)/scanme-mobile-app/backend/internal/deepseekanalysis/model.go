package deepseekanalysis

import (
	"encoding/json"

	"scanme/backend/internal/analysis"
)

// ModelResponse mirrors the Stage 10 JSON contract from ScanMe_implementation_plan.md.
type ModelResponse struct {
	SchemaVersion         int                    `json:"schemaVersion"`
	Locale                string                 `json:"locale"`
	ProductSummary        string                 `json:"productSummary"`
	CompositionOverview   string                 `json:"compositionOverview"`
	OverallDanger         string                 `json:"overallDanger"`
	IngredientsNormalized []IngredientNormalized `json:"ingredientsNormalized"`
	Matches               []matchJSON            `json:"matches"`
	SubstanceCandidates   []json.RawMessage      `json:"substanceCandidates"`
	Disclaimer            string                 `json:"disclaimer"`
}

type IngredientNormalized struct {
	Rank       int    `json:"rank"`
	Text       string `json:"text"`
	Percent    string `json:"percent"`
	ID         string `json:"id"`
	Vegan      string `json:"vegan"`
	Vegetarian string `json:"vegetarian"`
}

type matchJSON struct {
	IngredientText string              `json:"ingredientText"`
	Substances     []substanceSnapJSON `json:"substances"`
}

type substanceSnapJSON struct {
	ID          string   `json:"id"`
	Code        string   `json:"code"`
	Name        string   `json:"name"`
	DangerLevel string   `json:"dangerLevel"`
	Description string   `json:"description"`
	Sources     []string `json:"sources"`
}

// Outcome is merged server-side output ready for persistence and API.
type Outcome struct {
	RawModelJSON    json.RawMessage
	MergedAnalysis  analysis.Result
	Insight         InsightTexts
	IngredientPatch []IngredientNormalized
	Candidates      []json.RawMessage
	AnalysisSource  string
}

type InsightTexts struct {
	ProductSummary      string
	CompositionOverview string
	Disclaimer          string
	Locale              string
}

func ParseModelResponse(raw []byte) (ModelResponse, error) {
	var m ModelResponse
	if err := json.Unmarshal(raw, &m); err != nil {
		return ModelResponse{}, err
	}
	return m, nil
}
