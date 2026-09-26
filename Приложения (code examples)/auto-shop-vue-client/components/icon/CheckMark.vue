<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 16 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="inline-block shrink-0"
  >
    <polyline
      :points="isRead ? '1,5 4,8 9,2' : '3,5 6,8 11,2'"
      :stroke="isRead ? '#3b82f6' : '#9ca3af'"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <polyline
      v-if="isRead"
      points="5,5 8,8 13,2"
      stroke="#3b82f6"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  isRead?: boolean
  size?: number
}

withDefaults(defineProps<Props>(), {
  size: 16,
})
</script>
