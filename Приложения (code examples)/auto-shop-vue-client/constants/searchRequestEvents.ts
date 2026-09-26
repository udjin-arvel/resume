export const SearchRequestEventSource = "search_request_event"

// События заявок на подбор, видимые покупателю (действия менеджера)
export const SearchEventTakenInWork = "taken_in_work"
export const SearchEventCarAdded = "car_added"
export const SearchEventCarAddedMore = "car_added_more"
export const SearchEventAutoCarAdded = "auto_car_added"
export const SearchEventClosed = "closed"
export const SearchEventChangesAccepted = "changes_accepted"

// События заявок на подбор, видимые менеджеру и админу (действия покупателя / система)
export const SearchEventCreated = "created"
export const SearchEventUpdated = "updated"
export const SearchEventFindMoreRequested = "find_more_requested"
export const SearchEventClosedByBuyer = "closed_by_buyer"
export const SearchEventCarRejected = "car_rejected"
export const SearchEventAutoProposalAdded = "auto_proposal_added"
export const SearchEventCompleted = "completed"

export const SearchRequestEventTypesBuyer = [
  SearchEventTakenInWork,
  SearchEventCarAdded,
  SearchEventCarAddedMore,
  SearchEventAutoCarAdded,
  SearchEventClosed,
  SearchEventChangesAccepted,
]

export const SearchRequestEventTypesSeller = [
  SearchEventCreated,
  SearchEventUpdated,
  SearchEventFindMoreRequested,
  SearchEventClosedByBuyer,
  SearchEventCarRejected,
  SearchEventAutoProposalAdded,
  SearchEventCompleted,
]
