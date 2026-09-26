import { DiagnosticCost, CompensationCost } from "@/constants/catalog"
import {
  RequestTypeDiagnostic,
  RequestTypeCompensation,
} from "@/constants/listingRequests"
import type { SearchRequestListingRequest } from "@/types/responses/searchRequest"

const costs = {
  [RequestTypeDiagnostic]: DiagnosticCost,
  [RequestTypeCompensation]: CompensationCost,
}

export function getListingRequestCost(type: SearchRequestListingRequest["type"]): number {
  return costs[type]
}
