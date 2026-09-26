<template>
  <div class="mx-auto">
    <div :class="$style.formRow">
      <SearchableSelect
        :key="selectKey"
        v-model="draftSelectedCity"
        :label="t('calc.city')"
        :options="cityOptions"
        :placeholder="t('calc.find_or_select')"
        :default-to-first-option="false"
        :class="$style.smallSelect"
      />
      <NuxtLink :to="{ name: 'admin-calc-delivery-new' }">
        <Button
          kind="green"
          size="base"
          :class="$style.addButton"
        >
          <PlusIcon :class="$style.buttonIcon" />
          {{ t('calc.add_city') }}
        </Button>
      </NuxtLink>
      <div
        v-if="showCityFilterActions"
        :class="$style.applyFilterWrap"
      >
        <Button
          kind="primary"
          size="sm"
          @click="applyCityFilter"
        >
          {{ t('actions.apply') }}
        </Button>
        <Button
          kind="white"
          size="sm"
          :class="$style.resetFilterBtn"
          @click="resetCityFilter"
        >
          {{ t('actions.reset') }}
        </Button>
      </div>
      <Button
        kind="black"
        size="base"
        :class="$style.exportButton"
        :disabled="isExporting"
        @click="downloadExcel"
      >
        <ArrowDownTrayIcon
          v-if="!isExporting"
          :class="$style.buttonIcon"
        />
        {{ isExporting ? t('common.loading') : t('calc.download_excel') }}
      </Button>
    </div>

    <DataTable
      :table="table"
      :class="$style.dataTable"
    >
      <template #fromCity="{ row }">
        <div :class="$style.cellWithIcon">
          <div
            v-if="isEditing(row.original.id, 'fromCity')"
            :class="$style.nameEditGroup"
          >
            <div :class="$style.fieldStack">
              <Input
                v-model="editingNameRu"
                data-delivery-edit-input
                :placeholder="t('calc.city_name_placeholder')"
                :class="$style.editInput"
                :is-invalid="hasError('name_ru')"
                :show-invalid-message="false"
                @keyup.enter="saveEdit"
                @blur="saveEdit"
              />
              <div
                :class="[
                  $style.errorCollapse,
                  { [$style.errorCollapseOpen]: hasError('name_ru') },
                ]"
              >
                <span
                  v-if="hasError('name_ru')"
                  :class="$style.errorText"
                >
                  {{ getError('name_ru') }}
                </span>
              </div>
            </div>

            <div :class="$style.fieldStack">
              <Input
                v-model="editingNameZh"
                :placeholder="t('calc.chinese_city_placeholder')"
                :class="$style.editInput"
                :is-invalid="hasError('name_zh')"
                :show-invalid-message="false"
                @keyup.enter="saveEdit"
                @blur="saveEdit"
              />
              <div
                :class="[
                  $style.errorCollapse,
                  { [$style.errorCollapseOpen]: hasError('name_zh') },
                ]"
              >
                <span
                  v-if="hasError('name_zh')"
                  :class="$style.errorText"
                >
                  {{ getError('name_zh') }}
                </span>
              </div>
            </div>
          </div>

          <div
            v-else
            :class="$style.nameDisplayGroup"
          >
            <span :class="{ [$style.grayText]: row.original.hidden }">{{ row.original.fromCity }}</span>
            <PencilIcon
              :class="$style.editIconTight"
              @click="startEditNames(row.original)"
            />
          </div>
        </div>
      </template>

      <template #status="{ row }">
        <span :class="{ [$style.grayText]: row.original.hidden }">
          {{ row.original.hidden ? t('common.yes') : t('common.no') }}
        </span>
      </template>

      <template
        v-for="port in ports"
        :key="port.code"
        #[portSlot(port.code)]="{ row }"
      >
        <div :class="$style.cellWithIcon">
          <div
            v-if="isEditing(row.original.id, portSlot(port.code))"
            :class="$style.cellStack"
          >
            <div :class="$style.inputRow">
              <InputNumber
                v-model="editingValueNumber"
                data-delivery-edit-input
                :class="$style.editInput"
                :is-invalid="hasError('delivery_cost')"
                :show-invalid-message="false"
                @blur="saveEdit"
                @keyup.enter="saveEdit"
              />
              <span :class="[$style.currencySymbol, { [$style.grayText]: row.original.hidden }]">¥</span>
            </div>
            <div
              :class="[
                $style.errorCollapse,
                { [$style.errorCollapseOpen]: hasError('delivery_cost') },
              ]"
            >
              <span
                v-if="hasError('delivery_cost')"
                :class="$style.errorText"
              >
                {{ getError('delivery_cost') }}
              </span>
            </div>
          </div>

          <div
            v-else
            :class="$style.valueDisplayGroup"
          >
            <span :class="{ [$style.grayText]: row.original.hidden }">
              {{ row.original.costs[port.code] ?? '–' }} <span :class="$style.currencySymbol">¥</span>
            </span>
            <PencilIcon
              :class="$style.editIconTight"
              @click="startEditCost(row.original.id, port, row.original.costs[port.code] ?? '')"
            />
          </div>
        </div>
      </template>

      <template #action="{ row }">
        <div :class="$style.actionCell">
          <MenuElips :menu-action-groups="getRowActions(row.original)" />
        </div>
      </template>
    </DataTable>

    <Pagination
      v-if="pagination.total > pagination.perPage"
      :current-page="pagination.page"
      class="mt-4"
      :total="pagination.total"
      :limit="pagination.perPage"
      :limits="pageSizes"
      :show-total="false"
      :show-limits="false"
      @change-page="onPaginationChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue"
