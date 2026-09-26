<template>
  <div :class="$style.wrap">
    <div :class="$style.groupControl">
      <button
        type="button"
        :class="$style.increment"
        @click="decrement"
      >
        <MinusIcon :class="$style.icon" />
      </button>
      <FormInputNumber
        v-model="cust"
        :class="$style.input"
        :min="min"
        :max="max"
        :placeholder="placeholder"
        :precision="precision"
        :step="step"
        :readonly="readonly"
        :rounded="rounded"
        :disabled="disabled"
      />
      <button
        type="button"
        :class="$style.decrement"
        @click="increment"
      >
        <PlusIcon :class="$style.icon" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MinusIcon, PlusIcon } from "@heroicons/vue/20/solid"

interface Props {
  modelValue: number
  max?: number
  min?: number
  placeholder?: string
  precision?: number
  step?: number
  readonly?: boolean
  rounded?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  max: undefined,
  min: undefined,
  placeholder: undefined,
  precision: undefined,
  step: 1,
  readonly: false,
  rounded: false,
  disabled: false,
})

const emits = defineEmits(["update:modelValue"])

const cust = computed({
  get(): number {
    return props.modelValue
  },
  set(value: number) {
    emits("update:modelValue", value)
  },
})

const increment = () => (cust.value = cust.value + 1)
const decrement = () => (cust.value = cust.value - 1)
</script>

<style module>
.input {
  @apply rounded-none border-x-0 h-10 text-center text-sm block w-full py-2.5 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500;
}

.wrap {
  @apply max-w-xs mx-auto space-y-10;
}

.groupControl {
  @apply relative flex items-center max-w-[8rem];
}

.increment {
  @apply bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg p-3 h-10  focus:outline-none;
}

.decrement {
  @apply bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg p-3 h-10  focus:outline-none;
}

.icon {
  @apply w-3 h-3 text-gray-900 dark:text-white;
}
</style>
