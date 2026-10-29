export type ReactionSeconds = {
  samples: number
  median: number | null
  avg: number | null
  max: number | null
}

export type NotificationAuthorState = "active" | "pending" | "blocked" | "rejected" | "deleted" | "unknown"

export type NotificationAuthorUser = {
  id: number
  name: string | null
  role: string | null
  state: NotificationAuthorState
}

export type NotificationAuthorStats = {
  user: NotificationAuthorUser
  received: number
  receivedPriceChanged: number
  receivedUnpublished: number
  delivered: number
  undelivered: number
  reacted: number
  reactionRate: number | null
  resolved: number
  confirmed: number
  declined: number
  readOnly: number
  stillPending: number
  autoClosed: number
  overdue: number
  bulkRead: number
  negativeReactions: number
  reactionSeconds: ReactionSeconds
}

export type NotificationStatsTotals = {
  events: number
  pendingEvents: number
  supersededEvents: number
  authors: number
  received: number
  delivered: number
  undelivered: number
  reacted: number
  reactionRate: number | null
  overdue: number
  bulkRead: number
  negativeReactions: number
  reactionSeconds: ReactionSeconds
}

export type ResponseWindow = {
  from: string
  to: string
  timezone: string
}

export type NotificationStats = {
  generatedAt: string
  windowHours: number
  windowFrom: string
  windowTo: string
  responseSlaMinutes: number
  responseWindow: ResponseWindow
  totals: NotificationStatsTotals
  authors: NotificationAuthorStats[]
}

export type AuthorEventRecipient = {
  bulkRead: boolean
  reactionSeconds: number | null
  reactionKind: "resolved" | "read" | null
}

export type AuthorEventSource = {
  id: number
  type: string
  status: string
  oldPrice: number | null
  newPrice: number | null
  resolvedAt: string | null
  resolvedBy: { id: number, name: string | null } | null
}

export type AuthorEventListing = {
  id: number
  name: string | null
  year: number | null
  vin: string | null
  source: string | null
  externalUrl: string | null
}

export type AuthorEvent = {
  activityEventId: number
  notifiedAt: string
  delivered: boolean
  recipient: AuthorEventRecipient
  sourceEvent: AuthorEventSource
  listing: AuthorEventListing | null
}

export type AuthorEventsMeta = {
  currentPage: number
  lastPage: number
  limit: number
  offset: number
  total: number
  windowHours: number
  generatedAt: string
  author: NotificationAuthorStats
}

export type AuthorEventsParams = {
  hours: number
  limit?: number
  offset?: number
  type?: string
  status?: string
  reaction?: string
}
