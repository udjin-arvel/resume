<template>
  <svg
    :class="iconClass"
    :width="size"
    :height="size"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="24"
      cy="24"
      r="24"
      fill="black"
      fill-opacity="0.6"
    />
    <polygon
      points="19,15 36,24 19,33"
      fill="white"
    />
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  size?: number | string
  iconClass?: string
}>()
</script>
