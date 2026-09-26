import { ref, readonly, computed } from "vue"
import { storeToRefs } from "pinia"
import { useLoadingIndicator } from "#imports"
import usePagination from "@/composables/usePagination"
import type { ApiListStrictResponse, ApiResponse } from "@/types/responses/response"
import type { ChatMessage } from "@/types/common/chat"
import type { ChatMessagesRequest } from "@/types/requests/chat"
import { useApiChatMessages } from "@/composables/api/useApiChatMessage"
import { useChatStore } from "@/stores/chat"
import { useChatMessagesActiveStore } from "@/stores/chatMessage"

let instance: ReturnType<typeof createChatMessages> | null = null

function createChatMessages() {
  const { isLoading, start, finish } = useLoadingIndicator()
  const isPageLoading = ref(false)
  const isLoadingMore = ref(false)
  const isSending = ref(false)
  const { index, store } = useApiChatMessages()
  const chatStore = useChatStore()
  const { activeChatId } = storeToRefs(chatStore)
  const activeStore = useChatMessagesActiveStore()

  const messages = computed(() => activeStore.activeChatMessages)
  const minId = computed(() => activeStore.activeChatMinId)

  const { __currentPage, __limit, offset, total, lastPage, next, prev, first, last } = usePagination({
    currentPage: 1,
    limit: 30,
    total: 0,
  })

  const canLoadMore = computed(() => __currentPage.value < lastPage.value)

  let requestSeq = 0

  function setInitial() {
    total.value = 0
    __limit.value = 30
    __currentPage.value = 1
    first()
  }

  function isStale(seq: number, chatId: number) {
    return seq !== requestSeq || activeChatId.value !== chatId
  }

  async function fetchFirst() {
    const chatId = activeChatId.value
    if (!chatId) {
      return
    }
    const seq = ++requestSeq
    isPageLoading.value = true
    start()
    try {
      setInitial()
      const params: ChatMessagesRequest = { offset: offset.value, limit: __limit.value }
      const res = await index(chatId, params) as ApiListStrictResponse<ChatMessage>
      if (isStale(seq, chatId)) {
        return
      }
      const data = res.data ?? []
      activeStore.setChatMessages(chatId, data)
      total.value = res.meta.total
      __limit.value = res.meta.limit
      __currentPage.value = res.meta.currentPage
      activeStore.setChatMinId(chatId, data.length ? Math.min(...data.map(m => m.id)) : undefined)
      return res
    }
    finally {
      if (seq === requestSeq) {
        isPageLoading.value = false
      }
      finish()
    }
  }

  async function fetchNextPage() {
    const chatId = activeChatId.value
    if (!chatId || isLoadingMore.value || isPageLoading.value) {
      return
    }
    if (__currentPage.value >= lastPage.value) {
      return
    }
    const seq = requestSeq
    isLoadingMore.value = true
    start()
    try {
      next()
      const minIdValue: number | undefined = activeStore.activeChatMinId
      const params: ChatMessagesRequest = {
        offset: offset.value,
        limit: __limit.value,
        ...(minIdValue !== undefined ? { minId: minIdValue } : {}),
      }
      const res = await index(chatId, params) as ApiListStrictResponse<ChatMessage>
      if (isStale(seq, chatId)) {
        return
      }
      const incoming = res.data ?? []
      activeStore.appendChatMessages(chatId, incoming)
      total.value = res.meta.total
      __limit.value = res.meta.limit
      __currentPage.value = res.meta.currentPage
      activeStore.setChatMinIdByItems(chatId, incoming)
      return res
    }
    finally {
      isLoadingMore.value = false
      finish()
    }
  }

  async function send(text: string, mention?: string | null, fileId?: number | null) {
    const chatId = activeChatId.value
    if (!chatId) {
      return
    }
    if (isSending.value) {
      return
    }
    if (!text.trim() && !mention && !fileId) {
      return
    }

    isSending.value = true
    try {
      const payload: {
        text: string
        mentions?: string[]
        files?: number[]
      } = { text }

      if (mention) {
        payload.mentions = [mention]
      }
      if (fileId) {
        payload.files = [fileId]
      }

      const res = await store(chatId, payload) as ApiResponse<ChatMessage>
      const msg = res.data

      if (msg) {
        activeStore.prependChatMessage(chatId, msg)
        activeStore.setChatMinIdByItems(chatId, [msg])
        chatStore.updateChatLastMessage(chatId, msg, false)
      }

      return msg
    }
    finally {
      isSending.value = false
    }
  }

  return {
    data: messages,
    minId,
    isLoading: readonly(isLoading),
    isPageLoading: readonly(isPageLoading),
    isLoadingMore: readonly(isLoadingMore),
    isSending: readonly(isSending),
    canLoadMore,
    page: __currentPage,
    limit: __limit,
    total,
    lastPage,
    next,
    prev,
    first,
    last,
    fetchFirst,
    fetchNextPage,
    send,
  }
}

export function useChatMessages() {
  if (!instance) {
    instance = createChatMessages()
  }
  return instance
}
