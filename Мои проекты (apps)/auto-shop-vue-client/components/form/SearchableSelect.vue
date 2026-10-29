<template>
  <div>
    <Combobox
      :key="comboboxKey"
      v-model="selectedOption"
      as="div"
      :multiple="multiple"
      :disabled="disabled"
      :by="optionComparator"
    >
      <ComboboxLabel
        v-if="label"
        :for="uuid"
        :class="$style.comboboxLabel"
      >
        {{ label }}<span
          v-if="required"
        > *</span>
      </ComboboxLabel>
      <p
        v-if="isHelper"
        :class="$style.helper"
      >
        <slot name="helper-text">
          {{ helperText }}
        </slot>
      </p>
      <div :class="$style.wrapOptions">
        <div
          ref="comboboxWrapperRef"
          :class="[
            $style.comboboxWrapper,
            isInvalid ? $style.comboboxWrapperInvalid : $style.comboboxWrapperBase,
            withBorder && $style.comboboxWrapperBorder,
            withBorderWithoutLeft && $style.comboboxWrapperBorderWithoutRoundLeft,
            withBorderWithoutRight && $style.comboboxWrapperBorderWithoutRoundRight,
            disabled && $style.comboboxWrapperDisabled,
          ]"
          :title="selectedTitle"
          @click="handleWrapperClick"
        >
          <div
            v-if="selectedOption && !props.multiple && !isInputFocused"
            :class="$style.selectedDisplay"
          >
            <template v-if="(selectedOption as any).image">
              <img
                :src="(selectedOption as any).image"
                :class="$style.optionImage"
                alt=""
              >
              <span>{{ (selectedOption as any).name }}</span>
            </template>
            <template v-else-if="(selectedOption as any).color">
              <span
                :class="$style.colorSquare"
                :style="{ backgroundColor: (selectedOption as any).color }"
              />
              <span>{{ (selectedOption as any).name }}</span>
            </template>
            <template v-else-if="String((selectedOption as any).value) === '__any__'">
              <span :class="[$style.colorSquare, $style.anySquare]">
                <CheckIcon
                  v-if="true"
                  :class="$style.comboboxOptionsCheckIcon"
                  aria-hidden="true"
                />
              </span>
              <span>{{ (selectedOption as any).name }}</span>
            </template>
          </div>
          <ComboboxInput
            ref="comboboxInputRef"
            :display-value="displayValue"
            :class="$style.comboboxInput"
            :placeholder="selectedOption && !props.multiple && !isInputFocused && ((selectedOption as any).color || (selectedOption as any).image) ? '' : placeholder || t('common.search')"
            :aria-label="label || placeholder || t('common.search')"
            @change="handleInputChange($event.target.value)"
            @focus="handleFocus"
            @blur="handleBlur"
          />
          <ComboboxButton
            :class="$style.comboboxButton"
            @click="emits('open')"
          >
            <ChevronDownIcon
              :class="[$style.comboboxButtonIcon, isInvalid && $style.comboboxButtonIconInvalid]"
              aria-hidden="true"
            />
          </ComboboxButton>
        </div>
        <TransitionRoot
          leave="transition ease-in duration-100"
          leave-from="opacity-100"
          leave-to="opacity-0"
          @after-leave="query = ''"
        >
          <ComboboxOptions :class="$style.comboboxOptions">
            <div
              v-if="!loading && filteredOptions.length === 0 && query !== ''"
              :class="$style.noResults"
            >
              {{ t('common.no_results') }}
            </div>
            <ComboboxOption
              v-for="option in filteredOptions"
              :key="option.value"
              v-slot="{ active, selected }: { active: boolean; selected: boolean }"
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
                <slot
                  name="option-prefix"
                  :option="option"
                  :active="active"
                  :selected="selected"
                >
                  <template v-if="String(option.value) !== '__loading__'">
                    <img
                      v-if="(option as any).image"
                      :src="(option as any).image"
                      :class="[
                        $style.optionImage,
                        $style.noShrink,
                      ]"
                      alt=""
                    >
                    <span
                      v-else-if="(option as OptionBaseColor).color"
                      :class="[
                        $style.colorSquare,
                        selected && $style.colorSquareSelected,
                        active && $style.colorSquareActive,
                        $style.noShrink,
                      ]"
                      :style="{ backgroundColor: (option as OptionBaseColor).color }"
                    >
                      <CheckIcon
                        v-if="selected"
                        :class="$style.comboboxOptionsCheckIcon"
                        :style="{ color: contrastCheckColor((option as OptionBaseColor).color) }"
                        aria-hidden="true"
                      />
                    </span>
                    <span
                      v-else-if="String(option.value) === '__any__'"
                      :class="[$style.colorSquare, $style.noShrink, $style.anySquare]"
                      aria-hidden="true"
                    >
                      <CheckIcon
                        v-if="selected"
                        :class="$style.comboboxOptionsCheckIcon"
                        aria-hidden="true"
                      />
                    </span>
                    <span
                      v-else
                      :class="[
                        $style.checkIconWrapper,
                        selected ? (active ? $style.checkIconWrapperActive : $style.checkIconWrapperBase) : $style.checkIconPlaceholder,
                        $style.noShrink,
                      ]"
                    >
                      <CheckIcon
                        v-if="selected"
                        :class="$style.comboboxOptionsCheckIcon"
                        aria-hidden="true"
                      />
                    </span>
                  </template>
                </slot>
                <span
                  :class="[
                    $style.optionLiSpan,
                    selected ? $style.optionLiSpanSelect : $style.optionLiSpanBase,
                  ]"
                  :title="String(option.name ?? '')"
                >
                  {{ option.name }}
                </span>
              </li>
            </ComboboxOption>
          </ComboboxOptions>
        </TransitionRoot>
      </div>
    </Combobox>
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
import { ref, computed, watch } from "vue"
import { Combobox, ComboboxButton, ComboboxInput, ComboboxLabel, ComboboxOption, ComboboxOptions, TransitionRoot } from "@headlessui/vue"
import { ChevronDownIcon } from "@heroicons/vue/20/solid"
import { CheckIcon } from "@heroicons/vue/24/outline"
import { useI18n } from "#imports"
import type { OptionBase, OptionBaseColor } from "@/types/form/optionType"

