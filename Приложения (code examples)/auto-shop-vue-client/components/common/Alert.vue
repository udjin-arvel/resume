<template>
  <transition
    enter-active-class="transition-opacity duration-300 ease-in-out"
    leave-active-class="transition-opacity duration-300 ease-in-out"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="visible && alert"
      :class="[
        $style.alert,
        alert.type === 'error' && $style.alertError,
        alert.type === 'warning' && $style.alertWarning,
        alert.type === 'success' && $style.alertSuccess,
        alert.type === 'info' && $style.alertInfo,
      ]"
    >
      <div :class="$style.alertContainer">
        <div :class="$style.alertContainerIcon">
          <XCircleIcon
            v-if="alert.type === 'error'"
            :class="$style.xCircleIcon"
            aria-hidden="true"
          />
          <ExclamationTriangleIcon
            v-if="alert.type === 'warning'"
            :class="$style.exclamationIcon"
            aria-hidden="true"
          />
          <CheckCircleIcon
            v-if="alert.type === 'success'"
            :class="$style.checkCircleIcon"
            aria-hidden="true"
          />
          <InformationCircleIcon
            v-if="alert.type === 'info'"
            :class="$style.informationCircleIcon"
            aria-hidden="true"
          />
        </div>
        <div :class="$style.alertContainerContent">
          <h3
            :class="[
              $style.alertTitle,
              alert.type === 'error' && $style.alertTitleError,
              alert.type === 'warning' && $style.alertTitleWarning,
              alert.type === 'success' && $style.alertTitleSuccess,
              alert.type === 'info' && $style.alertTitleInfo,
            ]"
          >
            {{ alert.subtitle }}
          </h3>
          <div
            v-if="alert.text"
            :class="[
              $style.alertText,
              alert.type === 'error' && $style.alertTextError,
              alert.type === 'warning' && $style.alertTextWarning,
              alert.type === 'success' && $style.alertTextSuccess,
              alert.type === 'info' && $style.alertTextInfo,
            ]"
          >
            <p>{{ alert.text }}</p>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { XCircleIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from "@heroicons/vue/20/solid"
import type { Alert } from "@/types/common/alert"

const props = defineProps<{
  alert: Alert | null
}>()

const visible = ref(true)

watchEffect(() => {
  visible.value = !!props.alert
})
</script>

<style module>
.alert {
  @apply rounded-md p-4 mb-2;
}
.alertError {
  @apply bg-red-50;
}
.alertWarning {
  @apply bg-yellow-50;
}
.alertSuccess {
  @apply bg-green-50;
}
.alertInfo {
  @apply bg-blue-50;
}
.alertContainer {
  @apply flex;
}
.alertContainerIcon {
  @apply flex-shrink-0;
}
.xCircleIcon {
  @apply h-5 w-5 text-red-400;
}
.exclamationIcon {
  @apply h-5 w-5 text-yellow-400;
}
.checkCircleIcon {
  @apply h-5 w-5 text-green-400;
}
.informationCircleIcon {
  @apply h-5 w-5 text-blue-400;
}
.alertContainerContent {
  @apply ml-3;
}
.alertTitle {
  @apply text-sm font-medium;
}
.alertTitleError {
  @apply text-red-800;
}
.alertTitleWarning {
  @apply text-yellow-800;
}
.alertTitleSuccess {
  @apply text-green-800;
}
.alertTitleInfo {
  @apply text-blue-800;
}
.alertText {
  @apply mt-2 text-sm;
}
.alertTextError {
  @apply text-red-700;
}
.alertTextWarning {
  @apply text-yellow-700;
}
.alertTextSuccess {
  @apply text-green-700;
}
.alertTextInfo {
  @apply text-blue-700;
}
</style>
