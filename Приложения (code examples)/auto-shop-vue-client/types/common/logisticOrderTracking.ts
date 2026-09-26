import type { Creator, LogisticOrderStatus } from "@/types/common/logisticOrder"
import type { SimpleFile } from "@/types/common/file"
import type { TranslateStatus } from "~/types/common/statuses"
import type { LocaleType } from "~/types/common/locale"

export interface LogisticOrderTracking {
  id: number
  logisticOrderId: number
  status: LogisticOrderStatus
  comment: string | null
  commentRu: string | null
  commentZh: string | null
  originalLocale: LocaleType | null
  translateStatus: TranslateStatus
  createdBy: number | null
  creator: Creator
  createdAt: string | null
  updatedAt: string | null
  media: SimpleFile[]
  documents: SimpleFile[]
  buyerDocuments: SimpleFile[]
}

export interface PublicLogisticOrderTracking {
  createdAt: string
  status: LogisticOrderStatus
  comment: string | null
  media: SimpleFile[]
  commentRu?: string | null
  commentZh?: string | null
  originalLocale?: LocaleType | null
}
