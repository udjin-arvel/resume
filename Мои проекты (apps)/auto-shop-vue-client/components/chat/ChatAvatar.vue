<template>
  <div>
    <img
      v-if="type === 'car'"
      :src="src || carStubImage"
      :alt="t('chat.alt.car_avatar')"
      :class="$style.carAvatar"
    >

    <img
      v-else-if="type === 'personal' && kind === 'user'"
      :src="userAvatar"
      :alt="t('chat.alt.user_avatar')"
      :class="$style.personalAvatar"
    >
    <img
      v-else-if="type === 'personal' && kind === 'admin'"
      :src="adminAvatar"
      :alt="t('chat.alt.admin_avatar')"
      :class="$style.personalAvatar"
    >

    <div
      v-else-if="type === 'request'"
      :class="$style.requestAvatar"
      :title="t('chat.alt.request_avatar')"
    >
      <DocumentMagnifyingGlassIcon :class="$style.requestIcon" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { DocumentMagnifyingGlassIcon } from "@heroicons/vue/24/outline"
import { carStubImage, userAvatar, adminAvatar } from "~/constants/chat"

const { t } = useI18n()

defineProps<{
  type: "car" | "personal" | "request"
  kind?: "user" | "admin"
  src?: string
}>()
</script>

<style module>
.carAvatar {
  @apply w-12 h-12 object-cover rounded-md;
}
.personalAvatar {
  @apply w-12 h-12 object-cover rounded-full;
}
.requestAvatar {
  @apply w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center;
}
.requestIcon {
  @apply w-6 h-6 text-gray-500;
}
</style>
