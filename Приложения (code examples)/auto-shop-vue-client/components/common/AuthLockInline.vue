<template>
  <div :class="[$style.wrapper, alignEnd ? $style.alignEnd : '']">
    <div :class="[$style.bar, $style[size]]" />
    <AuthLockIcon :icon-class="size === 'xs' ? $style.iconXs : $style.icon" />
  </div>
</template>

<script setup lang="ts">
import AuthLockIcon from "@/components/common/AuthLockIcon.vue"

withDefaults(defineProps<{
  size?: "xs" | "sm" | "md" | "lg"
  alignEnd?: boolean
}>(), {
  size: "sm",
  alignEnd: false,
})
</script>

<style module>
.wrapper {
  @apply flex items-center;
}
.alignEnd {
  @apply justify-end;
}
.bar {
  @apply bg-gray-200 rounded mr-2;
}
.xs {
  @apply h-4 w-24;
}
.sm {
  @apply h-4 w-20;
}
.md {
  @apply h-5 w-24;
}
.lg {
  @apply h-6 w-32;
}
.icon {
  @apply w-4 h-4 text-gray-400;
}
.iconXs {
  @apply w-3 h-3;
}
</style>
