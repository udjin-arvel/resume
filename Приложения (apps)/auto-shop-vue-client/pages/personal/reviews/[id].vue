<template>
  <div>
    <div :class="$style.header">
      <NuxtLink
        :to="`/catalog/`"
        :class="$style.backLink"
      >
        <Button
          kind="white"
          size="sm"
        >
          <ArrowLeftIcon class="w-5 h-5 mr-2" />
          {{ t('reviews.back_to_cars') }}
        </Button>
      </NuxtLink>
    </div>

    <h1 :class="$style.pageTitle">
      {{ t('reviews.view_title') }}
    </h1>

    <div v-if="isLoading">
      <p class="text-gray-500">
        {{ t('common.loading') }}
      </p>
    </div>

    <div
      v-else-if="review"
      :class="$style.content"
    >
      <div :class="$style.carInfo">
        <img
          :src="carImage"
          alt="Car"
          :class="$style.carImage"
        >
        <div :class="$style.carDetails">
          <NuxtLink
            v-if="review.orderId"
            :to="{ name: 'personal-logistic-tracking-id', params: { id: review.orderId } }"
            :class="$style.carName"
          >
            {{ carName }}
          </NuxtLink>
          <span
            v-else
            :class="$style.carName"
          >
            {{ carName }}
          </span>

          <p :class="$style.carSpecs">
            {{ carParams }}
          </p>
          <p :class="$style.carSeller">
            {{ t('reviews.seller') }}: {{ sellerName }}.  {{ t('reviews.buyer') }}: {{ buyerName }}
          </p>
        </div>
      </div>
      <div :class="$style.reviewCard">
        <div
          v-if="review.status === 'pending' && user?.role === RoleAdmin"
          :class="$style.actionsRow"
        >
          <Button
            kind="black"
            size="sm"
            @click="openAcceptModal"
          >
            {{ t('reviews.actions.accept') }}
          </Button>
          <Button
            kind="white"
            size="sm"
            @click="openRejectModal"
          >
            {{ t('reviews.actions.reject') }}
          </Button>
        </div>

        <div :class="$style.reviewHeader">
          <span :class="$style.reviewDate">
            {{ formatDate(review.createdAt) }}
          </span>
          <Label
            v-if="review.status === 'accepted'"
            kind="gray"
            :text="t('reviews.status.accepted')"
          />
          <Label
            v-else-if="review.status === 'rejected'"
            kind="red"
            :text="t('reviews.status.rejected')"
          />
          <span
            v-else-if="review.status === 'pending'"
          />
        </div>

        <div :class="$style.reviewSection">
          <h3 :class="$style.sectionTitle">
            {{ t('reviews.review.rating_label') }}
          </h3>
          <div :class="$style.ratingDisplay">
            <span
              v-if="review.rating === 'good'"
              :class="[$style.ratingIcon, $style.ratingGood]"
            >
              <HandThumbUpIcon class="w-6 h-6" />
            </span>
            <span
              v-else
              :class="[$style.ratingIcon, $style.ratingBad]"
            >
              <HandThumbDownIcon class="w-6 h-6" />
            </span>
            <span :class="$style.ratingText">
              {{ review.rating === 'good' ? t('reviews.form.rating_good') : t('reviews.form.rating_bad') }}
            </span>
          </div>
        </div>

        <div
          v-if="review.liked"
          :class="$style.reviewSection"
        >
          <h3 :class="$style.sectionTitle">
            {{ t('reviews.form.liked') }}
          </h3>
          <TranslatableWrapper
            :data="review"
            :config="{
              keys: {
                ru: 'likedRu',
                zh: 'likedZh',
                original: 'liked',
              },
            }"
            control-class="absolute top-0 right-0 z-10"
            class="pr-10"
          >
            <template #default="{ displayedText }">
              <p :class="$style.reviewText">
                {{ displayedText }}
              </p>
            </template>
          </TranslatableWrapper>
        </div>

        <div
          v-if="review.disliked"
          :class="$style.reviewSection"
        >
          <h3 :class="$style.sectionTitle">
            {{ t('reviews.form.disliked') }}
          </h3>
          <TranslatableWrapper
            :data="review"
            :config="{
              keys: {
                ru: 'dislikedRu',
                zh: 'dislikedZh',
                original: 'disliked',
              },
            }"
            control-class="absolute top-0 right-0 z-10"
            class="pr-10"
          >
            <template #default="{ displayedText }">
              <p :class="$style.reviewText">
                {{ displayedText }}
              </p>
            </template>
          </TranslatableWrapper>
        </div>
      </div>
    </div>

    <div
      v-else
      class="text-center py-10"
    >
      <p class="text-gray-500">
        {{ t('reviews.not_found') }}
      </p>
    </div>

    <ModalConfirm
      :is-open="isAcceptModalOpen"
      :title="t('reviews.modal.accept_title')"
      :description="t('reviews.modal.accept_confirm')"
      confirm-kind="green"
      :confirm-text="t('reviews.actions.accept')"
      @close="isAcceptModalOpen = false"
      @confirm="confirmAccept"
    />

    <ModalConfirm
      :is-open="isRejectModalOpen"
      :title="t('reviews.modal.reject_title')"
      :description="t('reviews.modal.reject_confirm')"
      confirm-kind="primary"
      :confirm-text="t('reviews.actions.reject')"
      @close="isRejectModalOpen = false"
      @confirm="confirmReject"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute } from "vue-router"