import { useI18n } from "vue-i18n"
import { PlusIcon, PencilIcon, ArrowDownTrayIcon } from "@heroicons/vue/24/solid"
import { RoleAdmin, RoleLogistic } from "~/constants/roles"
import SearchableSelect from "@/components/form/SearchableSelect.vue"
import Button from "@/components/common/Button.vue"
import DataTable from "@/components/table/DataTable.vue"
import MenuElips from "@/components/common/MenuElips.vue"
import Input from "@/components/form/Input.vue"
import InputNumber from "@/components/form/InputNumber.vue"
import Pagination from "@/components/common/Pagination.vue"
import useTanstackTable from "@/composables/useTanstackTable"
import useCities from "@/composables/useCities"
import usePorts from "@/composables/usePorts"
import Errors from "@/classes/errors"
import type { ExternalColumn } from "@/types/common/tanstackTable"
import type { OptionBase } from "@/types/form/optionType"
import type { CityOption, DeliveryRow, EditingCell } from "~/types/responses/city"
import type { Port } from "~/types/responses/port"

const { t } = useI18n()

definePageMeta({
  auth: true,
  layout: "personal",
  roles: [RoleAdmin, RoleLogistic],
})

const draftSelectedCity = ref<OptionBase | undefined>(undefined)
const appliedCity = ref<OptionBase | undefined>(undefined)
const selectKey = ref(0)
const editingCell = ref<EditingCell | null>(null)
const editingNameRu = ref("")
const editingNameZh = ref("")
const editingValueNumber = ref<number | undefined>(undefined)
const editingPortId = ref<number | undefined>(undefined)
const originalNameRu = ref("")
const originalNameZh = ref("")
const originalCost = ref<number | undefined>(undefined)
const isSaving = ref(false)
const errors = ref(new Errors())

const { ports, reload: reloadPorts, portName } = usePorts()

const portSlot = (code: string) => `port_${code}`

const pagination = ref({ page: 1, perPage: 10, total: 0 })

const {
  cities: allCities,
  citiesPage,
  deliveryRows,
  pagination: citiesPagination,
  reloadAll,
  fetchCities,
  onPaginationChange,
  saveEdit: saveCityEdit,
  toggleVisibility: toggleCityVisibility,
  downloadExcel,
  isExporting,
  setCityCode,
} = useCities()

