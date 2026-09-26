<template>
  <div :class="$style.container">
    <div :class="$style.formContainer">
      <div :class="$style.titleRow">
        <div :class="$style.title">
          {{ t('calc.ports_title') }}
        </div>
        <Button
          kind="black"
          size="sm"
          :disabled="isLoading"
          @click="toggleCreateForm"
        >
          {{ t('calc.add_port') }}
        </Button>
      </div>

      <div
        v-if="showCreateForm"
        :class="$style.createForm"
      >
        <div :class="$style.createGrid">
          <Input
            v-model="createForm.name_ru"
            :label="t('calc.port_name_ru')"
            placeholder="Суйфэньхэ"
            class="w-full"
            :invalid-message="createErrors.get('name_ru')"
            @update:model-value="() => createErrors.clear('name_ru')"
          />
          <Input
            v-model="createForm.name_zh"
            :label="t('calc.port_name_zh')"
            placeholder="绥芬河"
            class="w-full"
            :invalid-message="createErrors.get('name_zh')"
            @update:model-value="() => createErrors.clear('name_zh')"
          />
          <Input
            v-model="createForm.code"
            :label="t('calc.port_code')"
            placeholder="suifenhe"
            class="w-full"
            :invalid-message="createErrors.get('code')"
            @update:model-value="() => createErrors.clear('code')"
          />
          <InputNumber
            v-model="createForm.surcharge"
            :label="t('calc.port_surcharge')"
            placeholder="0"
            class="w-full"
            :is-invalid="!!createErrors.has('surcharge')"
            :invalid-message="createErrors.get('surcharge') || ''"
          />
          <Select
            v-model="createForm.pricing_type"
            :label="t('calc.pricing_type')"
            :options="pricingOptions"
            class="w-full"
          />
          <InputNumber
            v-if="createForm.pricing_type === 'fixed'"
            v-model="createForm.fixed_delivery_cost"
            :label="t('calc.fixed_delivery_cost')"
            placeholder="0"
            class="w-full"
            :is-invalid="!!createErrors.has('fixed_delivery_cost')"
            :invalid-message="createErrors.get('fixed_delivery_cost') || ''"
          />
        </div>

        <div :class="$style.invoiceTitle">
          {{ t('calc.port_invoice_section') }}
        </div>
        <div :class="$style.createGrid">
          <Input
            v-for="field in PORT_INVOICE_FIELDS"
            :key="field"
            v-model="createForm.invoice[field]"
            :label="t(`calc.port_${field}`)"
            class="w-full"
            :invalid-message="createErrors.get(field)"
            @update:model-value="() => createErrors.clear(field)"
          />
        </div>

        <div :class="$style.createActions">
          <Button
            kind="black"
            size="base"
            :disabled="isLoading"
            @click="createPort"
          >
            {{ t('calc.create') }}
          </Button>
          <Button
            kind="lightgrey"
            size="base"
            @click="toggleCreateForm"
          >
            {{ t('calc.cancel') }}
          </Button>
        </div>
      </div>

      <div :class="$style.portList">
        <div
          v-for="port in ports"
          :key="port.id"
          :class="[$style.portCard, !port.active ? $style.portCardInactive : '']"
        >
          <div :class="$style.portHeader">
            <div :class="$style.portHeaderInfo">
              <span :class="$style.portName">{{ port.name_ru || port.code }}</span>
              <span :class="$style.portCode">{{ port.code }}</span>
              <span :class="$style.portBadge">{{ pricingLabel(port.pricing_type) }}</span>
              <span
                v-if="!port.active"
                :class="$style.portBadgeMuted"
              >
                {{ t('calc.port_disabled') }}
              </span>
            </div>
            <div :class="$style.portHeaderActions">
              <Button
                kind="black"
                size="sm"
                :disabled="isLoading"
                @click="saveRow(port)"
              >
                {{ t('calc.save') }}
              </Button>
              <Button
                v-if="port.active"
                kind="redOutline"
                size="sm"
                :disabled="isLoading"
                @click="softDelete(port)"
              >
                {{ t('calc.delete') }}
              </Button>
              <Button
                v-else
                kind="successOutline"
                size="sm"
                :disabled="isLoading"
                @click="activate(port)"
              >
                {{ t('calc.activate') }}
              </Button>
            </div>
          </div>

          <div :class="$style.fieldGrid">
            <Input
              v-model="port.name_ru"
              :label="t('calc.port_name_ru')"
              class="w-full"
              :invalid-message="rowError(port.id, 'name_ru')"
            />
            <Input
              v-model="port.name_zh"
              :label="t('calc.port_name_zh')"
              class="w-full"
              :invalid-message="rowError(port.id, 'name_zh')"
            />
            <InputNumber
              v-model="port.surcharge"
              :label="t('calc.port_surcharge')"
              placeholder="0"
              class="w-full"
              :invalid-message="rowError(port.id, 'surcharge')"
            />
            <Select
              v-model="port.pricing_type"
              :label="t('calc.pricing_type')"
              :options="pricingOptions"
              class="w-full"
            />
            <InputNumber
              v-if="port.pricing_type === 'fixed'"
              v-model="port.fixed_delivery_cost"
              :label="t('calc.fixed_delivery_cost')"
              placeholder="0"
              class="w-full"
              :invalid-message="rowError(port.id, 'fixed_delivery_cost')"
            />
          </div>

          <button
            type="button"
            :class="$style.detailsToggle"
            @click="toggleDetails(port.id)"
          >
            <ChevronDownIcon
              :class="[$style.detailsChevron, expandedPorts.has(port.id) ? $style.detailsChevronOpen : '']"
            />
            {{ t('calc.port_invoice_section') }}
          </button>

          <div
            v-if="expandedPorts.has(port.id)"
            :class="$style.portDetails"
          >
            <Input
              v-for="field in PORT_INVOICE_FIELDS"
              :key="field"
              v-model="port.invoice[field]"
              :label="t(`calc.port_${field}`)"
              class="w-full"
              :invalid-message="rowError(port.id, field)"
            />
          </div>
        </div>
      </div>
    </div>

    <div :class="$style.formContainer">
      <div :class="$style.title">
        {{ t('calc.new_cars_expenses') }}
      </div>
      <div :class="$style.inputContainer">
        <div :class="$style.row">
          <Select
            v-model="fuelTypeUsedLocal"
            :label="t('calc.fuel_type')"
            :options="fuelOptions"
            disabled
            :class="$style.fuelSelect"
          />
          <div :class="$style.iconWrapper">
            <ArrowRightIcon :class="$style.icon" />
          </div>
          <Select
            v-model="carPriceUsed"
            :label="t('calc.car_price')"
            :options="carPriceOptions"
            disabled
            :class="$style.carPriceSelect"
          />
          <div :class="$style.iconWrapper">
            <XMarkIcon :class="$style.icon" />
          </div>
          <InputNumber
            v-model="coefficientUsed"
            :label="t('calc.coefficient')"
            :class="$style.smallInput"
            :is-invalid="!!errorsNew.has('coefficient')"
            :invalid-message="errorsNew.get('coefficient') || ''"
            :step="0.001"
            :precision="3"
          />
          <div :class="$style.iconWrapper">
            <PlusIcon :class="$style.icon" />
          </div>
          <InputNumber
            v-model="fixedAmountUsed"
            :label="t('calc.fixed_amount_yuan')"
            :class="$style.smallInput"
            :is-invalid="!!errorsNew.has('surcharge')"
            :invalid-message="errorsNew.get('surcharge') || ''"
          />
        </div>
        <div :class="$style.row">
          <Select
            v-model="fuelTypeNew"
            :label="t('calc.fuel_type')"
            :options="fuelOptions"
            disabled
            :class="$style.fuelSelect"
          />
          <div :class="$style.iconWrapper">
            <ArrowRightIcon :class="$style.icon" />
          </div>
          <Select
            v-model="carPriceNew"
            :label="t('calc.car_price')"
            :options="carPriceOptions"
            disabled
            :class="$style.carPriceSelect"
          />
          <div :class="$style.iconWrapper">
            <MinusIcon :class="$style.icon" />
          </div>
        </div>
      </div>
      <div :class="$style.buttonContainer">
        <Button
          kind="black"
          size="base"
          :disabled="isLoading"
          @click="saveNew"
        >
          {{ t('calc.save') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { useI18n } from "vue-i18n"
import { ArrowRightIcon, XMarkIcon, PlusIcon, MinusIcon, ChevronDownIcon } from "@heroicons/vue/24/solid"
import { RoleAdmin, RoleLogistic } from "~/constants/roles"
import Select from "@/components/form/Select.vue"
import Input from "@/components/form/Input.vue"
import InputNumber from "@/components/form/InputNumber.vue"
import Button from "@/components/common/Button.vue"
import useCalcOptions from "@/composables/useCalcOptions"
import { useApiPorts } from "@/composables/api/useApiPorts"
import Errors from "@/classes/errors"
import type { OptionBase } from "@/types/form/optionType"
import type { PortUpdateBody, PortPricingType, PortInvoice, PortRow, PortFormFields } from "@/types/responses/port"
import { PORT_INVOICE_FIELDS } from "@/constants/ports"

const emptyInvoice = (): PortInvoice =>
  Object.fromEntries(PORT_INVOICE_FIELDS.map(f => [f, ""])) as PortInvoice

const invoiceToBody = (invoice: PortInvoice): PortUpdateBody =>
  Object.fromEntries(
    PORT_INVOICE_FIELDS.map(f => [f, invoice[f].trim() || null]),
  ) as PortUpdateBody

definePageMeta({
  auth: true,
  layout: "personal",
  roles: [RoleAdmin, RoleLogistic],
})

const { t } = useI18n()

const {
  isLoading,
  coefficientUsed,
  fixedAmountUsed,
  fuelTypeUsed,
  errorsNew,
  load,
  saveNew,
} = useCalcOptions()

const { adminIndex, store, update, destroy } = useApiPorts()

const ports = ref<PortRow[]>([])
const expandedPorts = ref<Set<number>>(new Set())
const showCreateForm = ref(false)
const createErrors = ref(new Errors())
const createForm = ref({
  name_ru: "",
  name_zh: "",
  code: "",
  surcharge: undefined as number | undefined,
  pricing_type: "per_city" as PortPricingType,
  fixed_delivery_cost: undefined as number | undefined,
  invoice: emptyInvoice(),
})

const pricingOptions = computed<OptionBase[]>(() => [
  { id: 1, value: "per_city", name: t("calc.pricing_per_city"), disabled: false },
  { id: 2, value: "fixed", name: t("calc.pricing_fixed"), disabled: false },
])

const pricingLabel = (type: PortPricingType): string =>
  type === "fixed" ? t("calc.pricing_fixed") : t("calc.pricing_per_city")

const reloadPorts = async () => {
  const response = await adminIndex()
  ports.value = (response.data || []).map(port => ({
    id: port.id,
    code: port.code,
    name_ru: port.name_ru ?? "",
    name_zh: port.name_zh ?? "",
    surcharge: port.surcharge ?? 0,
    pricing_type: port.pricing_type ?? "per_city",
    fixed_delivery_cost: port.fixed_delivery_cost ?? undefined,
    active: port.active,
    sort: port.sort,
    invoice: Object.fromEntries(
      PORT_INVOICE_FIELDS.map(f => [f, port[f] ?? ""]),
    ) as PortInvoice,
  }))
}

const toggleDetails = (id: number) => {
  if (expandedPorts.value.has(id)) {
    expandedPorts.value.delete(id)
    return
  }

  expandedPorts.value.add(id)
}

const toggleCreateForm = () => {
  showCreateForm.value = !showCreateForm.value
  createErrors.value.clear()
  createForm.value = {
    name_ru: "",
    name_zh: "",
    code: "",
    surcharge: undefined,
    pricing_type: "per_city",
    fixed_delivery_cost: undefined,
    invoice: emptyInvoice(),
  }
}

const buildPortErrors = (data: PortFormFields, withCode: boolean): Record<string, string[]> => {
  const errs: Record<string, string[]> = {}
  const required = (isEmpty: boolean, key: string) => {
    if (isEmpty) {
      errs[key] = [t("validation.required")]
    }
  }

  if (withCode) {
    required(!data.code?.trim(), "code")
  }
  required(!data.name_ru.trim(), "name_ru")
  required(!data.name_zh.trim(), "name_zh")
  required(data.surcharge == null, "surcharge")
  for (const field of PORT_INVOICE_FIELDS) {
    required(!data.invoice[field].trim(), field)
  }
  if (data.pricing_type === "fixed") {
    required(data.fixed_delivery_cost == null, "fixed_delivery_cost")
  }
  return errs
}

const rowErrors = ref<Record<number, Errors>>({})

const rowError = (id: number, field: string): string | undefined => {
  const errs = rowErrors.value[id]
  return errs?.has(field) ? errs.get(field) : undefined
}

const setRowErrors = (id: number, data: Record<string, string[]>) => {
  const errs = new Errors()
  errs.record(data)
  rowErrors.value[id] = errs
  if (PORT_INVOICE_FIELDS.some(field => field in data)) {
    expandedPorts.value.add(id)
  }
}

const createPort = async () => {
  const errs = buildPortErrors(createForm.value, true)
  if (Object.keys(errs).length > 0) {
    createErrors.value.record(errs)
    return
  }
  createErrors.value.clear()
  try {
    await store({
      code: createForm.value.code,
      name_ru: createForm.value.name_ru,
      name_zh: createForm.value.name_zh,
      surcharge: createForm.value.surcharge ?? 0,
      pricing_type: createForm.value.pricing_type,
      fixed_delivery_cost: createForm.value.pricing_type === "fixed"
        ? createForm.value.fixed_delivery_cost ?? 0
        : null,
      ...invoiceToBody(createForm.value.invoice),
    })
    showCreateForm.value = false
    await reloadPorts()
  }
  catch (error: any) {
    if (error?.data?.errors) {
      createErrors.value.record(error.data.errors)
    }
  }
}

const saveRow = async (port: PortRow) => {
  const errs = buildPortErrors(port, false)
  if (Object.keys(errs).length > 0) {
    setRowErrors(port.id, errs)
    return
  }
  try {
    await update(port.id, {
      name_ru: port.name_ru,
      name_zh: port.name_zh,
      surcharge: port.surcharge ?? 0,
      pricing_type: port.pricing_type,
      fixed_delivery_cost: port.pricing_type === "fixed"
        ? port.fixed_delivery_cost ?? 0
        : null,
      ...invoiceToBody(port.invoice),
    })
    rowErrors.value[port.id] = new Errors()
    await reloadPorts()
  }
  catch (error: any) {
    if (error?.data?.errors) {
      setRowErrors(port.id, error.data.errors)
    }
  }
}

const softDelete = async (port: PortRow) => {
  await destroy(port.id)
  await reloadPorts()
}

const activate = async (port: PortRow) => {
  await update(port.id, { active: true })
  await reloadPorts()
}

const fuelTypeUsedLocal = computed({
  get: () => fuelTypeUsed.value,
  set: () => {},
})

const fuelTypeNew = ref("electric")
const carPriceUsed = ref("from_data")
const carPriceNew = ref("from_data")

const fuelOptions = ref<OptionBase[]>([
  { id: 1, value: "petrol", name: t("calc.petrol"), disabled: false },
  { id: 2, value: "electric", name: t("calc.electric"), disabled: false },
])

const carPriceOptions = ref<OptionBase[]>([
  { id: 1, value: "from_data", name: t("calc.from_car_data"), disabled: false },
])

onMounted(async () => {
  await load()
  await reloadPorts()
})
</script>

<style module>
.container { @apply mx-auto; }
.formContainer { @apply w-full p-6 border border-gray-300 rounded-lg mb-6; }
.titleRow { @apply flex items-center justify-between mb-6; }
.title { @apply text-xl font-bold; }
.inputContainer { @apply mb-6; }
.amountInput { @apply w-full max-w-xs; }
.row {
  @apply flex flex-wrap items-start gap-2 mb-4;
}
.row > *:not(.iconWrapper) {
  @apply min-h-[80px];
}
.createForm {
  @apply p-5 mb-6 bg-gray-50 border border-gray-200 rounded-lg;
}
.createGrid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start;
}
.invoiceTitle { @apply text-sm font-semibold text-gray-600 mt-5 mb-2; }
.createActions { @apply flex items-center gap-3 mt-5 pt-4 border-t border-gray-200; }

.portList { @apply flex flex-col gap-5; }
.portCard { @apply p-5 border border-gray-200 rounded-lg bg-white; }
.portCardInactive { @apply opacity-60 bg-gray-50; }
.portHeader { @apply flex items-center justify-between gap-4 flex-wrap mb-4 pb-3 border-b border-gray-100; }
.portHeaderInfo { @apply flex items-center gap-2 flex-wrap; }
.portName { @apply text-base font-semibold text-gray-900; }
.portCode { @apply text-xs font-mono text-gray-400; }
.portBadge { @apply text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium; }
.portBadgeMuted { @apply text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium; }
.portHeaderActions { @apply flex items-center gap-2 flex-shrink-0; }
.fieldGrid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start;
}
.detailsToggle {
  @apply flex items-center gap-1.5 mt-4 text-sm font-medium text-gray-600 hover:text-black transition-colors;
}
.detailsChevron { @apply w-4 h-4 transition-transform duration-200; }
.detailsChevronOpen { @apply rotate-180; }
.portDetails {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start mt-4 pt-4 border-t border-dashed border-gray-200;
}
.smallInput { @apply flex-1 min-w-[120px]; }
.fuelSelect { @apply w-48; }
.carPriceSelect { @apply w-64; }
.iconWrapper { @apply flex items-center justify-center h-[38px] w-[38px] bg-gray-100 rounded-md;
  margin-top: 28px;}
.icon { @apply w-5 h-5 text-gray-500; }
.buttonContainer { @apply flex justify-start; }
</style>
