<template>
  <Modal
    :model-value="isOpen"
    size="xl7"
    @update:model-value="close"
  >
    <template #body>
      <div
        v-if="listing"
        :class="$style.content"
      >
        <div :class="$style.gallery">
          <template v-if="listing.images?.length">
            <Slider
              :id="`listing-preview-slider-${listing.id}`"
              type="image"
              :items="listing.images"
              :label="t('needs.preview.photo_gallery')"
            />
          </template>
          <div
            v-else
            :class="$style.noPhoto"
          >
            {{ t("needs.preview.no_photo") }}
          </div>
        </div>

        <div :class="$style.info">
          <div class="pr-10 md:pr-12">
            <h2 :class="$style.title">
              {{ listing.name }}
            </h2>
            <p :class="$style.subtitle">
              {{ formatSpecs(listing) }}
            </p>
          </div>

          <div :class="$style.priceRow">
            <div>
              <div :class="$style.priceLabel">
                {{ t("needs.preview.china_price_label") }}
              </div>
              <div :class="$style.priceValue">
                {{ formatNumber(listing.price) }} ¥
              </div>
            </div>

            <Button
              kind="lightgrey"
              :class="$style.addButton"
              :disabled="isSaving"
              @click="addToRequest"
            >
              <PlusIcon class="w-4 h-4 mr-2" />
              {{ t("needs.preview.add_to_request") }}
            </Button>
          </div>

          <div :class="$style.block">
            <Params
              :car="listingAsShortListing"
              :expandable="false"
            />
          </div>

          <div :class="$style.bottomLinkRow">
            <NuxtLink
              :to="`/personal/listings/${listing.id}`"
              target="_blank"
              :class="$style.toListingLink"
            >
              <span>{{ t("needs.preview.to_listing") }}</span>
              <ArrowTopRightOnSquareIcon :class="$style.toListingIcon" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useI18n } from "vue-i18n"
import { ArrowTopRightOnSquareIcon } from "@heroicons/vue/20/solid"
import { PlusIcon } from "@heroicons/vue/24/solid"
import Modal from "@/components/common/Modal.vue"
import Button from "@/components/common/Button.vue"
import Slider from "@/components/common/Slider.vue"
import Params from "@/components/catalog/Params.vue"
import useSearchRequest from "@/composables/useSearchRequest"
import { useListingFormat } from "@/composables/useListingFormat"

const props = defineProps<{
  isOpen: boolean
  listing: any | null
  requestId: number
}>()
const emit = defineEmits<{
  (e: "update:isOpen", val: boolean): void
  (e: "saved"): void
}>()

const { t } = useI18n()
const { bindListingsToRequest } = useSearchRequest()
const { formatNumber, formatSpecs, tryTranslate } = useListingFormat()
const isSaving = ref(false)

const close = () => emit("update:isOpen", false)

const paramsRows = computed(() => {
  if (!props.listing) {
    return []
  }
  const l = props.listing
  const result = []

  if (l.car?.brand_name) {
    result.push({ name: t("catalog.detail.brand"), value: l.car.brand_name })
  }
  if (l.car?.model_name) {
    result.push({ name: t("catalog.detail.model"), value: l.car.model_name })
  }
  if (l.car?.name) {
    result.push({ name: t("catalog.detail.equipment"), value: l.car.name })
  }
  if (l.description) {
    result.push({ name: t("catalog.detail.description"), value: tryTranslate("cars.description", l.description) })
  }
  if (l.original_paint !== null && l.original_paint !== undefined) {
    result.push({ name: t("common.original_paint"), value: l.original_paint ? t("common.yes") : t("common.no") })
  }
  if (l.condition) {
    result.push({ name: t("catalog.detail.condition"), value: tryTranslate("cars.condition", l.condition) })
  }
  if (l.mileage != null) {
    result.push({ name: t("catalog.detail.mileage"), value: `${formatNumber(l.mileage)} ${t("catalog.list.km")}` })
  }
  if (l.car?.displacement) {
    result.push({ name: t("catalog.detail.displacement"), value: String(l.car.displacement) })
  }
  if (l.car?.common_short_gearbox) {
    result.push({ name: t("catalog.detail.common_gearbox"), value: tryTranslate("cars.gearbox", l.car.common_short_gearbox) })
  }
  if (l.car?.chassis_driven_type) {
    result.push({ name: t("catalog.detail.chassis_driven_type"), value: l.car.chassis_driven_type })
  }

  return result
})

const listingAsShortListing = computed(() => ({ params: paramsRows.value }) as any)

const addToRequest = async () => {
  if (!props.listing || !props.requestId) {
    return
  }
  isSaving.value = true
  try {
    const success = await bindListingsToRequest(props.requestId, [props.listing.id])
    if (success) {
      emit("saved")
    }
  }
  catch (e) {
    console.error(e)
  }
  finally {
    isSaving.value = false
  }
}
</script>

<style module>
.content {
  @apply flex flex-col lg:flex-row gap-8 pt-8 lg:pt-4;
}
.gallery {
  @apply w-full lg:w-1/2 flex flex-col gap-2;
}
.block {
  @apply mt-8 bg-white border border-gray-200 rounded-xl p-6;
}
.noPhoto {
  @apply flex items-center justify-center bg-gray-100 rounded-lg text-gray-400 w-full;
  aspect-ratio: 16 / 9;
}
.info {
  @apply w-full lg:w-1/2 flex flex-col;
}
.title {
  @apply text-xl md:text-2xl font-bold text-gray-900 mb-1;
}
.subtitle {
  @apply text-sm md:text-base text-gray-600 mb-6;
}
.priceRow {
  @apply flex items-center justify-between mb-6 pb-6;
}
.priceLabel {
  @apply text-sm text-gray-500 mb-1;
}
.priceValue {
  @apply text-2xl md:text-3xl font-bold;
}
.addButton {
  @apply border-gray-300;
  padding-left: 1.5rem !important;
  padding-right: 1.5rem !important;
}
.bottomLinkRow {
  @apply text-center mt-auto pt-6 pb-4 lg:pb-0;
}
.toListingLink {
  @apply inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition;
}
.toListingIcon {
  @apply w-4 h-4;
}
</style>
