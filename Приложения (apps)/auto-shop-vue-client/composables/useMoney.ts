import { pluralizationRu } from "@/utils/pluralizationRu"
import type { Currency } from "@/types/common/currency"
import { CNY, RUB } from "@/constants/currency"

export function useMoney() {
  const { t } = useI18n()

  const formatBalance = (balance: number, currency: Currency = CNY) => {
    let forms: string[] = []
    if (currency === CNY) {
      forms = [
        t("currency.CNY_form_1"),
        t("currency.CNY_form_2"),
        t("currency.CNY_form_5"),
      ]
    }
    else if (currency === RUB) {
      forms = [
        t("currency.RUB_form_1"),
        t("currency.RUB_form_2"),
        t("currency.RUB_form_5"),
      ]
    }
    const formIndex = pluralizationRu(balance, forms.length)
    const formattedNumber = formatNumberWithSpace(balance)
    return `${formattedNumber} ${forms[formIndex]}`
  }

  const formatNumberWithSpace = (value: number) => {
    return value.toLocaleString("ru-RU", {
      useGrouping: true,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const formatPriceWithDecimals = (value: number) => {
    return value.toLocaleString("ru-RU", {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const formatPriceWithOptionalDecimals = (value: number | string) => {
    const numericValue = Number(value)

    if (!Number.isFinite(numericValue)) {
      return ""
    }

    const fractionDigits = Number.isInteger(numericValue) ? 0 : 2

    return numericValue
      .toLocaleString("ru-RU", {
        useGrouping: true,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      })
      .replace(",", ".")
  }

  return {
    formatBalance,
    formatNumberWithSpace,
    formatPriceWithDecimals,
    formatPriceWithOptionalDecimals,
  }
}
