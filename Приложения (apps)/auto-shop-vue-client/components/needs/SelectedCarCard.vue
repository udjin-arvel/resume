<template>
  <div :class="$style.card">
    <div
      :class="$style.header"
      @click="toggleExpand"
    >
      <div :class="$style.headerLeft">
        <img
          v-if="car.img"
          :src="car.img"
          :alt="car.name"
          :class="$style.carImage"
        >
        <div :class="$style.carInfo">
          <h3 :class="$style.carName">
            {{ car.name }}
          </h3>
          <p :class="$style.carMeta">
            <span v-if="car.year">{{ car.year }} г.</span>
            <span v-if="car.displacement"> • {{ car.displacement }} л</span>
            <span v-if="car.horse_power"> • {{ car.horse_power }} л.с.</span>
          </p>
        </div>
      </div>
      <div :class="$style.headerRight">
        <Button
          v-if="!readonlyMode"
          kind="unset"
          size="unset"
          :class="$style.removeBtn"
          @click.stop="$emit('remove')"
        >
          <XMarkIcon :class="$style.removeIcon" />
        </Button>
        <ChevronDownIcon
          :class="[$style.chevron, { [$style.chevronRotated]: isExpanded }]"
        />
      </div>
    </div>

    <transition name="expand">
      <div
        v-if="isExpanded"
        :class="$style.content"
      >
        <CarParams
          :car-id="car.id"
          :show-all="false"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { ChevronDownIcon, XMarkIcon } from "@heroicons/vue/24/solid"
import CarParams from "@/components/needs/CarParams.vue"
import Button from "@/components/common/Button.vue"

defineProps<{
  car: any
  readonlyMode?: boolean
}>()

defineEmits<{
  (e: "remove"): void
}>()

const isExpanded = ref(false)

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style module>
.card {
  @apply bg-white border border-gray-200 rounded-lg overflow-hidden;
}

.header {
  @apply flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition;
}

.headerLeft {
  @apply flex items-center gap-4 flex-1;
  min-width: 0;
}

.carImage {
  @apply w-16 h-16 object-cover rounded-md;
  flex-shrink: 0;
}

.carInfo {
  @apply flex flex-col;
  min-width: 0;
  overflow: hidden;
}

.carName {
  @apply text-base font-semibold text-gray-900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.carMeta {
  @apply text-sm text-gray-500 mt-1;
  word-break: break-word;
}

.headerRight {
  @apply flex items-center gap-2;
  flex-shrink: 0;
}

.removeBtn {
  @apply p-1 hover:bg-red-50 rounded transition;
}

.removeIcon {
  @apply w-5 h-5 text-red-500;
}

.chevron {
  @apply w-5 h-5 text-gray-400 transition-transform;
}

.chevronRotated {
  @apply rotate-180;
}

.content {
  @apply border-t border-gray-200 p-4 bg-white;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
