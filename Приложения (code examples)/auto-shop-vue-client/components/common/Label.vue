<template>
  <div
    :class="[
      $style.label,
      (iconLeft || iconRight || $slots['icon-left'] || $slots['icon-right']) ? $style.withIcon : '',
      kind === 'blue' ? $style.blue : '',
      kind === 'darkBlue' ? $style.darkBlue : '',
      kind === 'yellow' ? $style.yellow : '',
      kind === 'gray' ? $style.gray : '',
      kind === 'darkgray' ? $style.darkgray : '',
      kind === 'black' ? $style.black : '',
      kind === 'green' ? $style.green : '',
      kind === 'red' ? $style.red : '',
      kind === 'darkRed' ? $style.darkRed : '',
      kind === 'violet' ? $style.violet : '',
      size === 'sm' ? $style.sm : $style.md,
    ]"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <slot name="icon-left">
      <component
        :is="iconLeft"
        v-if="iconLeft"
        :class="[$style.icon, $style.iconLeft, iconBold ? $style.iconBold : '']"
      />
    </slot>
    <span v-if="text">{{ text }}</span>
    <Badge
      v-if="badge"
      :value="badge"
      :class="$style.badgeSpacing"
    />
    <slot />
    <slot name="icon-right">
      <component
        :is="iconRight"
        v-if="iconRight"
        :class="[$style.icon, $style.iconRight, iconBold ? $style.iconBold : '']"
      />
    </slot>
    <transition name="fade">
      <div
        v-if="showTooltip && tooltipText"
        :class="$style.tooltip"
        :style="tooltipStyles"
      >
        {{ t(tooltipText) }}
        <span :class="$style.tooltipArrow" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue"
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import Badge from "@/components/common/Badge.vue"

interface Props {
  text?: string
  kind?: "blue" | "darkBlue" | "yellow" | "gray" | "green" | "red" | "darkRed" | "violet" | "darkgray" | "black"
  size?: "sm" | "md"
  iconLeft?: Component
  iconRight?: Component
  iconBold?: boolean
  badge?: number | string
  tooltipText?: string
  tooltipStyles?: Record<string, string> | string
}

withDefaults(defineProps<Props>(), {
  kind: "gray",
  size: "md",
  tooltipText: undefined,
  tooltipStyles: undefined,
})

const { t } = useI18n()
const showTooltip = ref(false)
</script>

<style module>
.label {
  @apply text-nowrap relative inline-block rounded-2xl font-medium whitespace-normal max-w-full;
}

.withIcon {
  @apply inline-flex items-center flex-wrap;
}
.md {
  @apply px-3 py-1 text-xs;
}

.sm {
  @apply px-2 py-0.5 text-xs;
}

.blue {
  @apply text-blue-500 bg-blue-100;
}

.darkBlue {
  @apply text-blue-500 bg-blue-200;
}

.yellow {
  @apply text-yellow bg-yellow-200;
}

.gray {
  @apply text-black bg-grey-400;
}

.green {
  @apply text-black bg-green;
}

.red {
  @apply text-primary bg-primary-100;
}

.darkRed {
  @apply bg-primary text-white;
}

.violet {
  background-color: #ede9fe;
  color: #5b21b6;
}

.black {
  @apply text-white bg-black;
}

.icon {
  @apply w-4 h-4 flex-shrink-0;
}

.iconBold {
  stroke-width: 2.5;
}

.iconLeft {
  @apply mr-1.5;
}

.iconRight {
  @apply ml-1.5;
}

.sm .icon {
  @apply w-3.5 h-3.5;
}

.sm .iconLeft {
  @apply mr-1;
}

.sm .iconRight {
  @apply ml-1;
}

.badgeSpacing {
  @apply ml-2;
}

.sm .badgeSpacing {
  @apply ml-1.5;
}

.darkgray {
  @apply text-white bg-gray-500;
}

.tooltip {
  @apply absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded bg-black text-white text-xs font-medium shadow-lg z-50 whitespace-nowrap pointer-events-none;
}

.tooltipArrow {
  content: '';
  @apply absolute left-1/2 top-full;
  transform: translateX(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: transparent;
  border-top-color: #000;
  width: 0;
  height: 0;
  display: block;
}
</style>
