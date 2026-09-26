export enum SortDirectionEnum {
  Descending = "descending",
  Ascending = "ascending",
}

export interface Sort {
  sortKey: string
  sortDirection: string
}
