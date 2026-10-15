<template>
  <div v-bind="$attrs">
    <label
      v-if="label"
      :for="uuid"
      :class="$style.label"
    >
      {{ label }}
      <span
        v-if="labelSub"
        :class="$style.labelSub"
      >{{ labelSub }}</span>
    </label>

    <div :class="$style.wrapper">
      <label :class="[$style.checkboxLabel, disabled ? $style.labelDisabled : '']">
        <input
          :id="uuid"
          type="checkbox"
          :checked="isChecked"
          :disabled="disabled"
          :value="value"
          :class="$style.input"
          @change="handleChange"
        >
        <span :class="[$style.customCheckbox, disabled ? $style.customCheckboxDisabled : '', isChecked ? $style.customCheckboxChecked : '']">
          <svg
            v-if="isChecked && !disabled"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            :class="$style.checkIcon"
          >
            <path
              fill-rule="evenodd"
              d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
              clip-rule="evenodd"
            />
          </svg>
        </span>
        <span
          v-if="optionLabel"
          :class="$style.optionLabel"
        >{{ optionLabel }}</span>
      </label>
    </div>

    <p
      v-if="isInvalid"
      :class="$style.invalidMessage"
    >
      <slot name="invalid-message">
        {{ invalidMessage }}
      </slot>
    </p>
    <p
      v-if="isHelper"
      :class="$style.helper"
    >
      <slot name="helper-text">
        {{ helperText }}
      </slot>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useFormElements } from "~/composables/useFormElements"

interface Props {
  id?: string
  label?: string
  labelSub?: string
  optionLabel?: string
  invalidMessage?: string
  helperText?: string
  modelValue?: boolean | string[] | number[] | null
  value?: string | number | boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  value: true,
  disabled: false,
})

const emits = defineEmits(["update:modelValue", "change"])
const { isInvalid, isHelper, uuid } = useFormElements(props)

const isChecked = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(props.value as never)
  }
  return !!props.modelValue
})

function handleChange(event: Event) {
  if (props.disabled) {
    return
  }

  const target = event.target as HTMLInputElement
  const isCheckedNew = target.checked

  if (Array.isArray(props.modelValue)) {
    const newValue = [...props.modelValue]
    if (isCheckedNew) {
      newValue.push(props.value as never)
    }
    else {
      const index = newValue.indexOf(props.value as never)
      if (index !== -1) {
        newValue.splice(index, 1)
      }
    }
    emits("update:modelValue", newValue)
  }
  else {
    emits("update:modelValue", isCheckedNew)
  }

  emits("change", isCheckedNew)
}
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<style module>
.label {
  @apply block text-sm font-medium leading-5 text-gray-700 mb-2;
}
.labelSub {
  @apply text-gray-500;
}
.wrapper {
  @apply flex items-center;
}
.checkboxLabel {
  @apply flex items-center cursor-pointer relative;
}
.labelDisabled {
  @apply cursor-not-allowed opacity-50;
}
.input {
  @apply hidden;
}
.customCheckbox {
  @apply w-4 h-4 border border-gray-300 rounded flex items-center justify-center bg-white transition-colors duration-200;
}
.customCheckboxChecked {
  @apply bg-black border-black;
}
.customCheckboxDisabled {
  @apply bg-gray-200 border-gray-300;
}
.checkIcon {
  @apply w-3.5 h-3.5 text-white;
}
.optionLabel {
  @apply ml-2 text-sm text-gray-700;
}
.invalidMessage {
  @apply mt-2 text-sm text-red-600;
}
.helper {
  @apply mt-2 text-sm text-gray-500;
}
</style>
