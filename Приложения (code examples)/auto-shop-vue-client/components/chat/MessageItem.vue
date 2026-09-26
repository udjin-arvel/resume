<template>
  <div :class="$style.wrapper">
    <div :class="[$style.messageRow, isSelfComputed ? $style.justifyEnd : $style.justifyStart]">
      <div :class="[$style.messageInner, isSelfComputed ? $style.selfDirection : $style.otherDirection]">
        <template v-if="!isSelfComputed">
          <MessageAvatar
            :role="message.sender.role"
            :is-self="isSelfComputed"
          />
        </template>

        <div :class="$style.contentWrapper">
          <div :class="[$style.header, isSelfComputed ? $style.textRight : $style.textLeft]">
            <MessageHeader
              :author="message.sender.name"
              :role="message.sender.role"
              :is-self="isSelfComputed"
            />
          </div>

          <div :class="[$style.msgContainer, 'group inline-block w-full relative']">
            <div
              v-if="hasText"
              :class="[$style.menuWrapper, isSelfComputed ? $style.menuSelf : $style.menuOther]"
            >
              <Button
                size="sm"
                :kind="buttonKind"
                :disabled="isTranslateButtonDisabled"
                :title="buttonTitle"
                @click="handleToggleOriginal"
              >
                <template v-if="isLoading || isProcessing">
                  <Spinner />
                </template>
                <template v-else>
                  <LanguageIcon class="w-4 h-4" />
                </template>
              </Button>
            </div>

            <MessageBubble
              :role="message.sender.role"
              :is-self="isSelfComputed"
              :created-at="message.createdAt"
              :is-read="message.isRead"
            >
              <template #translation>
                <MessageTranslation
                  v-if="showTopBlock"
                  :text="topBlockText"
                  :label="topBlockLabel"
                  @copy="copyOriginal"
                />
              </template>

              <template #files>
                <MessageFiles
                  v-if="message.files && message.files.length"
                  :files="message.files"
                  :name-limit="15"
                  :has-text="Boolean(message.text && message.text.trim().length)"
                />
              </template>

              <template v-if="mentionLabels.length">
                <span
                  v-for="(m, idx) in mentionLabels"
                  :key="idx"
                  :class="$style.mentionBold"
                >
                  @{{ m }}
                </span>
                <span>&nbsp;</span>
              </template>

              <LinkifiedText
                :text="displayedText"
                :allow-internal="isSystemMessage"
                link-class="text-blue-600 hover:underline break-all"
              />
            </MessageBubble>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LanguageIcon } from "@heroicons/vue/24/outline"
import MessageAvatar from "./MessageAvatar.vue"
import MessageHeader from "./MessageHeader.vue"
import MessageFiles from "./MessageFiles.vue"
import MessageBubble from "./MessageBubble.vue"
import MessageTranslation from "./MessageTranslation.vue"
import LinkifiedText from "./LinkifiedText.vue"
import Button from "@/components/common/Button.vue"
import Spinner from "@/components/icon/Spinner.vue"
import { useChatStore } from "~/stores/chat"
import type { ChatMessage, MentionType } from "@/types/common/chat"
import { mentionAdmin, mentionBuyer, mentionSeller, USER_ID_KEY, USER_ROLE_KEY, ChatRoles, mentionLogistic, ChatRoleMap } from "@/constants/chat"
import { useChatMessagesActiveStore } from "~/stores/chatMessage"
import { useNotificationsStore } from "~/stores/notifications"
import { russian, chinese } from "~/constants/lang"

const { start, finish, isLoading } = useLoadingIndicator()
const { t, locale } = useI18n()
const chatStore = useChatStore()
const notifications = useNotificationsStore()

const props = defineProps<{ message: ChatMessage }>()

type ReadonlyRef<T> = { readonly value: T }
const injectedUserId = inject<ReadonlyRef<number | null>>(USER_ID_KEY, { value: null } as ReadonlyRef<number | null>)
const injectedUserRole = inject<ReadonlyRef<string>>(USER_ROLE_KEY, { value: "" } as ReadonlyRef<string>)

const isSelfComputed = computed(() => {
  const currentUserId = injectedUserId?.value ?? null
  const currentUserRole = injectedUserRole?.value ?? ""
  const messageSender = props.message.sender

  if (currentUserId === null) {
    return false
  }
  if (messageSender.participantId && messageSender.participantId === currentUserId) {
    return true
  }
  if (currentUserRole === ChatRoles.Admin && messageSender.role === ChatRoles.Admin) {
    return true
  }
  if (currentUserRole === ChatRoles.Logistic && messageSender.role === ChatRoles.Logistic) {
    return true
  }

  return messageSender.participantId === currentUserId
})

