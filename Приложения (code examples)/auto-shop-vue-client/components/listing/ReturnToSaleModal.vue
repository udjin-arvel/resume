<template>
  <Modal
    :model-value="isOpen"
    size="sm"
    :overflow-hidden="false"
    @update:model-value="onClose"
  >
    <template #body>
      <h3 :class="$style.title">
        {{ t("listing.return_to_sale_title") }}
      </h3>
      <p :class="$style.description">
        {{ t("listing.return_to_sale_description") }}
      </p>

      <div :class="$style.field">
        <div :class="$style.switchRow">
          <ClientOnly>
            <Switch
              v-model="shownOnSite"
              :class="$style.activitySwitch"
              :disabled="isSubmitting"
            />
          </ClientOnly>
          <span :class="$style.switchLabel">
            {{ t("listing.shown_on_site") }}
          </span>
          <span
            :class="[
              $style.statusBadge,
              shownOnSite ? $style.statusBadgeOn : $style.statusBadgeOff,
            ]"
          >
            {{ shownOnSite ? t("listing.published_badge") : t("listing.hidden_badge") }}
          </span>
        </div>
      </div>
    </template>

    <template #footer>
      <div :class="$style.footer">
        <Button
          kind="white"
          size="base"
          type="button"
          :disabled="isSubmitting"
          @click="onClose"
        >
          {{ t("common.cancel") }}
        </Button>
        <Button
          kind="black"
          size="base"
          type="button"
          :disabled="isSubmitting"
          @click="submit"
        >
          {{ isSubmitting ? t("common.saving") : t("catalog.actions.return_to_sale") }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { Switch } from "@headlessui/vue"
import Modal from "@/components/common/Modal.vue"
import Button from "@/components/common/Button.vue"
import { useApiListing } from "@/composables/api/useApiListing"
import { useNotificationsStore } from "@/stores/notifications"

const props = defineProps<{
  isOpen: boolean
  listingId: number | null
}>()

const emit = defineEmits<{
  (e: "close" | "success"): void
}>()

const { t } = useI18n()
const { returnToSale } = useApiListing()
const { successNotify, errorNotify } = useNotificationsStore()

const shownOnSite = ref(true)
const isSubmitting = ref(false)

watch(() => props.isOpen, (open) => {
  if (!open) {
    return
  }
  shownOnSite.value = true
  isSubmitting.value = false
})

const onClose = () => {
  if (isSubmitting.value) {
    return
  }
  emit("close")
}

const submit = async () => {
  if (!props.listingId || isSubmitting.value) {
    return
  }

  isSubmitting.value = true
  try {
    await returnToSale(props.listingId, {
      shown_on_site: shownOnSite.value,
    })
    successNotify(t("notification.listing.returned_to_sale"))
    emit("success")
    emit("close")
  }
  catch (e) {
    console.error(e)
    errorNotify(t("notification.response_status.forbidden"))
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<style module>
.title {
  @apply text-lg font-semibold leading-6 text-gray-900 mb-2;
}

.description {
  @apply text-sm text-gray-500 mb-4;
}

.field {
  @apply mb-4;
}

.switchRow {
  @apply flex flex-wrap items-center gap-3;
}

.switchLabel {
  @apply text-sm font-semibold text-gray-900;
}

.statusBadge {
  @apply rounded-full px-2.5 py-1 text-[11px] font-semibold;
}

.statusBadgeOn {
  @apply bg-blue-50 text-blue-600;
}

.statusBadgeOff {
  @apply bg-gray-100 text-gray-500;
}

.activitySwitch {
  @apply relative inline-flex h-6 w-11 items-center rounded-full bg-white border border-gray-400 transition-colors;
}

.activitySwitch[aria-checked="true"] {
  @apply bg-blue-600 border-blue-600;
}

.activitySwitch::after {
  @apply absolute h-4 w-4 rounded-full bg-gray-400 transition-transform;
  content: "";
  transform: translateX(2px);
}

.activitySwitch[aria-checked="true"]::after {
  @apply bg-white translate-x-6;
}

.footer {
  @apply flex justify-end gap-3;
}
</style>
