export const StatusActive = "active"
export const StatusPending = "pending"
export const StatusBlocked = "blocked"
export const StatusRejected = "rejected"

export const translateStatuses = {
  pending: "pending",
  done: "done",
  error: "error",
  processing: "processing",
} as const

export const RequestStatusDraft = "draft"
export const RequestStatusNew = "new"
export const RequestStatusInWork = "in_work"
export const RequestStatusOnBooking = "on_booking"
export const RequestStatusCompleted = "completed"
export const RequestStatusCancelled = "cancelled"

export const RequestStatusColorMap: Record<
  string,
  "gray" | "blue" | "darkBlue" | "green" | "red" | "yellow" | "darkRed"
> = {
  [RequestStatusNew]: "gray",
  [RequestStatusInWork]: "blue",
  [RequestStatusOnBooking]: "yellow",
  find_more: "darkBlue",
  [RequestStatusCompleted]: "green",
  [RequestStatusCancelled]: "red",
  updated: "yellow",
  [RequestStatusDraft]: "darkRed",
}
