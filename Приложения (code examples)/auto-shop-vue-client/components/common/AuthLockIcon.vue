<template>
  <span
    :class="$style.wrapper"
    @mouseenter="showHint = true"
    @mouseleave="showHint = false"
  >
    <LockClosedIcon :class="[$style.icon, iconClass]" />

    <transition name="fade">
      <span
        v-if="showHint"
        :class="[$style.hint, align === 'start' ? $style.hintStart : $style.hintCenter]"
      >
        {{ t('catalog.detail.locked_hint') }}
      </span>
    </transition>
  </span>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { LockClosedIcon } from "@heroicons/vue/24/solid"

withDefaults(defineProps<{
  iconClass?: string
  align?: "center" | "start"
}>(), {
  iconClass: "",
  align: "center",
})

const { t } = useI18n()
const showHint = ref(false)
</script>

<style module>
.wrapper {
  @apply relative inline-flex items-center;
}
.icon {
  @apply w-4 h-4 text-gray-400;
}
.hint {
  @apply absolute bottom-full mb-2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-lg z-50 pointer-events-none;
}
.hintCenter {
  @apply left-1/2 -translate-x-1/2;
}
.hintStart {
  @apply left-0;
}
</style>
