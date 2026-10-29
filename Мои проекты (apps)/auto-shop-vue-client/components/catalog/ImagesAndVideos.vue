<template>
  <div>
    <VideoRequestModal
      v-if="!isGuest"
      v-model:show="localShow"
      :car="car"
      :listing-id="listingId"
      @submit="handleVideoRequestSubmit"
      @update:show="setShow"
    />
    <template v-if="car?.images && car.images.length > 0">
      <Slider
        id="photo-slider"
        type="image"
        :items="car.images"
        :thumbs="car.imageThumbs ?? []"
        :originals="car.imageOriginals ?? []"
        :label="t('common.photo')"
        :blurred="car.imageBlurs ?? []"
        @locked-click="emit('locked-click')"
      />
    </template>
    <template v-else-if="isPhotosLocked || isGuest">
      <AuthLockBlock
        :title="t('catalog.detail.photo')"
        :blur-mode="true"
        :custom-class="$style.photoLockedBlock"
      />
    </template>
    <template v-if="isNameplatesLocked">
      <AuthLockBlock
        :title="t('listing.nameplate_photo')"
        :blur-mode="true"
        :custom-class="$style.sliderSpacing"
      />
    </template>
    <template v-else-if="showArchiveMedia && car?.nameplates && car.nameplates.length > 0">
      <Slider
        id="nameplate-slider"
        type="image"
        :items="car.nameplates"
        :thumbs="car.nameplateThumbs ?? []"
        :originals="car.nameplateOriginals ?? []"
        :label="t('listing.nameplate_photo')"
        :class="$style.sliderSpacing"
      />
    </template>
    <template v-if="showArchiveMedia && car?.defects && car.defects.length > 0">
      <Slider
        id="defect-slider"
        type="image"
        :items="car.defects"
        :thumbs="car.defectThumbs ?? []"
        :originals="car.defectOriginals ?? []"
        :captions="defectCaptions"
        :label="t('listing.defect_photo')"
        :class="$style.sliderSpacing"
      />
    </template>
    <template v-if="isVideosLocked">
      <AuthLockBlock
        :title="t('common.video')"
        :blur-mode="true"
        :custom-class="$style.sliderSpacing"
      />
    </template>
    <template v-else-if="showArchiveMedia && (!isGuest || (car?.videos && car.videos.length > 0))">
      <template v-if="car?.videos && car.videos.length > 0">
        <Slider
          id="video-slider"
          type="video"
          :items="car.videos"
          :posters="car.videoPosters ?? []"
          :label="t('common.video')"
          :class="$style.sliderSpacing"
        />
        <div v-if="canRequestVideo">
          <div
            v-if="!car?.video_requested"
            :class="$style.requestMoreVideoLink"
            @click.prevent="openVideoRequestModal"
          >
            {{ t('catalog.detail.request_more_video') }}
          </div>
          <div v-else>
            <Button
              kind="white"
              :class="$style.videoAgainActionBtn"
            >
              {{ t('catalog.detail.video_in_progress_again') }}
            </Button>
          </div>
        </div>
      </template>
      <template v-else>
        <div :class="$style.sliderSpacing">
          <div class="text-base font-bold mb-2">
            {{ t('common.video') }}
          </div>
          <template v-if="canRequestVideo">
            <template v-if="car?.video_requested">
              <p :class="$style.videoDesc">
                {{ t('catalog.detail.video_in_progress') }} <br>
                {{ t('catalog.detail.video_in_progress_desc') }}
              </p>
              <Button
                kind="white"
                :class="$style.priceActionBtn"
                @click="openVideoRequestModal"
              >
                {{ t('catalog.detail.request_car_video') }}
              </Button>
            </template>
            <template v-else>
              <p :class="$style.videoDesc">
                {{ t('catalog.detail.video_absence') }}
              </p>
              <Button
                kind="white"
                :class="$style.priceActionBtn"
                @click="openVideoRequestModal"
              >
                {{ t('catalog.detail.request_car_video') }}
              </Button>
            </template>
          </template>
          <template v-else>
            <p :class="$style.videoDesc">
              {{ t('catalog.detail.video_absence') }}
            </p>
          </template>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch, computed } from "vue"
import { useI18n } from "vue-i18n"
import type { ShortListingNullable } from "~/types/responses/listing"
import { SaleStatusBooked, SaleStatusSold } from "~/constants/catalog"
import { useUserStore } from "~/stores/user"

import Button from "@/components/common/Button.vue"
import Slider from "@/components/common/Slider.vue"
import VideoRequestModal from "@/components/catalog/VideoRequestModal.vue"
import AuthLockBlock from "@/components/common/AuthLockBlock.vue"

const props = defineProps<{
  car: ShortListingNullable
  listingId: number
  showVideoModal?: boolean
  isGuest?: boolean
  hasVideos?: boolean
  isPhotosLocked?: boolean
  isVideosLocked?: boolean
  isNameplatesLocked?: boolean
}>()

const emit = defineEmits<{
  (e: "update:showVideoModal", value: boolean): void
  (e: "request-video-submit" | "locked-click"): void
}>()

const { t, locale } = useI18n()

const userStore = useUserStore()
const localShow = ref<boolean>(!!props.showVideoModal)

const defectCaptions = computed<string[]>(() =>
  (props.car?.defectDescriptions ?? []).map((d) => {
    const map = d ?? {}
    return map[locale.value] ?? map.ru ?? map.zh ?? Object.values(map)[0] ?? ""
  }),
)

const canRequestVideo = computed(() => {
  if (!props.car) {
    return false
  }

  if (userStore.isAdmin || userStore.isAnySeller) {
    return false
  }

  const status = props.car.sale_status
  return status !== SaleStatusBooked && status !== SaleStatusSold
})

const showArchiveMedia = computed(() => {
  return !props.car?.is_archive || !!props.car?.can_view_archive_details
})

watch(() => props.showVideoModal, (v) => {
  if (v !== localShow.value) {
    localShow.value = !!v
  }
})

function setShow(val: boolean) {
  localShow.value = val
  emit("update:showVideoModal", val)
}

function openVideoRequestModal() {
  if (!canRequestVideo.value) {
    return
  }
  setShow(true)
}

function handleVideoRequestSubmit() {
  setShow(false)
  emit("request-video-submit")
}
</script>

<style module>
.topButtons > *:not(:last-child) {
  @apply mb-2 md:mb-0;
}
.sliderSpacing {
  @apply mt-6;
}
.priceActionBtn {
  @apply lg:min-w-[200px];
}
.videoAgainActionBtn {
  @apply lg:min-w-[200px] mt-2;
}
.requestMoreVideoLink {
  @apply text-gray-500 font-medium text-sm underline mt-2 cursor-pointer;
}
.videoDesc {
  @apply text-gray-500 font-medium text-sm mb-2;
}
.photoLockedBlock {
  @apply mb-6;
}
</style>
