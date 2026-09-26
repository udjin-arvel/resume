<template>
  <div>
    <div :class="$style.wrapForm">
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
      <div :class="$style.passwordHint">
        <span>
          {{ t('company.password_hint') }}<br>
          {{ t('company.password_min_length') }}
        </span>
      </div>
      <Form @submit.prevent="onChangePassword">
        <div :class="$style.passwordInputs">
          <div :class="$style.passwordInputWrap">
            <FormInput
              v-model="userPasswordUpdate.password"
              name="password"
              :label="t('auth.create_password_label') + ' *'"
              type="password"
              :invalid-message="errors.get('password')"
              required
              @input="passwordAlert = null"
              @update:model-value="errors.clear('password')"
            />
          </div>
          <div :class="$style.passwordInputWrap">
            <FormInput
              v-model="userPasswordUpdate.password_confirmation"
              name="password_confirmation"
              :label="t('auth.repeat_new_password_label') + ' *'"
              type="password"
              :invalid-message="errors.get('password_confirmation')"
              required
              @input="passwordAlert = null"
              @update:model-value="errors.clear('password_confirmation')"
            />
          </div>
        </div>
        <div :class="$style.personalBtnWrap">
          <CommonButton
            type="submit"
            kind="black"
            size="lg"
            class="whitespace-nowrap"
          >
            {{ t('company.change_password_second') }}
          </CommonButton>
          <CommonButton
            kind="unset"
            size="lg"
            type="button"
            :class="$style.cancelBtn"
            class="whitespace-nowrap"
            @click="onCancel"
          >
            {{ t('auth.cancel_and_return') }}
          </CommonButton>
        </div>
      </Form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import type { Alert } from "@/types/common/alert"
import { AlertTypeEnum } from "@/types/common/alert"
import useUser from "@/composables/useUser"
import { useUserStore } from "@/stores/user"
import { personalPage } from "@/constants/pages"
import useAuth from "@/composables/useAuth"

definePageMeta({
  layout: "auth",
  auth: true,
})

const { t } = useI18n()
const { updatePassword, errors, userPasswordUpdate } = useUser()
const userStore = useUserStore()
const router = useRouter()
const { signOut } = useAuth()

const passwordAlert = ref<Alert | null>(null)

const mustChangePasswordAlert = computed(() => {
  if (userStore?.user?.must_change_password) {
    return {
      type: AlertTypeEnum.Warning,
      subtitle: t("profile.must_change_password_warning"),
    }
  }
  return null
})

async function onChangePassword() {
  if (!userStore.user) {
    return
  }
  await updatePassword(userStore.user.id, userPasswordUpdate.value)
  if (!errors.value.any()) {
    passwordAlert.value = {
      type: AlertTypeEnum.Success,
      subtitle: t("notification.user.updated_password"),
    }
    if (userStore?.user?.must_change_password) {
      userStore.user.must_change_password = false
    }
    await router.replace(personalPage)
  }
  else {
    passwordAlert.value = null
  }
}

async function onCancel() {
  await signOut()
}
</script>

<style module>
.wrapForm {
    @apply bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12;
}
.passwordHint {
  @apply text-sm text-gray-500 mb-4;
}
.passwordInputs {
  @apply flex flex-col gap-4 w-full;
}
.passwordInputWrap {
  @apply flex-1 min-w-0 max-w-full;
}
.personalBtnWrap {
  @apply flex flex-row gap-4 items-center justify-start mt-6;
}
.cancelBtn {
  @apply ml-2;
}
.alert {
  @apply mb-2.5;
}
</style>
