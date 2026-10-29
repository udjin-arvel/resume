<template>
  <div>
    <div :class="$style.filterRow">
      <div :class="$style.actionGroup">
        <CommonButton
          kind="lightgrey"
          :class="$style.selectBtn"
          @click="handleMasterToggle"
        >
          <div :class="[$style.fakeCheckbox, hasSelection ? $style.fakeCheckboxActive : '']">
            <CheckIcon
              v-if="isAllSelected"
              :class="$style.checkIcon"
            />
            <MinusIcon
              v-else-if="isIndeterminate"
              :class="$style.checkIcon"
            />
          </div>
          <span>{{ t('admin_brands.list.select') }}</span>
        </CommonButton>

        <HeadlessMenu
          as="div"
          :class="$style.menuWrapper"
        >
          <HeadlessMenuButton
            as="template"
            :disabled="!hasSelection"
          >
            <CommonButton
              kind="lightgrey"
              :class="$style.selectBtn"
              :disabled="!hasSelection"
            >
              <span>{{ t('admin_brands.list.selected') }}</span>
              <ChevronDownIcon
                class="w-4 h-4 text-gray-500"
                aria-hidden="true"
              />
            </CommonButton>
          </HeadlessMenuButton>

          <transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <HeadlessMenuItems :class="$style.menuItems">
              <div :class="$style.menuGroup">
                <HeadlessMenuItem v-slot="{ active }">
                  <button
                    :class="[
                      'group',
                      $style.menuItem,
                      active ? $style.menuItemActive : '',
                    ]"
                    @click="handleBulkAction('hide')"
                  >
                    {{ t('admin_brands.list.hide_action') }}
                  </button>
                </HeadlessMenuItem>
                <HeadlessMenuItem v-slot="{ active }">
                  <button
                    :class="[
                      'group',
                      $style.menuItem,
                      active ? $style.menuItemActive : '',
                    ]"
                    @click="handleBulkAction('show')"
                  >
                    {{ t('admin_brands.list.show_action') }}
                  </button>
                </HeadlessMenuItem>
              </div>
            </HeadlessMenuItems>
          </transition>
        </HeadlessMenu>
      </div>

      <div :class="$style.filterGroup">
        <div :class="$style.searchWrapper">
          <Input
            v-model="search"
            :placeholder="t('admin_brands.list.search_placeholder')"
            :class="$style.searchInput"
          >
            <template #input-icon>
              <MagnifyingGlassIcon :class="$style.searchIcon" />
            </template>
          </Input>
        </div>
        <div :class="$style.selectWrapper">
          <Select
            v-model="selectedVisibility"
            :options="visibilityOptions"
            :class="$style.visibilitySelect"
          />
        </div>
      </div>

      <CommonButton
        kind="black"
        :class="[$style.selectBtn, 'ml-auto']"
        :disabled="isExporting"
        @click="downloadExcel"
      >
        <ArrowDownTrayIcon
          v-if="!isExporting"
          class="w-4 h-4 mr-2"
          aria-hidden="true"
        />
        <span>
          {{ isExporting ? t('common.loading') : t('admin_brands.list.export') }}
        </span>
      </CommonButton>
    </div>
    <div
      v-if="isLoading"
      class="py-12 text-center text-gray-500 text-lg"
    >
      {{ t('common.loading') }}
    </div>
    <div
      v-else
      :class="[$style.tableWrapper, $style.tableContainer]"
    >
      <DataTable
        :table="table"
        :is-loading="isLoading"
      >
        <template #checkbox="{ row }">
          <div :class="$style.checkboxCell">
            <CheckBox
              :model-value="row.getIsSelected()"
              :style="{ marginLeft: `${row.depth * 20}px` }"
              @update:model-value="row.toggleSelected()"
            />
          </div>
        </template>
        <template #expander="{ row }">
          <div :class="$style.expanderCell">
            <CommonButton
              v-if="row.getCanExpand()"
              kind="white"
              size="xs"
              :tooltip="row.getIsExpanded() ? t('admin_brands.list.collapse') : t('admin_brands.list.expand')"
              :class="$style.expandButton"
              @click="row.toggleExpanded()"
            >
              <ChevronDownIcon
                v-if="row.getIsExpanded()"
                :class="$style.expandIcon"
              />
              <ChevronRightIcon
                v-else
                :class="$style.expandIcon"
              />
            </CommonButton>
          </div>
        </template>
        <template #model="{ row }">
          <div
            v-if="editingRowId === row.original.id"
            :class="[$style.editWrapper, row.depth > 0 ? $style.nestedModelWrapper : '']"
          >
            <img
              v-if="row.original.image"
              :src="row.original.image ?? undefined"
              :alt="row.original.name"
              :class="$style.modelImage"
            >
            <div :class="$style.editInputGroup">
              <Input
                v-model="editingName"
                :class="$style.editInput"
                @keyup.enter="handleSaveEdit(row.original)"
                @keyup.esc="handleCancelEdit"
              />
              <div :class="$style.editActions">
                <CommonButton
                  kind="black"
                  size="xs"
                  @click="handleSaveEdit(row.original)"
                >
                  {{ t('actions.save') }}
                </CommonButton>
                <CommonButton
                  kind="white"
                  size="xs"
                  @click="handleCancelEdit"
                >
                  {{ t('actions.cancel') }}
                </CommonButton>
              </div>
            </div>
          </div>

          <template v-else>
            <div
              v-if="row.depth > 0"
              :class="$style.nestedModelWrapper"
            >
              <NuxtLink
                :to="{ name: 'admin-brands-id', params: { id: row.original.id } }"
                :class="$style.nestedLink"
              >
                <img
                  v-if="row.original.image"
                  :src="row.original.image ?? undefined"
                  :alt="row.original.name"
                  :class="$style.modelImage"
                >
                <span :class="$style.linkText">{{ row.original.name }}</span>
                <ChevronRightIcon :class="$style.linkArrow" />
              </NuxtLink>
            </div>
            <div
              v-else
              :class="$style.modelCell"
            >
              <img
                v-if="row.original.image"
                :src="row.original.image ?? undefined"
                :alt="row.original.name"
                :class="$style.modelImage"
              >
              <span>{{ row.original.name }}</span>
            </div>
          </template>
        </template>

        <template #active="{ row }">
          <div
            :class="$style.toggleCell"
            :style="{ paddingLeft: `${row.depth * 20}px` }"
          >
            <Switch
              v-model="row.original.active"
              :class="[$style.switchBase, row.original.active ? $style.switchActive : '']"
              @update:model-value="handleToggleVisibility(row.original)"
            >
              <span
                aria-hidden="true"
                :class="[$style.switchThumb, row.original.active ? $style.switchThumbActive : '']"
              />
            </Switch>
          </div>
        </template>

        <template #actions="{ row }">
          <div :class="$style.actionsCell">
            <MenuElips
              :menu-action-groups="getMenuActions(row)"
              kind="unset"
            />
          </div>
        </template>
      </DataTable>
    </div>

    <Pagination
      v-if="total > limit"
      :current-page="page"
      :total="total"
      :limit="limit"
      :limits="pageSizes"
      :show-total="false"
      :show-limits="false"
      @change-page="onPaginationChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue"
