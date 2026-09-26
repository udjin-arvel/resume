<template>
  <div :class="[customClass]">
    <div
      :class="[
        $style.lockedContainer,
        blurMode ? $style.blurMode : $style.staticMode,
      ]"
    >
      <div
        v-if="title"
        :class="$style.blockTitle"
      >
        {{ title }}
      </div>

      <div :class="blurMode ? $style.overlay : $style.staticContent">
        <div :class="$style.iconWrapper">
          <AuthLockIcon :icon-class="$style.icon" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AuthLockIcon from "@/components/common/AuthLockIcon.vue"

defineProps<{
  title?: string
  blurMode?: boolean
  customClass?: string
}>()
</script>

<style module>
.lockedContainer {
  @apply relative rounded-xl overflow-hidden min-h-[140px] flex flex-col p-6;
}

.blockTitle {
  @apply font-bold text-base text-gray-900 z-20 relative;
}

.staticMode {
   @apply bg-gray-50 border border-gray-100 justify-center items-center text-center;
}

.staticContent {
  @apply flex flex-col items-center justify-center w-full;
}

.blurMode {
  @apply bg-gray-50 border border-gray-100;
}

.overlay {
  @apply absolute inset-0 flex flex-col items-center justify-center z-10;
}

.iconWrapper {
   @apply text-gray-300 mb-2;
}

.icon {
  @apply w-10 h-10 text-gray-300;
}

.text {
  @apply text-sm text-gray-600 font-medium;
}

.link {
  @apply text-blue-600 hover:text-blue-800 cursor-pointer;
}
</style>
