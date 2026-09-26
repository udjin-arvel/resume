<template>
  <div :class="wrapperClass">
    <div
      v-if="showIcon"
      class="flex items-center gap-2 mb-2"
    >
      <component
        :is="icon"
        class="w-5 h-5"
        :class="iconClass"
      />
      <h2
        v-if="title"
        class="text-base font-bold"
      >
        {{ title }}
      </h2>
    </div>

    <h2
      v-else-if="title"
      class="text-base font-bold mb-2"
    >
      {{ title }}
    </h2>

    <div class="text-black">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { ExclamationTriangleIcon, InformationCircleIcon } from "@heroicons/vue/24/outline"

type Kind = "warning" | "info" | "success" | "danger"

const props = defineProps<{
  title?: string
  kind?: Kind
  showIcon?: boolean
}>()

const kind = computed<Kind>(() => props.kind ?? "warning")

const wrapperClass = computed(() => {
  switch (kind.value) {
    case "warning":
      return "rounded-xl p-6 mb-6 flex flex-col bg-yellow-100 border border-yellow-400"
    case "info":
      return "rounded-xl p-6 mb-6 flex flex-col bg-blue-100 border border-blue-400"
    case "success":
      return "rounded-xl p-6 mb-6 flex flex-col bg-green-100 border border-green-400"
    case "danger":
      return "rounded-xl p-6 mb-6 flex flex-col bg-red-100 border border-red-400"
    default:
      return "rounded-xl p-6 mb-6 flex flex-col bg-gray-100 border border-gray-300"
  }
})

const icon = computed(() => {
  if (kind.value === "warning" || kind.value === "danger") {
    return ExclamationTriangleIcon
  }
  return InformationCircleIcon
})

const iconClass = computed(() => {
  switch (kind.value) {
    case "warning":
      return "text-yellow-500"
    case "info":
      return "text-blue-500"
    case "success":
      return "text-green-600"
    case "danger":
      return "text-red-500"
    default:
      return "text-gray-500"
  }
})
</script>
