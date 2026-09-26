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
      {{ t('reviews.create_title') }}
    </h1>

    <div
      v-if="listing"
      :class="$style.carInfo"
    >
      <img
        :src="carImage"
        :alt="carName"
        :class="$style.carImage"
      >
      <div :class="$style.carDetails">
        <NuxtLink
          :to="{ name: 'personal-logistic-tracking-id', params: { id: orderId } }"
          :class="$style.carName"
        >
          {{ carName }}
        </NuxtLink>
        <p :class="$style.carSpecs">
          {{ carParams }}
        </p>
        <p
          v-if="sellerName"
          :class="$style.carSeller"
        >
          {{ t('reviews.seller') }}: {{ sellerName }}
        </p>
      </div>
    </div>

    <form
      :class="$style.form"
      @submit.prevent="handleSubmit"
    >
      <div :class="$style.formTitle">
        {{ t('reviews.form.title') }}
      </div>
      <div :class="$style.container">
        <div :class="$style.formSection">
          <h3 :class="$style.sectionTitle">
            {{ t('reviews.form.rating_label') }}
          </h3>
          <div :class="$style.ratingButtons">
            <Button
              :kind="reviewData.rating === 'good' ? 'black' : 'white'"
              @click="reviewData.rating = 'good'"
            >
              <HandThumbUpIcon class="w-5 h-5 mr-2" />
              {{ t('reviews.form.rating_good') }}
            </Button>
            <Button
              :kind="reviewData.rating === 'bad' ? 'black' : 'white'"
              @click="reviewData.rating = 'bad'"
            >
              <HandThumbDownIcon class="w-5 h-5 mr-2" />
              {{ t('reviews.form.rating_bad') }}
            </Button>
          </div>
          <p
            v-if="errors.get('rating')"
            :class="$style.errorText"
          >
            {{ errors.get('rating') }}
          </p>
        </div>

        <div :class="$style.formSection">
          <Textarea
            v-model="reviewData.liked"
            :label="t('reviews.form.liked')"
            :rows="4"
            :invalid-message="errors.get('liked')"
            @update:model-value="errors.clear('liked')"
          />
        </div>

        <div :class="$style.formSection">
          <Textarea
            v-model="reviewData.disliked"
            :label="t('reviews.form.disliked')"
            :rows="4"
            :invalid-message="errors.get('disliked')"
            @update:model-value="errors.clear('disliked')"
          />
        </div>

        <div :class="$style.disclamer">
          {{ t('reviews.form.disclaimer') }}
        </div>

        <div :class="$style.actions">
          <Button
            type="submit"
            kind="black"
            :disabled="isLoading"
          >
            {{ t('reviews.form.submit') }}
          </Button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, computed } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import { ArrowLeftIcon, HandThumbUpIcon, HandThumbDownIcon } from "@heroicons/vue/24/outline"
import Button from "@/components/common/Button.vue"
import Textarea from "@/components/form/Textarea.vue"
import { useReviews } from "@/composables/useReviews"
import type { StoreReviewRequest } from "@/types/requests/reviews"
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
const router = useRouter()

const { isLoading, errors, storeReview, fetchCreateFormData, reviewFormData } = useReviews()

const orderId = computed(() => Number(route.params.id))

const reviewData = reactive<StoreReviewRequest>({
  orderId: orderId.value,
  rating: "good",
  liked: "",
  disliked: "",
})

const listing = computed(() => reviewFormData.value?.car)
const sellerName = computed(() => reviewFormData.value?.seller?.name || "")

const carName = computed(() => listing.value?.name || "")
const carImage = computed(() => listing.value?.images?.[0]?.url || carStubImage)

const carParams = computed(() => {
  if (!listing.value) {
    return ""
  }
  const params = []

  if (listing.value.engine) {
    params.push(`${listing.value.engine} ${t("listing_request.engine_unit")}`)
  }
  if (listing.value.year) {
    params.push(`${listing.value.year} ${t("listing_request.year_unit")}`)
  }
  if (listing.value.mileage) {
    params.push(`${listing.value.mileage.toLocaleString()} ${t("listing_request.mileage_unit")}`)
  }
  return params.join(", ")
})

const handleSubmit = async () => {
  try {
    reviewData.orderId = orderId.value
    const reviewId = await storeReview(reviewData)
    if (reviewId) {
      await router.push(`/personal/reviews/${reviewId}`)
    }
  }
  catch (e) {
    console.error("Failed to create review", e)
  }
}

onMounted(async () => {
  await fetchCreateFormData(orderId.value)
})
</script>

<style module>
.header { @apply mb-6; }
.backLink { @apply inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900; }
.pageTitle { @apply text-3xl font-bold leading-tight mb-6; }
.carInfo { @apply flex gap-4 py-4 mb-6 bg-white rounded-lg; }
.carImage { @apply w-24 h-24 object-cover rounded; }
.carDetails { @apply flex-1; }
.carName { @apply text-lg font-semibold text-blue-600 hover:underline; }
.carSpecs { @apply text-base mb-1 text-gray-500; }
.carSeller { @apply text-base text-gray-500; }
.form { @apply bg-white rounded-lg border border-gray-200 overflow-hidden; }
.container { @apply p-6 lg:w-1/2; }
.formTitle { @apply p-3 bg-gray-50 text-base text-gray-600 text-center; }
.formSection { @apply mb-6; }
.sectionTitle { @apply text-base font-medium mb-3; }
.ratingButtons { @apply flex gap-4 flex-col sm:flex-row; }
.disclamer { @apply block text-base font-medium text-gray-700 mb-6 whitespace-pre-line; }
.errorText { @apply mt-2 text-sm text-red-600; }
.actions { @apply flex gap-4 justify-start; }
</style>
