export type ChinaExpensesMode = "base" | "markup" | "fixed"

export type ChinaExpensesPricingType = "per_city" | "fixed"

export interface ChinaExpensesPortSetting {
  portCode: string
  nameRu: string | null
  nameZh: string | null
  pricingType: ChinaExpensesPricingType
  baseSurcharge: number
  baseFixedDeliveryCost: number | null
  baseTotal: number | null
  mode: ChinaExpensesMode
  amount: number | null
}

export interface ChinaExpensesSettingUpdate {
  mode: ChinaExpensesMode
  amount: number | null
}

export interface ClientPortChinaExpenseSetting {
  port_code: string
  mode: ChinaExpensesMode
  amount: number | null
}
