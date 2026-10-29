<template>
  <Teleport to="body">
    <div
      v-if="userStore.isBuyer"
      :class="$style.root"
    >
      <Transition name="chat-window">
        <div
          v-if="isOpen"
          :class="$style.window"
          @dragenter.prevent="onDragEnter"
          @dragover.prevent
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
        >
          <Transition name="drag-overlay">
            <div
              v-if="isDragging"
              :class="$style.dragOverlay"
            >
              <ArrowUpTrayIcon class="w-10 h-10 text-gray-400 mb-3" />
              <span :class="$style.dragText">{{ t("online_chat.drop_file") }}</span>
            </div>
          </Transition>
          <div :class="$style.header">
            <span :class="$style.title">{{ t("online_chat.title") }}</span>
            <button
              :class="$style.closeBtn"
              @click="isOpen = false"
            >
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <div
            ref="messagesEl"
            :class="$style.messages"
            @scroll="onMessagesScroll"
          >
            <div :class="$style.spacer" />
            <div
              v-if="isLoadingMore"
              :class="$style.noticeCenter"
            >
              {{ t("common.loading") }}
            </div>
            <div
              v-if="isLoading"
              :class="$style.noticeCenter"
            >
              {{ t("common.loading") }}
            </div>
            <template v-else>
              <div
                v-for="msg in messages"
                :key="msg.id"
                :class="[$style.msgRow, isSelf(msg) ? $style.msgRowEnd : $style.msgRowStart]"
              >
                <div :class="$style.msgContent">
                  <MessageBubble
                    :role="msg.sender.role"
                    :is-self="isSelf(msg)"
                    :created-at="msg.createdAt"
                    :is-read="msg.isRead"
                  >
                    <template
                      v-if="msg.files && msg.files.length"
                      #files
                    >
                      <MessageFiles
                        :files="msg.files"
                        :name-limit="20"
                        :has-text="Boolean(msg.text && msg.text.trim())"
                      />
                    </template>
                    {{ msg.text }}
                  </MessageBubble>
                </div>
              </div>
              <Transition name="notice">
                <p
                  v-if="noticeVisible"
                  :class="$style.notice"
                >
                  {{ t("online_chat.notice") }}
                </p>
              </Transition>
              <div ref="bottomSentinel" />
            </template>
          </div>

          <div :class="$style.inputArea">
            <div :class="$style.inputColumn">
              <textarea
                v-model="message"
                rows="1"
                :placeholder="t('online_chat.placeholder')"
                :class="$style.textarea"
                @keydown.enter.exact.prevent="sendMessage"
              />
              <div
                v-if="fileName"
                :class="$style.fileRow"
              >
                <span
                  :class="$style.fileName"
                  :title="fileName"
                >{{ fileName }}</span>
                <button
                  :class="$style.fileClear"
                  @click="clearFile"
                >
                  ×
                </button>
              </div>
            </div>
            <div :class="$style.actions">
              <Button
                kind="unset"
                size="sm"
                :interactive="!isUploading"
                @click="triggerFileUpload"
              >
                <PaperClipIcon
                  :class="['w-5 h-5', isUploading ? 'text-gray-300' : 'text-gray-500']"
                />
              </Button>
              <Button
                kind="blue"
                size="sm"
                :interactive="!isSending"
                @click="sendMessage"
              >
                <ArrowTurnUpLeftIcon class="w-5 h-5 text-white rotate-90" />
              </Button>
            </div>
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept=".pdf,.doc,.docx,.jpg,.png,.webp,.mp4,.mov"
              @change="handleFileChange"
            >
          </div>
        </div>
      </Transition>

      <button
        :class="[$style.trigger, isOpen ? $style.triggerOpen : $style.triggerClosed]"
        @click="isOpen = !isOpen"
      >
        <ChatBubbleOvalLeftIcon class="w-6 h-6 text-white" />
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from "vue"
import { useI18n } from "vue-i18n"
import {
  XMarkIcon,
  PaperClipIcon,
  ArrowTurnUpLeftIcon,
  ArrowUpTrayIcon,
  ChatBubbleOvalLeftIcon,
} from "@heroicons/vue/24/outline"
import Button from "~/components/common/Button.vue"
import MessageBubble from "~/components/chat/MessageBubble.vue"
import MessageFiles from "~/components/chat/MessageFiles.vue"
import { useChatStore } from "~/stores/chat"
import { useChatMessagesActiveStore } from "~/stores/chatMessage"
import { useUserStore } from "~/stores/user"
import { useApiChat } from "~/composables/api/useApiChat"
import { useApiChatMessages } from "~/composables/api/useApiChatMessage"
import { useApiUpload } from "~/composables/api/useApiUpload"
import { chatTypes } from "~/constants/chat"
import type { ChatMessage } from "~/types/common/chat"

const { t } = useI18n()
const isOpen = ref(false)
const message = ref("")

