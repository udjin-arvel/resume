<template>
  <div class="mt-5 text-sm">
    <label
      :for="fieldId"
      class="block mb-2 text-gray-600"
    >{{ t('catalog.need_selection.label') }}</label>
    <button
      :id="fieldId"
      ref="trigger"
      type="button"
      class="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white p-3 text-left"
      :disabled="disabled || loading"
      :aria-expanded="expanded"
      :aria-controls="`${fieldId}-options`"
      @click="toggle"
    >
      <span>{{ selectedLabel }}</span>
      <ChevronDownIcon
        class="h-4 w-4 shrink-0 text-gray-400"
        :class="{ 'rotate-180': expanded }"
      />
    </button>
    <p
      v-if="selectedOption?.has_listing"
      class="mt-2 text-gray-500"
    >
      {{ t('catalog.need_selection.already_in_request') }}
    </p>
    <p
      v-if="loading"
      role="status"
      class="mt-3 text-gray-500"
    >
      {{ t('common.loading') }}
    </p>
    <div
      v-if="error"
      role="alert"
      class="mt-3 text-red-600"
    >
      {{ t('catalog.need_selection.load_error') }}
      <button
        type="button"
        class="ml-2 underline"
        @click="load"
      >
        {{ t('catalog.need_selection.retry') }}
      </button>
    </div>
    <div
      v-if="expanded"
      :id="`${fieldId}-options`"
      class="mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
      @keydown.esc.stop.prevent="close"
    >
      <input
        ref="searchInput"
        v-model="query"
        type="search"
        maxlength="200"
        class="mb-3 w-full rounded-lg border-gray-300 text-sm"
        :placeholder="t('catalog.need_selection.search')"
        :aria-label="t('catalog.need_selection.search')"
      >
      <div
        class="max-h-64 overflow-y-auto"
        :aria-busy="loading"
      >
        <template v-if="!loading && !error">
          <fieldset
            v-for="group in groups"
            :key="group.key"
            class="mb-3"
          >
            <legend class="mb-2 text-xs font-semibold uppercase text-gray-400">
              {{ group.title }}
            </legend>
            <SearchRequestOptionRow
              v-for="option in group.options"
              :key="option.id"
              :option="option"
              :name="fieldId"
              :selected="draftId === option.id"
              @select="selectDraft"
            />
          </fieldset>
          <p
            v-if="options.length === 0"
            class="py-3 text-gray-500"
          >
            {{ t('catalog.need_selection.empty') }}
          </p>
        </template>
      </div>
      <label
        class="mt-2 flex cursor-pointer items-center gap-3 rounded-lg border p-3"
        :class="draftId === null ? 'border-red-600 bg-red-50' : 'border-gray-100'"
      >
        <input
          v-model="draftId"
          type="radio"
          :name="fieldId"
          :value="null"
          class="border-gray-300 text-red-600 focus:ring-red-500"
          @change="draftOption = null"
        >
        <span>{{ t('catalog.need_selection.none') }}</span>
      </label>
      <div class="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-2 py-1 disabled:opacity-30"
            :disabled="page === 1 || loading"
            :aria-label="t('catalog.need_selection.previous')"
            @click="changePage(page - 1)"
          >
            ‹
          </button>
          <span>{{ page }} / {{ lastPage }}</span>
          <button
            type="button"
            class="px-2 py-1 disabled:opacity-30"
            :disabled="page >= lastPage || loading"
            :aria-label="t('catalog.need_selection.next')"
            @click="changePage(page + 1)"
          >
            ›
          </button>
        </div>
        <Button
          kind="blue"
          size="sm"
          :disabled="draftId === undefined || loading || error"
          @click="apply"
        >
          {{ t('catalog.need_selection.choose') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from "vue"
import { ChevronDownIcon } from "@heroicons/vue/24/solid"
import Button from "@/components/common/Button.vue"
import SearchRequestOptionRow from "@/components/needs/SearchRequestOptionRow.vue"
import { useSearchRequestOption } from "@/composables/useSearchRequestOption"
import type { SearchRequestForListingRequestOption, SearchRequestForListingRequestResponse } from "@/types/responses/searchRequestForListingRequest"

const props = defineProps<{ listingId: number, disabled?: boolean }>()
const model = defineModel<number | null>()
const ready = defineModel<boolean>("ready", { default: false })
const { t } = useI18n()
const { number, title } = useSearchRequestOption()
const $api = useNuxtApp().$api as typeof $fetch
const fieldId = useId()
const trigger = ref<HTMLButtonElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
const expanded = ref(false)
const loading = ref(true)
const error = ref(false)
const query = ref("")
const page = ref(1)
const total = ref(0)
const options = ref<SearchRequestForListingRequestOption[]>([])
const selectedOption = ref<SearchRequestForListingRequestOption | null>(null)
const draftId = ref<number | null>()
const draftOption = ref<SearchRequestForListingRequestOption | null>(null)
let initialized = false
let requestVersion = 0
let searchTimer: ReturnType<typeof setTimeout> | undefined
const lastPage = computed(() => Math.max(1, Math.ceil(total.value / 10)))
const groups = computed(() => [
  { key: "matching", title: t("catalog.need_selection.matching"), options: options.value.filter(option => option.has_listing) },
  { key: "other", title: t("catalog.need_selection.other"), options: options.value.filter(option => !option.has_listing) },
].filter(group => group.options.length > 0))
const selectedLabel = computed(() => {
  if (model.value === null) {
    return t("catalog.need_selection.none")
  }
  if (selectedOption.value) {
    return `${number(selectedOption.value.id)} · ${title(selectedOption.value)}`
  }
  return t("catalog.need_selection.placeholder")
})
watch([model, loading, error, expanded], () => {
  ready.value = model.value !== undefined && !loading.value && !error.value && !expanded.value
}, { immediate: true })

function selectDraft(option: SearchRequestForListingRequestOption) {
  draftId.value = option.id
  draftOption.value = option
}
async function load() {
  const version = ++requestVersion
  loading.value = true
  error.value = false
  try {
    const response = await $api<SearchRequestForListingRequestResponse>("/api/v1/search-requests/list-for-listing-request", {
      query: { listing_id: props.listingId, query: query.value, offset: (page.value - 1) * 10, limit: 10 },
    })
    if (version !== requestVersion) {
      return
    }
    options.value = response.data
    total.value = response.meta.total
    if (!initialized) {
      initialized = true
      selectedOption.value = response.meta.default_option
      if (response.meta.total === 0 && query.value.trim() === "") {
        model.value = null
      }
      else {
        model.value = selectedOption.value?.id
      }
    }
  }
  catch {
    if (version === requestVersion) {
      error.value = true
    }
  }
  finally {
    if (version === requestVersion) {
      loading.value = false
    }
  }
}
async function toggle() {
  if (expanded.value) {
    close()
    return
  }
  draftId.value = model.value
  draftOption.value = selectedOption.value
  expanded.value = true
  await nextTick()
  searchInput.value?.focus()
}
function close() {
  expanded.value = false
  trigger.value?.focus()
}
function apply() {
  if (draftId.value === undefined || loading.value || error.value) {
    return
  }
  model.value = draftId.value
  selectedOption.value = draftOption.value
  close()
}
function changePage(value: number) {
  page.value = value
  void load()
}
watch(query, () => {
  clearTimeout(searchTimer)
  ++requestVersion
  loading.value = true
  page.value = 1
  searchTimer = setTimeout(() => {
    void load()
  }, 300)
})
onMounted(() => {
  void load()
})
onBeforeUnmount(() => {
  ++requestVersion
  clearTimeout(searchTimer)
})
</script>
