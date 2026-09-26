<template>
  <div :class="$style.wrapper">
    <div :class="$style.container">
      <CommonAlert
        v-if="alert"
        :alert="alert"
        :class="$style.alert"
      />
      <Form
        :class="$style.spacings0"
        @submit.prevent="onUpdate"
      >
        <BlockContainerWithBody>
          <template #head>
            <h2 :class="$style.title">
              {{ t('profile.block_personal_data') }}
            </h2>
          </template>

          <template #body>
            <div :class="$style.formContentWrap">
              <FormInput
                v-model="profileUpdate.name"
                name="name"
                :label="t('columns.users.name') + ' *'"
                type="text"
                :disabled="isLoading"
                :invalid-message="errors.get('name')"
                required
                @input="errors.clear('name')"
              />
              <FormInput
                v-model="profileUpdate.phone"
                name="phone"
                :label="t('columns.users.phone') + ' *'"
                type="text"
                :disabled="true"
                :invalid-message="errors.get('phone')"
                :placeholder="t('columns.clients.placeholder_phone')"
                required
                @input="errors.clear('phone')"
              />
              <FormInput
                v-model="profileUpdate.email"
                name="email"
                :label="t('columns.users.email') + ' *'"
                type="email"
                :disabled="true"
                :invalid-message="errors.get('email')"
                required
                @input="errors.clear('email')"
              />
              <FormSelect
                v-model="profileUpdate.preferred_lang"
                name="preferred_lang"
                :label="t('columns.users.language') + ' *'"
                :options="languageOptions"
                :disabled="isLoading"
                :invalid-message="errors.get('preferred_lang')"
                required
                @update:model-value="errors.clear('preferred_lang')"
              />
              <div :class="$style.checkboxContainer">
                <input
                  v-model="acceptTerms"
                  type="checkbox"
                  required
                  :disabled="isLoading"
                  :class="$style.checkbox"
                >
                <span>
                  {{ t("auth.accept_terms_part1") }}
                  <NuxtLink
                    :to="'#'"
                    class="text-secondary-500 cursor-pointer underline"
                  >
                    {{ t("auth.terms_link") }}
                  </NuxtLink>
                </span>
              </div>
            </div>
          </template>

          <template #footer>
            <div :class="$style.personalBtnWrap">
              <CommonButton
                type="submit"
                kind="black"
                size="lg"
                :disabled="isLoading"
              >
                {{ t("common.save") }}
              </CommonButton>
            </div>
          </template>
        </BlockContainerWithBody>
      </Form>
    </div>

    <div :class="$style.rightContainer">
      <CommonAlert
        v-if="mustChangePasswordAlert"
        :alert="mustChangePasswordAlert"
        :class="$style.alert"
      />
      <CommonAlert
        v-if="passwordAlert"
        :alert="passwordAlert"
        :class="$style.alert"
      />
      <Form
        :class="$style.spacings0"
        @submit.prevent="onUpdatePassword"
      >
        <BlockContainerWithBody>
          <template #head>
            <h2 :class="$style.title">
              {{ t('profile.block_password') }}
            </h2>
          </template>

          <template #body>
            <div :class="$style.spacingsY4">
              <FormInput
                v-model="profilePasswordUpdate.current_password"
                name="current_password"
                :label="t('profile.current_password')"
                type="password"
                required
                :disabled="isLoading"
                :invalid-message="errors.get('current_password')"
                @input="errors.clear('current_password')"
              />
              <FormInput
                v-model="profilePasswordUpdate.password"
                name="password"
                :label="t('columns.users.password')"
                type="password"
                required
                :disabled="isLoading"
                :invalid-message="errors.get('password')"
                @input="errors.clear('password')"
              />
              <FormInput
                v-model="profilePasswordUpdate.password_confirmation"
                name="password_confirmation"
                :label="t('columns.users.password_confirmation')"
                type="password"
                required
                :disabled="isLoading"
                :invalid-message="errors.get('password_confirmation')"
                @input="errors.clear('password_confirmation')"
              />
            </div>
          </template>

          <template #footer>
            <div :class="$style.personalBtnWrap">
              <CommonButton
                type="submit"
                kind="black"
                size="lg"
                :disabled="isLoading"
              >
                {{ t("common.save") }}
              </CommonButton>
            </div>
          </template>
        </BlockContainerWithBody>
      </Form>

      <CommonAlert
        v-if="telegramAlert"
        :alert="telegramAlert"
        :class="$style.alert"
      />
      <BlockContainerWithBody>
        <template #head>
          <h2 :class="$style.title">
            {{ t('profile.block_telegram') }}
          </h2>
        </template>

        <template #body>
          <div :class="$style.spacingsY4">
            <p
              v-if="userStore.user?.telegram_chat_id"
              class="text-sm text-green-600 font-medium"
            >
              {{ t('profile.telegram_bound_success') }}
            </p>
            <p
              v-else
              class="text-sm text-gray-600"
            >
              {{ t('profile.telegram_unbound_desc') }}
            </p>
            <CheckBox
              v-if="userStore.user?.telegram_chat_id"
              v-model="telegramEventsEnabled"
              :option-label="t('profile.telegram_events_toggle')"
              :disabled="isTelegramLoading"
              @change="onToggleTelegramNotifications"
            />
          </div>
        </template>

        <template #footer>
          <div :class="$style.personalBtnWrap">
            <CommonButton
              v-if="!userStore.user?.telegram_chat_id"
              type="button"
              kind="black"
              size="lg"
              :disabled="isTelegramLoading"
              @click="onBindTelegram"
            >
              {{ t("profile.bind_telegram") }}
            </CommonButton>

            <a
              v-if="telegramBindUrl && !userStore.user?.telegram_chat_id"
              :href="telegramBindUrl"
              target="_blank"
              rel="noopener noreferrer"
              :class="$style.telegramBindLink"
            >
              {{ t("profile.telegram_open_bot") }}
            </a>

            <CommonButton
              v-if="userStore.user?.telegram_chat_id"
              type="button"
              kind="redOutline"
              size="lg"
              :disabled="isTelegramLoading"
              @click="onUnbindTelegram"
            >
              {{ t("profile.unbind_telegram") }}
            </CommonButton>
          </div>
        </template>
      </BlockContainerWithBody>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Alert } from "@/types/common/alert"
