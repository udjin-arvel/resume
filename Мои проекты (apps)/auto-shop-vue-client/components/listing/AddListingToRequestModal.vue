<template>
  <Modal
    :model-value="isOpen"
    size="lg"
    :overflow-hidden="false"
    @update:model-value="closeModal"
  >
    <template #body>
      <h3 :class="$style.title">
        {{ t('catalog.actions.add_to_request') }}
      </h3>

      <div
        v-if="isLoadingLocal"
        :class="$style.loaderWrapper"
      >
        <span :class="$style.loaderText">{{ t('common.loading') }}</span>
      </div>

      <div v-else>
        <SearchableSelect
          v-model="selectedRequests"
          :options="requests"
          :label="t('listing.add_car_to_request')"
          :placeholder="t('listing.request_placeholder')"
          :class="$style.searchSelect"
          :multiple="true"
          :disabled="isSaving || !hasLoadedBindings"
        />
        <div
          v-if="hasNewRequests"
          :class="$style.requestWarning"
        >
          <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
          {{ t('needs.take_request_to_work_first') }}
        </div>

        <div
          v-if="selectedRequests.length > 0"
          :class="$style.selectedRequestsWrapper"
        >
          <div
            v-for="req in selectedRequests"
            :key="req.value"
            :class="$style.selectedRequestItem"
          >
            <span>{{ req.name }}</span>
            <Button
              kind="unset"
              size="unset"
              :class="$style.removeButton"
              :disabled="isLocked(req)"
              :title="isLocked(req) ? t('needs.booking_action_blocked') : undefined"
              @click="removeRequest(req)"
            >
              <XMarkIcon :class="$style.removeIcon" />
            </Button>
          </div>
        </div>

        <div
          v-if="requests.length === 0 && !isLoadingLocal"
          :class="$style.emptyText"
        >
          {{ t('requests.no_open_requests') }}
        </div>
      </div>
    </template>

    <template #footer>
      <div :class="$style.footerButtons">
        <Button
          kind="white"
          size="base"
          type="button"
          @click="closeModal"
        >
          {{ t('common.cancel') }}
        </Button>
        <Button
          kind="black"
          size="base"
          type="button"
          :disabled="isSaving || isLoadingLocal || !hasLoadedBindings"
          @click="save"
        >
          {{ isSaving ? t('common.saving') : t('common.save') }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { useI18n } from "vue-i18n"
import { ExclamationCircleIcon, XMarkIcon } from "@heroicons/vue/24/outline"
import Modal from "@/components/common/Modal.vue"
import Button from "@/components/common/Button.vue"
import SearchableSelect from "@/components/form/SearchableSelect.vue"
import useListing from "@/composables/useListing"
import { useListingRequestSelection } from "@/composables/useListingRequestSelection"
import { useNotificationsStore } from "@/stores/notifications"
import type { OptionBase } from "@/types/form/optionType"
import type { Listing } from "@/types/responses/listing"

const props = defineProps<{
  isOpen: boolean
  listingId: number | null
}>()

const emit = defineEmits<{
  (e: "close" | "saved"): void
}>()

const { t } = useI18n()
const { loadOpenRequests, requestOptions, show, isSavingRequests: isSaving, bindListingToRequests } = useListing()

const requests = requestOptions
const selection = ref<OptionBase[]>([])
const { selectedRequests, initialize, isLocked } = useListingRequestSelection(requests, selection)
const { errorNotify } = useNotificationsStore()
const isLoadingLocal = ref(false)
const hasLoadedBindings = ref(false)
const hasNewRequests = computed(() =>
  requestOptions.value.some(opt => opt.status === "new"),
)

watch(() => props.isOpen, async (val) => {
  if (val && props.listingId) {
    isLoadingLocal.value = true
    hasLoadedBindings.value = false
    initialize([])

    try {
      if (!await loadOpenRequests()) {
        errorNotify(t("needs.action_error"))
        return
      }

      const listing = await show(props.listingId) as Listing
      if (!listing) {
        errorNotify(t("needs.action_error"))
        return
      }
      initialize(listing.search_requests ?? [])
      hasLoadedBindings.value = true
    }
    catch (e) {
      console.error(e)
    }
    finally {
      isLoadingLocal.value = false
    }
  }
})

const closeModal = () => {
  emit("close")
}

const removeRequest = (req: OptionBase) => {
  if (isLocked(req)) {
    return
  }
  selectedRequests.value = selectedRequests.value.filter(r => r.value !== req.value)
}

const save = async () => {
  if (!props.listingId || !hasLoadedBindings.value || isSaving.value) {
    return
  }
  const requestIds = selectedRequests.value.map(r => Number(r.value))
  if (!await bindListingToRequests(props.listingId, requestIds)) {
    errorNotify(t("needs.action_error"))
    return
  }
  emit("saved")
  closeModal()
}
</script>

<style module>
.title {
  @apply text-lg font-medium leading-6 text-gray-900 mb-4;
}

.loaderWrapper {
  @apply flex justify-center py-4;
}

.loaderText {
  @apply text-gray-500;
}

.searchSelect {
  @apply w-full mb-4;
}

.selectedRequestsWrapper {
  @apply mt-4 flex flex-wrap gap-2;
}

.selectedRequestItem {
  @apply inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800;
}

.removeButton {
  @apply ml-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-500 focus:bg-gray-500 focus:text-white focus:outline-none;
}

.removeIcon {
  @apply h-3 w-3;
}

.emptyText {
  @apply text-gray-500 text-sm mt-2;
}

.footerButtons {
  @apply flex justify-end gap-3;
}

.requestWarning {
  @apply flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 -mt-2 mb-4;
}
</style>
