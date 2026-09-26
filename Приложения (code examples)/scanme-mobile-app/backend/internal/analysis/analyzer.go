package analysis

import (
	"strings"
	"unicode"

	"scanme/backend/internal/substance"
)

type Result struct {
	OverallDanger string            `json:"overallDanger"`
	Matches       []IngredientMatch `json:"matches"`
}

type IngredientMatch struct {
	IngredientText string              `json:"ingredientText"`
	Substances     []SubstanceSnapshot `json:"substances"`
}

type SubstanceSnapshot struct {
	ID          string                `json:"id"`
	Code        string                `json:"code,omitempty"`
	Name        string                `json:"name"`
	DangerLevel substance.DangerLevel `json:"dangerLevel"`
	Description string                `json:"description,omitempty"`
	Sources     []string              `json:"sources"`
}

func AnalyzeIngredients(ingredientTexts []string, substances []substance.Substance) Result {
	result := Result{OverallDanger: "safe"}

	for _, ingredient := range ingredientTexts {
		normalizedIngredient := normalize(ingredient)
		if normalizedIngredient == "" {
			continue
		}

		match := IngredientMatch{IngredientText: ingredient}
		for _, item := range substances {
			if !item.IsActive || !matchesSubstance(normalizedIngredient, item) {
				continue
			}

			match.Substances = append(match.Substances, SubstanceSnapshot{
				ID:          item.ID,
				Code:        item.Code,
				Name:        item.Name,
				DangerLevel: item.DangerLevel,
				Description: item.Description,
				Sources:     item.Sources,
			})
			result.OverallDanger = maxDanger(result.OverallDanger, string(item.DangerLevel))
		}

		if len(match.Substances) > 0 {
			result.Matches = append(result.Matches, match)
		}
	}

	return result
}

func matchesSubstance(normalizedIngredient string, item substance.Substance) bool {
	needles := append([]string{item.Code, item.Name}, item.Aliases...)
	for _, needle := range needles {
		needle = normalize(needle)
		if needle != "" && strings.Contains(normalizedIngredient, needle) {
			return true
		}
	}
	return false
}

func normalize(value string) string {
	return strings.Join(strings.FieldsFunc(strings.ToLower(value), func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsNumber(r)
	}), " ")
}

// NormalizeIngredientText lowercases and strips non-alphanumeric separators for stable matching keys.
func NormalizeIngredientText(value string) string {
	return normalize(value)
}

func maxDanger(current string, next string) string {
	return MergeDangerLevels(current, next)
}

// MergeDangerLevels returns the more severe of two danger level strings (safe < controversial < dangerous).
func MergeDangerLevels(current, next string) string {
	rank := map[string]int{
		"safe":          0,
		"controversial": 1,
		"dangerous":     2,
	}
	if rank[next] > rank[current] {
		return next
	}
	return current
}
