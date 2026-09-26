export const BalanceAccountTypeBalance = "balance"
export const BalanceAccountTypeDeposit = "deposit"

export const BalanceTypeIncrease = "increase"
export const BalanceTypeDecrease = "decrease"
export const BalanceTypeChange = "change"

export const BalanceReasonDiagnostics = "diagnostics"
export const BalanceReasonCompensation = "compensation"
export const BalanceReasonCarPurchase = "car_purchase"
export const BalanceReasonInvoicePayment = "invoice_payment"
export const BalanceReasonPurchaseCancellation = "purchase_cancellation"
export const BalanceReasonMarkupRefund = "markup_refund"
export const BalanceReasonOtherPurchaseExpenses = "other_purchase_expenses"
export const BalanceReasonOther = "other"

export const BalancePurchaseReasons = [
  BalanceReasonCarPurchase,
  BalanceReasonInvoicePayment,
  BalanceReasonPurchaseCancellation,
  BalanceReasonMarkupRefund,
  BalanceReasonOtherPurchaseExpenses,
] as const

export const isBalancePurchaseReason = (reason: string): boolean =>
  (BalancePurchaseReasons as readonly string[]).includes(reason)

/**
 * Display order of balance operation reasons, shared by the adjustment form
 * and the history filter. An empty value means "not specified".
 */
export const BalanceReasonOrder = [
  "",
  BalanceReasonDiagnostics,
  BalanceReasonCompensation,
  BalanceReasonCarPurchase,
  BalanceReasonInvoicePayment,
  BalanceReasonPurchaseCancellation,
  BalanceReasonMarkupRefund,
  BalanceReasonOtherPurchaseExpenses,
  BalanceReasonOther,
] as const

export type BalanceReason = typeof BalanceReasonOrder[number]

export const balanceReasonLabelKey = (reason: BalanceReason): string =>
  `balance.change.reasons.${reason === "" ? "not_specified" : reason}`
