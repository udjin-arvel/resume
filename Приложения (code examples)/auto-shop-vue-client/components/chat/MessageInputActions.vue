<template>
  <div :class="$style.actions">
    <MentionAction
      v-if="!isAdminChat"
      @mention="$emit('mention', $event)"
    />

    <Button
      kind="unset"
      size="sm"
      @click="$emit('upload')"
    >
      <PaperClipIcon :class="$style.icon" />
    </Button>

    <Button
      kind="blue"
      size="sm"
      @click="$emit('send')"
    >
      <ArrowTurnUpLeftIcon class="w-5 h-5 text-white rotate-90" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { PaperClipIcon, ArrowTurnUpLeftIcon } from "@heroicons/vue/24/outline"
import MentionAction from "./MentionAction.vue"
import Button from "~/components/common/Button.vue"
import { useChatStore } from "@/stores/chat"
import { chatTypes } from "@/constants/chat"

defineEmits(["send", "mention", "upload"])

const chatStore = useChatStore()

const isAdminChat = computed(() => {
  const type = chatStore.activeChat?.chatType
  return type === chatTypes.sellerAdmin || type === chatTypes.buyerAdmin
})
</script>

<style module>
.actions {
  @apply flex items-center gap-2;
}
.icon {
  @apply w-5 h-5 text-gray-500;
}
</style>