import { ChevronDownIcon, ChevronRightIcon, MinusIcon, CheckIcon, MagnifyingGlassIcon, ArrowDownTrayIcon } from "@heroicons/vue/24/solid"
import { Switch, Menu as HeadlessMenu, MenuButton as HeadlessMenuButton, MenuItems as HeadlessMenuItems, MenuItem as HeadlessMenuItem } from "@headlessui/vue"
import { useDebounceFn } from "@vueuse/core"
import DataTable from "@/components/table/DataTable.vue"
import CommonButton from "@/components/common/Button.vue"
import CheckBox from "@/components/form/CheckBox.vue"
import Input from "@/components/form/Input.vue"
import Select from "@/components/form/Select.vue"
import Pagination from "@/components/common/Pagination.vue"

import useTanstackTable from "@/composables/useTanstackTable"
import { useAdminCar } from "@/composables/useAdminCar"

import type { ExternalColumn } from "@/types/common/tanstackTable"
import type { OptionBase } from "@/types/form/optionType"
import type { CarModel } from "~/types/common/adminCars"
import { RoleAdmin } from "~/constants/roles"
import MenuElips from "@/components/common/MenuElips.vue"
import type { MenuActions } from "@/types/common/menuActions"

definePageMeta({
  auth: true,
  layout: "personal",
  roles: [RoleAdmin],
})

const { t } = useI18n()
const search = ref("")
const selectedVisibility = ref("all")

const {
  items: brands,
  fetchBrands,
  page,
  limit,
  total,
  isLoading,
  activateItems,
  deactivateItems,
  updateItemName,
  isExporting, // <---
  downloadExcel, // <---
} = useAdminCar()

const pageSizes = [
  { id: 1, value: 10, name: 10, disabled: false },
  { id: 2, value: 20, name: 20, disabled: false },
  { id: 3, value: 50, name: 50, disabled: false },
]

const visibilityOptions = computed<OptionBase[]>(() => [
  { id: 1, name: t("admin_brands.list.filter_all"), value: "all", disabled: false },
  { id: 2, name: t("admin_brands.list.filter_hidden"), value: "hidden", disabled: false },
  { id: 3, name: t("admin_brands.list.filter_visible"), value: "visible", disabled: false },
])

