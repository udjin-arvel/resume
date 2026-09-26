<template>
  <div :class="$style.mention">
    <span>@ {{ mention.name }}</span>
    <button
      type="button"
      :class="$style.removeBtn"
      @click="$emit('remove')"
    >
      ✕
    </button>
  </div>
</template>

<script setup lang="ts">
import type { OptionBase } from "~/types/form/optionType"

defineProps<{ mention: OptionBase }>()
defineEmits<{ (e: "remove"): void }>()
</script>

<style module>
.mention {
  @apply flex items-center justify-between px-2 py-1 rounded-full text-sm w-full;
  background-color: #ede9fe;
  color: #5b21b6;
}
.removeBtn {
  @apply ml-2 text-xs hover:text-purple-800 focus:outline-none;
  color: #5b21b6;
}
</style>
