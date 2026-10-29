import type { ChatSubject } from "@/types/common/chat"

export type ChatSubjectUnread = Record<ChatSubject, number>

export interface LogisticUnreadGroup {
  active: Record<number, number>
  archive: Record<number, number>
}

export interface UnreadCounts {
  listingRequests: number
  chats: number
  chatsByListing?: Record<number, number>
  chatsBySearchRequest?: Record<number, number>
  chatsBySubject: ChatSubjectUnread
  carLinks: number
  needs: number
  logisticOrders: LogisticUnreadGroup
  searchRequests: number
  notifications: number
}

export type UnreadCountsInput = Partial<Omit<UnreadCounts, "chatsBySubject">> & {
  chatsBySubject?: Partial<ChatSubjectUnread>
}

export interface UnreadTotalsPayload {
  chats: number
  chatsBySubject?: Partial<ChatSubjectUnread>
  chatsByListing?: Array<{ listingId: number, unread: number }>
  chatsBySearchRequest?: Array<{ searchRequestId: number, unread: number }>
}

export interface NotificationCounts {
  listing_requests: number
  chats: number
  chats_by_listing?: Array<{ listing_id: number, unread: number }>
  chats_by_search_request?: Array<{ search_request_id: number, unread: number }>
  chats_by_subject?: Partial<Record<ChatSubject, number>>
  logistic_orders: LogisticUnreadGroup | []
  search_requests: number
  car_links: number
  notifications: number
}
