package services

import (
	"fmt"
	"math"
	"strconv"
)

func parseNum(s string) float64 {
	if s == "" {
		return 0
	}
	v, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0
	}
	return v
}

func formatMoney(v float64) string {
	return fmt.Sprintf("%.2f", math.Round(v*100)/100)
}

func CalcBlockAmount(blockType, quantity, unitPrice, hours, rate, amount string) string {
	switch blockType {
	case "service":
		return formatMoney(parseNum(quantity) * parseNum(unitPrice))
	case "resource":
		return formatMoney(parseNum(hours) * parseNum(rate))
	case "expense":
		if amount != "" {
			return formatMoney(parseNum(amount))
		}
		return "0.00"
	default:
		return formatMoney(parseNum(amount))
	}
}
