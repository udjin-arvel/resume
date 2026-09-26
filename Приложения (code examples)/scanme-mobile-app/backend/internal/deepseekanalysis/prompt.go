package deepseekanalysis

import (
	"encoding/json"
	"strings"

	"scanme/backend/internal/analysis"
)

const systemPrompt = `Ты помощник для анализа состава продуктов питания в приложении ScanMe.
Ответь ОДНИМ JSON-объектом без markdown и без текста вне JSON.

Обязательные поля верхнего уровня:
- schemaVersion: число, всегда 1
- locale: строка, язык текстов (например "ru")
- productSummary: краткое описание продукта для пользователя (1–3 предложения)
- compositionOverview: обзор состава и оценка рисков простым языком
- overallDanger: одно из "safe" | "controversial" | "dangerous" с учётом данных Open Food Facts и локального словаря
- ingredientsNormalized: массив объектов {rank, text, percent, id, vegan, vegetarian}; можно оставить [] если нечего улучшить
- matches: массив {ingredientText, substances:[{id, code, name, dangerLevel, description, sources}]};
  dangerLevel только "safe"|"controversial"|"dangerous"; id — UUID из словаря если известен, иначе пустая строка
- substanceCandidates: массив объектов для модерации (новые вещества), каждый объект — произвольный JSON с полями name, code (опц.), suggestedDangerLevel, rationale
- disclaimer: короткий дисклеймер что это не медицинская консультация

Используй входные ingredient lines и localDictionaryMatches; не выдумывай штрих-код и название — они даны в запросе.`

// SystemPrompt returns the fixed system message for DeepSeek.
func SystemPrompt() string {
	return systemPrompt
}

type localMatchDTO struct {
	IngredientText string   `json:"ingredientText"`
	SubstanceNames []string `json:"substanceNames"`
}

type userPayload struct {
	Barcode                      string       `json:"barcode"`
	ProductName                  string       `json:"productName"`
	Brands                       string       `json:"brands"`
	IngredientsFromOpenFoodFacts []string     `json:"ingredientsFromOpenFoodFacts"`
	LocalDictionaryMatches       localDictDTO `json:"localDictionaryMatches"`
}

type localDictDTO struct {
	OverallDanger string          `json:"overallDanger"`
	Matches       []localMatchDTO `json:"matches"`
}

// BuildUserPayloadJSON builds the user message body as JSON.
func BuildUserPayloadJSON(barcode, productName, brands string, ingredientLines []string, local analysis.Result) ([]byte, error) {
	lines := make([]string, 0, len(ingredientLines))
	for _, ing := range ingredientLines {
		t := strings.TrimSpace(ing)
		if t != "" {
			lines = append(lines, t)
		}
	}

	lm := make([]localMatchDTO, 0, len(local.Matches))
	for _, m := range local.Matches {
		names := make([]string, 0, len(m.Substances))
		for _, s := range m.Substances {
			n := strings.TrimSpace(s.Name)
			if n != "" {
				names = append(names, n)
			}
		}
		lm = append(lm, localMatchDTO{
			IngredientText: strings.TrimSpace(m.IngredientText),
			SubstanceNames: names,
		})
	}

	payload := userPayload{
		Barcode:                      strings.TrimSpace(barcode),
		ProductName:                  strings.TrimSpace(productName),
		Brands:                       strings.TrimSpace(brands),
		IngredientsFromOpenFoodFacts: lines,
		LocalDictionaryMatches: localDictDTO{
			OverallDanger: local.OverallDanger,
			Matches:       lm,
		},
	}
	return json.Marshal(payload)
}
