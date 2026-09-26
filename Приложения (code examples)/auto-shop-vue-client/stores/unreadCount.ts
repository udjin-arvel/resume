import { ref, computed } from "vue"
import { defineStore } from "pinia"
import type { UnreadCounts, UnreadCountsInput, LogisticUnreadGroup, ChatSubjectUnread, UnreadTotalsPayload } from "@/types/common/unread"
import { chatSubjects } from "@/constants/chat"
import type { ChatSubject } from "@/types/common/chat"

const normalizeGroup = (data: any): LogisticUnreadGroup => {
  if (!data || Array.isArray(data)) {
    return { active: {}, archive: {} }
  }

  return {
    active: Array.isArray(data.active) ? {} : (data.active || {}),
    archive: Array.isArray(data.archive) ? {} : (data.archive || {}),
  }
}

const emptySubjects = (): ChatSubjectUnread => ({
  [chatSubjects.listing]: 0,
  [chatSubjects.searchRequest]: 0,
})

export const useUnreadCountStore = defineStore("unreadCount", () => {
  const _counts = ref<UnreadCounts | null>(null)
  const defaultLogistic: LogisticUnreadGroup = { active: {}, archive: {} }
  const listingRequestsWsEvent = ref(0)

  const counts = computed(() => {
    if (_counts.value === null) {
      return {
        listingRequests: 0,
        chats: 0,
        chatsByListing: {},
        chatsBySubject: emptySubjects(),
        carLinks: 0,
        needs: 0,
        logisticOrders: defaultLogistic,
        searchRequests: 0,
        notifications: 0,
      } as UnreadCounts
    }
    return _counts.value
  })

  const totalActiveLogisticUnread = computed(() => {
    if (!_counts.value?.logisticOrders?.active) {
      return 0
    }
    return Object.values(_counts.value.logisticOrders.active).reduce((sum, curr) => sum + curr, 0)
  })

  const totalArchiveLogisticUnread = computed(() => {
    if (!_counts.value?.logisticOrders?.archive) {
      return 0
    }
    return Object.values(_counts.value.logisticOrders.archive).reduce((sum, curr) => sum + curr, 0)
  })

  const totalLogisticUnread = computed(() => {
    return totalActiveLogisticUnread.value + totalArchiveLogisticUnread.value
  })

  const getSubjectUnreadCount = (subject: ChatSubject): number => {
    return _counts.value?.chatsBySubject?.[subject] ?? 0
  }

  const getListingUnreadCount = (listingId: number): number => {
    if (!_counts.value?.chatsByListing) {
      return 0
    }
    return _counts.value.chatsByListing[listingId] || 0
  }

  const getSearchRequestUnreadCount = (searchRequestId: number): number | null => {
    const map = _counts.value?.chatsBySearchRequest
    if (!map) {
      return null
    }
    return map[searchRequestId] || 0
  }

  const ensureCounts = () => {
    if (_counts.value === null) {
      _counts.value = {
        listingRequests: 0,
        chats: 0,
        chatsByListing: {},
        chatsBySubject: emptySubjects(),
        carLinks: 0,
        needs: 0,
        logisticOrders: { ...defaultLogistic },
        searchRequests: 0,
        notifications: 0,
      }
    }
  }

  const setChats = (count: number) => {
    ensureCounts()
    _counts.value!.chats = count
  }

  const applyTotals = (totals: UnreadTotalsPayload | null | undefined) => {
    if (!totals || typeof totals.chats !== "number") {
      return
    }

    ensureCounts()

    const byListing: Record<number, number> = {}
    for (const item of totals.chatsByListing ?? []) {
      const listingId = (item as Record<string, any>)?.listingId ?? (item as Record<string, any>)?.listing_id
      if (listingId) {
        byListing[listingId] = item.unread
      }
    }

    const subjects = (totals.chatsBySubject ?? {}) as Record<string, number>

    _counts.value!.chats = totals.chats ?? 0
    _counts.value!.chatsBySubject = {
      [chatSubjects.listing]: subjects[chatSubjects.listing] ?? subjects.listing ?? 0,
      [chatSubjects.searchRequest]: subjects[chatSubjects.searchRequest] ?? subjects.searchRequest ?? 0,
    }
    _counts.value!.chatsByListing = byListing

    if (Array.isArray(totals.chatsBySearchRequest)) {
      const bySearchRequest: Record<number, number> = {}
      for (const item of totals.chatsBySearchRequest) {
        const requestId = (item as Record<string, any>)?.searchRequestId ?? (item as Record<string, any>)?.search_request_id
        if (requestId) {
          bySearchRequest[requestId] = item.unread
        }
      }
      _counts.value!.chatsBySearchRequest = bySearchRequest
    }
  }

  const setChatsBySubject = (data: Partial<ChatSubjectUnread>) => {
    ensureCounts()
    _counts.value!.chatsBySubject = { ...emptySubjects(), ...data }
  }

  const bumpSubjectCount = (subject: ChatSubject | null | undefined, diff: number) => {
    if (!subject || !diff) {
      return
    }

    ensureCounts()

    const current = _counts.value!.chatsBySubject ?? emptySubjects()

    _counts.value!.chatsBySubject = {
      ...current,
      [subject]: Math.max(0, (current[subject] ?? 0) + diff),
    }
  }

  const setCarLinks = (count: number) => {
    ensureCounts()
    _counts.value!.carLinks = count
  }

  const setNeeds = (count: number) => {
    ensureCounts()
    _counts.value!.needs = count
  }

  const setLogisticOrders = (data: Record<number, number>) => {
    ensureCounts()
    _counts.value!.logisticOrders = normalizeGroup(data)
  }

  const setListingRequests = (count: number) => {
    ensureCounts()
    _counts.value!.listingRequests = count
  }

  const bumpListingRequestsWsEvent = () => {
    listingRequestsWsEvent.value++
  }

  const setSearchRequests = (count: number) => {
    ensureCounts()
    _counts.value!.searchRequests = count
  }

  const setNotifications = (count: number) => {
    ensureCounts()
    _counts.value!.notifications = count
  }

  const setAll = (countsData: UnreadCountsInput) => {
    ensureCounts()
    _counts.value = {
      listingRequests: countsData.listingRequests ?? _counts.value!.listingRequests,
      chats: countsData.chats ?? _counts.value!.chats,
      chatsByListing: countsData.chatsByListing ?? _counts.value!.chatsByListing ?? {},
      chatsBySearchRequest: countsData.chatsBySearchRequest ?? _counts.value!.chatsBySearchRequest,
      chatsBySubject: countsData.chatsBySubject
        ? { ...emptySubjects(), ...countsData.chatsBySubject }
        : (_counts.value!.chatsBySubject ?? emptySubjects()),
      carLinks: countsData.carLinks ?? _counts.value!.carLinks,
      needs: countsData.needs ?? _counts.value!.needs,
      logisticOrders: countsData.logisticOrders
        ? normalizeGroup(countsData.logisticOrders)
        : _counts.value!.logisticOrders,
      searchRequests: countsData.searchRequests ?? _counts.value!.searchRequests,
      notifications: countsData.notifications ?? _counts.value!.notifications,
    }
  }

  const decrementChatCount = (amount: number, listingId?: number | null, subject?: ChatSubject | null) => {
    ensureCounts()

    const newTotal = Math.max(0, (_counts.value!.chats || 0) - amount)
    _counts.value!.chats = newTotal

    bumpSubjectCount(subject, -amount)

    if (listingId && _counts.value!.chatsByListing) {
      const currentListingCount = _counts.value!.chatsByListing[listingId] || 0
      const newListingCount = Math.max(0, currentListingCount - amount)

      _counts.value!.chatsByListing = {
        ..._counts.value!.chatsByListing,
        [listingId]: newListingCount,
      }
    }
  }

  const reset = () => {
    _counts.value = {
      listingRequests: 0,
      chats: 0,
      chatsByListing: {},
      chatsBySubject: emptySubjects(),
      carLinks: 0,
      needs: 0,
      logisticOrders: { ...defaultLogistic },
      searchRequests: 0,
      notifications: 0,
    }
  }

  if (import.meta.server || import.meta.client) {
    ensureCounts()
  }

  return {
    counts,
    totalLogisticUnread,
    totalActiveLogisticUnread,
    totalArchiveLogisticUnread,
    getListingUnreadCount,
    getSearchRequestUnreadCount,
    getSubjectUnreadCount,
    applyTotals,
    setChats,
    setChatsBySubject,
    bumpSubjectCount,
    setCarLinks,
    setNeeds,
    setLogisticOrders,
    setAll,
    decrementChatCount,
    reset,
    setListingRequests,
    setSearchRequests,
    setNotifications,
    listingRequestsWsEvent,
    bumpListingRequestsWsEvent,
  }
})