const chatStore = useChatStore()
const messageStore = useChatMessagesActiveStore()
const userStore = useUserStore()
const { index: fetchChatList, getAdminUser } = useApiChat()
const { index: fetchMessages, store: storeMessage } = useApiChatMessages()
const { uploadDraftFile } = useApiUpload()

const PAGE_SIZE = 30

const adminChatId = ref<number | null>(null)
const isLoading = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(false)
const isSending = ref(false)
const messagesEl = ref<HTMLElement | null>(null)
const bottomSentinel = ref<HTMLElement | null>(null)

const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref<string | null>(null)
const uploadedFileId = ref<number | null>(null)
const isUploading = ref(false)

const isDragging = ref(false)
const dragCounter = ref(0)

const noticeVisible = ref(false)
const noticeShown = ref(false)
let noticeTimer: ReturnType<typeof setTimeout> | null = null

function showNoticeOnce() {
  if (noticeShown.value) {
    return
  }
  noticeShown.value = true
  noticeVisible.value = true
  noticeTimer = setTimeout(() => {
    noticeVisible.value = false
    noticeTimer = null
  }, 5000)
}

onUnmounted(() => {
  if (noticeTimer) {
    clearTimeout(noticeTimer)
  }
})

const messages = computed<ChatMessage[]>(() =>
  adminChatId.value ? (messageStore.byChat[adminChatId.value] ?? []) : [],
)

function isSelf(msg: ChatMessage): boolean {
  return msg.sender?.participantId === userStore.currentUserId
}

async function scrollToBottom() {
  await nextTick()
  bottomSentinel.value?.scrollIntoView({ block: "end" })
}

function triggerFileUpload() {
  if (isUploading.value) {
    return
  }
  fileInput.value?.click()
}

function clearFile() {
  fileName.value = null
  uploadedFileId.value = null
  if (fileInput.value) {
    fileInput.value.value = ""
  }
}

async function processFile(file: File) {
  if (!adminChatId.value) {
    return
  }
  fileName.value = file.name
  isUploading.value = true
  try {
    const res = await uploadDraftFile(file, "chat_attachment")
    const id = res?.data?.id
    if (id) {
      uploadedFileId.value = id
    }
    else {
      clearFile()
    }
  }
  catch {
    clearFile()
  }
  finally {
    isUploading.value = false
  }
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) {
    return
  }
  target.value = ""
  await processFile(file)
}

function hasFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files")
}

function onDragEnter(event: DragEvent) {
  if (!hasFiles(event)) {
    return
  }
  dragCounter.value++
  isDragging.value = true
}

function onDragLeave(event: DragEvent) {
  if (!hasFiles(event)) {
    return
  }
  dragCounter.value--
  if (dragCounter.value === 0) {
    isDragging.value = false
  }
}

async function onDrop(event: DragEvent) {
  if (!hasFiles(event)) {
    return
  }
  dragCounter.value = 0
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    await processFile(file)
  }
}

async function loadAdminChat() {
  if (isLoading.value) {
    return
  }
  isLoading.value = true
  try {
    let adminChat = chatStore.chats.find(
      c => c.chatType === chatTypes.sellerAdmin || c.chatType === chatTypes.buyerAdmin,
    )

    if (!adminChat) {
      const res = await fetchChatList({}, { camelize: true })
      if (res?.data) {
        chatStore.setChats(res.data)
      }
      adminChat = chatStore.chats.find(
        c => c.chatType === chatTypes.sellerAdmin || c.chatType === chatTypes.buyerAdmin,
      )
    }

    if (!adminChat && userStore.currentUserId) {
      const res = await getAdminUser({ userId: userStore.currentUserId })
      const chat = res?.data
      if (chat) {
        chatStore.setChats([chat])
        adminChat = chat
      }
    }

    if (!adminChat?.id) {
      return
    }

    adminChatId.value = adminChat.id
    messageStore.clearChat(adminChat.id)

    const res = await fetchMessages(adminChat.id, { offset: 0, limit: PAGE_SIZE })
    if (res?.data) {
      messageStore.setChatMessages(adminChat.id, res.data)
      messageStore.setChatMinIdByItems(adminChat.id, res.data)
      hasMore.value = (res.meta?.total ?? 0) > PAGE_SIZE
    }
  }
  finally {
    isLoading.value = false
  }
  await scrollToBottom()
}

async function loadMoreMessages() {
  if (!adminChatId.value || isLoadingMore.value || !hasMore.value) {
    return
  }
  const minId = messageStore.minIdByChat[adminChatId.value]
  if (!minId) {
    return
  }

  isLoadingMore.value = true
  const oldScrollHeight = messagesEl.value?.scrollHeight ?? 0

  try {
    const res = await fetchMessages(adminChatId.value, { offset: 0, limit: PAGE_SIZE, minId })
    const items = res?.data ?? []
    if (items.length) {
      messageStore.appendChatMessages(adminChatId.value, items)
      messageStore.setChatMinIdByItems(adminChatId.value, items)
      hasMore.value = items.length >= PAGE_SIZE
      await nextTick()
      if (messagesEl.value) {
        messagesEl.value.scrollTop = messagesEl.value.scrollHeight - oldScrollHeight
      }
    }
    else {
      hasMore.value = false
    }
  }
  finally {
    isLoadingMore.value = false
  }
}