const { t } = useI18n()

interface Props {
  modelValue: OptionBase | string | number | OptionBase[] | undefined
  options: OptionBase[] | OptionBaseColor[]
  label?: string
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  withBorder?: boolean
  withBorderWithoutLeft?: boolean
  withBorderWithoutRight?: boolean
  id?: string
  invalidMessage?: string
  showInvalidMessage?: boolean
  helperText?: string
  required?: boolean
  multiple?: boolean
  defaultToFirstOption?: boolean
  allowCustomInput?: boolean
  returnValueOnly?: boolean
  by?: string | ((a: any, b: any) => boolean)
  displayFn?: (item: unknown) => string | undefined
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  placeholder: undefined,
  disabled: false,
  loading: false,
  withBorder: false,
  withBorderWithoutLeft: false,
  withBorderWithoutRight: false,
  id: undefined,
  invalidMessage: undefined,
  showInvalidMessage: true,
  helperText: undefined,
  required: false,
  multiple: false,
  defaultToFirstOption: true,
  allowCustomInput: false,
  returnValueOnly: false,
  by: "value",
  displayFn: undefined,
})

const emits = defineEmits(["update:modelValue", "open"])
const { isInvalid, isHelper, uuid } = useFormElements(props)

const query = ref("")
const isInputFocused = ref(false)
const dynamicOptions = ref<(OptionBase | OptionBaseColor)[]>([...props.options])
const comboboxKey = ref(0)
const comboboxWrapperRef = ref<HTMLElement | null>(null)
const comboboxInputRef = ref<{ $el?: HTMLInputElement } | HTMLInputElement | null>(null)

watch(() => props.options, (newOptions) => {
  dynamicOptions.value = [...newOptions]
}, { deep: true })

watch(() => props.modelValue, (newVal) => {
  if (newVal === undefined || newVal === null) {
    query.value = ""
    comboboxKey.value++
  }
})

