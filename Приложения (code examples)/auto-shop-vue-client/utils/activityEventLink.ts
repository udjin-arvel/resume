import type { RouteLocationRaw } from "vue-router"
import {
  type ActivityEvent,
  isCarLinkEvent,
  isListingRequest,
  isListingSourceEvent,
  isSearchRequestEvent,
} from "~/types/responses/activityEvent"

const listingRequestTabs: [string, string][] = [
  ["listing_request_video", "personal-listings-id-video"],
  ["listing_request_diagnostic", "personal-listings-id-diagnostic"],
  ["listing_request_compensation", "personal-listings-id-compensation"],
  ["listing_request_booking", "personal-listings-id-booking"],
]

export function activityEventItemLink(item: ActivityEvent, isBuyer = false): RouteLocationRaw | null {
  const id = item.entity.attributes.id
  if (!id) {
    return null
  }

  if (isListingSourceEvent(item)) {
    return { name: "personal-listings-id", params: { id }, query: { from: "events" } }
  }
  if (isCarLinkEvent(item)) {
    return { name: "personal-links-id", params: { id } }
  }
  if (isSearchRequestEvent(item)) {
    return { name: "personal-needs-id", params: { id } }
  }
  if (isListingRequest(item)) {
    if (isBuyer) {
      return { name: "catalog-id", params: { id } }
    }

    const tab = listingRequestTabs.find(([prefix]) => item.type.startsWith(prefix))

    return {
      name: tab?.[1] ?? "personal-listings-id",
      params: { id },
      query: { from: "events" },
    }
  }

  return null
}
