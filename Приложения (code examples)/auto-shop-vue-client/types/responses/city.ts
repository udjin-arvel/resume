export type CityOption = {
  id: number
  code: string
  name_ru: string
  name_zh: string
  hidden: boolean
  delivery_costs?: Record<string, string | null>
}

export type DeliveryCostInput = {
  port_id: number
  delivery_cost: number
}

export type CityStoreBody = {
  code?: string
  name_ru: string
  name_zh: string
  delivery_costs: DeliveryCostInput[]
  hidden?: boolean
}

export type DeliveryRow = {
  id: number
  fromCity: string
  hidden: boolean
  costs: Record<string, string>
}

export type EditingCell = {
  rowId: number
  column: string
}
