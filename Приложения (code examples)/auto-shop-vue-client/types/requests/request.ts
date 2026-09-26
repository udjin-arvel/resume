export default class Request {
  toJSON() {
    return { ...this }
  }
}

export class ListRequest {
  query?: string
  sortKey?: string
  sortDirection?: string
  offset?: number
  limit?: number
  sortRandom?: boolean
  filter?: { [key: string]: any }

  toJSON() {
    return { ...this }
  }
}

export type SortDirectionParam = "ascending" | "descending" | "asc" | "desc"

export type ListFilterValue = string | number | boolean | Array<string | number>

export type ListFilter = Record<string, ListFilterValue>

export type ListQueryRequest = {
  limit?: number
  offset?: number
  query?: string
  filter?: ListFilter | string
  sortKey?: string
  sortDirection?: SortDirectionParam
}
