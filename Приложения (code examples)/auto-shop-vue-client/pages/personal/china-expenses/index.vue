<template>
  <div>
    <div :class="$style.header">
      <h1 :class="$style.title">
        {{ t("china_expenses.settings.title") }}
      </h1>
    </div>

    <div :class="$style.wrapper">
      <div :class="$style.container">
        <p :class="$style.description">
          {{ t("china_expenses.settings.description") }}
        </p>

        <div
          v-for="row in rows"
          :key="row.portCode"
          :class="$style.section"
        >
          <div :class="$style.portHeader">
            <span :class="$style.portName">{{ portName(row) }}</span>
            <span :class="$style.portBase">{{ baseText(row) }}</span>
          </div>

          <FormRadio
            v-model="row.mode"
            :name="`mode-${row.portCode}`"
            :options="modeOptions(row)"
            direction="column"
            :disabled="row.saving"
            @update:model-value="row.amountError = ''"
          />

          <FormInput
            v-if="row.mode !== 'base'"
            v-model="row.amountInput"
            :name="`amount-${row.portCode}`"
            type="number"
            :label="amountLabel(row)"
            :placeholder="t('china_expenses.settings.amount_placeholder')"
            :disabled="row.saving"
            :invalid-message="row.amountError"
            :class="$style.amount"
            @input="row.amountError = ''"
          />

          <p
            v-if="belowBaseWarning(row)"
            :class="$style.warning"
          >
            {{ t("china_expenses.settings.below_base_warning") }}
          </p>

          <div :class="$style.actions">
            <CommonButton
              kind="black"
              :disabled="row.saving"
              @click="save(row)"
            >
              {{ t("china_expenses.settings.save") }}
            </CommonButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import CommonButton from "@/components/common/Button.vue"
import FormInput from "@/components/form/Input.vue"
import FormRadio from "@/components/form/Radio.vue"
import { useApiChinaExpenses } from "@/composables/api/useApiChinaExpenses"
import { useMoney } from "@/composables/useMoney"
import { useNotificationsStore } from "@/stores/notifications"
import { CNY } from "@/constants/currency"
import { RoleDirector } from "~/constants/roles"
import type { ChinaExpensesPortSetting } from "@/types/responses/chinaExpenses"
import type { OptionBase } from "@/types/form/optionType"

definePageMeta({
  layout: "personal",
  hideTitle: true,
  auth: true,
  roles: [RoleDirector],
})

interface SettingRow extends ChinaExpensesPortSetting {
  amountInput: string
  amountError: string
  saving: boolean
}

const { t, locale } = useI18n()
const { index, update } = useApiChinaExpenses()
const { formatBalance } = useMoney()
const { successNotify, errorNotify } = useNotificationsStore()

const rows = ref<SettingRow[]>([])

const portName = (row: SettingRow) => {
  if (locale.value === "zh" && row.nameZh) {
    return row.nameZh
  }
  return row.nameRu || row.portCode
}

const baseText = (row: SettingRow) => {
  if (row.pricingType === "fixed" && row.baseTotal !== null) {
    return t("china_expenses.settings.base_fixed", { amount: formatBalance(row.baseTotal, CNY) })
  }
  return t("china_expenses.settings.base_per_city", { amount: formatBalance(row.baseSurcharge, CNY) })
}

const modeOptions = (row: SettingRow): OptionBase[] => {
  if (row.pricingType === "fixed") {
    return [
      { id: 1, value: "base", name: t("china_expenses.settings.mode_base"), disabled: false },
      { id: 2, value: "fixed", name: t("china_expenses.settings.mode_own"), disabled: false },
    ]
  }
  return [
    { id: 1, value: "base", name: t("china_expenses.settings.mode_base"), disabled: false },
    { id: 2, value: "markup", name: t("china_expenses.settings.mode_markup"), disabled: false },
    { id: 3, value: "fixed", name: t("china_expenses.settings.mode_fixed"), disabled: false },
  ]
}

const amountLabel = (row: SettingRow) => row.mode === "markup"
  ? t("china_expenses.settings.amount_label_markup")
  : t("china_expenses.settings.amount_label_fixed")

const belowBaseWarning = (row: SettingRow) => {
  if (row.mode !== "fixed" || !row.amountInput) {
    return false
  }
  const amount = Number(row.amountInput)
  if (Number.isNaN(amount) || amount <= 0) {
    return false
  }
  const base = row.pricingType === "fixed" && row.baseTotal !== null
    ? row.baseTotal
    : row.baseSurcharge
  return amount < base
}

const load = async () => {
  try {
    const response = await index()
    rows.value = response.data.map(setting => ({
      ...setting,
      amountInput: setting.amount !== null ? String(setting.amount) : "",
      amountError: "",
      saving: false,
    }))
  }
  catch {
    errorNotify(t("notification.response_status.unknown_error"))
  }
}

const save = async (row: SettingRow) => {
  const amount = Number(row.amountInput)

  if (row.mode !== "base" && (!row.amountInput || Number.isNaN(amount) || amount <= 0)) {
    row.amountError = t("china_expenses.settings.amount_invalid")
    return
  }

  row.saving = true
  try {
    const response = await update(row.portCode, {
      mode: row.mode,
      amount: row.mode === "base" ? null : amount,
    })
    row.mode = response.data.mode
    row.amount = response.data.amount
    row.amountInput = response.data.amount !== null ? String(response.data.amount) : ""
    successNotify(t("china_expenses.settings.saved", { port: portName(row) }))
  }
  catch {
    errorNotify(t("notification.response_status.unknown_error"))
  }
  finally {
    row.saving = false
  }
}

onMounted(load)
</script>

<style module>
.header {
  @apply flex items-start justify-between gap-4 mb-6;
}

.title {
  @apply text-3xl font-bold leading-tight;
}

.wrapper {
  @apply flex flex-col lg:flex-row gap-4;
}

.container {
  @apply w-full lg:w-1/2 pr-4;
}

.description {
  @apply text-gray-600 mb-6;
}

.section {
  @apply mb-6 bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-y-4;
}

.portHeader {
  @apply flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1;
}

.portName {
  @apply text-lg font-semibold;
}

.portBase {
  @apply text-sm text-gray-500;
}

.amount {
  @apply w-full sm:max-w-xs;
}

.warning {
  @apply text-sm text-red-600;
}

.actions {
  @apply flex gap-4;
}
</style>
