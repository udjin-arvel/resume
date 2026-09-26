<template>
  <Popover class="relative">
    <PopoverButton as="template">
      <Button
        kind="unset"
        size="sm"
        :disabled="disabled"
      >
        <AtSymbolIcon :class="$style.icon" />
      </Button>
    </PopoverButton>

    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <PopoverPanel
        v-slot="{ close }"
        :class="$style.popoverPanel"
      >
        <div :class="$style.note">
          {{ t('chat.message_visible_to_all') }}
        </div>

        <div :class="$style.menu">
          <div :class="$style.sectionTitle">
            {{ t('chat.message') }}
          </div>
          <ul>
            <li
              v-for="opt in dynamicMentionOptions"
              :key="opt.id"
            >
              <button
                :class="$style.option"
                @click="selectMention(opt, close)"
              >
                @ {{ opt.name }}
              </button>
            </li>
          </ul>
        </div>
      </PopoverPanel>
    </transition>
  </Popover>
</template>

<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/vue"
import { AtSymbolIcon } from "@heroicons/vue/24/outline"
import { useI18n } from "vue-i18n"
import { inject, computed, type ComputedRef } from "vue"
import Button from "~/components/common/Button.vue"
import type { OptionBase } from "~/types/form/optionType"
import {
  USER_ROLE_KEY,
  ChatRoles,
  ChatRoleMap,
  mentionAdmin,
  mentionSeller,
  mentionBuyer,
  mentionLogistic,
  ParticipantStatus,
} from "~/constants/chat"
import type { MentionType, ChatRole } from "@/types/common/chat"
import { useChatStore } from "~/stores/chat"

const { t } = useI18n()
const chatStore = useChatStore()
const userRole = inject<ComputedRef<ChatRole>>(USER_ROLE_KEY)!

defineProps<{
  disabled?: boolean
}>()

type MentionOption = OptionBase & { value: MentionType }
const emit = defineEmits<{ (e: "mention", value: MentionOption): void }>()

const MENTION_CONFIG: Record<string, { value: Exclude<MentionType, null>, labelKey: string }> = {
  [ChatRoles.Logistic]: { value: mentionLogistic, labelKey: "chat.logistic" },
  [ChatRoles.Seller]: { value: mentionSeller, labelKey: "chat.seller" },
  [ChatRoles.Buyer]: { value: mentionBuyer, labelKey: "chat.buyer" },
}

const roleMap: Record<string, string | undefined> = ChatRoleMap as unknown as Record<string, string | undefined>

const dynamicMentionOptions = computed<MentionOption[]>(() => {
  const activeChat = chatStore.activeChat
  if (!activeChat) {
    return []
  }

  const options: MentionOption[] = []

  if (userRole.value !== ChatRoles.Admin) {
    options.push({
      id: 1,
      name: t("chat.admin"),
      value: mentionAdmin,
      disabled: false,
    })
  }

  const participants = activeChat.participants || []

  participants.forEach((p, index) => {
    const normalizedRole = roleMap[p.role] || p.role

    if (normalizedRole === userRole.value) {
      return
    }
    if (p.status === ParticipantStatus.Closed) {
      return
    }

    const config = MENTION_CONFIG[normalizedRole]

    if (config) {
      const exists = options.find(o => o.value === config.value)

      if (!exists) {
        options.push({
          id: 10 + index,
          name: t(config.labelKey),
          value: config.value,
          disabled: false,
        })
      }
    }
  })

  return options
})

function selectMention(opt: MentionOption, close: () => void) {
  emit("mention", opt)
  close()
}
</script>

<style module>
.icon {
  @apply w-5 h-5 text-gray-500;
}

.popoverPanel {
  @apply absolute left-0 bottom-full mb-2 z-50 w-48 rounded-lg shadow-lg ring-1 ring-gray-900/5 overflow-hidden;
}

.note {
  @apply bg-gray-100 text-gray-500 text-xs px-3 py-2;
}

.menu {
  @apply bg-white p-2;
}

.sectionTitle {
  @apply text-xs text-gray-400 mb-1 px-1;
}

.option {
  @apply block w-full text-left px-1 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md;
}
</style>
