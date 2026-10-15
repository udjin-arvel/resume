import type { PORT_INVOICE_FIELDS } from "@/constants/ports"

export type PortPricingType = "per_city" | "fixed"

export type Port = {
  id: number
  code: string
  name_ru?: string | null
  name_zh?: string | null
  name_en?: string | null
  terms?: string | null
  surcharge?: number
  pricing_type?: PortPricingType
  fixed_delivery_cost?: number | null
  loading_en?: string | null
  loading_zh?: string | null
  loading_ru?: string | null
  destination_en?: string | null
  destination_ru?: string | null
  destination_zh?: string | null
  active: boolean
  sort: number
}

export type PortStoreBody = {
  code: string
  name_ru: string
  name_zh?: string | null
  name_en?: string | null
  pricing_type?: PortPricingType
  fixed_delivery_cost?: number | null
  terms?: string | null
  loading_en?: string | null
  loading_zh?: string | null
  loading_ru?: string | null
  destination_en?: string | null
  destination_zh?: string | null
  destination_ru?: string | null
  surcharge?: number
  active?: boolean
  sort?: number
}

export type PortUpdateBody = Partial<Omit<PortStoreBody, "code">>

export type PortInvoiceField = typeof PORT_INVOICE_FIELDS[number]

export type PortInvoice = Record<PortInvoiceField, string>

export interface PortRow {
  id: number
  code: string
  name_ru: string
  name_zh: string
  surcharge: number
  pricing_type: PortPricingType
  fixed_delivery_cost: number | undefined
  active: boolean
  sort: number
  invoice: PortInvoice
}

export interface PortFormFields {
  code?: string
  name_ru: string
  name_zh: string
  surcharge: number | undefined
  pricing_type: PortPricingType
  fixed_delivery_cost: number | undefined
  invoice: PortInvoice
}

export interface PortType {
  id: number
  code: string
  nameRu: string | null
  nameZh: string | null
  nameEn: string | null
  terms: string | null
  loadingEn: string | null
  loadingZh: string | null
  loadingRu: string | null
  destinationEn: string | null
  destinationZh: string | null
  destinationRu: string | null
  active: boolean
  sort: number
}
