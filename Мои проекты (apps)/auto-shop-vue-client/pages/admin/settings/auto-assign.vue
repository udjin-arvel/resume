<template>
  <div class="mx-auto">
    <CommonAlert
      v-if="alert"
      :alert="alert"
      :class="$style.alert"
    />

    <div :class="$style.container">
      <div :class="$style.switchRow">
        <Switch
          :model-value="enabled"
          :disabled="globalLoading"
          :class="[
            $style.switchBase,
            enabled ? $style.switchActive : '',
            globalLoading ? 'opacity-50 cursor-not-allowed' : '',
          ]"
          @update:model-value="toggleGlobal"
        >
          <span :class="[$style.switchThumb, enabled ? $style.switchThumbActive : '']" />
        </Switch>
        <span :class="$style.switchLabel">{{ t('admin_main.auto_assign.global_label') }}</span>
      </div>
      <p :class="$style.hint">
        {{ t('admin_main.auto_assign.global_hint') }}
      </p>
    </div>

    <div :class="$style.container">
      <div :class="$style.title">
        {{ t('admin_main.auto_assign.managers_title') }}
      </div>

      <div
        v-if="managers.length"
        :class="$style.managerList"
      >
        <div
          v-for="manager in managers"
          :key="manager.id"
          :class="$style.managerRow"
        >
          <span :class="$style.managerName">{{ manager.name }}</span>
          <span
            :class="[$style.managerStatus, manager.status === StatusBlocked ? $style.statusBlocked : '']"
          >
            {{ t('statuses.client.' + manager.status) }}
          </span>
          <div :class="$style.managerSwitch">
            <Switch
              :model-value="manager.autoAssign"
              :disabled="manager.isLoading || manager.status === StatusBlocked"
              :class="[
                $style.switchBase,
                manager.autoAssign ? $style.switchActive : '',
                (manager.isLoading || manager.status === StatusBlocked) ? 'opacity-50 cursor-not-allowed' : '',
              ]"
              @update:model-value="toggleManager(manager, $event)"
            >
              <span :class="[$style.switchThumb, manager.autoAssign ? $style.switchThumbActive : '']" />
            </Switch>
            <span :class="$style.assignLabel">{{ t('admin_main.auto_assign.assign_column') }}</span>
          </div>
        </div>
      </div>
      <p
        v-else
        :class="$style.empty"
      >
        {{ t('admin_main.auto_assign.empty') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import { Switch } from "@headlessui/vue"
import { RoleAdmin } from "@/constants/roles"
import { StatusBlocked } from "@/constants/statuses"
import { useApiAutoAssign } from "@/composables/api/useApiAutoAssign"
import type { Alert } from "@/types/common/alert"
import { AlertTypeEnum } from "@/types/common/alert"

definePageMeta({
  layout: "personal",
  auth: true,
  roles: [RoleAdmin],
})

interface ManagerRow {
  id: number
  name: string
  status: string
  autoAssign: boolean
  isLoading: boolean
}

const { t } = useI18n()
const { get, setEnabled, setManager } = useApiAutoAssign()

const enabled = ref(false)
const globalLoading = ref(false)
const managers = ref<ManagerRow[]>([])
const alert = ref<Alert | null>(null)

onMounted(async () => {
  const res = await get()

  if (res?.data) {
    enabled.value = res.data.enabled
    managers.value = res.data.managers.map(manager => ({ ...manager, isLoading: false }))
  }
})

const toggleGlobal = async (value: boolean) => {
  alert.value = null
  globalLoading.value = true

  try {
    const res = await setEnabled(value)
    enabled.value = res?.data?.enabled ?? value
    alert.value = {
      type: AlertTypeEnum.Success,
      subtitle: t("admin_main.auto_assign.saved"),
    }
  }
  catch {
    alert.value = {
      type: AlertTypeEnum.Error,
      subtitle: t("common.error_occurred"),
    }
  }
  finally {
    globalLoading.value = false
  }
}

const toggleManager = async (manager: ManagerRow, value: boolean) => {
  alert.value = null
  manager.isLoading = true

  try {
    const res = await setManager(manager.id, value)
    manager.autoAssign = res?.data?.autoAssign ?? value
    alert.value = {
      type: AlertTypeEnum.Success,
      subtitle: t("admin_main.auto_assign.saved"),
    }
  }
  catch {
    alert.value = {
      type: AlertTypeEnum.Error,
      subtitle: t("common.error_occurred"),
    }
  }
  finally {
    manager.isLoading = false
  }
}
</script>

<style module>
.container {
  @apply p-6 border border-gray-300 rounded-lg mb-4;
}

.title {
  @apply text-base font-bold mb-4;
}

.hint {
  @apply text-xs text-gray-500 mt-2;
}

.managerList {
  @apply flex flex-col gap-3 mt-2;
}

.managerRow {
  @apply flex items-center gap-4 py-2 border-b border-gray-100 last:border-b-0;
}

.managerName {
  @apply text-sm text-gray-700 font-medium w-64;
}

.managerStatus {
  @apply text-sm text-gray-500 w-32;
}

.statusBlocked {
  @apply text-red-500;
}

.managerSwitch {
  @apply flex items-center gap-3 ml-auto;
}

.assignLabel {
  @apply text-sm text-gray-700 select-none;
}

.empty {
  @apply text-sm text-gray-500 italic mt-2;
}

.switchRow {
  @apply flex items-center gap-3;
}

.switchLabel {
  @apply text-sm text-gray-700 select-none;
}

.switchBase {
  @apply relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-white border border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 cursor-pointer;
}

.switchActive {
  @apply bg-blue border-blue;
}

.switchThumb {
  @apply inline-block h-4 w-4 transform rounded-full bg-gray-400 transition pointer-events-none;
  transform: translateX(2px);
}

.switchThumbActive {
  @apply bg-white translate-x-6;
}

.alert {
  @apply mb-4;
}
</style>
