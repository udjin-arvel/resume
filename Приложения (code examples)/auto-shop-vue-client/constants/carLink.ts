export const ActionTypeEnum = {
  CREATED: "created",
  MANAGER_REPLY: "manager_reply",
  CAR_ADDED: "car_added",
  AUTO_REPLY: "auto_reply",
  STATUS_CHANGED: "status_changed",
  CUSTOMER_DECISION: "customer_decision",
  CANCELED: "canceled",
} as const

export const CarConditionEnum = {
  NEW: "new",
  USED: "used",
} as const

export const CarLinkStatusEnum = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  ANSWERED: "answered",
  CLOSED: "closed",
  CANCELLED: "cancelled",
} as const

export const CustomerInterestEnum = {
  PENDING: "pending",
  INTERESTED: "interested",
  NOT_INTERESTED: "not_interested",
} as const

export const CarLinkClosureOutcomeEnum = {
  CAR_OFFERED: "car_offered",
  CLIENT_DECLINED: "client_declined",
  REFUSED_NO_LISTING: "refused_no_listing",
} as const

export type ActionType = typeof ActionTypeEnum[keyof typeof ActionTypeEnum]
export type CarCondition = typeof CarConditionEnum[keyof typeof CarConditionEnum]
export type CarLinkStatus = typeof CarLinkStatusEnum[keyof typeof CarLinkStatusEnum]
export type CustomerInterest = typeof CustomerInterestEnum[keyof typeof CustomerInterestEnum]
export type CarLinkClosureOutcome = typeof CarLinkClosureOutcomeEnum[keyof typeof CarLinkClosureOutcomeEnum]
