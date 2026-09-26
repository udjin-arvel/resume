import type { ChatRoles, ChatNoticeKeys, chatTypes, chatSubjects, chatLockReasons, mentions, ParticipantStatus, ChatNoticeKinds } from "@/constants/chat"
import type { TranslateStatus } from "~/types/common/statuses"

export type ChatRole = typeof ChatRoles[keyof typeof ChatRoles]
export type ChatType = typeof chatTypes[keyof typeof chatTypes] | null
export type ChatSubject = typeof chatSubjects[keyof typeof chatSubjects]
export type ChatLockReason = typeof chatLockReasons[keyof typeof chatLockReasons]
export type MentionType = typeof mentions[keyof typeof mentions] | null
export type ChatNoticeKey = typeof ChatNoticeKeys[keyof typeof ChatNoticeKeys] | null
export type ParticipantStatus = typeof ParticipantStatus[keyof typeof ParticipantStatus]

export interface Chat {
  id: number
  listingId: number | null
  searchRequestId: number | null
  name: string
  description: string
  chatType: ChatType
  lastMessage: ChatMessage
  createdAt: string
  unread: number
  avatar: string
  isLocked: boolean
  lockReason: ChatLockReason | null
  participants: Participant[]
}

export interface ChatMessage {
  id: number
  chatId: number
  text: string
  textRu: string
  textZh: string
  originalLocale: string
  sender: Participant
  createdAt: string
  mentions: MentionType[]
  files: ChatFile[]
  translateStatus: TranslateStatus
  listingId?: number
  isRead: boolean
}

export interface Participant {
  id: number
  participantId: number
  role: ChatRole
  name: string
  status: ParticipantStatus
}

export type ChatNoticeKind = typeof ChatNoticeKinds[keyof typeof ChatNoticeKinds]

export interface ChatNotice {
  key: ChatNoticeKey
  kind: ChatNoticeKind
}

export type ChatFile = {
  id: number
  name: string
  url: string
  mimeType: string
  size: number
  thumb?: string | null
}
