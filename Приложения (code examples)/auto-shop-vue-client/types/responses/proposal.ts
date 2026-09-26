import type { Listing } from "@/types/responses/listing"

export type ProposalStatus = "pending" | "accepted" | "rejected"
export type ProposalSource = "auto" | "manual"

export interface RejectionPhoto {
  id: number
  url: string
  thumb?: string
}

export interface Proposal {
  listing: Listing
  status: ProposalStatus
  has_pending_booking: boolean
  rejection_reason?: string
  rejection_reason_ru?: string
  rejection_reason_zh?: string
  rejection_reason_original_locale?: string
  source: ProposalSource
  rejection_photos?: RejectionPhoto[]
}
