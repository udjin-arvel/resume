<template>
  <button
    type="button"
    :class="$style.button"
    :aria-label="label"
    :aria-pressed="isFavorited"
    :disabled="isPending"
    :title="label"
    @click.stop.prevent="toggle"
  >
    <StarIconSolid
      v-if="isFavorited"
      :class="[$style.icon, $style.iconActive]"
    />
    <StarIconOutline
      v-else
      :class="$style.icon"
    />
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { StarIcon as StarIconOutline } from "@heroicons/vue/24/outline"
import { StarIcon as StarIconSolid } from "@heroicons/vue/24/solid"
import { useApiListing } from "~/composables/api/useApiListing"
import { useNotificationsStore } from "@/stores/notifications"
import { useUserStore } from "@/stores/user"

const props = defineProps<{
  listingId: number
  isFavorited: boolean
}>()

const emit = defineEmits<{
  change: [isFavorited: boolean]
}>()

const { t } = useI18n()
const userStore = useUserStore()
const { goToLogin } = useLoginRedirect()
const { addFavorite, removeFavorite } = useApiListing()
const { errorNotify } = useNotificationsStore()
const isPending = ref(false)

const label = computed(() => props.isFavorited
  ? t("catalog.common.remove_from_favorites")
  : t("catalog.common.add_to_favorites"))

async function toggle() {
  if (!userStore.isAuthenticated) {
    return goToLogin()
  }

  if (isPending.value) {
    return
  }

  const nextValue = !props.isFavorited
  isPending.value = true

  try {
    if (nextValue) {
      await addFavorite(props.listingId)
    }
    else {
      await removeFavorite(props.listingId)
    }
    emit("change", nextValue)
  }
  catch {
    errorNotify(t("common.error_occurred"))
  }
  finally {
    isPending.value = false
  }
}
</script>

<style module>
.button {
  @apply inline-flex items-center justify-center shrink-0 rounded-md p-1 text-gray-400 transition hover:text-gray-600 disabled:opacity-60;
}

.icon {
  @apply w-6 h-6;
}

.iconActive {
  @apply text-amber-400;
}
</style>
