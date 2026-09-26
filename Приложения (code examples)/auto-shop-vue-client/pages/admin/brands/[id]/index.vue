<template>
  <div :class="$style.container">
    <div :class="$style.topRow">
      <CommonBackButton :to="{ name: 'admin-brands' }" />
      <h1 :class="$style.title">
        {{ t('navigation.admin-brands-id') }}
      </h1>
    </div>

    <div :class="$style.filtersRow">
      <div
        :class="$style.filterItem"
        @click="handleLoadBrands"
      >
        <SearchableSelect
          v-model="selectedBrand"
          :options="brandOptions"
          :label="t('admin_brands.completion.brand_select_label')"
          :placeholder="t('admin_brands.completion.brand_select_placeholder')"
        />
      </div>

      <div :class="$style.filterItem">
        <SearchableSelect
          v-model="selectedModel"
          :options="modelOptions"
          :label="t('admin_brands.completion.model_select_label')"
          :placeholder="t('admin_brands.completion.model_select_placeholder')"
          :disabled="!selectedBrand"
        />
      </div>
    </div>

    <div :class="$style.controlsRow">
      <div :class="$style.searchWrapper">
        <Input
          v-model="search"
          :placeholder="t('admin_brands.completion.search_placeholder')"
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

    <div :class="$style.actionsRow">
      <div :class="$style.actionButtons">
        <CommonButton
          kind="lightgrey"
          :class="$style.selectBtn"
          @click="handleMasterToggle"
        >
          <div :class="[$style.fakeCheckbox, (isAllSelected || isIndeterminate) ? $style.fakeCheckboxActive : '']">
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
    </div>

    <div :class="$style.listContainer">
      <div
        v-if="isLoading"
        class="py-10 text-center text-gray-500"
      >
        {{ t('common.loading') }}
      </div>
      <CompletionUnit
        v-for="item in filteredItems"
        v-else
        :key="item.id"
        v-model:selected="item.isSelected"
        :visible="item.active"
        :item="item"
        @update:visible="(val) => handleSingleToggle(item, val)"
        @update:name="handleNameUpdate"
      />
      <div
        v-if="!isLoading && filteredItems.length === 0"
        class="py-10 text-center text-gray-500"
      >
        {{ t('common.no_data') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue"
import { useRoute } from "vue-router"
import {
  MagnifyingGlassIcon,
  MinusIcon,
  CheckIcon,
  ChevronDownIcon,
} from "@heroicons/vue/24/outline"
import {
  Menu as HeadlessMenu,
  MenuButton as HeadlessMenuButton,
  MenuItems as HeadlessMenuItems,
  MenuItem as HeadlessMenuItem,
} from "@headlessui/vue"

import CommonButton from "~/components/common/Button.vue"
import SearchableSelect from "~/components/form/SearchableSelect.vue"
import Input from "~/components/form/Input.vue"
import Select from "~/components/form/Select.vue"
import CompletionUnit from "~/components/admin/CompletionUnit.vue"
import { useAdminCar } from "@/composables/useAdminCar"
import { RoleAdmin } from "~/constants/roles"
import type { OptionBase } from "@/types/form/optionType"
import type { CarCompletion } from "~/types/common/adminCars"

type UiCarCompletion = CarCompletion & { isSelected: boolean }

definePageMeta({
  auth: true,
  hideTitle: true,
  layout: "personal",
  roles: [RoleAdmin],
})

const { t } = useI18n()
const route = useRoute()
const modelId = route.params.id as string

const {
  fetchCompletions,
  fetchBrandOptions,
  fetchModelOptions,
  completionsItems,
  isLoading,
  brandOptions: apiBrandOptions,
  modelOptions: apiModelOptions,
  activateItems,
  deactivateItems,
  currentBrand,
  updateItemName,
} = useAdminCar()

const uiItems = ref<UiCarCompletion[]>([])
const selectedBrand = ref<OptionBase | undefined>()
const selectedModel = ref<OptionBase | undefined>()
const search = ref("")
const selectedVisibility = ref("all")

const brandOptions = ref<OptionBase[]>([])
const modelOptions = ref<OptionBase[]>([])

const visibilityOptions = computed<OptionBase[]>(() => [
  { id: 1, name: t("admin_brands.list.filter_all"), value: "all", disabled: false },
  { id: 2, name: t("admin_brands.list.filter_hidden"), value: "hidden", disabled: false },
  { id: 3, name: t("admin_brands.list.filter_visible"), value: "visible", disabled: false },
])

const isBrandsLoaded = ref(false)
const isHydrating = ref(true)

watch(completionsItems, (newItems) => {
  uiItems.value = newItems.map(item => ({
    ...item,
    isSelected: false,
  }))
}, { immediate: true })

const filteredItems = computed(() => {
  let result = uiItems.value

  if (selectedVisibility.value === "visible") {
    result = result.filter(i => i.active)
  }
  else if (selectedVisibility.value === "hidden") {
    result = result.filter(i => !i.active)
  }

  if (search.value) {
    const q = search.value.toLowerCase().trim()
    result = result.filter(i => i.name.toLowerCase().includes(q))
  }

  return result
})

const selectedCount = computed(() => uiItems.value.filter(i => i.isSelected).length)
const hasSelection = computed(() => selectedCount.value > 0)

const isAllSelected = computed(() => {
  return filteredItems.value.length > 0 && filteredItems.value.every(i => i.isSelected)
})

const isIndeterminate = computed(() => {
  if (isAllSelected.value) {
    return false
  }
  return uiItems.value.some(i => i.isSelected)
})

async function handleLoadBrands() {
  if (isBrandsLoaded.value) {
    return
  }

  await fetchBrandOptions()
  brandOptions.value = apiBrandOptions.value.map(item => ({
    id: item.id,
    name: item.name,
    value: item.id,
    disabled: false,
    image: item.image,
  }))

  isBrandsLoaded.value = true
}

watch(selectedBrand, async (newBrand, oldBrand) => {
  if (isHydrating.value) {
    return
  }

  if (newBrand?.value && newBrand.value !== oldBrand?.value) {
    selectedModel.value = undefined
    modelOptions.value = []

    await fetchModelOptions(newBrand.value)

    modelOptions.value = apiModelOptions.value.map(item => ({
      id: item.id,
      name: item.name,
      value: item.id,
      disabled: false,
    }))
  }
})

watch(selectedModel, async (newModel, oldModel) => {
  if (isHydrating.value) {
    return
  }

  if (newModel?.value && newModel.value !== oldModel?.value) {
    await fetchCompletions(newModel.value)
  }
})

function handleMasterToggle() {
  const targetState = !isAllSelected.value
  filteredItems.value.forEach((item) => {
    item.isSelected = targetState
  })
}

async function handleSingleToggle(item: UiCarCompletion, newValue: boolean) {
  const action = newValue ? activateItems : deactivateItems
  const res = await action([item.id])

  if (res?.data && Array.isArray(res.data)) {
    const updatedIds = res.data.map(id => Number(id))
    if (updatedIds.includes(item.id)) {
      item.active = newValue
    }
  }
}

async function handleNameUpdate(id: number, newName: string) {
  await updateItemName(id, newName)

  const targetItem = uiItems.value.find(i => i.id === id)
  if (targetItem) {
    targetItem.name = newName
  }
}

async function handleBulkAction(action: "hide" | "show") {
  const selected = uiItems.value.filter(i => i.isSelected)
  const ids = selected.map(i => i.id)

  if (ids.length === 0) {
    return
  }

  const apiMethod = action === "show" ? activateItems : deactivateItems
  const res = await apiMethod(ids)

  if (res?.data && Array.isArray(res.data)) {
    const updatedIds = res.data.map(id => Number(id))

    uiItems.value.forEach((item) => {
      if (updatedIds.includes(item.id)) {
        item.active = (action === "show")
      }
    })
  }

  uiItems.value.forEach((item) => {
    item.isSelected = false
  })
}

onMounted(async () => {
  if (modelId) {
    await fetchCompletions(modelId)

    if (currentBrand.value) {
      const brandObj = {
        id: currentBrand.value.id,
        name: currentBrand.value.name,
        value: currentBrand.value.id,
        disabled: false,
        image: currentBrand.value.image,
      }

      brandOptions.value = [brandObj]
      selectedBrand.value = brandObj
    }

    if (apiModelOptions.value.length > 0) {
      modelOptions.value = apiModelOptions.value.map(item => ({
        id: item.id,
        name: item.name,
        value: item.id,
        disabled: false,
      }))

      const activeModel = modelOptions.value.find(m => Number(m.id) === Number(modelId))

      if (activeModel) {
        selectedModel.value = activeModel
      }
    }

    await nextTick()
    isHydrating.value = false
  }
  else {
    isHydrating.value = false
  }
})
</script>

<style module>
.container {
  @apply w-full;
}

.topRow {
  @apply flex items-center gap-3 mb-6;
}

.title {
  font-size: 1.875rem;
  @apply font-bold leading-tight text-gray-900;
}

.filtersRow {
  @apply w-full lg:w-1/2 flex items-center gap-6 mb-6;
}

.filterItem {
  @apply w-1/2;
}

.controlsRow {
  @apply w-full lg:w-1/2 flex items-center gap-4 mb-6;
}

.searchWrapper {
  @apply relative;
  flex: 2;
}

.selectWrapper {
  flex: 1;
}

.searchInput {
  @apply w-full !rounded-full h-10 border-gray-300 pr-10 focus:ring-blue focus:border-blue;
}

.searchIcon {
  @apply w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none;
}

.visibilitySelect {
  @apply w-full;
}

.actionsRow {
  @apply flex items-center mb-6;
}

.actionButtons {
  @apply flex items-center gap-4;
}

.selectBtn {
  @apply flex items-center gap-2;
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

.listContainer {
  @apply w-full lg:w-1/2 flex flex-col gap-4;
}
</style>
