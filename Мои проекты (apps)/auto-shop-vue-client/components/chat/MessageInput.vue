<template>
  <div :class="$style.wrapper">
    <div :class="$style.inputRow">
      <div :class="$style.mentions">
        <MentionChip
          v-if="mention"
          :mention="mention"
          @remove="removeMention"
        />
      </div>
      <MessageInputField
        v-model="message"
        :placeholder="inputPlaceholder"
        :disabled="!hasActiveChat || isChatClosed || isChatLocked"
        @keydown.enter.exact.prevent="sendMessage"
      />
      <MessageInputActions
        :disabled="!hasActiveChat || isChatClosed || isChatLocked"
        @send="sendMessage"
        @mention="setMention"
        @upload="handleUploadClick"
      />
    </div>
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      accept=".pdf,.doc,.docx,.jpg,.png,.webp,.mp4,.mov"
      @change="handleFileChange"
    >
    <div class="text-xs text-gray-500 pl-2 mt-1">
      {{ t('chat.notice.allowed_formats') }}
    </div>
    <div
      v-if="fileName"
      class="text-xs text-gray-800 font-bold pl-2 mt-1 flex items-center gap-2"
    >
      <span
        class="truncate"
        :title="fileName"
      >{{ fileName }}</span>
      <button
        class="text-red-500 hover:text-red-700 text-lg leading-none"
        @click="clearFile"
      >
        ×
      </button>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isDragging"
          class="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center"
        >
          <div class="pointer-events-none flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/60 rounded-3xl bg-white/10">
            <svg
              class="w-16 h-16 text-white mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span class="text-white text-2xl font-medium tracking-wide">
              {{ t('chat.drop_files_here') }}
            </span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue"
import { useI18n } from "vue-i18n"
import MessageInputField from "./MessageInputField.vue"
import MessageInputActions from "./MessageInputActions.vue"
import MentionChip from "./MentionChip.vue"
import type { OptionBase } from "~/types/form/optionType"
import { useChatMessages } from "@/composables/useChatMessages"
import { useApiUpload } from "@/composables/api/useApiUpload"
import { useChatStore } from "@/stores/chat"
import { useUserStore } from "@/stores/user"
import { ChatNoticeKinds, ChatNoticeKeys } from "@/constants/chat"

const { t } = useI18n()
const { send } = useChatMessages()
const { uploadDraftFile } = useApiUpload()
const chatStore = useChatStore()
const userStore = useUserStore()

const hasActiveChat = computed(() => !!chatStore.activeChatId)

const isChatClosed = computed(() => {
  if (!chatStore.activeChat) {
    return false
  }
  const currentUserId = userStore.currentUserId
  const myParticipant = chatStore.activeChat.participants?.find(p => p.participantId === currentUserId)
  return myParticipant?.status === "closed"
})

const isChatLocked = computed(() => !!chatStore.activeChat?.isLocked)

const inputPlaceholder = computed(() => {
  if (!hasActiveChat.value) {
    return t("chat.select_chat_first")
  }
  if (mention.value) {
    return ""
  }
  return t("chat.enter_message")
})

const message = ref("")
const mention = ref<OptionBase | null>(null)
const mentionValue = computed(() => mention.value?.value as string | undefined)
const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref<string | null>(null)
const uploadedFileId = ref<number | null>(null)

const isDragging = ref(false)
const dragCounter = ref(0)

async function sendMessage() {
  if (!hasActiveChat.value || isChatClosed.value || isChatLocked.value) {
    return
  }
  if ((!message.value.trim()) && !mentionValue.value && !uploadedFileId.value) {
    return
  }
  await send(message.value, mentionValue.value, uploadedFileId.value)
  message.value = ""
  mention.value = null
  fileName.value = null
  uploadedFileId.value = null
}

function setMention(option: OptionBase) {
  if (!hasActiveChat.value || isChatClosed.value || isChatLocked.value) {
    return
  }
  mention.value = option
}

function removeMention() {
  mention.value = null
}

function handleUploadClick() {
  if (!hasActiveChat.value || isChatClosed.value || isChatLocked.value) {
    return
  }
  fileInput.value?.click()
}

function clearFile() {
  fileName.value = null
  uploadedFileId.value = null
}

