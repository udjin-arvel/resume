<template>
  <Modal
    v-model="show"
    size="lg"
    :overflow-hidden="true"
  >
    <template #body>
      <h2 class="text-xl font-bold mb-4">
        {{ t('catalog.detail.video_modal_title') }}
      </h2>
      <p class="text-base text-gray-600 mb-4">
        {{ t('catalog.detail.video_modal_description') }}
      </p>
      <Textarea
        v-model="additionalComments"
        :label="commentLabel"
        :rows="4"
        :limit="500"
        :show-limit="false"
        :invalid-message="errors.get('text')"
        :disabled="isLoading"
        @update:model-value="errors.clear('text')"
      />
    </template>
    <template #footer>
      <div class="flex justify-between">
        <Button
          kind="black"
          size="base"
          type="submit"
          :disabled="isLoading"
          @click="handleSubmit"
        >
          {{ t('catalog.detail.video_modal_submit') }}
        </Button>
        <Button
          kind="lightgrey"
          size="base"
          type="button"
          @click="show = false"
        >
          {{ t('catalog.detail.video_modal_cancel') }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import Modal from "@/components/common/Modal.vue"
import Button from "@/components/common/Button.vue"
import Textarea from "@/components/form/Textarea.vue"
import { useListingRequest } from "@/composables/useListingRequest"
import { RequestTypeVideo } from "@/constants/listingRequests"
import type { ShortListing } from "~/types/responses/listing"

const props = defineProps<{
  car: ShortListing | null
  listingId: number
}>()

const emit = defineEmits<{
  (e: "update:show", value: boolean): void
  (e: "submit", comments: string): void
}>()

const { t } = useI18n()
const additionalComments = ref("")
const show = defineModel<boolean>("show", { default: false })
const { store, isLoading, errors } = useListingRequest(props.car)

const hasExistingVideo = computed(() => {
  if (!props.car) {
    return false
  }

  if (props.car.has_video === true) {
    return true
  }

  return (props.car.videos?.length ?? 0) > 0
})

const commentLabel = computed(() => {
  const label = t("catalog.detail.video_modal_label")
  return hasExistingVideo.value ? `${label} *` : label
})

async function handleSubmit() {
  if (hasExistingVideo.value && !additionalComments.value.trim()) {
    errors.value.record({ text: [t("catalog.detail.video_modal_comment_required")] })
    return
  }

  const success = await store(props.listingId, RequestTypeVideo, additionalComments.value.trim() || undefined)
  if (success) {
    emit("submit", additionalComments.value)
    show.value = false
    additionalComments.value = ""
  }
}
</script>