const getCommonCellClass = (row: any, baseClass: string = "px-4 py-3") => {
  return `${baseClass} ${row.depth > 0 ? "bg-gray-50" : ""}`
}

function buildFilterParams(): any {
  const params: any = {}

  if (search.value) {
    params.name = search.value
  }

  if (selectedVisibility.value === "visible") {
    params.active = true
  }
  else if (selectedVisibility.value === "hidden") {
    params.active = false
  }
  else {
    params.active = null
  }

  return params
}

const filteredBrands = computed(() => {
  if (!brands.value) {
    return []
  }

  const query = search.value.toLowerCase().trim()
  const visibility = selectedVisibility.value

  const processedBrands = brands.value.map((brand) => {
    const isParentSearchMatch = !query || brand.name.toLowerCase().includes(query)

    const hasAnyChildSearchMatch = brand.models?.some(model =>
      model.name.toLowerCase().includes(query),
    )

    const filteredModels = (brand.models || []).filter((model) => {
      let isModelVisibilityMatch = true

      if (visibility === "visible") {
        isModelVisibilityMatch = model.active === true
      }

      if (visibility === "hidden") {
        isModelVisibilityMatch = model.active === false
      }

      if (!isModelVisibilityMatch) {
        return false
      }

      if (!query) {
        return true
      }

      const isModelSearchMatch = model.name.toLowerCase().includes(query)

      if (isParentSearchMatch) {
        if (!hasAnyChildSearchMatch) {
          return true
        }
        return isModelSearchMatch
      }

      return isModelSearchMatch
    })

    let isParentVisibilityMatch = true
    if (visibility === "visible") {
      isParentVisibilityMatch = brand.active === true
    }
    if (visibility === "hidden") {
      isParentVisibilityMatch = brand.active === false
    }

    if (filteredModels.length > 0) {
      return {
        ...brand,
        models: filteredModels,
      }
    }

    if (isParentVisibilityMatch && isParentSearchMatch) {
      return {
        ...brand,
        models: [],
      }
    }

    return null
  })

  return processedBrands.filter(item => item !== null) as typeof brands.value
})

const columns = computed<ExternalColumn<CarModel>[]>(() => [
  {
    id: "checkbox",
    header: "",
    cell: () => "",
    meta: {
      headerClass: "px-2 py-3",
      cellClassFn: ({ row }) => getCommonCellClass(row, "px-2 py-3"),
      style: "width: 40px",
    },
  },
  {
    id: "expander",
    header: "",
    cell: () => "",
    meta: {
      headerClass: "px-2 py-3",
      cellClassFn: ({ row }) => getCommonCellClass(row, "px-2 py-3"),
      style: "width: 40px",
    },
  },
  {
    header: t("admin_brands.list.column_model"),
    id: "model",
    accessorFn: row => `${row.name}`,
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: ({ row }) => getCommonCellClass(row),
      style: "width: 450px",
    },
  },
  {
    header: t("admin_brands.list.column_visible"),
    id: "active",
    accessorKey: "active",
    meta: {
      headerClass: "px-4 py-3 text-left font-medium",
      cellClassFn: ({ row }) => getCommonCellClass(row),
      style: "width: 180px",
    },
  },
  {
    id: "spacer",
    header: "",
    cell: () => "",
    meta: {
      style: "",
      headerClass: "p-0",
      cellClassFn: ({ row }) => getCommonCellClass(row, "p-0"),
    },
  },
  {
    id: "actions",
    header: "",
    cell: () => "",
    meta: {
      style: "width: 60px",
      headerClass: "p-0",
      cellClassFn: ({ row }) => getCommonCellClass(row, "p-0"),
    },
  },
])

const { table } = useTanstackTable(filteredBrands, columns, {
  getSubRows: (row: CarModel) => row.models,
  enableExpanding: true,
  enableRowSelection: true,
})

const isAllSelected = computed(() => table.getIsAllRowsSelected())
const isIndeterminate = computed(() => table.getIsSomeRowsSelected())
const hasSelection = computed(() => isAllSelected.value || isIndeterminate.value)

async function handleMasterToggle() {
  const targetState = !isAllSelected.value
  table.toggleAllRowsSelected(targetState)
}

async function handleToggleVisibility(item: CarModel) {
  if (item.active) {
    await activateItems([item.id])
  }
  else {
    await deactivateItems([item.id])
  }
}

async function handleBulkAction(action: "hide" | "show") {
  const selectedRows = table.getPrePaginationRowModel().flatRows.filter(row => row.getIsSelected())

  const ids = selectedRows.map(r => r.original.id)

  if (ids.length === 0) {
    return
  }

  if (action === "show") {
    await activateItems(ids)
  }
  else {
    await deactivateItems(ids)
  }

  table.resetRowSelection()
}