async function processFile(file: File) {
  if (isChatClosed.value || isChatLocked.value || !chatStore.activeChatId) {
    return
  }

  fileName.value = file.name
  const allowedExtensions = ["pdf", "doc", "docx", "jpg", "png", "webp", "mp4", "mov"]
  const ext = file.name.split(".").pop()?.toLowerCase()

  if (!ext || !allowedExtensions.includes(ext)) {
    chatStore.setNotice(ChatNoticeKeys.InvalidFile, ChatNoticeKinds.Error)
    fileName.value = null
    return
  }

  const maxKB = ["mp4", "mov"].includes(ext) ? 307200 : 20480
  const fileSizeKB = file.size / 1024

  if (fileSizeKB > maxKB) {
    chatStore.setNotice(ChatNoticeKeys.InvalidFile, ChatNoticeKinds.Error)
    fileName.value = null
    return
  }

  try {
    chatStore.setNotice(ChatNoticeKeys.UploadingFile, ChatNoticeKinds.Uploading)
    const response = await uploadDraftFile(file, "chat_attachment")
    const uploadedId = response.data?.id
    if (uploadedId) {
      uploadedFileId.value = uploadedId
      chatStore.setNotice(ChatNoticeKeys.FileUploaded, ChatNoticeKinds.Success)
    }
    else {
      chatStore.setNotice(ChatNoticeKeys.UploadFailed, ChatNoticeKinds.Error)
      fileName.value = null
    }
  }
  catch {
    chatStore.setNotice(ChatNoticeKeys.UploadFailed, ChatNoticeKinds.Error)
    fileName.value = null
  }
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) {
    return
  }
  await processFile(target.files[0])
  target.value = ""
}

function hasFiles(event: DragEvent) {
  return Array.from(event.dataTransfer?.types || []).includes("Files")
}

function onDragEnter(event: DragEvent) {
  if (!hasActiveChat.value || isChatClosed.value || isChatLocked.value || !hasFiles(event)) {
    return
  }
  event.preventDefault()
  dragCounter.value++
  isDragging.value = true
}

function onDragOver(event: DragEvent) {
  if (!hasActiveChat.value || isChatClosed.value || isChatLocked.value || !hasFiles(event)) {
    return
  }
  event.preventDefault()
}

function onDragLeave(event: DragEvent) {
  if (!hasActiveChat.value || isChatClosed.value || isChatLocked.value || !hasFiles(event)) {
    return
  }
  event.preventDefault()
  dragCounter.value--
  if (dragCounter.value === 0) {
    isDragging.value = false
  }
}

async function onDrop(event: DragEvent) {
  if (!hasActiveChat.value || isChatClosed.value || isChatLocked.value || !hasFiles(event)) {
    return
  }
  event.preventDefault()
  dragCounter.value = 0
  isDragging.value = false

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    await processFile(files[0])
  }
}

async function onPaste(event: ClipboardEvent) {
  if (!hasActiveChat.value || isChatClosed.value || isChatLocked.value) {
    return
  }

  const items = event.clipboardData?.items
  if (!items) {
    return
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind === "file") {
      const file = item.getAsFile()
      if (file) {
        event.preventDefault()
        await processFile(file)
        break
      }
    }
  }
}

onMounted(() => {
  window.addEventListener("dragenter", onDragEnter)
  window.addEventListener("dragover", onDragOver)
  window.addEventListener("dragleave", onDragLeave)
  window.addEventListener("drop", onDrop)
  window.addEventListener("paste", onPaste)
})

onBeforeUnmount(() => {
  window.removeEventListener("dragenter", onDragEnter)
  window.removeEventListener("dragover", onDragOver)
  window.removeEventListener("dragleave", onDragLeave)
  window.removeEventListener("drop", onDrop)
  window.removeEventListener("paste", onPaste)
})

watch(() => chatStore.activeChatId, () => {
  fileName.value = null
  uploadedFileId.value = null
})
</script>

<style module>
.wrapper {
  @apply flex flex-col p-3 border-t border-gray-200 bg-gray-50;
}
.inputRow {
  @apply flex flex-row items-start gap-2;
}
.mentions {
  @apply flex flex-col gap-1 pt-1;
}
</style>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
