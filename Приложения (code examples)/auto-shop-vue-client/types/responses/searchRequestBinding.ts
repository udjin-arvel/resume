import type { SearchRequestStatusType } from "@/types/responses/searchRequest"

export interface SearchRequestBinding {
  id: number
  value: number
  request_id: number
  created_at: string
  client_name: string | null
  status: SearchRequestStatusType
  disabled: boolean
  proposal_source: "auto" | "manual"
  proposal_status: "pending" | "rejected"
}
