<template>
  <div
    v-if="selectedCars.length"
    :class="$style.container"
  >
    <div :class="$style.header">
      <h3 :class="$style.title">
        {{ t('needs.form.selected_cars') }}
        <span :class="$style.badge">{{ selectedCars.length }}</span>
      </h3>
      <Button
        v-if="!readonlyMode && selectedCars.length > 1"
        kind="unset"
        size="unset"
        :class="$style.clearAllBtn"
        @click="$emit('clear-all')"
      >
        {{ t('needs.form.clear_all') }}
      </Button>
    </div>

    <div :class="$style.carsList">
      <SelectedCarCard
        v-for="car in selectedCars"
        :key="car.id"
        :car="car"
        :readonly-mode="readonlyMode"
        @remove="handleRemove(car.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import SelectedCarCard from "@/components/needs/SelectedCarCard.vue"
import Button from "@/components/common/Button.vue"

const props = defineProps<{
  selectedCars: any[]
  readonlyMode?: boolean
}>()

const emit = defineEmits<{
  (e: "remove", id: number): void
  (e: "clear-all"): void
}>()

const { t } = useI18n()

function handleRemove(id: number) {
  if (!props.readonlyMode) {
    emit("remove", id)
  }
}
</script>

<style module>
.container {
  @apply mt-4 mb-5 bg-gray-50 border border-gray-200 rounded-md p-4 w-full;
}

.header {
  @apply flex items-center justify-between mb-2;
}

.title {
  @apply text-base font-bold text-gray-900 flex items-center gap-2;
}

.badge {
  @apply inline-flex items-center justify-center px-1 min-w-4 h-5 text-xs font-semibold text-white bg-red-500 rounded-full;
}

.clearAllBtn {
  @apply text-sm text-red-600 hover:text-red-800 font-medium transition;
}

.carsList {
  @apply flex flex-col gap-3;
}
</style>
