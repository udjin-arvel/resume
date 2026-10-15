<template>
  <div>
    <HeadlessListbox
      v-model="selectedOption"
      :by="compareDepartments"
      as="div"
    >
      <HeadlessListboxLabel
        v-if="label"
        :class="$style.listBoxLabel"
      >
        {{ label }}
      </HeadlessListboxLabel>
      <div :class="$style.wrapOptions">
        <HeadlessListboxButton
          :class="[
            $style.listBoxButton,
            withBorder && $style.listBoxButtonBorder,
            withBorderWithoutLeft && $style.listBoxButtonBorderWithoutRoundLeft,
            isInvalid && $style.listBoxButtonInvalid,
          ]"
          :disabled="disabled"
        >
          <span :class="$style.listBoxButtonName">{{ selectedOption.name }}</span>
          <span :class="$style.listBoxButtonBlock">
            <ChevronUpDownIcon
              :class="[$style.listBoxButtonIcon, isInvalid && $style.listBoxButtonIconInvalid]"
              aria-hidden="true"
            />
          </span>
        </HeadlessListboxButton>
        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-out"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <HeadlessListboxOptions :class="$style.listBoxOptions">
            <HeadlessListboxOption
              v-for="option in options"
              :key="option.value"
              v-slot="{ active, selected }: { active: boolean; selected: boolean }"
              as="template"
              :value="option"
              :disabled="option.disabled ?? false"
            >
              <li
                :class="[
                  $style.optionLi,
                  active ? $style.optionLiActive : $style.optionLiBase,
                  option.disabled && $style.optionLiDisabled,
                ]"
              >
                <span :class="[selected ? $style.optionLiSpanSelect : $style.optionLiSpanBase, $style.optionLiSpan]">
                  {{ option.name }}
                </span>
                <span
                  v-if="selected"
                  :class="[
                    active ? $style.optionLiSpanIconActive : $style.optionLiSpanIconBase,
                    $style.optionLiSpanIcon,
                  ]"
                >
                  <CheckIcon
                    :class="$style.listBoxOptionsCheckIcon"
                    aria-hidden="true"
                  />
                </span>
              </li>
            </HeadlessListboxOption>
          </HeadlessListboxOptions>
        </transition>
      </div>
    </HeadlessListbox>
    <p
      v-if="isInvalid && showInvalidMessage"
      :class="$style.invalidMessage"
    >
      <slot name="invalid-message">
        {{ invalidMessage }}
      </slot>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ChevronUpDownIcon } from "@heroicons/vue/20/solid"
import { CheckIcon } from "@heroicons/vue/24/outline"
import type { OptionBase } from "@/types/form/optionType"

interface Props {
  modelValue: number | string | undefined
  options: OptionBase[]
  label?: string
  disabled?: boolean
  withBorder?: boolean
  withBorderWithoutLeft?: boolean
  id?: string
  invalidMessage?: string
  showInvalidMessage?: boolean
  helperText?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  disabled: false,
  withBorder: false,
  withBorderWithoutLeft: false,
  id: undefined,
  invalidMessage: undefined,
  showInvalidMessage: true,
  helperText: undefined,
})

const emits = defineEmits(["update:modelValue"])
const { isInvalid } = useFormElements(props)

const selectedOption = computed({
  get(): OptionBase {
    const _defaultOption = props.options.find((x: OptionBase) => String(x.value).toLowerCase() === "0")
    const defaultOption = _defaultOption ? _defaultOption : props.options[0]

    if (typeof props.modelValue === "undefined") {
      return defaultOption
    }

    const findOption = props.options.find(
      (x: OptionBase) => String(x.value).toLowerCase() === String(props.modelValue).toLowerCase(),
    )
    return findOption ? findOption : defaultOption
  },
  set(value: OptionBase) {
    emits("update:modelValue", value.value)
  },
})

const compareDepartments = (a: OptionBase, b: OptionBase): boolean => {
  return String(a.value).toLowerCase() === String(b.value).toLowerCase()
}
</script>

<style module>
.listBoxLabel {
  @apply block text-sm font-medium leading-5 text-gray-700 mb-2;
}
.listBoxButton {
  @apply relative w-full bg-white rounded-md pl-3 pr-10 py-2 text-left cursor-default focus:outline-none sm:text-sm  disabled:bg-gray-50 disabled:text-gray-500;
}
.listBoxButtonBorder {
  @apply border border-gray-300  shadow-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500;
}
.listBoxButtonBorderWithoutRoundLeft {
  @apply rounded-none rounded-r-md;
}
.listBoxButtonInvalid {
  @apply border border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500;
}
.listBoxButtonName {
  @apply block truncate;
}
.listBoxButtonBlock {
  @apply absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none;
}
.listBoxButtonIcon {
  @apply h-5 w-5 text-gray-400;
}
.listBoxButtonIconInvalid {
  @apply text-red-900;
}
.wrapOptions {
  @apply relative;
}
.listBoxOptions {
  @apply absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm;
}
.listBoxOptionsCheckIcon {
  @apply h-5 w-5;
}
.optionLi {
  @apply cursor-pointer select-none relative py-2 pl-8 pr-4;
}
.optionLiActive {
  @apply bg-gray-50;
}
.optionLiBase {
  @apply text-gray-900;
}
.optionLiDisabled {
  @apply cursor-default text-gray-500;
}
.optionLiSpan {
  @apply block truncate;
}
.optionLiSpanSelect {
  @apply font-semibold;
}
.optionLiSpanBase {
  @apply font-normal;
}
.optionLiSpanIcon {
  @apply absolute inset-y-0 left-0 flex items-center pl-1.5;
}
.optionLiSpanIconActive {
  @apply text-primary-600;
}
.optionLiSpanIconBase {
  @apply text-primary-600;
}
.invalidMessage {
  @apply mt-2 text-sm text-red-600;
}
</style>
