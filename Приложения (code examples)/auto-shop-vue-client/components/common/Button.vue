<template>
  <button
    :id="id"
    :disabled="disabled"
    :class="[
      $style.button,
      interactive ? $style.interactive : $style.static,
      kind === 'white' ? $style.white : '',
      kind === 'white' && interactive ? $style.whiteHover : '',
      kind === 'primary' ? $style.primary : '',
      kind === 'primaryOutline' ? $style.primaryOutline : '',
      kind === 'redOutline' ? $style.redOutline : '',
      kind === 'black' ? $style.black : '',
      kind === 'blue' ? $style.blue : '',
      kind === 'grey' ? $style.grey : '',
      kind === 'yellow' ? $style.yellow : '',
      kind === 'transparent' ? $style.transparent : '',
      kind === 'lightgrey' ? $style.lightgrey : '',
      kind === 'green' ? $style.green : '',
      kind === 'violet' ? $style.violet : '',
      kind === 'successOutline' ? $style.successOutline : '',
      kind === 'link' ? $style.link : '',
      size === 'xs' ? $style.xs : '',
      size === 'sm' ? $style.sm : '',
      size === 'base' ? $style.base : '',
      size === 'lg' ? $style.lg : '',
      size === 'xl' ? $style.xl : '',
    ]"
    :aria-disabled="disabled || !interactive"
    :tabindex="disabled || !interactive ? -1 : 0"
    @mouseenter="!disabled && interactive && (showTooltip = true)"
    @mouseleave="showTooltip = false"
  >
    <slot />
    <transition name="fade">
      <div
        v-if="showTooltip && tooltip"
        :class="$style.tooltip"
      >
        {{ tooltip }}
        <span :class="$style.tooltipArrow" />
      </div>
    </transition>
  </button>
</template>

<script setup lang="ts">
import { ref } from "vue"

withDefaults(defineProps<{
  kind?: "unset" | "white" | "primary" | "primaryOutline" | "redOutline" | "black" | "blue" | "grey" | "yellow" | "transparent" | "lightgrey" | "green" | "violet" | "successOutline" | "link"
  size?: "unset" | "xs" | "sm" | "base" | "lg" | "xl"
  tooltip?: string
  interactive?: boolean
  disabled?: boolean
}>(), {
  kind: "primary",
  size: "base",
  tooltip: "",
  interactive: true,
  disabled: false,
})

const id = useId()
const showTooltip = ref(false)
</script>

<style module>
.cursor {
  @apply cursor-pointer disabled:cursor-not-allowed disabled:opacity-60;
}

.button {
  @apply relative inline-flex items-center justify-center border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300;
  @apply disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none;
}

.interactive {
  @apply cursor-pointer;
}

.static {
  @apply cursor-default;
}

.primaryOutline {
  @apply button;
  @apply bg-white text-primary-500 border-primary-500 hover:bg-primary-500 hover:text-white hover:border-primary-700 active:border-primary-800 active:text-primary-800 focus:border-primary-800 focus:text-primary-800;
  @apply disabled:bg-white disabled:text-primary-200 disabled:border-primary-100 disabled:hover:bg-white disabled:hover:text-primary-200 disabled:hover:border-primary-100;
}

.primary {
  @apply button;
  @apply text-white bg-primary-600 hover:bg-white hover:text-primary-500 hover:border hover:border-primary-600 active:bg-primary-800 focus:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800;
  @apply disabled:bg-primary-100 disabled:text-primary-400 disabled:border-transparent disabled:hover:bg-primary-100 disabled:hover:text-primary-400;
}

.redOutline {
  @apply button;
  @apply bg-white text-red-500 border-red-500 hover:border-red-700 hover:text-red-700 active:border-red-800 active:text-red-800 focus:border-red-800 focus:text-red-800;
  @apply disabled:bg-white disabled:text-red-200 disabled:border-red-100 disabled:hover:border-red-100 disabled:hover:text-red-200;
}

.white {
  @apply button;
  @apply bg-white text-gray-900 border-gray-300 transition duration-300 !important;
  @apply disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:hover:bg-gray-100;
}