watch(citiesPagination, p => (pagination.value = p), { immediate: true })

const cities = citiesPage
const deliveryData = computed(() => deliveryRows.value)

const cityOptions = computed(() =>
  allCities.value.map(city => ({
    id: city.id,
    name: city.name_ru,
    value: city.code,
    disabled: false,
  })),
)

const showCityFilterActions = computed(() => {
  const d = draftSelectedCity.value?.value ?? ""
  const a = appliedCity.value?.value ?? ""
  return d !== a || a !== ""
})

const pageSizes = [
  { id: 1, value: 10, name: 10, disabled: false },
  { id: 2, value: 20, name: 20, disabled: false },
  { id: 3, value: 50, name: 50, disabled: false },
]

function isEditing(id: number, column: string) {
  return editingCell.value?.rowId === id && editingCell.value?.column === column
}

function normalizeNumericString(s: string): string {
  if (!s) {
    return ""
  }
  return s.replace(/[\s\u202F\u00A0]/g, "").replace(/,/g, "").replace(/[^\d.]/g, "")
}

async function focusEditingInput() {
  await nextTick()
  const input = document.querySelector("[data-delivery-edit-input]") as HTMLInputElement | null
  input?.focus()
}

function startEditCost(rowId: number, port: Port, displayedValue: string) {
  errors.value.clear()
  editingCell.value = { rowId, column: portSlot(port.code) }
  editingPortId.value = port.id
  const cleaned = normalizeNumericString(displayedValue)
  const n = cleaned === "" ? undefined : Number(cleaned)
  editingValueNumber.value = Number.isFinite(n as number) ? (n as number) : undefined
  originalCost.value = editingValueNumber.value
  focusEditingInput()
}

function startEditNames(row: DeliveryRow) {
  errors.value.clear()
  editingCell.value = { rowId: row.id, column: "fromCity" }
  const original = cities.value.find(c => c.id === row.id)
  editingNameRu.value = (original as CityOption | undefined)?.name_ru ?? ""
  editingNameZh.value = (original as CityOption | undefined)?.name_zh ?? ""
  originalNameRu.value = editingNameRu.value
  originalNameZh.value = editingNameZh.value
  focusEditingInput()
}

function stopEdit() {
  editingCell.value = null
  editingNameRu.value = ""
  editingNameZh.value = ""
  editingValueNumber.value = undefined
  editingPortId.value = undefined
  originalNameRu.value = ""
  originalNameZh.value = ""
  originalCost.value = undefined
}

function hasError(field: string): boolean {
  return errors.value.has(field)
}
function getError(field: string): string | undefined {
  return errors.value.get(field) || undefined
}

async function applyCityFilter() {
  appliedCity.value = draftSelectedCity.value ? { ...draftSelectedCity.value } : undefined
  const code = appliedCity.value?.value
  setCityCode(typeof code === "number" ? String(code) : code)
}

async function resetCityFilter() {
  draftSelectedCity.value = undefined
  appliedCity.value = undefined
  selectKey.value += 1
  setCityCode(undefined)
}

onMounted(async () => {
  await reloadPorts()
  await reloadAll()
  await fetchCities()
})

async function saveEdit() {
  if (!editingCell.value || isSaving.value) {
    return
  }

  const { rowId, column } = editingCell.value

  if (column === "fromCity") {
    if (
      editingNameRu.value === originalNameRu.value
      && editingNameZh.value === originalNameZh.value
    ) {
      stopEdit()
      return
    }
  }
  else if (editingValueNumber.value === originalCost.value) {
    stopEdit()
    return
  }
  else if (typeof editingValueNumber.value !== "number") {
    stopEdit()
    return
  }

  errors.value.clear()
  isSaving.value = true
  try {
    if (column === "fromCity") {
      await saveCityEdit({
        id: rowId,
        column,
        name_ru: editingNameRu.value,
        name_zh: editingNameZh.value,
      })
    }
    else {
      await saveCityEdit({
        id: rowId,
        column: "cost",
        portId: editingPortId.value,
        numericValue: editingValueNumber.value,
      })
    }
  }
  catch (e: any) {
    const resp = e?.data || {}
    if (resp.errors) {
      errors.value.record(resp.errors)
    }
    return
  }
  finally {
    isSaving.value = false
    if (!errors.value.any()) {
      stopEdit()
    }
  }
}

