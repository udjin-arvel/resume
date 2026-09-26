export type CarLinkActionAttributes = {
  id: number
  car_link_url: string
  car_link_wish: string
}
export type ListingRequestAttributes = {
  id: number
  name: string
  year: number
  vin: string
  gearbox: string
  listing_user_id: number
  user_id: number
}
export type SearchRequestEventAttributes = {
  id?: number
  search_request_title?: string | null
}
export type ListingSourceEventAttributes = {
  id: number
  name: string | null
  year: number | null
  vin: string | null
  gearbox: string | null
  listing_user_id: number | null
  source: string | null
  external_url: string | null
  source_event_id: number
  source_event_type: string
  source_event_status: string
  client: null
}

export type ActivityEventEntity =
  | {
    type: "CarLinkAction"
    id: number
    attributes: CarLinkActionAttributes
  }
  | {
    type: "ListingRequest"
    id: number
    attributes: ListingRequestAttributes
  }
  | {
    type: "SearchRequestEvent"
    id: number
    attributes: SearchRequestEventAttributes
  }
  | {
    type: "ListingSourceEvent"
    id: number
    attributes: ListingSourceEventAttributes
  }

export interface ActivityEventPayload {
  old_price?: number | string | null
  new_price?: number | string | null
}

export interface ActivityEvent {
  id: number
  type: string
  payload: ActivityEventPayload | null
  entity: ActivityEventEntity
  read_at: string | null
  created_at: string
  initiator: {
    id: number
    role: string
    name: string
  } | null
}

export interface ActivityEventsFilter {
  visibility: string
  created_at?: { from: string, to: string }
  types?: string[]
  listing_vin?: string
  brand_id?: string | number
  series_id?: string | number
  client_id?: string | number
  user_id?: string | number
  initiator_user_id?: string | number
}

export type ActivityEventByEntityType<
  T extends ActivityEventEntity["type"],
> = ActivityEvent & {
  entity: Extract<ActivityEventEntity, { type: T }>
}

export type ListingRequestNotification = ActivityEventByEntityType<"ListingRequest">
export type ListingSourceEventNotification = ActivityEventByEntityType<"ListingSourceEvent">
export type CarLinkActionNotification = ActivityEventByEntityType<"CarLinkAction">
export type SearchRequestNotification = ActivityEventByEntityType<"SearchRequestEvent">

export function isSearchRequestEvent(item: ActivityEvent): item is SearchRequestNotification {
  return item.entity.type === "SearchRequestEvent"
}

export function isCarLinkEvent(item: ActivityEvent): item is CarLinkActionNotification {
  return item.entity.type === "CarLinkAction"
}

export function isListingRequest(item: ActivityEvent): item is ListingRequestNotification {
  return item.entity.type === "ListingRequest"
}

export function isListingSourceEvent(item: ActivityEvent): item is ListingSourceEventNotification {
  return item.entity.type === "ListingSourceEvent"
}

export interface FiltersOptionsResponse {
  listing_request_types: string[]
  car_link_action_types: string[]
  search_request_event_types: string[]
  listing_source_event_types?: string[]
  brands: {
    id: number
    image: string
    name: string
  }[]
  series: {
    id: number
    name: string
  }[]
  clients: {
    id: number
    name: string
  }[]
  employees: {
    id: number
    name: string
  }[]
  initiators: {
    id: number
    name: string
  }[]
}
