import type { StatusActive, StatusBlocked, StatusPending, StatusRejected, translateStatuses } from "~/constants/statuses"

export type Status =
  | typeof StatusActive
  | typeof StatusPending
  | typeof StatusBlocked
  | typeof StatusRejected

export type TranslateStatus = typeof translateStatuses[keyof typeof translateStatuses]
