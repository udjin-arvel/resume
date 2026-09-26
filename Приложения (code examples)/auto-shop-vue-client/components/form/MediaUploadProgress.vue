<template>
  <transition name="fade">
    <aside
      v-if="visible && sessions.length"
      :class="$style.panel"
      role="status"
      aria-live="polite"
    >
      <div :class="$style.header">
        <strong>{{ t("files.upload_progress_title") }}</strong>
        <span>{{ aggregate.completedFiles }} / {{ aggregate.totalFiles }}</span>
      </div>
      <div :class="$style.bar">
        <div
          :class="[$style.fill, aggregate.failed.length && $style.fillError]"
          :style="{ width: `${uploadPercent}%` }"
        />
      </div>
      <div :class="$style.meta">
        <span v-if="activeUploads.length">
          {{ t("files.upload_active_groups", { count: activeUploads.length }) }}
        </span>
        <span v-else-if="aggregate.failed.length">{{ t("files.upload_failed") }}</span>
        <span v-else>{{ t("files.upload_completed") }}</span>
        <span>{{ uploadPercent }}%</span>
      </div>
      <ul
        v-if="aggregate.failed.length"
        :class="$style.errors"
      >
        <li
          v-for="(error, index) in aggregate.failed"
          :key="`${error.name}-${index}`"
        >
          {{ error.name }} — {{ error.message }}
        </li>
      </ul>
    </aside>
  </transition>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue"

const { t } = useI18n()
const router = useRouter()
const notificationsStore = useNotificationsStore()
const { sessions, activeUploads, isAnyUploading, aggregate, clearCompleted } = useMediaUploadState()

const visible = ref(false)
const hadActiveUploads = ref(false)
const pendingCleanupIds = ref<string[]>([])
let hideTimer: ReturnType<typeof setTimeout> | null = null

const uploadPercent = computed(() => {
  if (!aggregate.value.total) {
    return 0
  }

  return Math.min(100, Math.round(aggregate.value.loaded / aggregate.value.total * 100))
})

const warnAboutActiveUpload = (event: BeforeUnloadEvent) => {
  if (!isAnyUploading.value) {
    return
  }

  event.preventDefault()
  event.returnValue = ""
}

const removeRouteGuard = router.beforeEach(() => {
  if (!isAnyUploading.value || !import.meta.client) {
    return true
  }

  return window.confirm(t("files.upload_leave_warning"))
})

watch(
  () => sessions.value.map(upload => `${upload.id}:${upload.active}`).join("|"),
  () => {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }

    if (activeUploads.value.length > 0) {
      if (pendingCleanupIds.value.length) {
        const completedIds = pendingCleanupIds.value
        pendingCleanupIds.value = []
        clearCompleted(completedIds)
      }

      hadActiveUploads.value = true
      visible.value = true
      if (import.meta.client) {
        window.addEventListener("beforeunload", warnAboutActiveUpload)
      }
      return
    }

    if (import.meta.client) {
      window.removeEventListener("beforeunload", warnAboutActiveUpload)
    }

    if (!hadActiveUploads.value || !sessions.value.length) {
      return
    }

    hadActiveUploads.value = false
    const failedCount = aggregate.value.failed.length
    const successCount = Math.max(0, aggregate.value.totalFiles - failedCount)

    if (!failedCount) {
      notificationsStore.successNotify(t("files.upload_completed"))
    }
    else if (!successCount) {
      notificationsStore.errorNotify(t("files.upload_all_failed"))
    }
    else {
      notificationsStore.warningNotify(t("files.upload_partially_completed", {
        success: successCount,
        failed: failedCount,
      }))
    }

    pendingCleanupIds.value = sessions.value.filter(upload => !upload.active).map(upload => upload.id)
    hideTimer = setTimeout(() => {
      if (activeUploads.value.length) {
        return
      }

      visible.value = false
      clearCompleted(pendingCleanupIds.value)
      pendingCleanupIds.value = []
    }, 3000)
  },
  { flush: "sync" },
)

onBeforeUnmount(() => {
  removeRouteGuard()

  if (hideTimer) {
    clearTimeout(hideTimer)
  }

  if (import.meta.client) {
    window.removeEventListener("beforeunload", warnAboutActiveUpload)
  }
})
</script>

<style module>
.panel {
  @apply fixed left-4 right-4 bottom-4 z-[60] mx-auto max-w-2xl rounded-xl bg-white p-4 shadow-2xl border border-gray-200;
}

.header,
.meta {
  @apply flex items-center justify-between gap-4 text-sm;
}

.bar {
  @apply h-2 my-3 overflow-hidden rounded-full bg-gray-200;
}

.fill {
  @apply h-full bg-blue-600 transition-all duration-200;
}

.fillError {
  @apply bg-red-500;
}

.meta {
  @apply text-gray-500;
}

.errors {
  @apply mt-3 max-h-24 overflow-auto text-sm text-red-600;
}
</style>
