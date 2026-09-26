<template>
  <div>
    <div :class="$style.paramsGrid">
      <div
        v-for="(param, idx) in mainPageParams"
        :key="idx"
        :class="$style.paramRow"
      >
        <span :class="$style.paramName">{{ param.name }}</span>

        <AuthLockInline
          v-if="param.locked || (isGuest && isSecretParam(param.name))"
          size="xs"
          :class="$style.lockedValue"
        />

        <span
          v-else
          :class="$style.paramValue"
        >
          <template v-if="isTranslatable(param.value)">
            <TranslatableWrapper
              :data="param.value.data"
              :config="param.value.config"
              class="w-full relative"
              control-class="absolute top-0 -right-4 z-10"
            />
          </template>
          <template v-else-if="hasBullets(param.value)">
            <span
              v-for="(part, i) in bulletParts(param.value)"
              :key="i"
              class="inline-flex items-center mr-3"
            >
              <CheckIcon :class="$style.checkIcon" />
              <span>{{ part }}</span>
            </span>
          </template>
          <template v-else>
            <span class="inline-flex items-center gap-1">
              {{ formatParamValue(param.value) }}
              <LabelTooltip
                v-if="param.showHybridTooltip"
                :icon="InformationCircleIcon"
                tooltip-text="catalog.common.hybrid_tooltip"
                kind="unset"
                class="flex flex-shrink-0 items-center justify-center w-4 h-4 text-current opacity-70 hover:opacity-100 transition-opacity"
              />
            </span>
          </template>
        </span>
      </div>
    </div>

    <button
      v-if="props.expandable && groupedData.groups.length > 0"
      type="button"
      :class="$style.expandBtn"
      @click="isDrawerOpen = true"
    >
      <span>{{ t('catalog.detail.expand_all_params') }}</span>
      <ChevronRightIcon :class="$style.expandIcon" />
    </button>

    <SideDrawer
      v-model="isDrawerOpen"
      :title="t('catalog.detail.all_params')"
    >
      <template #before-body>
        <div class="px-4 py-4 sm:px-6 border-b border-gray-200 bg-gray-50">
          <Input
            v-model="searchQuery"
            type="text"
            :placeholder="t('catalog.detail.search_params')"
            class="!rounded-full !pr-10"
          >
            <template #input-icon>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none z-10">
                <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
              </div>
            </template>
          </Input>
        </div>
      </template>

      <template v-if="filteredGroups.length > 0">
        <Disclosure
          v-for="group in filteredGroups"
          :key="group.title"
          v-slot="{ open }"
          as="div"
          class="mb-4 border border-gray-200 bg-gray-50 rounded-xl overflow-hidden"
          default-open
        >
          <DisclosureButton
            class="flex w-full items-center gap-2 px-4 py-4 text-left text-base text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <ChevronDownIcon
              :class="[open ? 'rotate-180 transform' : '', 'h-5 w-5 text-gray-500 transition-transform duration-200']"
            />
            <span>{{ group.title }}</span>
          </DisclosureButton>

          <transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <DisclosurePanel class="px-4 py-4 bg-white border-t border-gray-200">
              <div :class="$style.paramsGrid">
                <div
                  v-for="(param, idx) in group.items"
                  :key="idx"
                  :class="$style.paramRow"
                >
                  <span :class="$style.paramName">{{ param.name }}</span>

                  <AuthLockInline
                    v-if="param.locked || (isGuest && isSecretParam(param.name))"
                    size="xs"
                    :class="$style.lockedValue"
                  />

                  <span
                    v-else
                    :class="$style.paramValue"
                  >
                    <template v-if="isTranslatable(param.value)">
                      <TranslatableWrapper
                        :data="param.value.data"
                        :config="param.value.config"
                        class="w-full relative"
                        control-class="absolute top-0 -right-4 z-10"
                      />
                    </template>
                    <template v-else-if="hasBullets(param.value)">
                      <span
                        v-for="(part, i) in bulletParts(param.value)"
                        :key="i"
                        class="inline-flex items-center mr-3"
                      >
                        <CheckIcon :class="$style.checkIcon" />
                        <span>{{ part }}</span>
                      </span>
                    </template>
                    <template v-else>
                      <span class="inline-flex items-center gap-1">
                        {{ formatParamValue(param.value) }}
                        <LabelTooltip
                          v-if="param.showHybridTooltip"
                          :icon="InformationCircleIcon"
                          tooltip-text="catalog.common.hybrid_tooltip"
                          kind="unset"
                          class="flex flex-shrink-0 items-center justify-center w-4 h-4 text-current opacity-70 hover:opacity-100 transition-opacity"
                        />
                      </span>
                    </template>
                  </span>
                </div>
              </div>
            </DisclosurePanel>
          </transition>
        </Disclosure>
      </template>

      <div
        v-else
        class="text-center py-10 text-gray-500"
      >
        {{ t('catalog.detail.nothing_found') }} «{{ searchQuery }}»
      </div>
    </SideDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useI18n } from "vue-i18n"
