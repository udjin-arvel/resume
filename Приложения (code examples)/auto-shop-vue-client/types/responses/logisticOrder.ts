import type { ApiMetaList, ApiResponse } from "~/types/responses/response"
import type { SimpleFile } from "~/types/common/file"

export interface BuyerFormData {
  fullname: string | null
  passportNumber: string | null
  address: string | null
  additionalInfo: string | null
}

export interface BuyerFormResponse {
  buyerProfile: BuyerFormData
}

export interface PaymentDocsResponse {
  invoiceId: number
  paymentDocs: SimpleFile[]
}

export interface OrderFilterItem {
  id: number
  name: string
  image?: string
}

export interface OrderListFilters {
  buyers: OrderFilterItem[]
  sellers: OrderFilterItem[]
  brands: OrderFilterItem[]
  models: OrderFilterItem[]
  logists: OrderFilterItem[]
}

export interface OrderListMeta extends ApiMetaList {
  filters: OrderListFilters | null
}

export type OrderApiListStrictResponse<TItem> =
  ApiResponse<TItem[], OrderListMeta> & {
    meta: OrderListMeta
  }
