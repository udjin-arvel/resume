<template>
  <div :class="$attrs.class">
    <HeadlessListbox
      v-slot="{ open }"
      v-model="selectedOption"
      :by="compareOptions"
      :disabled="disabled"
      as="div"
    >
      <div
        v-if="label || $slots.label"
        :class="$style.labelWrapper"
      >
        <HeadlessListboxLabel :class="$style.label">
          <slot name="label">
            {{ label }}
          </slot>
          <span v-if="required"> *</span>
        </HeadlessListboxLabel>
        <div
          v-if="$slots['label-extra']"
          :class="$style.labelExtra"
        >
          <slot name="label-extra" />
        </div>
      </div>

      <p
        v-if="isHelper"
        :class="$style.helper"
      >
        <slot name="helper-text">
          {{ helperText }}
        </slot>
      </p>

      <div :class="$style.wrapOptions">
        <HeadlessListboxButton
          :id="uuid"
          :class="[
            $style.listBoxButton,
            isInvalid ? $style.listBoxButtonInvalid : $style.listBoxButtonBorder,
            disabled && $style.listBoxButtonDisabled,
          ]"
        >
          <span
            :class="[
              $style.listBoxButtonName,
              !selectedOption && $style.placeholder,
            ]"
          >
            {{ selectedOption?.name ?? placeholderText }}
          </span>
          <span :class="$style.listBoxButtonBlock">
            <ChevronDownIcon :class="[$style.listBoxButtonIcon, open && $style.listBoxButtonIconOpen]" />
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
              v-if="showPlaceholderOption"
              v-slot="{ active, selected }: { active: boolean; selected: boolean }"
              as="template"
              :value="undefined"
            >
              <li :class="optionClasses(active, selected, false)">
                <span :class="[selected ? $style.optionLiSpanSelect : $style.optionLiSpanBase, $style.optionLiSpan, $style.placeholder]">
                  {{ placeholderText }}
                </span>
              </li>
            </HeadlessListboxOption>

            <HeadlessListboxOption
              v-for="option in displayOptions"
              :key="option.value"
              v-slot="{ active, selected }: { active: boolean; selected: boolean }"
              as="template"
              :value="option"
              :disabled="option.disabled ?? false"
            >
              <li :class="optionClasses(active, selected, !!option.disabled)">
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
import { Listbox as HeadlessListbox, ListboxButton as HeadlessListboxButton, ListboxLabel as HeadlessListboxLabel, ListboxOption as HeadlessListboxOption, ListboxOptions as HeadlessListboxOptions } from "@headlessui/vue"
import { ChevronDownIcon } from "@heroicons/vue/20/solid"
import { CheckIcon } from "@heroicons/vue/24/outline"
import { useI18n } from "vue-i18n"
import type { OptionBase } from "@/types/form/optionType"

const props = defineProps<{
  id?: string
  label?: string
  invalidMessage?: string
  helperText?: string
  modelValue: string | number | undefined
  options: OptionBase[]
  disabled?: boolean
  loading?: boolean
  required?: boolean
  placeholder?: string
}>()

const emits = defineEmits(["update:modelValue"])

const { isInvalid, isHelper, uuid } = useFormElements(props)
const { t } = useI18n()
const styles = useCssModule()

const placeholderText = computed(() => props.placeholder || t("common.default_select_placeholder"))

const loadingOption = computed<OptionBase>(() => ({
  id: -1,
  value: "__loading__",
  name: t("common.loading"),
  disabled: true,
}))

const displayOptions = computed(() => {
  if (props.loading) {
    return [loadingOption.value]
  }
  return props.options
})

const selectedOption = computed<OptionBase | undefined>({
  get() {
    if (typeof props.modelValue === "undefined" || props.modelValue === "") {
      return undefined
    }

    return props.options.find(option => compareOptions(option, props.modelValue)) ?? undefined
  },
  set(value) {
    emits("update:modelValue", value?.value)
  },
})

const showPlaceholderOption = computed(() => !props.required && !props.loading)

function compareOptions(a?: OptionBase | string | number, b?: OptionBase | string | number): boolean {
  const left = typeof a === "object" ? a?.value : a
  const right = typeof b === "object" ? b?.value : b

  if (left == null && right == null) {
    return true
  }
  if (left == null || right == null) {
    return false
  }

  return String(left).toLowerCase() === String(right).toLowerCase()
}

function optionClasses(active: boolean, selected: boolean, disabled: boolean) {
  return [
    styles.optionLi,
    active ? styles.optionLiActive : styles.optionLiBase,
    selected && styles.optionLiSelected,
    disabled && styles.optionLiDisabled,
  ]
}
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<style module>
.labelWrapper {
  @apply flex items-center justify-between mb-2;
}
.label {
  @apply block text-sm font-medium leading-5 text-gray-700;
}
.labelExtra {
  @apply text-sm;
}

.wrapOptions {
  @apply relative;
}

.listBoxButton {
  @apply relative w-full rounded-md bg-white pl-3 pr-10 py-2 text-left text-base text-gray-900 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-0 sm:text-sm;
}

.listBoxButtonBorder {
  @apply border border-gray-300 focus:border-black;
}

.listBoxButtonInvalid {
  @apply border border-red-300 focus:border-primary-500;
}

.listBoxButtonDisabled {
  @apply cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500;
}

.listBoxButtonName {
  @apply block truncate;
}

.placeholder {
  @apply text-gray-400;
}

.listBoxButtonBlock {
  @apply pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2;
}

.listBoxButtonIcon {
  @apply h-5 w-5 text-gray-400 transition-transform duration-200;
}

.listBoxButtonIconOpen {
  @apply rotate-180;
}

.listBoxOptions {
  @apply absolute top-full z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm;
}

.listBoxOptionsCheckIcon {
  @apply h-5 w-5;
}

.optionLi {
  @apply relative cursor-pointer select-none py-2 pl-8 pr-4;
}

.optionLiActive {
  @apply bg-gray-50 text-gray-900;
}

.optionLiBase {
  @apply text-gray-900;
}

.optionLiSelected {
  @apply bg-gray-50;
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

.helper {
  @apply mt-2 text-sm text-gray-500;
}
</style>
