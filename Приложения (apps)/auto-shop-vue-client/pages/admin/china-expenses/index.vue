<template>
  <div>
    <div :class="$style.header">
      <h1 :class="$style.title">
        {{ t("china_expenses.settings.title") }}
      </h1>
    </div>

    <div :class="$style.wrapper">
      <div :class="$style.container">
        <Select
          v-model="selectedClientId"
          :options="companyOptions"
          :label="t('china_expenses.admin.select_label')"
          :placeholder="t('china_expenses.admin.select_placeholder')"
          :class="$style.companySelect"
          @update:model-value="onCompanyChange"
        />

        <p
          v-if="!selectedClientId"
          :class="$style.hint"
        >
          {{ t("china_expenses.admin.pick_company") }}
        </p>

        <template v-else>
          <p
            v-if="!isLoading && !rows.length"
            :class="$style.hint"
          >
            {{ t("china_expenses.admin.no_ports") }}
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

            <div :class="$style.settingRow">
              <span :class="$style.settingLabel">{{ t("china_expenses.admin.mode_label") }}:</span>
              <span :class="$style.settingValue">{{ modeLabel(row) }}</span>
            </div>

            <div
              v-if="row.mode !== 'base'"
              :class="$style.settingRow"
            >
              <span :class="$style.settingLabel">{{ amountLabel(row) }}:</span>
              <span :class="$style.settingValue">{{ formatBalance(row.amount || 0, CNY) }}</span>
            </div>

            <p
              v-if="belowBase(row)"
              :class="$style.warning"
            >
              {{ t("china_expenses.settings.below_base_warning") }}
            </p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import Select from "@/components/form/Select.vue"
import { useApiChinaExpenses } from "@/composables/api/useApiChinaExpenses"
import { useApiClient } from "@/composables/api/useApiClient"
import { useMoney } from "@/composables/useMoney"
import { useNotificationsStore } from "@/stores/notifications"
import { CNY } from "@/constants/currency"
import { RoleAdmin } from "~/constants/roles"
import type { ChinaExpensesPortSetting } from "@/types/responses/chinaExpenses"
import type { OptionBase } from "@/types/form/optionType"

definePageMeta({
  layout: "personal",
  hideTitle: true,
  auth: true,
  roles: [RoleAdmin],
})

const { t, locale } = useI18n()
const { showForClient } = useApiChinaExpenses()
const { index: listClients } = useApiClient()
const { formatBalance } = useMoney()
const { errorNotify } = useNotificationsStore()

const companyOptions = ref<OptionBase[]>([])
const selectedClientId = ref<number | string>("")
const rows = ref<ChinaExpensesPortSetting[]>([])
const isLoading = ref(false)

const portName = (row: ChinaExpensesPortSetting) => {
  if (locale.value === "zh" && row.nameZh) {
    return row.nameZh
  }
  return row.nameRu || row.portCode
}

const baseText = (row: ChinaExpensesPortSetting) => {
  if (row.pricingType === "fixed" && row.baseTotal !== null) {
    return t("china_expenses.settings.base_fixed", { amount: formatBalance(row.baseTotal, CNY) })
  }
  return t("china_expenses.settings.base_per_city", { amount: formatBalance(row.baseSurcharge, CNY) })
}

const modeLabel = (row: ChinaExpensesPortSetting) => {
  if (row.mode === "base") {
    return t("china_expenses.settings.mode_base")
  }
  if (row.pricingType === "fixed") {
    return t("china_expenses.settings.mode_own")
  }
  return row.mode === "markup"
    ? t("china_expenses.settings.mode_markup")
    : t("china_expenses.settings.mode_fixed")
}

const amountLabel = (row: ChinaExpensesPortSetting) => row.mode === "markup"
  ? t("china_expenses.settings.amount_label_markup")
  : t("china_expenses.settings.amount_label_fixed")

const belowBase = (row: ChinaExpensesPortSetting) => {
  if (row.mode !== "fixed" || !row.amount) {
    return false
  }
  const base = row.pricingType === "fixed" && row.baseTotal !== null
    ? row.baseTotal
    : row.baseSurcharge
  return base > 0 && row.amount < base
}

const loadCompanies = async () => {
  try {
    const response = await listClients({ limit: -1 })
    companyOptions.value = (response.data ?? []).map(company => ({
      id: company.id,
      value: company.id,
      name: company.name,
      disabled: false,
    }))
  }
  catch {
    errorNotify(t("notification.response_status.unknown_error"))
  }
}

const onCompanyChange = async (clientId: number | string) => {
  if (!clientId) {
    rows.value = []
    return
  }
  isLoading.value = true
  try {
    const response = await showForClient(clientId)
    rows.value = response.data
  }
  catch {
    errorNotify(t("notification.response_status.unknown_error"))
    rows.value = []
  }
  finally {
    isLoading.value = false
  }
}

onMounted(loadCompanies)
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

.companySelect {
  @apply mb-6;
}

.hint {
  @apply text-gray-500;
}

.section {
  @apply mb-6 bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-y-3;
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

.settingRow {
  @apply flex items-baseline gap-2;
}

.settingLabel {
  @apply text-gray-700;
}

.settingValue {
  @apply text-black font-medium;
}

.warning {
  @apply text-sm text-red-600 mt-1;
}
</style>
