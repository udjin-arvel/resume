<template>
  <div>
    <CommonAlert
      v-if="alert"
      :alert="alert"
      :class="$style.alert"
    />
    <div :class="$style.wrapForm">
      <Form @submit.prevent="register">
        <FormInput
          v-model="signUpData.name"
          name="name"
          :label="t('columns.clients.name') + ' *'"
          :disabled="isLoading"
          type="text"
          :placeholder="t('columns.clients.placeholder_name')"
          :helper-text="t('columns.clients.helper_name')"
          required
          :invalid-message="errors.get('name')"
          :show-invalid-message="true"
          @input="alert = null"
          @update:model-value="errors.clear('name')"
        />
        <FormInput
          v-model="signUpData.fio"
          name="fio"
          :label="t('columns.clients.fio') + ' *'"
          :disabled="isLoading"
          :placeholder="t('columns.clients.placeholder_fio')"
          type="text"
          required
          :invalid-message="errors.get('fio')"
          :show-invalid-message="true"
          @input="alert = null"
          @update:model-value="errors.clear('fio')"
        />
        <FormInput
          v-model="signUpData.phone"
          name="phone"
          :label="t('columns.clients.phone') + ' *'"
          :placeholder="t('columns.clients.placeholder_phone')"
          :disabled="isLoading"
          required
          :invalid-message="errors.get('phone')"
          :show-invalid-message="true"
          @input="alert = null"
          @update:model-value="errors.clear('phone')"
        />
        <FormInput
          v-model="signUpData.email"
          name="email"
          :label="t('columns.users.email') + ' *'"
          :placeholder="t('columns.clients.placeholder_email')"
          :disabled="isLoading"
          type="email"
          required
          :invalid-message="errors.get('email')"
          :show-invalid-message="true"
          @input="alert = null"
          @update:model-value="errors.clear('email')"
        />
        <FormInput
          v-model="signUpData.inn"
          name="inn"
          :label="t('columns.clients.inn') + ' *'"
          :placeholder="t('columns.clients.placeholder_inn')"
          :helper-text="t('columns.clients.helper_inn')"
          :disabled="isLoading"
          required
          :invalid-message="errors.get('inn')"
          :show-invalid-message="true"
          @input="alert = null"
          @update:model-value="errors.clear('inn')"
        />
        <FormInput
          v-model="signUpData.address"
          name="address"
          :label="t('columns.clients.address') + ' *'"
          :placeholder="t('columns.clients.placeholder_address')"
          :helper-text="t('columns.clients.helper_address')"
          :disabled="isLoading"
          required
          :invalid-message="errors.get('address')"
          :show-invalid-message="true"
          @input="alert = null"
          @update:model-value="errors.clear('address')"
        />
        <FormInput
          v-model="signUpData.contact"
          name="contact"
          :label="t('columns.clients.contact')"
          :placeholder="t('columns.clients.placeholder_contact')"
          :helper-text="t('columns.clients.helper_contact')"
          :disabled="isLoading"
          :invalid-message="errors.get('contact')"
          :show-invalid-message="true"
          @input="alert = null"
          @update:model-value="errors.clear('contact')"
        />
        <FormInput
          v-model="signUpData.password"
          name="password"
          :label="t('auth.password') + ' *'"
          :placeholder="t('auth.password')"
          :disabled="isLoading"
          type="password"
          required
          :helper-text="t('auth.password_helper')"
          :invalid-message="errors.get('password')"
          :show-invalid-message="true"
          @input="alert = null"
          @update:model-value="errors.clear('password')"
        />
        <FormInput
          v-model="signUpData.password_confirmation"
          name="password_confirmation"
          :label="t('auth.password_confirm') + ' *'"
          :placeholder="t('auth.password_confirm')"
          :disabled="isLoading"
          type="password"
          required
          :invalid-message="errors.get('password_confirmation')"
          :show-invalid-message="true"
          @input="alert = null"
          @update:model-value="errors.clear('password_confirmation')"
        />
        <div :class="$style.checkboxContainer">
          <input
            type="checkbox"
            required
            :disabled="isLoading"
            :class="$style.checkbox"
          >
          <span>
            {{ t("auth.accept_terms_part1") }}
            <NuxtLink
              :to="'#'"
              :class="$style.link"
            >
              {{ t("auth.terms_link") }}
            </NuxtLink>
            {{ t("auth.accept_terms_and") }}
            <NuxtLink
              :to="'#'"
              :class="$style.link"
            >
              {{ t("auth.privacy_link") }}
            </NuxtLink>
          </span>
        </div>
        <div :class="$style.buttons">
          <CommonButton
            :kind="'black'"
            :size="'lg'"
            type="submit"
            :disabled="isLoading"
          >
            {{ t("auth.sign_up") }}
          </CommonButton>
        </div>
      </Form>
    </div>
    <NuxtLink
      v-t="'auth.sign_in_second'"
      :to="{ name: 'personal-login' }"
      :class="$style.bottomLink"
    />
  </div>
</template>

<script setup lang="ts">
import { SigUp as SigUpRequest } from "@/types/requests/auth/sigUp"
import { type Alert, AlertTypeEnum } from "@/types/common/alert"
import type Response from "@/types/responses/response"
import { personalPage } from "@/constants/pages"
import useUser from "@/composables/useUser"

definePageMeta({
  layout: "auth",
  auth: {
    unauthenticatedOnly: true,
  },
})

const route = useRoute()
const { t } = useI18n()
const { signUp } = useAuth()
const { isLoading, errors } = useUser()

const alert = ref<Alert | null>(null)
const signUpData = ref<SigUpRequest>(new SigUpRequest())

const register = async () => {
  alert.value = null
  errors.value.clear()
  const redirect = route.query.redirect as string || ""

  try {
    await signUp(signUpData.value, {
      callbackUrl: redirect ? redirect : personalPage,
    })
  }
  catch (error: any) {
    const _error = (error?.data as Response<any>) || {}
    if (_error.message) {
      alert.value = {
        type: AlertTypeEnum.Error,
        subtitle: _error.message,
      }
    }
    if (_error.errors) {
      Object.entries(_error.errors).forEach(([key, value]) => {
        errors.value.set({ path: key, value: value as string })
      })
    }
  }
}
</script>

<style module>
.wrapForm {
  @apply bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12 mb-6;
}

.buttons {
  @apply flex items-center justify-between;
}

.alert {
  @apply mb-2.5;
}
.checkboxContainer {
  @apply mt-4 flex items-center text-sm;
}

.checkbox {
  @apply mr-2 h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded cursor-pointer;
}
.passwordHelper {
  @apply text-sm text-gray-500;
}
.link {
  @apply text-black underline text-sm cursor-pointer mx-0.5;
}
.bottomLink {
  @apply block mt-6 text-black underline text-sm text-left cursor-pointer;
}
</style>