import { AlertTypeEnum } from "@/types/common/alert"
import { ProfileUpdate as ProfileUpdateRequest } from "~/types/requests/profile/profile"
import { PasswordUpdate as PasswordUpdateRequest } from "~/types/requests/profile/password"
import { russian, chinese } from "@/constants/lang"
import { SubscriptionTypeEnum } from "@/types/common/subscription"
import CheckBox from "@/components/form/CheckBox.vue"

definePageMeta({
  auth: true,
  layout: "personal",
  hideTitle: true,
})

const { t } = useI18n()
const {
  update,
  updatePassword,
  isLoading,
  errors,
  getTelegramToken,
  unbindTelegram,
  updateTelegramNotifications,
} = useProfile()
const userStore = useUserStore()
const { successNotify } = useNotificationsStore()
const profileUpdate: Ref<ProfileUpdateRequest> = ref<ProfileUpdateRequest>(new ProfileUpdateRequest())
const profilePasswordUpdate: Ref<PasswordUpdateRequest> = ref<PasswordUpdateRequest>(new PasswordUpdateRequest())
const acceptTerms = ref(false)
const alert = ref<Alert | null>(null)
const passwordAlert = ref<Alert | null>(null)
const telegramAlert = ref<Alert | null>(null)

const languageOptions = computed(() => [
  { id: 1, name: t("common.languages.ru"), value: russian, label: t("common.languages.ru"), disabled: false },
  { id: 2, name: t("common.languages.zh"), value: chinese, label: t("common.languages.zh"), disabled: false },
])

