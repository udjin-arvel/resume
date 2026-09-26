export interface MenuActions {
  label: string
  action: () => void
  disabled?: boolean
  style?: "underline" | "red"
  template?: Record<string, any>
}
