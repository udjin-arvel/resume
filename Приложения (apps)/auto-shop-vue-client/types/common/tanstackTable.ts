import type { ColumnDef, Table, CellContext, Row } from "@tanstack/vue-table"

export type ColumnMeta = {
  meta?: {
    style?: string
    calculated?: boolean
    cellClass?: string
    headerClass?: string
    cellClassFn?: (context: CellContext<any, unknown>) => string
  }
}

export type ExternalColumn<T = any> = ColumnDef<T> & ColumnMeta

export interface TanstackTableParams<T = any> {
  visabilityKey?: string
  ordering?: string[]
  pinning?: {
    left?: string[]
    right?: string[]
    top?: string[]
  }
  expanding?: Record<string, boolean>
  visibility?: Record<string, boolean>
  getSubRows?: (row: T) => T[] | undefined
  enableExpanding?: boolean
  enableRowSelection?: boolean | ((row: T) => boolean)
}

export interface TanstackProps<T = any> {
  table: Table<T>
  rowClassFn?: (row: Row<T>) => string
}