function onMessagesScroll() {
  if (messagesEl.value && messagesEl.value.scrollTop <= 0 && hasMore.value && !isLoadingMore.value) {
    loadMoreMessages()
  }
}

async function sendMessage() {
  const text = message.value.trim()
  if (!adminChatId.value || (!text && !uploadedFileId.value) || isSending.value) {
    return
  }

  message.value = ""
  const fileId = uploadedFileId.value
  clearFile()

  isSending.value = true
  try {
    const payload: { text: string, files?: number[] } = { text }
    if (fileId) {
      payload.files = [fileId]
    }

    const res = await storeMessage(adminChatId.value, payload)
    const msg = res?.data
    if (msg) {
      messageStore.prependChatMessage(adminChatId.value, msg)
      chatStore.updateChatLastMessage(adminChatId.value, msg, false)
      await scrollToBottom()
    }
  }
  finally {
    isSending.value = false
  }
}

function markAdminRead() {
  if (!adminChatId.value) {
    return
  }
  chatStore.markChatReadLocal(adminChatId.value)
  void chatStore.markChatAsReadAction(adminChatId.value)
}

watch(isOpen, async (open) => {
  if (!open) {
    return
  }
  showNoticeOnce()
  if (!adminChatId.value) {
    await loadAdminChat()
  }
  else {
    await scrollToBottom()
  }
  markAdminRead()
}, { flush: "post" })

watch(() => messages.value.length, (newLen, oldLen) => {
  if (!isLoadingMore.value) {
    scrollToBottom()
  }

  if (isLoadingMore.value || !isOpen.value || newLen <= (oldLen ?? 0)) {
    return
  }
  const last = messages.value[messages.value.length - 1]
  if (last && !isSelf(last)) {
    markAdminRead()
  }
}, { flush: "post" })
</script>

<style module>
.root {
  @apply fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3;
}

.window {
  @apply relative w-80 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col overflow-hidden;
  height: 480px;
}

.dragOverlay {
  @apply absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm;
  border: 2px dashed #d1d5db;
  border-radius: inherit;
}

.dragText {
  @apply text-sm font-medium text-gray-500;
}

.header {
  @apply flex items-center justify-between px-4 py-3.5 border-b border-gray-100 flex-none;
}

.title {
  @apply text-sm font-medium text-gray-900;
}

.closeBtn {
  @apply text-gray-400 hover:text-gray-600 transition-colors;
}

.messages {
  @apply flex-1 overflow-y-auto px-4 py-4 flex flex-col;
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
}

.messages::-webkit-scrollbar {
  width: 6px;
}

.messages::-webkit-scrollbar-track {
  background: transparent;
}

.messages::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 3px;
}

.spacer {
  flex: 1;
}

.notice {
  @apply text-xs text-gray-400 text-center leading-5 border-t border-gray-200 pt-2 mt-1;
}

.noticeCenter {
  @apply text-xs text-gray-400 text-center;
}

.msgRow {
  @apply flex mb-2;
}

.msgRowEnd {
  @apply justify-end;
}

.msgRowStart {
  @apply justify-start;
}

.msgContent {
  @apply max-w-[80%];
}

.inputArea {
  @apply flex flex-row items-start gap-2 p-3 border-t border-gray-200 bg-gray-50 flex-none;
}

.inputColumn {
  @apply flex flex-col flex-1 min-w-0;
}

.textarea {
  @apply pt-0 pl-0 w-full bg-transparent border-none resize-none text-sm;
  min-height: 44px;
  line-height: 1.5;
  outline: none;
  box-shadow: none;
}

.textarea:focus {
  outline: none;
  box-shadow: none;
}

.fileRow {
  @apply flex items-center gap-1 mt-1;
}

.fileName {
  @apply text-xs text-gray-600 truncate max-w-[160px] font-medium;
}

.fileClear {
  @apply text-red-400 hover:text-red-600 text-base leading-none flex-shrink-0;
}

.actions {
  @apply flex items-center gap-2;
}

.trigger {
  @apply w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors;
}

.triggerClosed {
  @apply bg-red-500 hover:bg-red-600;
}

.triggerOpen {
  @apply bg-black hover:bg-gray-800;
}
</style>

<style scoped>
.chat-window-enter-active,
.chat-window-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.chat-window-enter-from,
.chat-window-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}

.drag-overlay-enter-active,
.drag-overlay-leave-active {
  transition: opacity 0.15s ease;
}

.drag-overlay-enter-from,
.drag-overlay-leave-to {
  opacity: 0;
}

.notice-enter-active,
.notice-leave-active {
  transition: opacity 0.4s ease;
}

.notice-enter-from,
.notice-leave-to {
  opacity: 0;
}
</style>
