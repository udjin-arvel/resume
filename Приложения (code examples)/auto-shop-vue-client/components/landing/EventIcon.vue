<template>
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <template v-if="kind === 'check'">
      <path
        d="M20 6 9 17l-5-5"
        stroke="#fff"
        stroke-width="2.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </template>
    <template v-else-if="kind === 'booking'">
      <path
        d="M5 4h11l3 3v13H5z"
        stroke="#fff"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="#fff"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </template>
    <template v-else-if="kind === 'video'">
      <path
        d="M4 6h13v12H4z"
        stroke="#fff"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <path
        d="M17 10l3-2v8l-3-2M9 9l4 3-4 3z"
        stroke="#fff"
        stroke-width="2"
        stroke-linejoin="round"
      />
    </template>
    <template v-else>
      <path
        d="M3 7h11v8H3zM14 10h4l3 3v2h-7z"
        stroke="#fff"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <circle
        cx="7"
        cy="17"
        r="2"
        fill="#fff"
      />
      <circle
        cx="17"
        cy="17"
        r="2"
        fill="#fff"
      />
    </template>
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  kind: "check" | "booking" | "video" | "truck"
}>()
</script>