const loadingOption = computed<OptionBase>(() => ({
  id: -1,
  value: "__loading__",
  name: t("common.loading"),
  disabled: true,
}))

const filteredOptions = computed(() => {
  if (props.loading) {
    return [loadingOption.value]
  }
  if (!query.value) {
    return dynamicOptions.value
  }
  const normalizedQuery = query.value.toLowerCase().replace(/\s+/g, "")
  return dynamicOptions.value.filter((option) => {
    const searchable = [
      String(option.name ?? ""),
      String((option as OptionBase & { searchText?: string }).searchText ?? ""),
    ].join(" ")
    return searchable
      .toLowerCase()
      .replace(/\s+/g, "")
      .includes(normalizedQuery)
  })
})

const optionIdentity = (item: unknown): string | number | undefined => {
  if (item == null || item === "") {
    return undefined
  }
  if (typeof item === "object" && "value" in (item as object)) {
    return (item as OptionBase).value
  }
  if (typeof item === "string" || typeof item === "number") {
    return item
  }
  return undefined
}

const optionComparator = (a: unknown, b: unknown): boolean => {
  if (typeof props.by === "function") {
    return props.by(a, b)
  }

  const left = optionIdentity(a)
  const right = optionIdentity(b)

  if (left == null && right == null) {
    return true
  }
  if (left == null || right == null) {
    return false
  }

  return String(left).toLowerCase() === String(right).toLowerCase()
}

const selectedOption = computed({
  get(): OptionBase | string | number | OptionBase[] | undefined {
    if (typeof props.modelValue !== "undefined" && props.modelValue !== null && props.modelValue !== "") {
      if (
        props.returnValueOnly
        && !props.multiple
        && (typeof props.modelValue === "string" || typeof props.modelValue === "number")
      ) {
        return dynamicOptions.value.find(option => optionComparator(option, props.modelValue)) ?? undefined
      }
      return props.modelValue
    }
    if (props.multiple) {
      emits("update:modelValue", [])
      return []
    }
    if (props.loading) {
      return undefined
    }
    if (!props.allowCustomInput && props.defaultToFirstOption && dynamicOptions.value.length > 0) {
      const firstOption = dynamicOptions.value[0]
      emits("update:modelValue", props.returnValueOnly ? firstOption.value : firstOption)
      return firstOption
    }
    return undefined
  },
  set(value: OptionBase | string | number | OptionBase[]) {
    if (props.returnValueOnly && !props.multiple && value && typeof value === "object" && "value" in value) {
      emits("update:modelValue", (value as OptionBase).value)
    }
    else {
      emits("update:modelValue", value)
    }
    query.value = ""
  },
})

const ALL_SENTINEL_VALUES = new Set(["", "__all__", "__any__", "__any_model__", "all"])

const isAllOption = (option: unknown): boolean => {
  if (!option || typeof option !== "object" || !("value" in (option as object))) {
    return false
  }

  const value = String((option as OptionBase).value ?? "")
  if (ALL_SENTINEL_VALUES.has(value)) {
    return true
  }

  const first = dynamicOptions.value[0]
  if (first?.id === 0 && optionComparator(option, first)) {
    return true
  }

  return false
}

const multipleSpecificSelection = (items: unknown[]): OptionBase[] =>
  items.filter((item): item is OptionBase => !isAllOption(item))

const multipleSelectionLabel = (items: unknown[]): string | undefined => {
  if (!Array.isArray(items) || items.length === 0) {
    return undefined
  }

  const specificItems = multipleSpecificSelection(items)
  if (specificItems.length === 0) {
    const allOption = items.find(item => isAllOption(item)) ?? items[0]
    if (allOption && typeof allOption === "object" && "name" in allOption) {
      return String((allOption as OptionBase).name ?? t("common.all"))
    }
    return t("common.all")
  }

  return `${t("common.selected")}: ${specificItems.length}`
}

const contrastCheckColor = (hex: string): string => {
  const c = (hex || "").replace("#", "")
  if (c.length !== 6) {
    return "#ffffff"
  }
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "#111827" : "#ffffff"
}

