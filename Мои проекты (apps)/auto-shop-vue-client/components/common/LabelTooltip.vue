<template>
  <div
    :class="[
      $style.labelOverlay,
      'labelOverlay',
      props.kind === 'black' ? $style.labelOverlayBlack : '',
      props.kind === 'gray' ? $style.labelOverlayGray : '',
      props.kind === 'unset' ? $style.labelOverlayUnset : '',
    ]"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <component
      :is="icon"
      :class="[
        iconClass ?? $style.labelIcon,
        props.kind === 'black' ? $style.labelIconBlack : '',
        props.kind === 'gray' ? $style.labelIconGray : '',
      ]"
    />
    <transition name="fade">
      <div
        v-if="showTooltip"
        :class="[
          $style.tooltip,
          props.align === 'end' ? $style.tooltipEnd : props.align === 'start' ? $style.tooltipStart : $style.tooltipCenter,
        ]"
        :style="tooltipStyles"
      >
        {{ t(tooltipText) }}
        <span
          :class="[
            $style.tooltipArrow,
            props.align === 'end' ? $style.tooltipArrowEnd : props.align === 'start' ? $style.tooltipArrowStart : $style.tooltipArrowCenter,
          ]"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import type { defineComponent } from "vue"
import { ref } from "vue"
import { useI18n } from "vue-i18n"

interface Props {
  icon: ReturnType<typeof defineComponent>
  tooltipText: string
  kind?: "black" | "gray" | "unset"
  align?: "center" | "end" | "start"
  tooltipStyles?: Record<string, string> | string
  iconClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  kind: "black",
  align: "center",
  tooltipStyles: undefined,
  iconClass: undefined,
})

const { t } = useI18n()
const showTooltip = ref(false)
</script>

<style module>
.labelOverlay {
  @apply relative flex items-center justify-center;
  width: 44px;
  height: 36px;
  border-radius: 50% / 60%;
}
.labelOverlayBlack {
  @apply bg-black bg-opacity-50;
}
.labelOverlayGray {
  @apply bg-[#f5f5f5];
}
.labelOverlayUnset {
  @apply bg-transparent w-auto h-auto;
}
.labelIcon {
  @apply w-4 h-4;
}
.labelIconBlack {
  @apply text-white;
}
.labelIconGray {
  @apply text-[#222];
}
.tooltip {
  @apply absolute bottom-full mb-2 px-3 py-2 rounded bg-black text-white text-xs font-medium shadow-lg z-20 whitespace-nowrap;
}

.tooltipStart {
  @apply left-0 right-auto translate-x-0;
}

.tooltipCenter {
  @apply left-1/2 -translate-x-1/2;
}

.tooltipEnd {
  @apply right-0 left-auto translate-x-0;
}

.tooltipArrow {
  content: '';
  @apply absolute;
  top: 100%;
  border-width: 6px;
  border-style: solid;
  border-color: transparent;
  border-top-color: #000;
  width: 0;
  height: 0;
  display: block;
}

.tooltipArrowStart {
  @apply left-[4px];
  transform: none;
}

.tooltipArrowCenter {
  @apply left-1/2;
  transform: translateX(-50%);
}

.tooltipArrowEnd {
  @apply right-[4px];
  transform: none;
}
</style>
