<template>
  <img
    v-if="src"
    :src="src"
    :alt="t('chat.avatar_alt')"
    :class="$style.avatar"
  >
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import type { ChatRole } from "@/types/common/chat"
import { ChatRoles, adminAvatar, systemAvatar, userAvatar } from "@/constants/chat"

const { t } = useI18n()

const props = defineProps<{
  role: ChatRole
  isSelf?: boolean
}>()

const src = computed<string | null>(() => {
  if (props.isSelf || props.role === ChatRoles.Self) {
    return null
  }
  if (props.role === ChatRoles.Admin) {
    return adminAvatar
  }
  if (props.role === ChatRoles.System) {
    return systemAvatar
  }
  return userAvatar
})
</script>

<style module>
.avatar {
  @apply w-8 h-8 rounded-full object-cover mt-0;
}
</style>