const displayValue = (item: unknown): string => {
  if (props.displayFn) {
    const customText = props.displayFn(item)
    if (customText !== undefined) {
      return customText
    }
  }
  if (!item || (props.multiple && Array.isArray(item) && item.length === 0)) {
    if (props.defaultToFirstOption && dynamicOptions.value.length > 0) {
      return String(dynamicOptions.value[0].name)
    }
    return props.placeholder || t("common.search")
  }
  if (props.multiple && Array.isArray(item)) {
    return multipleSelectionLabel(item) ?? (props.placeholder || t("common.search"))
  }
  if (props.returnValueOnly && (typeof item === "string" || typeof item === "number")) {
    const matchingOption = dynamicOptions.value.find(option => option.value === item)
    return matchingOption ? String(matchingOption.name) : String(item)
  }
  if (typeof item === "string" || typeof item === "number") {
    return String(item)
  }
  const option = item as any
  if (!isInputFocused.value && !props.multiple && (option.color || option.image)) {
    return ""
  }
  return String(option.name ?? "")
}

const selectedTitle = computed(() => {
  const selected = selectedOption.value
  if (!selected) {
    return undefined
  }
  if (props.multiple && Array.isArray(selected)) {
    if (selected.length === 0) {
      return undefined
    }

    const specificItems = multipleSpecificSelection(selected)
    if (specificItems.length === 0) {
      const allOption = selected.find(item => isAllOption(item)) ?? selected[0]
      return String((allOption as OptionBase).name ?? t("common.all"))
    }

    return specificItems.map(item => String(item.name ?? "")).filter(Boolean).join(", ")
  }
  if (typeof selected === "object" && selected !== null && "name" in selected) {
    return String((selected as OptionBase).name ?? "")
  }
  if (typeof selected === "string" || typeof selected === "number") {
    const matchingOption = dynamicOptions.value.find(option => optionComparator(option, selected))
    return matchingOption ? String(matchingOption.name) : String(selected)
  }
  return undefined
})

const handleFocus = () => {
  isInputFocused.value = true
  emits("open")
}

const handleWrapperClick = (event: MouseEvent) => {
  if (props.disabled) {
    return
  }

  const target = event.target as HTMLElement | null
  if (!target) {
    return
  }

  const wrapper = comboboxWrapperRef.value
  const button = wrapper?.querySelector("button")
  const inputCandidate = comboboxInputRef.value
  const input = inputCandidate instanceof HTMLInputElement
    ? inputCandidate
    : inputCandidate?.$el

  if (button && target.closest("button") !== button) {
    button.click()
  }

  input?.focus()
}

const handleInputChange = (value: string) => {
  query.value = value
  if (props.allowCustomInput && value) {
    const matchingOption = dynamicOptions.value.find(
      option => String(option.name).toLowerCase() === value.toLowerCase(),
    )
    if (matchingOption) {
      selectedOption.value = props.returnValueOnly ? matchingOption.value : matchingOption
    }
    else {
      const numericValue = parseFloat(value.replace(/,/g, ""))
      const newOptionValue = isNaN(numericValue) ? value : numericValue
      const newOption = {
        id: Math.max(0, ...dynamicOptions.value.map(o => o.id)) + 1,
        value: newOptionValue,
        name: String(newOptionValue),
        disabled: false,
      }
      dynamicOptions.value = [newOption, ...props.options]
      selectedOption.value = props.returnValueOnly ? newOption.value : newOption
    }
  }
}

const handleBlur = () => {
  isInputFocused.value = false
  if (props.allowCustomInput && query.value) {
    const matchingOption = dynamicOptions.value.find(
      option => String(option.name).toLowerCase() === query.value.toLowerCase(),
    )
    if (!matchingOption) {
      const numericValue = parseFloat(query.value.replace(/,/g, ""))
      const newOptionValue = isNaN(numericValue) ? query.value : numericValue
      const newOption = {
        id: Math.max(0, ...dynamicOptions.value.map(o => o.id)) + 1,
        value: newOptionValue,
        name: String(newOptionValue),
        disabled: false,
      }
      dynamicOptions.value = [newOption, ...props.options]
      selectedOption.value = props.returnValueOnly ? newOption.value : newOption
    }
    else {
      selectedOption.value = props.returnValueOnly ? matchingOption.value : matchingOption
    }
  }
}
</script>