async function onPaginationChange({ currentPage, limit: newLimit }: { currentPage: number, limit: number }) {
  page.value = currentPage
  limit.value = newLimit
  await fetchBrands(buildFilterParams())
}

const debouncedSearch = useDebounceFn(async () => {
  page.value = 1
  await fetchBrands(buildFilterParams())
}, 500)

const editingRowId = ref<number | string | null>(null)
const editingName = ref<string>("")

function handleEdit(item: CarModel) {
  editingRowId.value = item.id
  editingName.value = item.name
}

function handleCancelEdit() {
  editingRowId.value = null
  editingName.value = ""
}

async function handleSaveEdit(item: CarModel) {
  if (!editingName.value.trim() || editingName.value === item.name) {
    handleCancelEdit()
    return
  }

  try {
    const newName = editingName.value

    item.name = newName

    handleCancelEdit()

    await updateItemName(item.id, newName)
  }
  catch (error) {
    console.error("Ошибка при обновлении названия:", error)
  }
}

async function handleMenuToggleVisibility(item: CarModel) {
  if (item.active) {
    await deactivateItems([item.id])
  }
  else {
    await activateItems([item.id])
  }
}

function getMenuActions(row: any): MenuActions[][] {
  const item = row.original

  const actions: MenuActions[] = [
    {
      label: t("admin_brands.list.change_name_action"),
      action: () => handleEdit(item),
    },
    {
      label: item.active
        ? t("actions.hide")
        : t("actions.show"),
      action: () => handleMenuToggleVisibility(item),
    },
  ]

  return [actions]
}

watch(search, () => {
  table.resetExpanded()
  debouncedSearch()
})

watch(selectedVisibility, async () => {
  page.value = 1
  await fetchBrands(buildFilterParams())
})

onMounted(() => {
  fetchBrands(buildFilterParams())
})
</script>

<style module>
.filterRow {
  @apply flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-4;
}

.actionGroup {
  @apply flex items-center gap-4 w-full lg:w-auto flex-wrap;
}

.filterGroup {
  @apply flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto;
}

.searchWrapper {
  @apply relative w-full sm:w-auto sm:flex-1 lg:w-72;
}

.searchInput {
  @apply w-full rounded-full h-10 border-gray-300 pr-10 focus:ring-blue focus:border-blue;
}

.searchIcon {
  @apply w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none;
}

.selectWrapper {
  @apply w-full sm:w-56;
}

.visibilitySelect {}

.selectBtn {
  @apply flex items-center gap-2;
}

.menuWrapper {
  @apply relative inline-block text-left;
}

.menuItems {
  @apply absolute left-0 mt-2 w-48 origin-top-left divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10;
}

.menuGroup {
  @apply py-1;
}

.menuItem {
  @apply flex w-full items-center px-4 py-2 text-sm text-gray-700 text-left;
}

.menuItemActive {
  @apply bg-gray-100 text-gray-900;
}

.fakeCheckbox {
  @apply w-4 h-4 border border-gray-400 rounded bg-white flex items-center justify-center transition-colors;
}

.fakeCheckboxActive {
  @apply bg-black border-black;
}

.checkIcon {
  @apply w-3.5 h-3.5 text-white;
}

.tableWrapper {
  @apply mt-4 mb-4;
}

.tableContainer :global(table) {
  table-layout: fixed;
  width: 100%;
}

.checkboxCell {
  @apply flex items-center;
}

.expanderCell {
  @apply flex items-center justify-center;
}

.expandIcon {
  @apply size-4 text-gray-500;
}

.modelCell {
  @apply flex items-center gap-2 text-gray-900 truncate;
}

.nestedModelWrapper {
  @apply pl-8;
}

.nestedLink {
  @apply inline-flex items-center gap-2 transition-colors duration-200 text-gray-900 hover:text-blue;
}

.modelImage {
  @apply w-8 h-8 object-contain rounded flex-shrink-0;
}

.linkText {
  @apply truncate;
}

.linkArrow {
  @apply size-4 text-gray-400 group-hover:text-blue;
}

.toggleCell {
  @apply flex items-center;
}

.switchBase {
  @apply relative inline-flex h-6 w-11 items-center rounded-full bg-white border border-gray-300 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2;
}

.switchActive {
  @apply bg-blue border-blue;
}

.switchThumb {
  @apply inline-block h-4 w-4 transform rounded-full bg-gray-400 transition;
  transform: translateX(2px);
}

.switchThumbActive {
  @apply bg-white translate-x-6;
}

.actionsCell {
  @apply flex items-center justify-center pr-2 h-full;
}

.editWrapper {
  @apply flex items-start gap-3 w-full py-1;
}

.editInputGroup {
  @apply flex flex-col gap-2 flex-1;
}

.editInput {
  @apply w-full max-w-[300px];
}

.editActions {
  @apply flex items-center gap-2;
}
</style>
