<template>
  <div class="mx-auto">
    <div :class="$style.container">
      <div :class="$style.title">
        {{ t('admin_main.new_registration_subscription_title') }}
      </div>

      <CommonAlert
        v-if="alert"
        :alert="alert"
        :class="$style.alert"
      />

      <div :class="$style.userList">
        <div
          v-for="user in subscribers"
          :key="user.id"
          :class="$style.switchRow"
        >
          <Switch
            :model-value="user.isSubscribed"
            :disabled="user.isLoading"
            :class="[
              $style.switchBase,
              user.isSubscribed ? $style.switchActive : '',
              user.isLoading ? 'opacity-50 cursor-not-allowed' : '',
            ]"
            @update:model-value="toggleSubscription(user, $event)"
          >
            <span :class="[$style.switchThumb, user.isSubscribed ? $style.switchThumbActive : '']" />
          </Switch>
          <span :class="$style.switchLabel">{{ user.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import { Switch } from "@headlessui/vue"
import { RoleAdmin } from "~/constants/roles"
import { AdminCompanyId } from "@/constants/options"
import { SubscriptionTypeEnum } from "@/types/common/subscription"
import useUser from "@/composables/useUser"

import type { Alert } from "@/types/common/alert"
import { AlertTypeEnum } from "@/types/common/alert"

definePageMeta({
  auth: true,
  layout: "personal",
  roles: [RoleAdmin],
})

const { t } = useI18n()
const { index: fetchUsers, updateNotificationSettings, errors } = useUser()

interface Subscriber {
  id: number
  name: string
  isSubscribed: boolean
  isLoading: boolean
}

const subscribers = ref<Subscriber[]>([])
const alert = ref<Alert | null>(null)

onMounted(async () => {
  const res = await fetchUsers({
    "filter[client_id]": AdminCompanyId,
  })

  if (res?.data) {
    subscribers.value = res.data.map((user: any) => ({
      id: user.id,
      name: user.name,
      isSubscribed: user.notification_settings?.includes(SubscriptionTypeEnum.NewRegistration) ?? false,
      isLoading: false,
    }))
  }
})

const toggleSubscription = async (user: Subscriber, newValue: boolean) => {
  alert.value = null
  user.isLoading = true

  const settings = newValue ? [SubscriptionTypeEnum.NewRegistration] : []

  const success = await updateNotificationSettings(user.id, settings)

  if (success) {
    user.isSubscribed = newValue
  }
  else {
    const errorMessage = errors.value.get("settings") || t("common.error_occurred")

    alert.value = {
      type: AlertTypeEnum.Error,
      subtitle: errorMessage,
    }
  }

  user.isLoading = false
}
</script>

<style module>
.container {
  @apply p-6 border border-gray-300 rounded-lg;
}

.title {
  @apply text-base font-bold mb-4;
}

.userList {
  @apply flex flex-col gap-3 mt-4;
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