<style module>
.comboboxLabel {
  @apply block text-sm font-medium leading-5 text-gray-700 mb-2;
}
.wrapOptions {
  @apply relative;
}
.comboboxWrapper {
  @apply relative w-full bg-white rounded-md text-left cursor-default focus:outline-none text-base sm:text-sm;
}
.comboboxWrapperBase {
  @apply border border-gray-300 focus:ring-black focus:border-black;
}
.comboboxWrapperInvalid {
  @apply border border-red-300 text-red-900 placeholder-red-300 focus:ring-primary-500 focus:border-primary-500;
}
.comboboxWrapperBorder {
  @apply shadow-sm;
}
.comboboxWrapperBorderWithoutRoundLeft {
  @apply rounded-none rounded-r-md;
}
.comboboxWrapperBorderWithoutRoundRight {
  @apply rounded-none rounded-l-md;
}
.comboboxWrapperDisabled {
  @apply bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed pointer-events-none;
}
.comboboxInput {
  @apply w-full pl-3 pr-10 py-2 border-0 focus:outline-none focus:ring-0 text-base sm:text-sm bg-transparent placeholder-gray-400;
}
.comboboxButton {
  @apply absolute inset-y-0 right-0 flex items-center px-2;
}
.comboboxButtonIcon {
  @apply h-5 w-5 text-gray-400;
}
.comboboxButtonIconInvalid {
  @apply text-red-900;
}
.comboboxOptions {
  @apply absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base sm:text-sm ring-1 ring-black/5 overflow-auto focus:outline-none top-full;
}
.noResults {
  @apply relative cursor-default select-none px-4 py-2 text-gray-700;
}
.comboboxOptionsCheckIcon {
  @apply h-4 w-4 text-white;
}
.colorSquare {
  @apply inline-flex items-center justify-center w-6 h-6 mr-2 rounded border border-gray-300;
  position: relative;
  color: #9ca3af;
}

.colorSquareSelected {
  @apply border-black;
}
.colorSquareActive {
  @apply border-white;
}
.optionImage {
  @apply w-5 h-5 mr-2 rounded object-cover bg-white hover:border hover:border-gray-200 transition-all duration-200;
}
.checkIconWrapper {
  @apply inline-flex items-center justify-center w-5 h-5 mr-2 rounded border border-black;
}
.checkIconWrapperBase {
  @apply bg-black;
}
.checkIconWrapperActive {
  @apply bg-white;
}
.checkIconWrapperActive .comboboxOptionsCheckIcon {
  @apply text-black;
}
.checkIconPlaceholder {
  @apply w-5 h-5 mr-2;
}
.optionLiActive .checkIconWrapper.checkIconPlaceholder {
  @apply border-white;
}
.noShrink {
  @apply flex-shrink-0;
}
.selectedDisplay {
  @apply absolute inset-y-0 left-0 flex items-center pl-3 text-base sm:text-sm text-gray-900 pointer-events-none;
}
.optionLi {
  @apply relative cursor-default select-none py-2 pl-3 pr-4 flex items-start;
}
.optionLiActive {
  @apply bg-black text-white;
}
.optionLiBase {
  @apply text-gray-900;
}
.optionLiDisabled {
  @apply cursor-default text-gray-500;
}
.optionLiSpan {
  @apply block whitespace-normal break-words line-clamp-3 max-w-[calc(100%-2.5rem)];
}
.optionLiSpanSelect {
  @apply font-medium;
}
.optionLiSpanBase {
  @apply font-normal;
}
.invalidMessage {
  @apply mt-2 text-sm text-red-600;
}
.helper {
  @apply mb-1 mt-[-0.5rem] text-sm text-gray-500;
}
.anySquare {
  --b: 1px;
  overflow: hidden;
}
.anySquare::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  height: var(--b);
  width: 140%;
  background-color: currentColor;
  transform: translate(-50%, -50%) rotate(-45deg);
  transform-origin: center;
}
.colorSquareSelected.anySquare { color: #000; }
.optionLiActive .anySquare     { color: #fff; }
</style>
