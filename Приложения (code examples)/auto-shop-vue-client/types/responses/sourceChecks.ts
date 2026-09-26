export type SourceCheckOutcomes = {
  ok: number
  priceChanged: number
  gone: number
  unpublished: number
  suppressed: number
  failed: number
}

export type SourceCheckFailures = {
  network: number
  blocked: number
  structure: number
  unknown: number
}

export type SourceHealth = {
  source: string
  windowMinutes: number
  checks: number
  broken: number
  brokenShare: number
  degraded: boolean
}

export type SourceCheckSource = {
  source: string
  monitored: number
  checks: number
  successRate: number | null
  avgDurationMs: number | null
  outcomes: SourceCheckOutcomes
  failures: SourceCheckFailures
  health: SourceHealth
  failingListings: number
}

export type SourceCheckQueue = {
  backlog: number
  maxBacklog: number
  monitored: number
  neverChecked: number
  waitingRetry: number
  inFlight: number
  dueNow: number
  overSla: number
  failing: number
  pendingEvents: number
}

export type SourceCheckHourly = {
  bucket: string
  source: string
  total: number
  failed: number
  structureFailed: number
  events: number
}

export type SourceCheckFailureRow = {
  id: number
  listingId: number
  source: string
  failureKind: string | null
  reason: string | null
  failCount: number
  createdAt: string | null
}

export type SourceCheckWindow = {
  timezone: string
  startsAt: string
  readyBy: string
  stopsAt: string
  localTime: string
  open: boolean
}

export type SourceCheckStats = {
  generatedAt: string
  windowHours: number
  enabled: boolean
  slaMinutes: number
  tickMinutes: number
  failureLogAfter: number
  window: SourceCheckWindow
  queue: SourceCheckQueue
  sources: Array<SourceCheckSource>
  hourly: Array<SourceCheckHourly>
  recentFailures: Array<SourceCheckFailureRow>
}
