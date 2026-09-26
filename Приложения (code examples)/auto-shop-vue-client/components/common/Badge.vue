<template>
  <span
    v-if="shouldShow"
    :class="[$style.base, $style[kind]]"
  >
    {{ value }}
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue"

type BadgeKind = "red" | "gray" | "gray-active" | "blue" | "green"

const props = withDefaults(defineProps<{
  value?: number | string
  kind?: BadgeKind
}>(), {
  kind: "red",
})

const shouldShow = computed(() => {
  if (typeof props.value === "number") {
    return props.value > 0
  }
  return !!props.value
})
</script>

<style module>
.base {
  @apply inline-flex items-center justify-center rounded-full flex-shrink-0 font-bold leading-none text-center;
}

.red {
  @apply bg-red-600 text-white;
  @apply h-4 min-w-[16px] px-1;
  @apply text-[10px];
}

.gray {
  @apply bg-gray-200 text-gray-600;
  @apply px-2 py-1 min-w-[24px];
  @apply text-xs;
}

.gray-active {
  @apply bg-gray-400 text-gray-800;
  @apply px-2 py-1 min-w-[24px];
  @apply text-xs;
}

.blue {
  @apply bg-blue-100 text-blue-700;
  @apply px-2 py-1 min-w-[24px];
  @apply text-xs;
}

.green {
  @apply bg-green-100 text-green-700;
  @apply px-2 py-1 min-w-[24px];
  @apply text-xs;
}
</style>
