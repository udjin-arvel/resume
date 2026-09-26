import type {
  ActionType,
  CarCondition,
  CarLinkClosureOutcome,
  CarLinkStatus,
  CustomerInterest,
} from "@/constants/carLink"
import type { TranslateStatus } from "~/types/common/statuses"

export interface CarLinkActionData {
  id: number
  carLinkId: number
  userId: number | null
  type: ActionType
  description: string | null
  descriptionRu: string | null
  descriptionZh: string | null
  translateStatus: TranslateStatus | null
  originalLocale: string | null
  listingId: number | null
  createdAt: string
  updatedAt: string | null
}

export interface CarLinkData {
  id: number
  creatorId: number
  assigneeId: number | null
  url: string
  wish: string | null
  wishRu: string | null
  wishZh: string | null
  translateStatus: TranslateStatus | null
  originalLocale: string | null
  condition: CarCondition
  status: CarLinkStatus
  closureOutcome: CarLinkClosureOutcome | null
  customerInterest: CustomerInterest
  internalNote: string | null
  createdAt: string
  updatedAt: string | null
  actions: CarLinkActionData[] | null
  isUnread: boolean
}
