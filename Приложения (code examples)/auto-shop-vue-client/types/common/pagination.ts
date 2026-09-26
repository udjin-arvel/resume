export interface Pagination {
  limit: number
  page: number
  offset: number
}

export interface PaginationData {
  currentPage: number
  lastPage: number
  limit: number
  offset: number
  total: number
}
