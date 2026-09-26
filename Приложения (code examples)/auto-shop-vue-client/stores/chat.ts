import { defineStore } from "pinia"
import { ref, watch } from "vue"
import { ChatNoticeKinds, chatTypes, chatSubjects, ChatNoticeKeys, ChatRoles, chatLockReasons } from "~/constants/chat"
import type { Chat, ChatNotice, ChatNoticeKey, ChatMessage, ChatSubject } from "@/types/common/chat"
import { useChat } from "~/composables/useChat"
import type { ChatListRequest } from "@/types/requests/chat"
import { useApiChat } from "@/composables/api/useApiChat"
import { useUserStore } from "~/stores/user"
import { useUnreadCountStore } from "~/stores/unreadCount"
import { chatSubjectOfType } from "@/utils/chatSubjectOfType"

export const useChatStore = defineStore("chat", () => {
  const chats = ref<Chat[]>([])
  const activeChatId = ref<number | null>(null)
  const activeChat = ref<Chat | null>(null)
  const isAdminChat = ref(false)
  const notice = ref<ChatNotice | null>(null)
  const filters = ref<ChatListRequest>({ subject: chatSubjects.listing })
  const pendingChat = ref<Chat | null>(null)
  const onlineInChats = ref<Record<number, any[]>>({})
  const unreadStore = useUnreadCountStore()

  const { fetchChats, fetchNextPage } = useChat()
  const { markAsUnread, markAsRead, show } = useApiChat()

  const isAdminType = (t: Chat["chatType"]) =>
    t === chatTypes.buyerAdmin || t === chatTypes.sellerAdmin

  const setActiveChat = (chat: Chat) => {
    activeChatId.value = chat.id
    activeChat.value = chat
    isAdminChat.value = isAdminType(chat.chatType)

    const idx = chats.value.findIndex(c => c.id === chat.id)
    if (idx !== -1) {
      const unreadBefore = chats.value[idx].unread ?? 0
      chats.value[idx].unread = 0
      if (unreadBefore > 0) {
        unreadStore.decrementChatCount(unreadBefore, chat.listingId, chatSubjectOfType(chat.chatType ?? undefined))
      }
    }

    activeChat.value = chats.value[idx] ?? chat

    const userStore = useUserStore()
    const currentUserId = userStore.currentUserId
    const currentUserRole = userStore.user?.role

    let myParticipant = chat.participants?.find(p => p.participantId === currentUserId)

    if (!myParticipant && currentUserRole) {
      if (currentUserRole === ChatRoles.Logistic) {
        myParticipant = chat.participants?.find(p => p.role === ChatRoles.Logistic)
      }
      else if (currentUserRole === ChatRoles.Admin) {
        myParticipant = chat.participants?.find(p => p.role === ChatRoles.Admin)
      }
    }

    const isStaff = userStore.isAdmin
      || currentUserRole === ChatRoles.Admin
      || currentUserRole === ChatRoles.Logistic

    if (chat.isLocked && chat.lockReason === chatLockReasons.searchRequestUnassigned) {
      setNotice(ChatNoticeKeys.SearchRequestUnassigned, ChatNoticeKinds.Info)
    }
    else if (chat.isLocked) {
      setNotice(
        chat.chatType === chatTypes.searchRequest
          ? ChatNoticeKeys.SearchRequestClosed
          : ChatNoticeKeys.ListingDeleted,
        ChatNoticeKinds.Warning,
      )
    }
    else if (myParticipant?.status === "closed") {
      setNotice(ChatNoticeKeys.ChatClosed, ChatNoticeKinds.Info)
    }
    else if (isAdminChat.value && !isStaff) {
      setNotice(ChatNoticeKeys.AdminChat, ChatNoticeKinds.Info)
    }
    else {
      clearNotice()
    }
  }

  const clearActiveChat = () => {
    activeChatId.value = null
    activeChat.value = null
    isAdminChat.value = false
    clearNotice()
  }

  const setNotice = (key: ChatNoticeKey, kind: ChatNotice["kind"] = ChatNoticeKinds.Info) => {
    notice.value = key ? { key, kind } : null
  }

  const clearNotice = () => {
    notice.value = null
  }

  const setChats = (list: Chat[]) => {
    const existing = [...chats.value]
    const map = new Map<number, Chat>()

    for (const c of existing) {
      map.set(c.id, c)
    }

    for (const c of list) {
      map.set(c.id, c)
    }

    chats.value = Array.from(map.values()).sort((a, b) => {
      return (b.lastMessage?.createdAt || b.createdAt || "").localeCompare(a.lastMessage?.createdAt || a.createdAt || "")
    })
  }

  const setPendingChat = (chat: Chat | null) => {
    pendingChat.value = chat
  }

  const updateChatLastMessage = (chatId: number, msg: ChatMessage, unreadInput: boolean | number = true) => {
    const list = [...chats.value]
    const index = list.findIndex(c => c.id === chatId)

    if (index !== -1) {
      const currentUnread = list[index].unread ?? 0
      const newUnread = typeof unreadInput === "number"
        ? unreadInput
        : (unreadInput ? currentUnread + 1 : currentUnread)

      const existingLast = list[index].lastMessage
      const keepTranslated = Boolean(existingLast
        && existingLast.id === msg.id
        && existingLast.translateStatus === "done"
        && msg.translateStatus !== "done")

      const updatedChat: Chat = {
        ...list[index],
        lastMessage: keepTranslated ? existingLast : msg,
        unread: newUnread,
      }

      if (activeChat.value?.id === chatId) {
        activeChat.value = updatedChat
      }

      list.splice(index, 1)
      list.unshift(updatedChat)
    }
    else {
      const newUnread = typeof unreadInput === "number"
        ? unreadInput
        : (unreadInput ? 1 : 0)

      const newChat: Chat = {
        id: chatId,
        lastMessage: msg,
        unread: newUnread,
        createdAt: msg.createdAt,
        listingId: msg.listingId,
      } as Chat
      list.unshift(newChat)
    }

    chats.value = list
  }

  const clearChats = () => {
    chats.value = []
  }

  const setFilters = (newFilters: ChatListRequest) => {
    filters.value = newFilters
  }

  const resetFilters = () => {
    filters.value = { subject: filters.value.subject }
  }

  const setSubject = (subject: ChatSubject) => {
    if (filters.value.subject === subject) {
      return
    }
    filters.value = { ...filters.value, subject }
  }

  const markChatAsUnread = async (chatId: number) => {
    const idx = chats.value.findIndex(c => c.id === chatId)
    if (idx !== -1) {
      chats.value[idx] = { ...chats.value[idx], unread: (chats.value[idx].unread ?? 0) + 1 }
      chats.value = [...chats.value]
    }

    if (activeChat.value?.id === chatId) {
      activeChat.value = { ...activeChat.value, unread: (activeChat.value.unread ?? 0) + 1 }
    }

    try {
      const res = await markAsUnread(chatId)
      unreadStore.applyTotals(res?.data)
    }
    catch {
      if (idx !== -1) {
        chats.value[idx].unread = Math.max((chats.value[idx].unread ?? 1) - 1, 0)
      }

      if (activeChat.value?.id === chatId) {
        activeChat.value.unread = Math.max((activeChat.value.unread ?? 1) - 1, 0)
      }
    }
  }

  const markChatAsReadAction = async (chatId: number) => {
    const res = await markAsRead(chatId).catch(() => null)
    unreadStore.applyTotals(res?.data)
  }

  const markChatReadLocal = (chatId: number) => {
    const idx = chats.value.findIndex(c => c.id === chatId)

    if (idx === -1) {
      return
    }

    const unreadBefore = chats.value[idx].unread ?? 0

    if (unreadBefore <= 0) {
      return
    }

    chats.value[idx].unread = 0
    unreadStore.decrementChatCount(
      unreadBefore,
      chats.value[idx].listingId,
      chatSubjectOfType(chats.value[idx].chatType ?? undefined),
    )
  }

  async function fetchChatById(id: number) {
    try {
      const res = await show(id, { camelize: true })
      const chat = res?.data ?? null
      if (!chat) {
        return null
      }
      setChats([chat])
      setPendingChat(chat)
      return chat
    }
    catch {
      return null
    }
  }

  const setOnlineParticipants = (chatId: number, users: any[]) => {
    onlineInChats.value[chatId] = users
  }

  const addOnlineParticipant = (chatId: number, user: any) => {
    const list = onlineInChats.value[chatId] ?? []
    onlineInChats.value[chatId] = [...list, user]
  }

  const removeOnlineParticipant = (chatId: number, user: any) => {
    const list = onlineInChats.value[chatId] ?? []
    onlineInChats.value[chatId] = list.filter(u => u.id !== user.id)
  }

  watch(
    filters,
    async (f) => {
      const res = await fetchChats({ filters: f })
      if (res?.data) {
        chats.value = res.data
      }
    },
    { deep: true },
  )

  return {
    chats,
    activeChatId,
    activeChat,
    isAdminChat,
    notice,
    filters,
    pendingChat,
    setChats,
    setActiveChat,
    clearActiveChat,
    setNotice,
    clearNotice,
    updateChatLastMessage,
    setFilters,
    resetFilters,
    setSubject,
    fetchChats,
    fetchNextPage,
    markChatAsUnread,
    fetchChatById,
    setPendingChat,
    onlineInChats,
    setOnlineParticipants,
    addOnlineParticipant,
    removeOnlineParticipant,
    clearChats,
    markChatAsReadAction,
    markChatReadLocal,
  }
})
