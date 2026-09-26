<template>
  <div :class="$attrs.class">
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
    <div :class="direction === 'column' ? $style.wrapperColumn : $style.wrapperRow">
      <div
        v-for="(option, index) in options"
        :key="index"
        :class="[$style.optionWrapper, option.disabled ? $style.optionWrapperDisabled : '']"
      >
        <label :class="[$style.radioLabel, option.disabled ? $style.radioLabelDisabled : '']">
          <input
            :id="`${uuid}-${index}`"
            type="radio"
            :name="uuid"
            :value="option.value"
            :checked="modelValue === option.value"
            :disabled="option.disabled"
            v-bind="$attrs"
            :class="$style.input"
            @change="handleChange(option)"
          >
          <span :class="[$style.customRadio, option.disabled ? $style.customRadioDisabled : '']">
            <span
              v-if="modelValue === option.value && !option.disabled"
              :class="$style.customRadioInner"
            />
          </span>
          <span :class="$style.optionLabel">{{ option.name }}</span>
        </label>
        <slot
          v-if="index < options.length - 1"
          name="separator"
        />
      </div>
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
import { useFormElements } from "~/composables/useFormElements"
import type { OptionBase } from "@/types/form/optionType"

interface Props {
  id?: string
  label?: string
  labelSub?: string
  invalidMessage?: string
  helperText?: string
  modelValue: string
  options: OptionBase[]
  direction?: "row" | "column"
}

const props = defineProps<Props>()
const emits = defineEmits(["update:modelValue"])
const { isInvalid, isHelper, uuid } = useFormElements(props)

function handleChange(option: OptionBase) {
  if (!option.disabled) {
    emits("update:modelValue", option.value)
  }
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
.wrapperRow {
  @apply flex flex-row space-x-4;
}
.wrapperColumn {
  @apply flex flex-col space-y-2;
}
.optionWrapper {
  @apply flex items-center;
}
.optionWrapperDisabled {
  @apply opacity-50;
}
.radioLabel {
  @apply flex items-center cursor-pointer;
}
.radioLabelDisabled {
  @apply cursor-not-allowed pointer-events-none;
}
.input {
  @apply hidden;
}
.customRadio {
  @apply w-5 h-5 border-2 border-black rounded-full flex items-center justify-center mr-2;
}
.customRadioDisabled {
  @apply bg-gray-400 border-none;
}
.customRadioInner {
  @apply w-2.5 h-2.5 bg-black rounded-full;
}
.optionLabel {
  @apply text-sm text-gray-700;
}
.invalidMessage {
  @apply mt-2 text-sm text-red-600;
}
.helper {
  @apply mt-2 text-sm text-gray-500;
}
</style>