.whiteHover {
  @apply hover:bg-gray-100 !important;
}

.black {
  @apply button;
  @apply text-white bg-black hover:bg-gray-600 hover:border hover:border-black active:bg-gray-900 disabled:bg-gray-400 focus:bg-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition duration-300 !important;
  @apply disabled:text-gray-200 disabled:border-transparent disabled:hover:bg-gray-400;
}

.blue {
  @apply button text-white bg-blue hover:bg-blue-hover focus:bg-blue-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-hover transition duration-200;
  @apply disabled:bg-blue-200 disabled:text-blue-50 disabled:border-transparent disabled:hover:bg-blue-200;
}

.grey {
  @apply button text-white bg-grey hover:bg-grey-300 focus:bg-grey-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-300 transition duration-200;
  @apply disabled:bg-gray-300 disabled:text-gray-500 disabled:border-transparent disabled:hover:bg-gray-300;
}

.yellow {
  @apply button text-white bg-yellow hover:bg-yellow-100 focus:bg-yellow-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-100 transition duration-200;
  @apply disabled:bg-yellow-200 disabled:text-yellow-50 disabled:border-transparent disabled:hover:bg-yellow-200;
}

.transparent {
  @apply button bg-transparent text-black border border-grey-300 hover:bg-black hover:text-white transition duration-300 !important;
  @apply disabled:bg-transparent disabled:text-gray-400 disabled:border-gray-200 disabled:hover:bg-transparent disabled:hover:text-gray-400;
}

.lightgrey {
  @apply button bg-[#f5f5f5] text-black border border-black transition duration-300 hover:bg-[#d9d9d9];
  border: 1px solid #d9d9d9;
  @apply disabled:bg-[#f0f0f0] disabled:text-gray-400 disabled:border-gray-300 disabled:hover:bg-[#f0f0f0];
}

.green {
  @apply button bg-[#ebffee] text-[#1f6a45] border-[#4ac280] hover:bg-[#4ac280] hover:text-white hover:border-[#4ac280] active:bg-[#3aa76d] focus:text-white focus:bg-[#3aa76d] focus:border-[#3aa76d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3aa76d] disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300 transition duration-300 !important;
  @apply disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-200 disabled:hover:bg-gray-200;
}

.violet {
  @apply button text-[#5b22b6] bg-[#fbf4ff] transition-colors duration-300;
  @apply !border !border-[#5b22b6];
  @apply hover:bg-[#5b22b6] hover:text-white;
  @apply disabled:opacity-60 disabled:cursor-not-allowed;
}

.xs {
  @apply px-2.5 py-1.5 text-xs font-medium;
}

.sm {
  @apply px-3 py-2 text-sm leading-4 font-medium;
}

.base {
  @apply px-4 py-2 text-sm font-medium;
}

.lg {
  @apply px-4 py-2 text-base font-medium;
}

.xl {
  @apply px-6 py-3 text-base font-medium;
}

.tooltip {
  @apply absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded bg-black text-white text-xs font-medium shadow-lg z-20 whitespace-nowrap pointer-events-none;
}

.tooltipArrow {
  content: '';
  @apply absolute left-1/2;
  top: 100%;
  transform: translateX(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: transparent;
  border-top-color: #000;
  width: 0;
  height: 0;
  display: block;
}

.successOutline {
  @apply button;
  @apply bg-[#f5f5f5] text-black border-[#d9d9d9] transition duration-300;
  @apply hover:bg-[#4ac280] hover:text-white hover:border-[#4ac280];
  @apply active:bg-[#3aa76d] active:border-[#3aa76d];
  @apply focus:bg-[#3aa76d] focus:border-[#3aa76d];
  @apply focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3aa76d];
  @apply disabled:bg-[#f0f0f0] disabled:text-gray-400 disabled:border-gray-300 disabled:hover:bg-[#f0f0f0] disabled:hover:text-gray-400 disabled:hover:border-gray-300;
}

.link {
  @apply !bg-transparent !shadow-none !rounded-none text-blue-600 hover:text-blue-800 font-medium transition duration-300;
  @apply disabled:text-blue-300 disabled:hover:text-blue-300;
}
</style>
