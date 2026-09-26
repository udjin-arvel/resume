<template>
  <div :class="[$style.wrapper, isMobile ? $style.mobile : '']">
    <div
      v-show="!isMobile || (isMobile && !showChat)"
      :class="$style.leftCol"
    >
      <ChatSubjectTabs />
      <ChatSearch />
      <ChatList @chat-selected="handleChatSelected" />
    </div>

    <div
      v-show="!isMobile || (isMobile && showChat)"
      :class="$style.rightCol"
    >
      <ChatHeader
        :show-back-btn="isMobile"
        @back="handleBack"
      />
      <MessageList />
      <ChatNotice
        :notice="chatNoticeText"
        :kind="noticeKind"
      />
      <MessageInput v-if="!isAwaitingExecutor" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, onMounted, onBeforeUnmount, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import ChatSubjectTabs from "./ChatSubjectTabs.vue"
import ChatSearch from "./ChatSearch.vue"
import ChatList from "./ChatList.vue"
import ChatHeader from "./ChatHeader.vue"
import MessageList from "./MessageList.vue"
import MessageInput from "./MessageInput.vue"
import ChatNotice from "./ChatNotice.vue"
import { USER_ROLE_KEY, USER_ID_KEY, chatTypes, chatSubjects, chatLockReasons } from "~/constants/chat"
import { useUserStore } from "~/stores/user"
import { useChatStore } from "~/stores/chat"
import { mapExternalRoleToChatRole } from "@/utils/chatRole"
import { useChatMessages } from "@/composables/useChatMessages"
import { usePresenceChat } from "@/composables/usePresenceChat"
import { useChatMessagesActiveStore } from "~/stores/chatMessage"

const { t } = useI18n()
const userStore = useUserStore()
const chatStore = useChatStore()
const route = useRoute()
const router = useRouter()
const { fetchFirst } = useChatMessages()
const chatMessagesStore = useChatMessagesActiveStore()

const chatRole = computed(() => mapExternalRoleToChatRole(userStore.user?.role))
provide(USER_ROLE_KEY, chatRole)

const currentUserId = computed(() => userStore.user?.id ?? null)
provide(USER_ID_KEY, currentUserId)

chatStore.setSubject(
  route.query.subject === chatSubjects.searchRequest
    ? chatSubjects.searchRequest
    : chatSubjects.listing,
)

const chatNoticeText = computed(() => {
  const noticeKey = chatStore.notice?.key
  if (!noticeKey) {
    return null
  }
  return t(`chat.notice.${noticeKey}`)
})
const noticeKind = computed(() => chatStore.notice?.kind || "info")
const isAwaitingExecutor = computed(() => chatStore.activeChat?.lockReason === chatLockReasons.searchRequestUnassigned)

const isMobile = ref(false)
const showChat = ref(false)

const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}
onMounted(() => {
  handleResize()
  window.addEventListener("resize", handleResize)
})
onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize)
  chatMessagesStore.setActiveChat(null)
  chatStore.clearActiveChat()

  if (cleanupPresence) {
    cleanupPresence()
    cleanupPresence = null
  }
})

watch(
  [() => isMobile.value, () => chatStore.activeChatId],
  ([mobile, activeChat]) => {
    if (mobile) {
      showChat.value = !!activeChat
    }
    else {
      showChat.value = false
    }
  },
  { immediate: true },
)

let cleanupPresence: (() => void) | null = null

watch(
  () => route.params.id,
  async (chatId) => {
    if (!route.path.startsWith("/chats") && !route.path.startsWith("/personal/chats")) {
      if (cleanupPresence) {
        cleanupPresence()
        cleanupPresence = null
      }

      return
    }

    const idNum = chatId ? Number(chatId) : null

    if (!idNum) {
      chatStore.clearActiveChat()
      chatMessagesStore.setActiveChat(null)
      if (isMobile.value) {
        showChat.value = false
      }
      if (cleanupPresence) {
        cleanupPresence()
        cleanupPresence = null
      }
      return
    }

    if (!chatStore.chats.length) {
      const res = await chatStore.fetchChats({ filters: chatStore.filters })
      if (res?.data) {
        chatStore.setChats(res.data)
      }
    }

    let found = chatStore.chats.find(c => c.id === idNum)

    if (!found) {
      const chat = await chatStore.fetchChatById(idNum)
      if (chat) {
        found = chat
        chatStore.setChats([chat])
      }
    }

    if (found) {
      if (found.chatType === chatTypes.searchRequest) {
        chatStore.setSubject(chatSubjects.searchRequest)
      }

      chatStore.setActiveChat(found)
      chatMessagesStore.setActiveChat(found.id)
      await fetchFirst()

      if (cleanupPresence) {
        cleanupPresence()
      }
      cleanupPresence = usePresenceChat(found.id)

      await chatStore.markChatAsReadAction(found.id)
    }

    if (isMobile.value) {
      showChat.value = true
    }
  },
  { immediate: true },
)

watch(
  () => [chatStore.chats, route.params.id],
  ([list, id]) => {
    const idNum = id != null ? Number(id) : null
    if (!idNum) {
      return
    }
    if (!Array.isArray(list) || list.length === 0) {
      return
    }
    if (chatStore.activeChatId === idNum && chatStore.activeChat) {
      return
    }
    const found = chatStore.chats.find(c => c.id === idNum)
    if (found) {
      chatStore.setActiveChat(found)
    }
  },
  { deep: true },
)

const handleChatSelected = (chatId?: number) => {
  if (isMobile.value) {
    showChat.value = true
  }
  router.push({
    params: { id: chatId ?? chatStore.activeChatId },
    query: route.query,
  })
}

const handleBack = () => {
  if (isMobile.value) {
    showChat.value = false
    chatStore.clearActiveChat()
    router.push({
      params: { id: undefined },
      query: route.query,
    })
  }
}
</script>

<style module>
.wrapper {
  @apply flex-1 min-h-0 flex border border-gray-200 rounded-lg overflow-hidden;
}
.leftCol {
  @apply w-1/3 border-r border-gray-200 flex flex-col;
}
.rightCol {
  @apply w-2/3 flex flex-col overflow-hidden;
}
@media (max-width: 767px) {
  .leftCol,
  .rightCol {
    @apply w-full border-none;
  }
}
</style>
