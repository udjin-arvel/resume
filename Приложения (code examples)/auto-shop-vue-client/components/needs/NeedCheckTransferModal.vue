<template>
  <Modal
    v-model="isOpen"
    size="lg"
  >
    <template #body>
      <h2 class="mb-4 pr-10 text-xl font-bold">
        {{ t('needs.check_transfer.title') }}
      </h2>
      <p class="mb-2 text-sm font-medium">
        {{ t(request.type === 'diagnostic' ? 'needs.proposal_checks.diagnostic' : 'needs.proposal_checks.compensation') }}
        · {{ request.listing?.name || t('needs.detail.checks.car_unavailable') }}
      </p>
      <p class="mb-4 text-sm text-gray-600">
        {{ t('needs.check_transfer.description') }}
      </p>
      <div
        v-if="alert"
        role="alert"
      >
        <Alert :alert="alert" />
      </div>
      <input
        ref="searchInput"
        v-model="query"
        type="search"
        maxlength="200"
        :disabled="submitting"
        :placeholder="t('catalog.need_selection.search')"
        :aria-label="t('catalog.need_selection.search')"
        class="mb-3 w-full rounded-lg border-gray-300 text-sm"
      >
      <p
        v-if="selectedTarget"
        class="mb-3 break-words text-sm text-gray-600"
      >
        {{ t('needs.check_transfer.selected', { number: number(selectedTarget.id), title: title(selectedTarget) }) }}
      </p>
      <div
        :aria-busy="loading"
        class="max-h-64 overflow-y-auto text-sm"
      >
        <p
          v-if="loading"
          role="status"
          class="py-4 text-gray-500"
        >
          {{ t('common.loading') }}
        </p>
        <div
          v-else-if="loadError"
          role="alert"
          class="py-4 text-red-600"
        >
          {{ loadError }}
          <button
            type="button"
            :disabled="submitting"
            class="ml-2 underline"
            @click="load"
          >
            {{ t('catalog.need_selection.retry') }}
          </button>
        </div>
        <fieldset v-else>
          <legend class="sr-only">
            {{ t('needs.check_transfer.target') }}
          </legend>
          <SearchRequestOptionRow
            v-for="option in options"
            :key="option.id"
            :option="option"
            :name="fieldId"
            :selected="selectedTarget?.id === option.id"
            :disabled="submitting"
            @select="selectTarget"
          />
          <p
            v-if="options.length === 0"
            class="py-4 text-gray-500"
          >
            {{ t(query.trim() ? 'needs.check_transfer.no_results' : 'needs.check_transfer.empty') }}
          </p>
        </fieldset>
      </div>
      <div class="mt-3 flex items-center justify-center gap-2 text-sm">
        <button
          type="button"
          :disabled="page === 1 || loading || submitting"
          :aria-label="t('catalog.need_selection.previous')"
          class="px-2 py-1 disabled:opacity-30"
          @click="changePage(page - 1)"
        >
          ‹
        </button>
        <span>{{ page }} / {{ lastPage }}</span>
        <button
          type="button"
          :disabled="page >= lastPage || loading || submitting"
          :aria-label="t('catalog.need_selection.next')"
          class="px-2 py-1 disabled:opacity-30"
          @click="changePage(page + 1)"
        >
          ›
        </button>
      </div>
    </template>
    <template #footer>
      <div class="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button
          kind="blue"
          type="button"
          :disabled="!selectedTarget || loading || !!loadError || submitting"
          @click="confirm"
        >
          {{ t('needs.check_transfer.action') }}
        </Button>
        <Button
          kind="lightgrey"
          type="button"
          :disabled="submitting"
          @click="isOpen = false"
        >
          {{ t('actions.cancel') }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from "vue"
import { useI18n } from "vue-i18n"
import type { FetchError } from "ofetch"
import Modal from "@/components/common/Modal.vue"
import Button from "@/components/common/Button.vue"
import Alert from "@/components/common/Alert.vue"
import SearchRequestOptionRow from "@/components/needs/SearchRequestOptionRow.vue"
import { useApiSearchRequests } from "@/composables/api/useApiSearchRequests"
import { useSearchRequestOption } from "@/composables/useSearchRequestOption"
import type { Alert as AlertData } from "@/types/common/alert"
import type { SearchRequestListingRequest } from "@/types/responses/searchRequest"
import type { SearchRequestForListingRequestOption } from "@/types/responses/searchRequestForListingRequest"

const props = defineProps<{
  show: boolean
  sourceRequestId: number
  request: SearchRequestListingRequest
  submitting: boolean
  alert: AlertData | null
}>()

const emit = defineEmits<{
  "update:show": [value: boolean]
  "confirm": [targetSearchRequestId: number]
}>()

const { t } = useI18n()
const { number, title } = useSearchRequestOption()
const { getListingRequestTransferOptions } = useApiSearchRequests()
const fieldId = useId()
const searchInput = ref<HTMLInputElement | null>(null)
const query = ref("")
const page = ref(1)
const total = ref(0)
const options = ref<SearchRequestForListingRequestOption[]>([])
const selectedTarget = ref<SearchRequestForListingRequestOption>()
const loading = ref(true)
const loadError = ref<string | null>(null)
let requestVersion = 0
let searchTimer: ReturnType<typeof setTimeout> | undefined

const lastPage = computed(() => Math.max(1, Math.ceil(total.value / 10)))
const isOpen = computed({
  get: () => props.show,
  set: (value) => {
    if (!props.submitting) {
      emit("update:show", value)
    }
  },
})

async function load() {
  const version = ++requestVersion
  loading.value = true
  loadError.value = null
  try {
    const response = await getListingRequestTransferOptions(props.sourceRequestId, props.request.id, {
      query: query.value,
      offset: (page.value - 1) * 10,
      limit: 10,
    })
    if (version !== requestVersion) {
      return
    }
    options.value = response.data
    total.value = response.meta.total
  }
  catch (error) {
    if (version === requestVersion) {
      const response = (error as FetchError<{ message?: string }>).data
      loadError.value = response?.message || t("catalog.need_selection.load_error")
    }
  }
  finally {
    if (version === requestVersion) {
      loading.value = false
    }
  }
}

function selectTarget(option: SearchRequestForListingRequestOption) {
  if (!props.submitting) {
    selectedTarget.value = option
  }
}

function changePage(value: number) {
  if (loading.value || props.submitting) {
    return
  }
  page.value = value
  void load()
}

function confirm() {
  if (selectedTarget.value && !loading.value && !loadError.value && !props.submitting) {
    emit("confirm", selectedTarget.value.id)
  }
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

onMounted(async () => {
  void load()
  await nextTick()
  searchInput.value?.focus()
})

onBeforeUnmount(() => {
  ++requestVersion
  clearTimeout(searchTimer)
})
</script>
