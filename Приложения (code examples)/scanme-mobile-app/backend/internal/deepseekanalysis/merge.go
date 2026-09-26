package deepseekanalysis

import (
	"encoding/json"
	"strings"

	"scanme/backend/internal/analysis"
	"scanme/backend/internal/substance"
)

func MergeModel(local analysis.Result, catalog []substance.Substance, model ModelResponse) Outcome {
	out := Outcome{
		RawModelJSON:    mustRaw(model),
		Insight:         insightFrom(model),
		IngredientPatch: model.IngredientsNormalized,
		Candidates:      append([]json.RawMessage(nil), model.SubstanceCandidates...),
		AnalysisSource:  "deepseek",
	}

	modelOverall := normalizeOverall(model.OverallDanger)
	mergedOverall := analysis.MergeDangerLevels(local.OverallDanger, modelOverall)

	byKey := make(map[string]analysis.IngredientMatch)

	for _, m := range model.Matches {
		key := analysis.NormalizeIngredientText(m.IngredientText)
		if key == "" {
			continue
		}
		im := analysis.IngredientMatch{IngredientText: strings.TrimSpace(m.IngredientText)}
		for _, s := range m.Substances {
			d := coerceDanger(s.DangerLevel)
			snap := analysis.SubstanceSnapshot{
				ID:          strings.TrimSpace(s.ID),
				Code:        strings.TrimSpace(s.Code),
				Name:        strings.TrimSpace(s.Name),
				DangerLevel: d,
				Description: strings.TrimSpace(s.Description),
				Sources:     append([]string(nil), s.Sources...),
			}
			if snap.ID == "" {
				snap.ID = resolveCatalogID(snap, catalog)
			}
			im.Substances = append(im.Substances, snap)
			mergedOverall = analysis.MergeDangerLevels(mergedOverall, string(d))
		}
		if len(im.Substances) > 0 {
			byKey[key] = im
		}
	}

	for _, lm := range local.Matches {
		key := analysis.NormalizeIngredientText(lm.IngredientText)
		if _, ok := byKey[key]; ok {
			continue
		}
		byKey[key] = lm
		for _, s := range lm.Substances {
			mergedOverall = analysis.MergeDangerLevels(mergedOverall, string(s.DangerLevel))
		}
	}

	ordered := make([]analysis.IngredientMatch, 0, len(byKey))
	seen := map[string]struct{}{}
	for _, lm := range local.Matches {
		k := analysis.NormalizeIngredientText(lm.IngredientText)
		if m, ok := byKey[k]; ok {
			ordered = append(ordered, m)
			seen[k] = struct{}{}
		}
	}
	for _, m := range model.Matches {
		k := analysis.NormalizeIngredientText(m.IngredientText)
		if _, ok := seen[k]; ok {
			continue
		}
		if mm, ok := byKey[k]; ok {
			ordered = append(ordered, mm)
			seen[k] = struct{}{}
		}
	}

	out.MergedAnalysis = analysis.Result{
		OverallDanger: mergedOverall,
		Matches:       ordered,
	}

	if len(local.Matches) > 0 && len(model.Matches) > 0 {
		out.AnalysisSource = "mixed"
	}
	return out
}

func insightFrom(m ModelResponse) InsightTexts {
	return InsightTexts{
		ProductSummary:      strings.TrimSpace(m.ProductSummary),
		CompositionOverview: strings.TrimSpace(m.CompositionOverview),
		Disclaimer:          strings.TrimSpace(m.Disclaimer),
		Locale:              strings.TrimSpace(m.Locale),
	}
}

func normalizeOverall(s string) string {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "dangerous":
		return "dangerous"
	case "controversial":
		return "controversial"
	default:
		return "safe"
	}
}

func coerceDanger(s string) substance.DangerLevel {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "dangerous":
		return substance.DangerLevelDangerous
	case "controversial":
		return substance.DangerLevelControversial
	default:
		return substance.DangerLevelSafe
	}
}

func resolveCatalogID(snap analysis.SubstanceSnapshot, catalog []substance.Substance) string {
	if strings.TrimSpace(snap.ID) != "" {
		return snap.ID
	}
	codeWant := strings.TrimSpace(strings.ToLower(snap.Code))
	nameWant := analysis.NormalizeIngredientText(snap.Name)
	for _, item := range catalog {
		if !item.IsActive {
			continue
		}
		if codeWant != "" && strings.TrimSpace(strings.ToLower(item.Code)) == codeWant {
			return item.ID
		}
		if nameWant != "" && analysis.NormalizeIngredientText(item.Name) == nameWant {
			return item.ID
		}
		for _, a := range item.Aliases {
			if nameWant != "" && analysis.NormalizeIngredientText(a) == nameWant {
				return item.ID
			}
		}
	}
	return ""
}

func mustRaw(model ModelResponse) json.RawMessage {
	b, err := json.Marshal(model)
	if err != nil {
		return json.RawMessage("{}")
	}
	return b
}