import { ChevronRightIcon, ChevronDownIcon, CheckIcon, MagnifyingGlassIcon } from "@heroicons/vue/24/solid"
import { InformationCircleIcon } from "@heroicons/vue/24/outline"
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/vue"
import LabelTooltip from "@/components/common/LabelTooltip.vue"
import SideDrawer from "@/components/common/SideDrawer.vue"
import AuthLockInline from "@/components/common/AuthLockInline.vue"
import type { ShortListing, ParamPair as Param, TranslatableParamValue } from "~/types/responses/listing"
import TranslatableWrapper from "~/components/common/TranslatableWrapper.vue"
import Input from "~/components/form/Input.vue"

interface ParamGroup {
  title: string
  items: Param[]
}

const props = withDefaults(defineProps<{
  car: ShortListing | null
  isGuest?: boolean
  expandable?: boolean
}>(), {
  expandable: true,
})

const { t } = useI18n()
const isDrawerOpen = ref(false)
const searchQuery = ref("")

watch(isDrawerOpen, (newVal) => {
  if (!newVal) {
    searchQuery.value = ""
  }
})

const params = computed(() => props.car?.params ?? [])

const { isShareDomain } = useShareDomain()

const secretParamNames = [
  t("catalog.detail.mileage"),
  t("catalog.detail.condition"),
  t("catalog.detail.chassis_number"),
  t("catalog.detail.year"),
  t("catalog.detail.month"),
]

const shareVisibleParamNames = [
  t("catalog.detail.mileage"),
  t("catalog.detail.year"),
  t("catalog.detail.month"),
]

function isSecretParam(name: string): boolean {
  if (isShareDomain.value && shareVisibleParamNames.includes(name)) {
    return false
  }
  if (secretParamNames.includes(name)) {
    return true
  }
  return false
}

const groupedData = computed(() => {
  const list = params.value || []
  const basicParams: Param[] = []
  const groups: ParamGroup[] = []

  let currentGroup: ParamGroup | null = null

  for (const p of list) {
    if (p.name === "group_header") {
      if (currentGroup && currentGroup.items.length > 0) {
        groups.push(currentGroup)
      }
      currentGroup = { title: String(p.value), items: [] }
    }
    else if (p.value || p.locked) {
      if (currentGroup) {
        currentGroup.items.push(p)
      }
      else {
        basicParams.push(p)
      }
    }
  }

  if (currentGroup && currentGroup.items.length > 0) {
    groups.push(currentGroup)
  }

  return { basicParams, groups }
})

const mainPageParams = computed(() => groupedData.value.basicParams)

const filteredGroups = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  const groups = groupedData.value.groups

  if (!query) {
    return groups
  }

  return groups.map((group) => {
    return {
      ...group,
      items: group.items.filter(param => param.name.toLowerCase().includes(query)),
    }
  }).filter(group => group.items.length > 0)
})

function isTranslatable(value: any): value is TranslatableParamValue {
  return value && typeof value === "object" && value.type === "translatable"
}

function formatParamValue(value: unknown): string {
  if (value == null) {
    return ""
  }
  if (typeof value === "object") {
    return ""
  }
  const str = String(value).trim()
  if (/^○$/.test(str)) {
    return t("catalog.detail.option_word")
  }
  return str
}

function hasBullets(value: unknown): boolean {
  if (typeof value === "object") {
    return false
  }
  return value != null && String(value).includes("●")
}

function bulletParts(value: unknown): string[] {
  if (value == null) {
    return []
  }
  const str = String(value)
  return str
    .split("●")
    .map((s) => {
      const trimmed = s.trim()
      if (!trimmed) {
        return ""
      }
      if (/^○$/.test(trimmed)) {
        return t("catalog.detail.option_word")
      }
      return trimmed
    })
    .filter(Boolean)
}
</script>

<style module>
.paramsGrid {
  @apply flex flex-col gap-4;
}
.paramRow {
  @apply flex flex-row items-start;
}
.paramName {
  @apply text-gray-500 text-sm w-1/2 text-left;
}
.paramValue {
  @apply text-black text-base font-medium w-1/2 text-left break-words;
}
.expandBtn {
  @apply flex items-center mt-4 text-blue-500 underline text-sm font-medium hover:text-blue-800 transition-colors;
}
.expandIcon {
  @apply w-5 h-5 ml-2;
}
.checkIcon {
  @apply w-5 h-5 text-green-500 inline-block mr-1 flex-none shrink-0 align-middle;
}
.lockedValue {
  @apply w-1/2 flex items-center;
}
</style>
