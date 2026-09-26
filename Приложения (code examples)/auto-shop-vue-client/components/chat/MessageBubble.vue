<template>
  <div :class="wrapperClass">
    <slot name="translation" />
    <slot name="files" />
    <div :class="$style.textContent">
      <slot />
    </div>

    <div
      v-if="createdAt"
      :class="$style.metaFooter"
    >
      <span :class="$style.time">{{ timeString }}</span>

      <div
        v-if="isSelf"
        :class="$style.readReceipts"
        :title="isRead ? t('chat.status_read') : t('chat.status_sent')"
      >
        <CheckMark
          :is-read="isRead"
          :size="16"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import CheckMark from "@/components/icon/CheckMark.vue"
import { useLocalizedDate } from "@/composables/useLocalizedDate"
import type { ChatRole } from "~/types/common/chat"
import { ChatRoles } from "~/constants/chat"

const props = defineProps<{
  role: ChatRole
  isSelf?: boolean
  createdAt?: string
  isRead?: boolean
}>()

const { t } = useI18n()
const { formatDate } = useLocalizedDate()

const timeString = computed(() => {
  if (!props.createdAt) {
    return ""
  }
  return formatDate(props.createdAt, "HH:mm") ?? ""
})

const wrapperClass = computed(() => {
  const base = "relative inline-block px-3 py-2 rounded-lg text-sm leading-relaxed text-left w-full break-words"
  const align = props.isSelf ? "ml-auto" : "mr-auto"

  let bg = "bg-[#f3f4f6] text-gray-900"

  if (props.isSelf || props.role === "self") {
    bg = "bg-[#f0f9ff] text-gray-900"
  }
  else if (props.role === ChatRoles.Admin) {
    bg = "bg-[#fef2f2] text-gray-900"
  }
  else if (props.role === ChatRoles.Logistic) {
    bg = "bg-[#fefce8] text-gray-900"
  }
  else if (props.role === ChatRoles.System) {
    bg = "bg-[#f3f4f6] text-gray-900"
  }

  return [base, bg, align].join(" ")
})
</script>

<style module>
.textContent {
  @apply inline;
}

.metaFooter {
  @apply float-right flex items-center justify-end gap-1 ml-3 mt-1.5 -mb-0.5;
  clear: both;
}

.time {
  @apply text-[11px] text-gray-500 opacity-80 leading-none;
}

.readReceipts {
  @apply flex items-center;
}
</style>
