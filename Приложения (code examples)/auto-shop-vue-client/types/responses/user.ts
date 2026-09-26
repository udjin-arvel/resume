import type { Client } from "@/types/responses/client"
import type { NotificationCounts } from "@/types/common/unread"
import type { SubscriptionTypeEnum } from "@/types/common/subscription"

export interface User {
  id: number
  name: string
  status: string
  role: string
  client_id?: number
  email: string
  email_verified_at: string | null
  client?: Client
  phone?: string | null
  telegram_chat_id?: number | null
  must_change_password?: boolean
  preferred_lang: string
  notifications_count?: NotificationCounts
  notification_settings?: SubscriptionTypeEnum[]
}
