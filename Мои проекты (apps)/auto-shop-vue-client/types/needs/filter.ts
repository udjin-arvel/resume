export interface NeedsFilterState {
  id: string | number
  client: string
  company: string
  user: string
  buyer: string
  /** @deprecated legacy single-select; prefer executorIds + onlyMine */
  executor?: string
  executorIds: Array<number | string>
  onlyMine: boolean
  hasUnreadChat?: boolean
  sort: string
  statusValues: string[]
  brandIds: number[]
  seriesIds: number[]
  dateFrom?: string
  dateTo?: string
}

export interface SavedNeedsFilter {
  id: number
  name: string
  body: string | { filters: NeedsFilterState }
  timestamp: string
}

export interface SavedNeedsFilterPayload {
  filters: NeedsFilterState
}