const mustChangePasswordAlert = computed(() => {
  if (userStore.user?.must_change_password) {
    return {
      type: AlertTypeEnum.Warning,
      subtitle: t("profile.must_change_password_warning"),
    }
  }
  return null
})

const isTelegramLoading = ref(false)
const telegramEventsEnabled = ref(false)
const telegramBindUrl = ref<string | null>(null)

const onToggleTelegramNotifications = async () => {
  isTelegramLoading.value = true
  telegramAlert.value = null

  try {
    const success = await updateTelegramNotifications(telegramEventsEnabled.value)

    if (success) {
      telegramAlert.value = {
        type: AlertTypeEnum.Success,
        subtitle: t("notification.subscription.successful"),
      }
    }
    else {
      telegramEventsEnabled.value = !telegramEventsEnabled.value
    }
  }
  finally {
    isTelegramLoading.value = false
  }
}

const onBindTelegram = async () => {
  isTelegramLoading.value = true
  telegramAlert.value = null
  telegramBindUrl.value = null
  errors.value.clear()

  try {
    const token = await getTelegramToken()

    if (token) {
      const config = useRuntimeConfig()
      const botUrl = `https://t.me/${config.public.telegramBotName}?start=${token}`
      telegramBindUrl.value = botUrl
      window.open(botUrl, "_blank")
      successNotify(t("profile.telegram_bind_link_ready"))
    }
    else {
      const errorMessage = errors.value.get("telegram") || t("common.error_occurred")

      telegramAlert.value = {
        type: AlertTypeEnum.Error,
        subtitle: errorMessage,
      }
    }
  }
  finally {
    isTelegramLoading.value = false
  }
}

const onUnbindTelegram = async () => {
  isTelegramLoading.value = true
  telegramAlert.value = null

  try {
    const success = await unbindTelegram()

    if (success && userStore.user) {
      userStore.user.telegram_chat_id = null

      telegramAlert.value = {
        type: AlertTypeEnum.Success,
        subtitle: t("notification.profile.telegram_unbound"),
      }
    }
  }
  finally {
    isTelegramLoading.value = false
  }
}

onMounted(() => {
  profileUpdate.value.name = userStore.user?.name || ""
  profileUpdate.value.email = userStore.user?.email || ""
  profileUpdate.value.phone = userStore.user?.phone || ""
  profileUpdate.value.preferred_lang = userStore.user?.preferred_lang || russian
  telegramEventsEnabled.value = userStore.user?.notification_settings?.includes(SubscriptionTypeEnum.TelegramEvents) || false
})

const onUpdate = async () => {
  await update(profileUpdate.value)
  alert.value = {
    type: AlertTypeEnum.Success,
    subtitle: t("notification.profile.updated"),
  }
}

const onUpdatePassword = async () => {
  await updatePassword(profilePasswordUpdate.value)
  if (!errors.value.any()) {
    passwordAlert.value = {
      type: AlertTypeEnum.Success,
      subtitle: t("notification.profile.updated_password"),
    }
    if (userStore.user?.must_change_password) {
      userStore.user.must_change_password = false
    }
  }
  else {
    passwordAlert.value = null
  }
}
</script>

<style module>
.wrapper {
  @apply flex flex-col lg:flex-row gap-4;
}

.container {
  @apply w-full lg:w-1/2 pr-4;
}

.rightContainer {
  @apply w-full lg:w-1/2 pl-4 flex flex-col gap-4;
}

.personalBtnWrap {
  @apply flex flex-wrap items-center justify-start gap-3;
}

.telegramBindLink {
  @apply text-sm underline;
}

.formContentWrap {
  @apply flex flex-col gap-y-6;
}

.title {
  @apply text-2xl text-black;
}

.checkboxContainer {
  @apply mt-4 flex items-center text-sm;
}

.checkbox {
  @apply mr-2 h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded cursor-pointer;
}

.spacings0 {
  @apply space-y-0;
}

.spacingsY4 {
  @apply space-y-4;
}

.alert {
  @apply mb-2.5;
}
</style>
