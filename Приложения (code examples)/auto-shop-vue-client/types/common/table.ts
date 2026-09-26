export interface TableColumn {
  label: string | null
  primary?: boolean
  action?: boolean
}

export interface TableRow {
  value: string | number
  primary?: boolean
  action?: boolean
  expandable?: boolean
  expanded?: boolean
  children?: Array<{ id: number, name: string, role: string }>
  rowId?: number
  paddingLeft?: boolean
}
