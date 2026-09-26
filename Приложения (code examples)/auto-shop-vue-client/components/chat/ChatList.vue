<template>
  <div
    ref="listRef"
    :class="$style.wrapper"
    @scroll="onScroll"
  >
    <ChatItem
      v-for="chat in allChats"
      :key="chat.id"
      :chat="chat"
      :highlighted="chat.id === activeChatId"
      @click="selectChat(chat)"
    />
    <div
      v-if="isPageLoading || isLoading"
      :class="$style.loader"
    >
      {{ t('common.loading') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref, type ComputedRef } from "vue"
import { storeToRefs } from "pinia"
import { useI18n } from "vue-i18n"
import { useDebounceFn } from "@vueuse/core"
import ChatItem from "./ChatItem.vue"
import { USER_ROLE_KEY, ChatRoles, chatTypes, chatSubjects } from "~/constants/chat"
import type { Chat, ChatMessage, MentionType, Participant, ChatFile } from "~/types/common/chat"
import type { TranslateStatus } from "~/types/common/statuses"

import { useChatStore } from "~/stores/chat"

const { t } = useI18n()
const userRole = inject<ComputedRef<string>>(USER_ROLE_KEY)!
const chatStore = useChatStore()
const { chats, activeChatId, filters } = storeToRefs(chatStore)
const { fetchChats, fetchNextPage } = chatStore
const emit = defineEmits(["chat-selected"])
const isLoading = ref(false)
const isPageLoading = ref(false)

onMounted(async () => {
  if (!chats.value.length) {
    isLoading.value = true
    const res = await fetchChats({ filters: filters.value })
    if (res?.data) {
      chatStore.setChats(res.data)
    }
    isLoading.value = false
  }
})

function makeParticipant(id: number, participantId: number, role: Chat["lastMessage"]["sender"]["role"], name: string): Participant {
  return { id, participantId, role, name, status: "active" as any }
}

function makeMsg(
  id: number,
  chatId: number,
  text: string,
  originalLocale: string,
  textRu: string,
  textZh: string,
  sender: Participant,
  createdAt: string,
  translateStatus: TranslateStatus,
  mentions: MentionType[] = [],
  files: ChatFile[] = [],
  isRead: boolean = false,
): ChatMessage {
  return { id, chatId, text, originalLocale, textRu, textZh, sender, createdAt, translateStatus, mentions, files, isRead }
}

const isSearchRequestSubject = computed(() => filters.value.subject === chatSubjects.searchRequest)

const pinnedChat = computed<Chat[]>(() => {
  if (userRole.value === ChatRoles.Admin || isSearchRequestSubject.value) {
    return []
  }

  const defaultAdmin: Chat = {
    id: 0,
    listingId: null,
    searchRequestId: null,
    name: t("chat.admin"),
    description: "",
    chatType: userRole.value === ChatRoles.Seller ? chatTypes.sellerAdmin : chatTypes.buyerAdmin,
    lastMessage: makeMsg(0, 0, t("chat.admin_default_description"), "", "", "", makeParticipant(0, 0, ChatRoles.Admin, ""), "", "done", [], [], true),
    createdAt: "",
    participants: [],
    unread: 0,
    avatar: "",
    isLocked: false,
    lockReason: null,
  }
  const adminFromApi = chats.value.find(
    chat =>
      chat.chatType === chatTypes.sellerAdmin
      || chat.chatType === chatTypes.buyerAdmin,
  )

  if (adminFromApi) {
    return [
      {
        ...defaultAdmin,
        id: adminFromApi.id,
        lastMessage: adminFromApi.lastMessage ?? defaultAdmin.lastMessage,
        unread: adminFromApi.unread ?? 0,
        participants: adminFromApi.participants ?? defaultAdmin.participants,
      },
    ]
  }

  return [defaultAdmin]
})

const matchesSubject = (chatType: Chat["chatType"]) => {
  if (isSearchRequestSubject.value) {
    return chatType === chatTypes.searchRequest
  }

  return chatType !== chatTypes.searchRequest
}

const allChats = computed<Chat[]>(() => {
  let filteredChats = chats.value.filter(chat => matchesSubject(chat.chatType))

  if (userRole.value !== ChatRoles.Admin) {
    filteredChats = filteredChats.filter(
      chat =>
        chat.chatType !== chatTypes.sellerAdmin
        && chat.chatType !== chatTypes.buyerAdmin,
    )
    return [...pinnedChat.value, ...filteredChats]
  }

  return filteredChats
})

function selectChat(chat: Chat) {
  chatStore.setActiveChat(chat)
  emit("chat-selected", chat.id)
}

const listRef = ref<HTMLElement | null>(null)
const THRESHOLD_PX = 300

const checkAndLoadMore = async () => {
  const el = listRef.value
  if (!el) {
    return
  }
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= THRESHOLD_PX
  if (nearBottom) {
    isPageLoading.value = true
    const res = await fetchNextPage({ filters: filters.value })
    if (res?.data?.length) {
      chatStore.setChats([...chats.value, ...res.data])
    }
    isPageLoading.value = false
  }
}

const onScroll = useDebounceFn(checkAndLoadMore, 120)
</script>

<style module>
.wrapper { @apply flex-1 overflow-y-auto bg-white divide-y divide-gray-200; }
.loader { @apply p-4 text-center text-gray-500; }
</style>
