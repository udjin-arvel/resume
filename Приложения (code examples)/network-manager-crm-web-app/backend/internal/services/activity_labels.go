package services

import (
	"fmt"
	"strconv"
	"strings"
)

var downtimeReasonLabels = map[string]string{
	"no-access":      "нет доступа на объект",
	"no-permits":     "нет разрешений",
	"infrastructure": "не готова инфраструктура",
	"no-materials":   "нет материалов",
	"contractor":     "ожидание подрядчика",
	"client":         "ожидание клиента",
	"other":          "другое",
}

func downtimeReasonLabel(reason string) string {
	if label, ok := downtimeReasonLabels[reason]; ok {
		return label
	}
	if reason == "" {
		return "не указана"
	}
	return reason
}

func formatBudgetDisplay(amount string) string {
	n := int64(parseNum(amount))
	negative := n < 0
	if negative {
		n = -n
	}
	s := strconv.FormatInt(n, 10)
	var parts []string
	for len(s) > 3 {
		parts = append([]string{s[len(s)-3:]}, parts...)
		s = s[:len(s)-3]
	}
	parts = append([]string{s}, parts...)
	formatted := strings.Join(parts, " ")
	if negative {
		formatted = "-" + formatted
	}
	return formatted + " ₽"
}

func projectDocumentUploadLabel(documentType, filename string) string {
	switch documentType {
	case "estimate":
		return fmt.Sprintf("Загружена смета: %s", filename)
	case "instruction":
		return fmt.Sprintf("Загружена инструкция: %s", filename)
	default:
		return fmt.Sprintf("Загружен документ: %s", filename)
	}
}
