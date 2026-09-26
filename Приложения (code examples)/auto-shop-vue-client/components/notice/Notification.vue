<template>
  <div :class="$style.wrapper">
    <div :class="$style.columns">
      <div :class="$style.columnIcon">
        <CheckCircleIcon
          v-if="kind === KindTypeEnum.Success"
          :class="$style.iconSuccess"
          aria-hidden="true"
        />
        <InformationCircleIcon
          v-if="kind === KindTypeEnum.Info"
          :class="$style.iconInfo"
          aria-hidden="true"
        />
        <XCircleIcon
          v-if="kind === KindTypeEnum.Error"
          :class="$style.iconError"
          aria-hidden="true"
        />
        <ExclamationCircleIcon
          v-if="kind === KindTypeEnum.Warning"
          :class="$style.iconWarning"
          aria-hidden="true"
        />
      </div>
      <div :class="$style.columnText">
        <p :class="$style.title">
          {{ title }}
        </p>
        <p :class="$style.subtitle">
          {{ subTitle }}
        </p>
      </div>
      <div :class="$style.columnClose">
        <button
          :class="$style.close"
          @click="$emit('close')"
        >
          <XMarkIcon
            :class="$style.closeIcon"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircleIcon, InformationCircleIcon, XCircleIcon, ExclamationCircleIcon } from "@heroicons/vue/24/outline"
import { XMarkIcon } from "@heroicons/vue/24/solid"
import { KindTypeEnum } from "@/types/common/notification"

defineProps<{
  kind: KindTypeEnum
  title: string
  subTitle: string
}>()
defineEmits(["close"])
</script>

<style module>
.wrapper {
  @apply max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden p-4;
}
.columns {
  @apply flex items-start;
}
.columnIcon {
  @apply flex-shrink-0;
}
.columnText {
  @apply ml-3 w-0 flex-1 pt-0.5;
}
.columnClose {
  @apply ml-4 flex-shrink-0 flex;
}
.iconSuccess {
  @apply h-6 w-6 text-green-500;
}
.iconInfo {
  @apply h-6 w-6 text-blue-400;
}
.iconError {
  @apply h-6 w-6 text-red-400;
}
.iconWarning {
  @apply h-6 w-6 text-yellow-400;
}
.title {
  @apply text-sm font-medium text-gray-900;
}
.subtitle {
  @apply mt-1 text-sm text-gray-500;
}
.close {
  @apply bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500;
}
.closeIcon {
  @apply h-5 w-5;
}
</style>