function getRowActions(row: DeliveryRow) {
  return [
    [
      {
        label: row.hidden ? t("common.show") : t("common.hide"),
        action: () => toggleCityVisibility(row),
        disabled: false,
      },
    ],
  ]
}

const columns = computed<ExternalColumn<DeliveryRow>[]>(() => [
  {
    header: t("calc.from_city"),
    id: "fromCity",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: ({ row }) => `px-4 py-3 ${row.original.hidden ? "text-gray-400" : ""}`,
      style: "width: 240px; min-width: 220px; max-width: 280px;",
    },
  },
  ...ports.value.map(port => ({
    header: portName(port),
    id: portSlot(port.code),
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: ({ row }: { row: { original: DeliveryRow } }) =>
        `px-4 py-3 ${row.original.hidden ? "text-gray-400" : ""}`,
      style: "width: 170px; min-width: 160px; max-width: 200px;",
    },
  })),
  {
    header: t("calc.hidden"),
    id: "status",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: ({ row }: { row: { original: DeliveryRow } }) =>
        `px-4 py-3 ${row.original.hidden ? "text-gray-400" : ""}`,
      style: "width: 90px; min-width: 90px; max-width: 110px;",
    },
  },
  {
    header: "",
    id: "action",
    cell: () => "",
    meta: {
      headerClass: "px-0 py-3 text-center",
      cellClassFn: () => "px-0 py-3 text-center",
      style: "width: 60px; min-width: 60px; max-width: 60px;",
    },
  },
])

const { table } = useTanstackTable(deliveryData, columns)
</script>

<style module>
.formRow { @apply flex items-end gap-4 mb-6 flex-wrap; }
.smallSelect { @apply w-64; }
.addButton { @apply flex-shrink-0 inline-flex items-center; }
.exportButton { @apply flex-shrink-0 inline-flex items-center ml-auto; }
.applyFilterWrap { @apply flex items-center gap-2 mb-1; }
.resetFilterBtn { @apply ml-0; }
.buttonIcon { @apply w-4 h-4 mr-2; }
.dataTable { @apply mt-6 !border-0; }
.dataTable :global(th),
.dataTable :global(td) {
  @apply border border-gray-200;
}
.actionCell { @apply flex justify-center; }
.actionCell > :global(div) {
  justify-content: center;
}

.cellWithIcon { @apply flex items-center justify-between; }
.valueDisplayGroup, .nameDisplayGroup { @apply flex items-center justify-between w-full; }
.nameEditGroup { @apply grid gap-2 w-full; grid-template-columns: 1fr; }
.inputRow { @apply flex items-center gap-1 w-full; }
.editInput { @apply w-full text-sm border border-gray-300 rounded; }
.currencySymbol { @apply text-gray-500 ml-1; }
.grayText { @apply text-gray-400; }
.editIconTight { @apply w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 ml-1 flex-shrink-0; }

.fieldStack { @apply w-full; }
.cellStack { @apply w-full; }

.errorCollapse {
  max-height: 0;
  overflow: hidden;
  transition: max-height 180ms ease;
}
.errorCollapseOpen {
  max-height: 80px;
}
.errorText {
  font-size: 12px;
  color: #dc2626;
  word-break: break-word;
  overflow-wrap: anywhere;
  line-height: 20px;
  padding-top: 2px;
}
</style>
