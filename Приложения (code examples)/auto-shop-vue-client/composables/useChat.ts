import { ref, readonly } from "vue"
import { useApiChat, useLoadingIndicator, useRouter } from "#imports"
import usePagination from "@/composables/usePagination"
import type { ApiListStrictResponse } from "@/types/responses/response"
import type { Chat } from "@/types/common/chat"
import { useDate } from "@/composables/useDate"
import { useUserStore } from "@/stores/user"
import type { GetBuyerSellerRequest, GetSearchRequestChatRequest, GetAdminUserRequest, ChatListRequest } from "@/types/requests/chat"

function chatSortTs(c: Chat, ts: (v?: string | Date | null) => number): number {
  return ts(c.lastMessage?.createdAt) || ts(c.createdAt)
}

interface FetchOpts {
  filters?: ChatListRequest
}

export function useChat() {
  const userStore = useUserStore()
  const { isLoading, start, finish } = useLoadingIndicator()
  const isPageLoading = ref(false)
  const data = ref<Chat[]>([])
  const { index, getBuyerSeller, getSearchRequest, getAdminUser } = useApiChat()
  const router = useRouter()
  const { ts } = useDate()

  const { __currentPage, __limit, offset, total, lastPage, next, prev, first, last } = usePagination({
    currentPage: 1,
    limit: 20,
    total: 0,
  })

  function mergeUniqueSorted(existing: Chat[], incoming: Chat[]): Chat[] {
    const map = new Map<number, Chat>()
    for (const item of existing) {
      map.set(item.id, item)
    }
    for (const item of incoming) {
      map.set(item.id, item)
    }
    const arr = Array.from(map.values())
    arr.sort((a, b) => {
      const tb = chatSortTs(b, ts)
      const ta = chatSortTs(a, ts)
      if (tb !== ta) {
        return tb - ta
      }
      return (b.id ?? 0) - (a.id ?? 0)
    })
    return arr
  }

  async function fetchChats(opts?: FetchOpts) {
    if (isPageLoading.value || !userStore.isAuthenticated) {
      return
    }
    isPageLoading.value = true
    start()
    try {
      const res = await index(
        { offset: offset.value, limit: __limit.value, ...(opts?.filters || {}) },
        { camelize: true },
      ) as ApiListStrictResponse<Chat>
      data.value = mergeUniqueSorted([], res.data)
      total.value = res.meta.total
      __limit.value = res.meta.limit
      __currentPage.value = res.meta.currentPage
      return res
    }
    finally {
      isPageLoading.value = false
      finish()
    }
  }

  async function fetchNextPage(opts?: FetchOpts) {
    if (isPageLoading.value || !userStore.isAuthenticated) {
      return
    }
    if (__currentPage.value >= lastPage.value) {
      return
    }
    isPageLoading.value = true
    start()
    try {
      next()
      const res = await index(
        { offset: offset.value, limit: __limit.value, ...(opts?.filters || {}) },
        { camelize: true },
      ) as ApiListStrictResponse<Chat>
      data.value = mergeUniqueSorted(data.value, res.data)
      total.value = res.meta.total
      __limit.value = res.meta.limit
      __currentPage.value = res.meta.currentPage
      return res
    }
    finally {
      isPageLoading.value = false
      finish()
    }
  }

  async function openBuyerSellerChat(payload: GetBuyerSellerRequest) {
    start()
    try {
      const { data: chat } = await getBuyerSeller(payload)
      await router.push({ name: "personal-chats-id", params: { id: String(chat.id) } })
      return chat
    }
    finally {
      finish()
    }
  }

  async function openSearchRequestChat(payload: GetSearchRequestChatRequest) {
    start()
    try {
      const { data: chat } = await getSearchRequest(payload)
      await router.push({ name: "personal-chats-id", params: { id: String(chat.id) } })
      return chat
    }
    finally {
      finish()
    }
  }

  async function openAdminUserChat(payload: GetAdminUserRequest) {
    start()
    try {
      const { data: chat } = await getAdminUser(payload)
      await router.push({ name: "personal-chats-id", params: { id: String(chat.id) } })
      return chat
    }
    finally {
      finish()
    }
  }

  return {
    data,
    isLoading: readonly(isLoading),
    isPageLoading: readonly(isPageLoading),
    page: __currentPage,
    limit: __limit,
    total,
    lastPage,
    next,
    prev,
    first,
    last,
    fetchChats,
    fetchNextPage,
    openBuyerSellerChat,
    openSearchRequestChat,
    openAdminUserChat,
  }
}
