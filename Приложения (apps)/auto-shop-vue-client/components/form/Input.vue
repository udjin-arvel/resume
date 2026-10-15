<template>
  <div :class="$attrs.class">
    <div :class="$style.labelWrapper">
      <label
        v-if="label"
        :for="uuid"
        :class="$style.label"
      >
        <slot name="label">
          {{ label }}
        </slot>
        <span
          v-if="labelSub"
          :class="$style.labelSub"
        >{{ labelSub }}</span>
      </label>
      <div :class="$style.labelExtra">
        <slot name="label-extra" />
      </div>
    </div>
    <p
      v-if="isHelper && helperPosition === 'top'"
      :class="$style.helperTop"
    >
      <slot name="helper-text">
        {{ helperText }}
      </slot>
    </p>
    <div :class="$style.inputWrapper">
      <slot name="input-icon" />
      <input
        :id="uuid"
        v-bind="inputAttrs"
        ref="input"
        :autocomplete="autocomplete"
        :type="isPasswordType ? (showPassword ? 'text' : 'password') : type"
        :value="modelValue"
        :class="inputClasses"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement)?.value)"
        @paste="$emit('paste', $event)"
      >
      <div
        v-if="isPasswordType"
        :class="$style.togglePassword"
      >
        <EyeIcon
          v-if="!showPassword"
          :class="$style.eyeIcon"
          aria-hidden="true"
          @click="showPassword = !showPassword"
        />
        <EyeSlashIcon
          v-else
          :class="$style.eyeIcon"
          aria-hidden="true"
          @click="showPassword = !showPassword"
        />
      </div>
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
      v-if="isHelper && helperPosition === 'bottom'"
      :class="$style.helperBottom"
    >
      <slot name="helper-text">
        {{ helperText }}
      </slot>
    </p>
    <p
      v-if="isInvalid"
      :class="$style.invalidMessage"
    >
      <slot name="invalid-message">
        {{ invalidMessage }}
      </slot>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ExclamationCircleIcon, EyeIcon, EyeSlashIcon } from "@heroicons/vue/24/solid"

interface InputProps {
  id?: string
  label?: string
  labelSub?: string
  invalidMessage?: string
  autocomplete?: "off" | "on"
  helperText?: string
  helperPosition?: "top" | "bottom"
  modelValue: string
  type?: string
  /** Подсветка рамки: success — зелёная, error — красная */
  status?: "success" | "error" | null
}

const props = withDefaults(defineProps<InputProps>(), {
  helperPosition: "top",
  status: null,
})

const attrs = useAttrs()
const $style = useCssModule()
const { isInvalid, isHelper, uuid } = useFormElements(props)
defineEmits(["update:modelValue", "paste", "input"])

const showPassword = ref(false)
const isPasswordType = computed(() => props.type === "password")

/** class уходит на обёртку через $attrs.class, на input — всё остальное */
const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs
  return rest
})

const inputClasses = computed(() => {
  if (isInvalid.value) {
    return $style.inputInvalid
  }
  if (props.status === "success") {
    return $style.inputSuccess
  }
  if (props.status === "error") {
    return $style.inputError
  }
  return $style.input
})
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<style module>
.labelWrapper {
  @apply flex items-center justify-between;
}
.label {
  @apply block text-sm font-medium leading-5 text-gray-700 mb-2;
}
.labelSub {
  @apply text-gray-500;
}
.labelExtra {
  @apply text-sm;
}
.inputWrapper {
  @apply relative;
}
.input {
  @apply block w-full px-3 py-2 rounded-md border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-sm disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500;
}
.inputSuccess {
  @apply block w-full px-3 py-2 rounded-md border border-green-500 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500;
}
.inputError {
  @apply block w-full px-3 py-2 rounded-md border border-red-500 placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500;
}
.inputInvalid {
  @apply block w-full px-3 py-2 pr-10 rounded-md border border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm;
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
.helperTop {
  @apply text-sm text-gray-500;
  margin-top: -.5rem;
  margin-bottom: .5rem;
}
.helperBottom {
  @apply mt-1 text-sm text-gray-500;
}

.togglePassword {
    @apply absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer;
}
.eyeIcon {
    @apply h-5 w-5 text-gray-400 hover:text-gray-600 transition duration-200 ease-in-out;
}
</style>
