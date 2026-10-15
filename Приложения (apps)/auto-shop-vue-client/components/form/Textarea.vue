<template>
  <div>
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
      <textarea
        :id="uuid"
        ref="input"
        v-bind="$attrs"
        :value="inputValue"
        :rows="rows"
        :class="[
          isInvalid ? $style.textareaInvalid : $style.textarea,
          autoresized && 'resize-none overflow-hidden',
        ]"
        @input="handleInput"
        @compositionstart="isComposing = true"
        @compositionend="handleCompositionEnd"
      />
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
    <p
      v-if="limit && limit > 0 && showLimit"
      :class="$style.limit"
    >
      {{ limit - inputValue.length }} / {{ limit }} символов
    </p>
  </div>
</template>

<script setup lang="ts">
import { ExclamationCircleIcon } from "@heroicons/vue/24/solid"

interface Props {
  id?: string
  label?: string
  labelSub?: string
  invalidMessage?: string
  helperText?: string
  limit?: number
  showLimit?: boolean
  modelValue: string
  rows: number
  autoresized?: boolean
}

const props = defineProps<Props>()
const emits = defineEmits(["update:modelValue"])
const { isInvalid, isHelper, uuid } = useFormElements(props)

const input = ref<HTMLTextAreaElement>()
const inputValue = ref("")
const isComposing = ref(false)

const emitValue = (value: string) => {
  let newValue = value

  if (!isComposing.value && newValue.length > 0) {
    newValue = newValue.charAt(0).toUpperCase() + newValue.slice(1)
  }

  if (typeof props.limit !== "undefined" && props.limit > 0) {
    newValue = newValue.substring(0, props.limit)
  }

  inputValue.value = newValue

  if (input.value && "value" in input.value) {
    input.value.value = String(newValue)
  }

  emits("update:modelValue", newValue)
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  const value = target?.value || ""

  if (!isComposing.value) {
    emitValue(value)
  }

  resize(target)
}

const handleCompositionEnd = (event: Event) => {
  isComposing.value = false
  const target = event.target as HTMLTextAreaElement

  emitValue(target.value)
  resize(target)
}

const resize = (target?: HTMLTextAreaElement) => {
  if (!props.autoresized) {
    return
  }
  if (!target) {
    return
  }

  target.style.height = "auto"
  target.style.height = target.scrollHeight + 2 + "px"
}

onMounted(() => {
  nextTick(() => resize(input.value))
})

watch(
  () => props.modelValue,
  (value, oldValue) => {
    if (!(value === "" && typeof oldValue === "undefined") && value !== inputValue.value) {
      emitValue(value)
    }

    nextTick(() => resize(input.value))
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

.labelSub {
  @apply text-gray-500;
}

.wrapper {
  @apply relative;
}

.textarea {
  @apply appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500;
}

.textareaInvalid {
  @apply appearance-none block w-full px-3 py-2 pr-10 border border-red-300 rounded-md text-red-900 placeholder-red-300 focus:outline-none focus:ring-black focus:border-black sm:text-sm;
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

.limit {
  @apply mt-2 text-sm text-gray-500;
}
</style>
