import type { ListQueryRequest } from "@/types/requests/request"

export interface ClientBalanceHistoryRequest extends ListQueryRequest {
  accountType?: string
  type?: "increase" | "decrease" | "change"
  reason?: string
  createdAtFrom?: string
  createdAtTo?: string
  comment?: string
  userId?: number
  payer?: string
}

export interface ClientBalanceAdjustRequest extends ListQueryRequest {
  accountType: string
  amount: number
  comment?: string
  type?: string
  reason?: string
  fileId?: number
}
