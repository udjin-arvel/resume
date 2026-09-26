<template>
  <div :class="$attrs.class">
    <label
      v-if="label"
      :for="uuid"
      :class="$style.label"
    >{{ label }}</label>
    <div :class="$style.wrapper">
      <input
        :id="uuid"
        ref="input"
        v-maska="thousandsSeparated ? integerMaskOptions : undefined"
        :class="isInvalid ? [$style.inputInvalid, $style.inputNumber] : [$style.input, $style.inputNumber]"
        v-bind="$attrs"
        :type="thousandsSeparated ? 'text' : 'number'"
        :inputmode="thousandsSeparated ? 'numeric' : undefined"
        :name="name || uuid"
        :value="rawInputValue"
        :min="min"
        :max="max"
        :step="step"
        :readonly="readonly"
        :disabled="disabled"
        :placeholder="placeholder"
        autocomplete="off"
        @input="inputEvent"
        @change="changeEvent"
        @paste="pasteEvent"
      >
      <div
        v-if="isInvalid"
        :class="$style.invalid"
      >
        <ExclamationCircleIcon
          :class="$style.invalidIcon"
          aria-hidden="true"
        />
      </div>
    </div>
    <p
      v-if="isInvalid && showInvalidMessage"
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
import { ExclamationCircleIcon } from "@heroicons/vue/24/solid"
import { ref, watch } from "vue"
import { Mask } from "maska"
import { vMaska } from "maska/vue"

const emits = defineEmits(["update:modelValue", "complete:modelValue"])

interface Props {
  id?: string
  label?: string
  invalidMessage?: string
  showInvalidMessage?: boolean
  helperText?: string
  modelValue?: number | string | null
  max?: number
  min?: number
  name?: string
  placeholder?: string
  step?: number
  readonly?: boolean
  rounded?: boolean
  disabled?: boolean
  precision?: number
  thousandsSeparated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  label: undefined,
  invalidMessage: undefined,
  showInvalidMessage: true,
  helperText: undefined,
  modelValue: undefined,
  name: undefined,
  placeholder: undefined,
  precision: undefined,
  max: undefined,
  min: undefined,
  step: 1,
  disabled: false,
  readonly: false,
  rounded: false,
  thousandsSeparated: false,
})

const { isInvalid, isHelper, uuid } = useFormElements(props)
const input = ref<HTMLInputElement | null>(null)

const integerMaskOptions = {
  number: {
    locale: "ru-RU",
    fraction: 0,
    unsigned: true,
  },
}
const integerMask = new Mask(integerMaskOptions)

const formatInputValue = (value: number | string | null | undefined) => {
  if (value == null || value === "") {
    return ""
  }
  return props.thousandsSeparated ? integerMask.masked(value.toString()) : value.toString()
}

const unmaskInputValue = (value: string) => (
  props.thousandsSeparated ? integerMask.unmasked(value) : value
)

const rawInputValue = ref(formatInputValue(props.modelValue))

const inputEvent = (event: Event) => {
  const target = event.target as HTMLInputElement
  rawInputValue.value = target.value
  emits("update:modelValue", unmaskInputValue(target.value))
}

const changeEvent = (event: Event) => {
  const target = event.target as HTMLInputElement
  let val = parseFloat(unmaskInputValue(target.value))
  if (!isNaN(val)) {
    if (props.precision) {
      val = Math.round(val * Math.pow(10, props.precision)) / Math.pow(10, props.precision)
    }

    if (props.min !== undefined && props.max !== undefined && props.min <= props.max) {
      val = Math.min(props.max, Math.max(props.min, val))
    }

    if (props.rounded) {
      val = Math.round(val)
    }

    rawInputValue.value = formatInputValue(val)
    emits("update:modelValue", val)
    emits("complete:modelValue", val)
  }
  else {
    rawInputValue.value = ""
    emits("update:modelValue", null)
  }
}

const pasteEvent = (event: ClipboardEvent) => {
  if (props.thousandsSeparated) {
    return
  }

  const REGEXP_NUMBER = /^-?(?:\d+|\d*\.\d+)(?:[eE][-+]?\d+)?$/
  const clipboardData = event.clipboardData || (window as any).clipboardData
  if (clipboardData && !REGEXP_NUMBER.test(clipboardData.getData("text"))) {
    event.preventDefault()
  }
}

watch(
  () => props.modelValue,
  (value) => {
    const formattedValue = formatInputValue(value)
    if (formattedValue !== rawInputValue.value) {
      rawInputValue.value = formattedValue
    }
  },
  { immediate: true },
)
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
.wrapper {
  @apply relative;
}
.input {
  @apply appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500;
}
.inputInvalid {
  @apply appearance-none block w-full px-3 py-2 border border-red-300 rounded-md text-red-900 placeholder-red-300 focus:outline-none focus:ring-black focus:border-black sm:text-sm;
}
.invalid {
  @apply absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none;
}
.invalidIcon {
  @apply h-5 w-5 text-red-500;
}
.invalidMessage {
  @apply mt-2 text-sm text-red-600;
}
.helper {
  @apply mt-2 text-sm text-gray-500;
}
.inputNumber {
  -moz-appearance: textfield;
}
.inputNumber::-webkit-outer-spin-button,
.inputNumber::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
</style>
