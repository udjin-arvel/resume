<template>
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    :class="$attrs.class"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14.6666 8H11.9999L9.99992 14L5.99992 2L3.99992 8H1.33325"
      :stroke="color"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = defineProps<{ color?: string }>()
const color = computed(() => props.color || "currentColor")
</script>
