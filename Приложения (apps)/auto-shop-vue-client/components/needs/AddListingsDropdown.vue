<template>
  <div :class="$style.dropdownContainer">
    <Input
      v-model="searchQuery"
      :placeholder="t('common.search')"
      class="mb-4"
    />

    <div
      v-if="isLoading"
      :class="$style.loaderWrapper"
    >
      <span :class="$style.loaderText">{{ t("common.loading") }}</span>
    </div>

    <template v-else>
      <div :class="$style.listWrapper">
        <div
          v-if="listings.length === 0"
          :class="$style.emptyState"
        >
          {{ searchQuery.trim() ? t("needs.no_listings_found") : t("needs.no_available_listings") }}
        </div>

        <div
          v-for="listing in listings"
          :key="listing.id"
          :class="$style.listItem"
        >
          <CheckBox
            :id="`listing-checkbox-${listing.id}`"
            v-model="selectedIds"
            :value="listing.id"
            :class="$style.checkbox"
          />

          <div :class="$style.itemInfo">
            <h4 :class="$style.itemName">
              {{ listing.name }}
            </h4>
            <p :class="$style.itemSpecs">
              {{ formatSpecs(listing) }}
            </p>
          </div>

          <div :class="$style.itemActions">
            <span :class="$style.itemPrice">{{ formatPrice(listing.price) }} ¥</span>

            <div :class="$style.iconButtons">
              <Button
                kind="unset"
                size="unset"
                :class="$style.iconButton"
                @click="$emit('preview', listing)"
              >
                <EyeIcon :class="$style.icon" />
              </Button>
              <NuxtLink
                :to="`/personal/listings/${listing.id}`"
                target="_blank"
                :class="$style.iconButton"
              >
                <ArrowTopRightOnSquareIcon :class="$style.icon" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <Pagination
        v-if="total > pageSize"
        class="mt-3"
        :current-page="currentPage"
        :total="total"
        :limit="pageSize"
        :show-limits="false"
        :show-total="false"
        :disabled="isLoading"
        @change-page="onPaginationChange"
      />
    </template>

    <div :class="$style.footer">
      <Button
        kind="black"
        :disabled="selectedIds.length === 0 || isSaving"
        @click="save"
      >
        {{ isSaving ? t("common.saving") : t("common.add") }} ({{
          selectedIds.length
        }})
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import { useDebounceFn } from "@vueuse/core"
import { EyeIcon, ArrowTopRightOnSquareIcon } from "@heroicons/vue/24/outline"
import Button from "@/components/common/Button.vue"
import Pagination from "@/components/common/Pagination.vue"
import Input from "@/components/form/Input.vue"
import CheckBox from "@/components/form/CheckBox.vue"
import useSearchRequest from "@/composables/useSearchRequest"
import { useListingFormat } from "@/composables/useListingFormat"
import type { PaginationData } from "@/types/common/pagination"

const PAGE_SIZE = 5

const props = defineProps<{ requestId: number }>()
const emit = defineEmits<{
  (e: "saved"): void
  (e: "preview", listing: any): void
}>()

const { t } = useI18n()
const {
  availableListings: listings,
  availableListingsMeta,
  isLoadingListings: isLoading,
  loadAvailableListings,
  bindListingsToRequest,
} = useSearchRequest()
const { formatPrice, formatSpecs } = useListingFormat()

const selectedIds = ref<number[]>([])
const searchQuery = ref("")
const currentPage = ref(1)
const total = ref(0)
const pageSize = PAGE_SIZE
const isSaving = ref(false)

const fetchListings = async () => {
  await loadAvailableListings(props.requestId, {
    query: searchQuery.value.trim() || undefined,
    offset: (currentPage.value - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  })
  total.value = availableListingsMeta.value?.total ?? 0
  if (availableListingsMeta.value?.currentPage) {
    currentPage.value = availableListingsMeta.value.currentPage
  }
}

const onPaginationChange = (data: PaginationData) => {
  if (data.currentPage === currentPage.value) {
    return
  }
  currentPage.value = data.currentPage
  fetchListings()
}

const debouncedSearch = useDebounceFn(() => {
  currentPage.value = 1
  fetchListings()
}, 400)

watch(searchQuery, () => {
  debouncedSearch()
})

onMounted(() => fetchListings())

const save = async () => {
  if (selectedIds.value.length === 0) {
    return
  }
  isSaving.value = true
  try {
    const success = await bindListingsToRequest(props.requestId, selectedIds.value)
    if (success) {
      emit("saved")
    }
  }
  finally {
    isSaving.value = false
  }
}
</script>

<style module>
.dropdownContainer {
  @apply flex flex-col w-full max-h-[600px] bg-white rounded-xl overflow-hidden p-4;
}

.loaderWrapper {
  @apply flex justify-center py-8;
}

.loaderText {
  @apply text-gray-500;
}

.listWrapper {
  @apply flex-1 overflow-y-auto pr-2 space-y-2;
}

.emptyState {
  @apply text-gray-500 text-sm py-4 text-center;
}

.listItem {
  @apply flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition;
}

.checkbox {
  @apply flex-shrink-0;
}

.itemInfo {
  @apply flex-1 min-w-0;
}

.itemName {
  @apply text-sm font-medium text-gray-900 truncate;
}

.itemSpecs {
  @apply text-xs text-gray-500 truncate mt-1;
}

.itemActions {
  @apply flex items-center gap-4 shrink-0;
}

.itemPrice {
  @apply font-semibold whitespace-nowrap;
}

.iconButtons {
  @apply flex items-center gap-2;
}

.iconButton {
  @apply p-1 text-gray-400 hover:text-gray-900 transition;
}

.icon {
  @apply w-5 h-5;
}

.footer {
  @apply pt-4 mt-2 border-t border-gray-100 flex justify-end gap-3 shrink-0;
}
</style>
