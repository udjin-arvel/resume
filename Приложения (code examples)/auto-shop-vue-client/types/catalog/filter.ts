import type { SaleStatus } from "~/types/responses/listing"

export interface FilterOption {
  id: number
  value: string | number
  name: string | number
  disabled: boolean
}

export interface Filters {
  status: string[]
  buyer: string | undefined
  condition: string
  vin?: string
  internal_number?: string
  brand: string | undefined
  model: string | undefined
  year: { left: any, right: any }
  displacement: { left: any, right: any }
  equipment: string[]
  price: number | undefined
  mileage: string | undefined
  gearbox: string
  power_type: string
  drive_type: string
  scale: string
  color: string
  hasVideo?: boolean
  hasDiagnostics?: boolean
  hasCompensation?: boolean
  original_paint?: boolean
  visibility: string | undefined
  sale_status?: SaleStatus
  bought_at?: [Date, Date] | null
  deleted?: boolean | false
  archive?: boolean | false
  favorites?: boolean | false
  seller_id?: string
}

export interface FilterOptions {
  status: FilterOption[]
  buyer: FilterOption[]
  manager: FilterOption[]
  condition: FilterOption[]
  brand: FilterOption[]
  model: FilterOption[]
  year: Array<{ id: number, value: number, name: number, disabled: boolean }>
  price: FilterOption[]
  displacement: FilterOption[]
  equipment: FilterOption[]
  mileage: Array<{ id: number, value: number, name: string, disabled: boolean }>
  gearbox: FilterOption[]
  power_type: FilterOption[]
  drive_type: FilterOption[]
  scale: FilterOption[]
  visibility: FilterOption[]
  color: FilterOption[]
}

export interface CatalogFilterResponse {
  id: number
  name: string
  listings_count: number
  image?: string
}

export interface PartsFilterResponse {
  gearbox: Record<string, number>
  drive_type: Record<string, number>
  scale: Record<string, number>
  power_type: Record<string, number>
  condition: Record<string, number>
  status: Record<string, number>
}

export interface BuyerResponse {
  id: number
  name: string
}

export interface SavedFilter {
  id: number
  name: string
  body: string
  timestamp: string
}

export interface FilterComponent {
  validateOptions: (savedFilters: Filters) => Promise<{ filters: Filters, wasModified: boolean }>
  reloadOptions?: () => Promise<void> | void
}

export interface FilterOptionsResponse {
  brands: CatalogFilterResponse[]
  models: CatalogFilterResponse[]
  completions: CatalogFilterResponse[]
  parts: PartsFilterResponse
}

export interface FilterOptionParams {
  brand_id?: number | string
  model_id?: number | string
  isSeller?: boolean
  condition?: string
  visibility?: string
  status?: string
  init?: boolean
  sale_status?: SaleStatus
  deleted?: boolean | false
  archive?: boolean | false
  favorites?: boolean | false
}

export interface SavedFilterPayload {
  filters: Filters
  tab: number
}
