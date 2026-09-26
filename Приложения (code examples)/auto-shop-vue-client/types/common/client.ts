import type { SimpleFile } from "@/types/common/file"

export interface ClientBalanceUser {
  id: number
  name: string
}

export interface ClientBalance {
  id: number
  clientId: number
  type: string
  reason?: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  comment: string | null
  commentRu?: string | null
  commentZh?: string | null
  originalLocale?: string
  translateStatus?: string
  createdAt: string
  updatedAt: string | null
  file: SimpleFile | null
  user: ClientBalanceUser | null
  payerName: string | null
}
