<template>
  <div>
    <label
      v-if="label"
      :class="$style.label"
    >{{ label }}</label>
    <div class="flex items-center gap-0">
      <InputNumber
        v-model="left"
        :placeholder="leftPlaceholder"
        :min="min"
        :max="max"
        :step="step"
        :precision="precision"
        :class="[$style.input, 'flex-1', $style.inputLeft]"
      />
      <InputNumber
        v-model="right"
        :placeholder="rightPlaceholder"
        :min="min"
        :max="max"
        :step="step"
        :precision="precision"
        :class="[$style.input, 'flex-1', $style.inputRight]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import InputNumber from "@/components/form/InputNumber.vue"

const props = defineProps<{
  label?: string
  leftPlaceholder?: string
  rightPlaceholder?: string
  min?: number
  max?: number
  step?: number
  precision?: number
  modelValue?: { left: number | undefined, right: number | undefined }
}>()

const emits = defineEmits(["update:modelValue"])

const left = computed<number | undefined>({
  get() {
    return props.modelValue?.left
  },
  set(val) {
    emits("update:modelValue", { left: val, right: right.value })
  },
})

const right = computed<number | undefined>({
  get() {
    return props.modelValue?.right
  },
  set(val) {
    emits("update:modelValue", { left: left.value, right: val })
  },
})
</script>

<style module>
.label {
  @apply block text-sm font-medium leading-5 text-gray-700 mb-2;
}
.inputLeft {
  @apply rounded-r-none;
}
.inputRight {
  @apply rounded-l-none;
}
</style>
