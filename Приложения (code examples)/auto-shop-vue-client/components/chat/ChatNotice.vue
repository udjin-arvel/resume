<template>
  <transition name="fade">
    <div
      v-if="visible && notice"
      :class="[$style.notice, kindClass]"
    >
      {{ notice }}
      <slot />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import type { ChatNoticeKind } from "@/types/common/chat"

const props = defineProps<{
  notice?: string | null
  kind?: ChatNoticeKind
}>()

const visible = ref(!!props.notice)

const persistentKinds: ChatNoticeKind[] = ["info", "uploading", "warning"]

watch(
  () => props.notice,
  (newNotice) => {
    if (newNotice) {
      visible.value = true

      if (props.kind && !persistentKinds.includes(props.kind)) {
        setTimeout(() => {
          if (props.notice === newNotice) {
            visible.value = false
          }
        }, 3000)
      }
    }
    else {
      visible.value = false
    }
  },
  { immediate: true },
)

const kindClass = computed(() => {
  switch (props.kind) {
    case "error":
      return "bg-red-100 text-red-800 border-red-200"
    case "warning":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "success":
      return "bg-green-100 text-green-800 border-green-200"
    case "uploading":
      return "bg-blue-100 text-blue-800 border-blue-200"
    default:
      return "bg-transparent text-gray-500 border-t border-gray-200 border-b-0"
  }
})
</script>

<style module>
.notice {
  @apply p-3 text-sm text-center border-b;
  white-space: pre-line;
}
</style>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