import { ArrowLeftIcon, HandThumbUpIcon, HandThumbDownIcon } from "@heroicons/vue/24/outline"
import Label from "@/components/common/Label.vue"
import Button from "@/components/common/Button.vue"
import ModalConfirm from "@/components/reviews/ModalConfirm.vue"
import TranslatableWrapper from "@/components/common/TranslatableWrapper.vue"
import { useReviews } from "@/composables/useReviews"
import { useUserStore } from "@/stores/user"
import { RoleEmployee, RoleDirector, RoleAdmin } from "~/constants/roles"
import { carStubImage } from "@/constants/catalog"

definePageMeta({
  auth: true,
  roles: [RoleEmployee, RoleDirector, RoleAdmin],
  layout: "personal",
  hideTitle: true,
})

const { t } = useI18n()
const route = useRoute()
const { review, fetchReview, updateReviewStatus, isLoading } = useReviews()
const userStore = useUserStore()
const user = userStore.user

const reviewId = computed(() => Number(route.params.id))
const isAcceptModalOpen = ref(false)
const isRejectModalOpen = ref(false)

const formatDate = (dateStr?: string) => {
  if (!dateStr) {
    return ""
  }
  const date = new Date(dateStr)
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

const carParams = computed(() => {
  if (!review.value?.car) {
    return ""
  }
  const car = review.value.car
  const params: string[] = []

  if (car.engine) {
    params.push(`${car.engine} ${t("listing_request.engine_unit")}`)
  }
  if (car.year) {
    params.push(`${car.year} ${t("listing_request.year_unit")}`)
  }
  if (car.mileage) {
    params.push(`${car.mileage.toLocaleString()} ${t("listing_request.mileage_unit")}`)
  }
  return params.join(", ")
})

const carName = computed(() => review.value?.car?.name)
const sellerName = computed(() => review.value?.seller?.name)
const buyerName = computed(() => review.value?.buyer?.name)

const carImage = computed(() => {
  if (review.value?.car?.images && review.value.car.images.length > 0) {
    return review.value.car.images[0].url
  }
  return carStubImage
})

const openAcceptModal = () => {
  isAcceptModalOpen.value = true
}
const openRejectModal = () => {
  isRejectModalOpen.value = true
}

const confirmAccept = async () => {
  if (review.value?.id) {
    await updateReviewStatus(review.value.id, "accepted")
    isAcceptModalOpen.value = false
  }
}

const confirmReject = async () => {
  if (review.value?.id) {
    await updateReviewStatus(review.value.id, "rejected")
    isRejectModalOpen.value = false
  }
}

onMounted(async () => {
  if (reviewId.value) {
    await fetchReview(reviewId.value)
  }
})
</script>

<style module>
.header {
  @apply mb-4;
}
.backLink {
  @apply inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900;
}
.pageTitle {
  @apply text-3xl font-bold mb-6;
}
.content {
  @apply space-y-6;
}
.carInfo {
  @apply flex gap-4 py-4 bg-white rounded-lg;
}
.carImage {
  @apply w-24 h-24 object-cover rounded;
}
.carDetails {
  @apply flex-1;
}
.carName {
  @apply text-lg font-semibold text-blue-600 hover:underline cursor-pointer;
}
span.carName {
   @apply no-underline text-gray-800 cursor-default hover:no-underline;
}
.carSpecs {
  @apply text-base mb-1;
}
.carSeller {
  @apply text-base text-gray-500;
}
.reviewCard {
  @apply bg-white rounded-lg border border-gray-200 p-6;
}
.reviewHeader {
  @apply flex justify-start gap-6 items-center mb-4 pb-4;
}
.reviewDate {
  @apply text-base text-gray-500;
}
.reviewSection {
  @apply mb-6 last:mb-0 lg:w-2/3;
}
.sectionTitle {
  @apply text-base font-extrabold text-gray-700 mb-2;
}
.ratingDisplay {
  @apply flex items-center gap-3;
}
.ratingIcon {
  @apply inline-flex items-center justify-center;
}
.ratingGood {
  @apply text-gray-600;
}
.ratingBad {
  @apply text-red-600;
}
.ratingText {
  @apply text-base font-medium;
}
.reviewText {
  @apply text-gray-700 whitespace-pre-wrap;
}
.actionsRow {
  @apply flex gap-4 mb-6;
}
</style>
