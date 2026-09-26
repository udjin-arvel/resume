import type { UnreadCounts } from "@/types/common/unread"

export interface NavigationItem {
  name: string
  icon?: any
  label?: string | { key: string, count: number | null }
  children?: Array<NavigationItem>
  unreadCountKey?: keyof UnreadCounts
}
