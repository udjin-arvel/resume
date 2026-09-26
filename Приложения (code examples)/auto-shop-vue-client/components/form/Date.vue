<template>
  <div>
    <div :class="$style.labelWrapper">
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
      <div :class="$style.labelExtra">
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
    <div :class="$style.inputWrapper">
      <VueDatePicker
        :id="uuid"
        v-model="model"
        v-bind="$attrs"
        :input-class="isInvalid ? $style.inputInvalid : $style.input"
        :placeholder="placeholder"
        :disabled="disabled"
        :format="formatDate"
        :format-locale="localeComputed"
        :class="$style.datepicker"
        :enable-time-picker="false"
        :auto-apply="true"
        :disabled-dates="computedDisabledDates"
        :range="range"
      />
    </div>
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
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import VueDatePicker from "@vuepic/vue-datepicker"
import "@vuepic/vue-datepicker/dist/main.css"
import { ru } from "date-fns/locale/ru"
import { zhCN } from "date-fns/locale/zh-CN"
import { chinese } from "~/constants/lang"

interface DateProps {
  id?: string
  label?: string
  labelSub?: string
  invalidMessage?: string
  autocomplete?: "off" | "on"
  helperText?: string
  modelValue: string | Date | Date[] | null
  placeholder?: string
  disabled?: boolean
  format?: string
  locale?: any
  disablePastDates?: boolean
  disabledFutureDates?: boolean
  range?: boolean
}

const props = withDefaults(defineProps<DateProps>(), {
  disablePastDates: false,
  disabledFutureDates: false,
  range: false,
})

const emit = defineEmits(["update:modelValue"])
const { isInvalid, isHelper, uuid } = useFormElements(props)

const { locale: currentLocale } = useI18n()

const model = computed({
  get: () => props.modelValue,
  set: v => emit("update:modelValue", v),
})

const localeComputed = computed(() => {
  if (props.locale) {
    return props.locale
  }
  if (currentLocale.value === chinese) {
    return zhCN
  }
  return ru
})

const formatDate = (date: Date | Date[]) => {
  if (!date) {
    return ""
  }

  const formatSingle = (d: Date) => {
    const parsed = d instanceof Date ? d : new Date(d)
    if (Number.isNaN(parsed.getTime())) {
      return ""
    }
    const day = String(parsed.getDate()).padStart(2, "0")
    const month = String(parsed.getMonth() + 1).padStart(2, "0")
    const year = parsed.getFullYear()
    return `${day}.${month}.${year}`
  }

  if (Array.isArray(date)) {
    if (date.length === 2 && date[0] && date[1]) {
      return `${formatSingle(date[0])} - ${formatSingle(date[1])}`
    }
    return ""
  }

  return formatSingle(date)
}

const computedDisabledDates = computed(() => {
  const { disablePastDates, disabledFutureDates } = props

  if (!disablePastDates && !disabledFutureDates) {
    return undefined
  }

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  return (date: Date) => {
    if (disablePastDates && date < startOfToday) {
      return true
    }
    if (disabledFutureDates && date > endOfToday) {
      return true
    }
    return false
  }
})
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
.input::placeholder {
  @apply text-gray-400;
}
.inputInvalid {
  @apply block w-full px-3 py-2 pr-10 rounded-md border border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm;
}
.inputInvalid::placeholder {
  @apply text-red-300;
}
.datepicker {
  @apply w-full;
}
.invalidMessage {
  @apply mt-2 text-sm text-red-600;
}
.helper {
  @apply text-sm text-gray-500 mt-[-0.5rem] mb-[0.5rem];
}
</style>