const isProcessing = computed(() => props.message.translateStatus === "processing")
const isTranslated = computed(() => props.message.translateStatus === "done")
const isError = computed(() => props.message.translateStatus === "error")
const hasText = computed(() => Boolean(props.message.text?.trim().length))
const isSystemMessage = computed(() => props.message.sender.role === ChatRoles.System)

const originalVisible = ref(false)

const originalText = computed(() => {
  if (props.message.originalLocale === russian) {
    return props.message.textRu || props.message.text
  }
  if (props.message.originalLocale === chinese) {
    return props.message.textZh || props.message.text
  }
  return props.message.text
})

const translatedText = computed(() => {
  if (props.message.originalLocale === russian) {
    return props.message.textZh || ""
  }
  if (props.message.originalLocale === chinese) {
    return props.message.textRu || ""
  }
  return ""
})

const hasTranslation = computed(() => {
  return isTranslated.value && !!translatedText.value
})

const displayedText = computed(() => {
  if (!hasTranslation.value) {
    return props.message.text
  }
  if (!originalVisible.value) {
    if (locale.value === props.message.originalLocale) {
      return originalText.value
    }
    return translatedText.value
  }
  return translatedText.value
})

const topBlockText = computed(() => {
  return originalText.value
})

const topBlockLabel = computed(() => {
  return t("chat.original_message")
})

const showTopBlock = computed(() => {
  return originalVisible.value && hasTranslation.value
})

const buttonKind = computed(() => {
  if (isError.value) {
    return "primaryOutline"
  }
  if (originalVisible.value) {
    return "violet"
  }
  return "lightgrey"
})

const isTranslateButtonDisabled = computed(() =>
  isLoading.value
  || isProcessing.value
  || !hasText.value,
)

const buttonTitle = computed(() => {
  if (isError.value) {
    return t("chat.translation_failed")
  }
  if (isProcessing.value) {
    return t("chat.translation_processing")
  }
  if (hasTranslation.value) {
    return originalVisible.value ? t("chat.hide_original") : t("chat.show_original")
  }
  return t("chat.translate")
})

const { translate: translateMessage } = useApiChatMessages()
const chatMessagesActive = useChatMessagesActiveStore()

const handleToggleOriginal = async () => {
  if (hasTranslation.value) {
    originalVisible.value = !originalVisible.value
    return
  }

  if (isProcessing.value) {
    return
  }

  start()
  try {
    const { data } = await translateMessage(props.message.id, { camelize: true })
    if (data) {
      chatMessagesActive.updateMessage(data)
    }
  }
  catch {
    chatMessagesActive.updateMessage({
      ...props.message,
      translateStatus: "error",
    })
  }
  finally {
    finish()
  }
}

const copyOriginal = async () => {
  const textToCopy = originalText.value
  if (!textToCopy) {
    return
  }

  try {
    await navigator.clipboard.writeText(textToCopy)
    notifications.successNotify(t("chat.copied"))
  }
  catch {
    notifications.errorNotify(t("chat.copy_error"))
  }
}

type NonNullMention = Exclude<MentionType, null>
const roleMap: Record<string, string | undefined> = ChatRoleMap as unknown as Record<string, string | undefined>

const mentionLabels = computed(() => {
  const mentions = Array.isArray(props.message.mentions) ? props.message.mentions : []
  const chat = chatStore.activeChat

  return mentions
    .filter((v): v is NonNullMention => v !== null)
    .map((v) => {
      if (v === mentionLogistic) {
        return t("chat.logistic")
      }
      if (v === mentionAdmin) {
        return t("chat.admin")
      }

      if (chat?.participants) {
        const participant = chat.participants.find((p) => {
          return p.role === v || roleMap[p.role] === v
        })

        if (participant?.name) {
          return participant.name
        }
      }

      if (v === mentionSeller) {
        return t("chat.seller")
      }
      if (v === mentionBuyer) {
        return t("chat.buyer")
      }

      return v
    })
})
</script>

<style module>
.wrapper {
  @apply mb-3;
}

.messageRow {
  @apply flex items-start gap-2;
}

.justifyEnd {
  @apply justify-end;
}

.justifyStart {
  @apply justify-start;
}

.messageInner {
  @apply flex items-start gap-2 w-full;
}

.selfDirection {
  @apply flex-row-reverse;
}

.otherDirection {
  @apply flex-row;
}

.contentWrapper {
  @apply max-w-[80%];
}

.header {
  @apply text-xs text-gray-500 mb-1;
}

.textLeft {
  @apply text-left;
}

.textRight {
  @apply text-right;
}

.msgContainer {
  position: relative;
  z-index: 0;
}

.menuWrapper {
  @apply absolute top-0 flex items-start;
}

.menuSelf {
  @apply left-0 -translate-x-full pr-1;
}

.menuOther {
  @apply right-0 translate-x-full pl-1;
}

.mentionBold {
  @apply font-bold;
}
</style>
