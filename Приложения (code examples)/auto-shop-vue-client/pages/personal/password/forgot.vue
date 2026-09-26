<template>
  <div>
    <CommonAlert
      v-if="alert"
      :alert="alert"
      :class="$style.alert"
    />
    <div :class="$style.wrapForm">
      <Form
        v-if="!showCodeInput"
        @submit.prevent="requestForgotCode"
      >
        <FormInput
          v-model="form.email_phone"
          name="email"
          :label="t('columns.users.email_phone')"
          type="text"
          :autocomplete="'off'"
          required
          :disabled="isLoading || (timer > 0 && showCodeInput)"
          :invalid-message="errors.get('email_phone')"
          @input="onEmailInput"
          @update:model-value="errors.clear('email_phone')"
        />
        <div :class="$style.buttons">
          <CommonButton
            :kind="'black'"
            :size="'lg'"
            type="submit"
            :disabled="isLoading || (timer > 0 && showCodeInput)"
            :class="$style.fullWidthBtn"
          >
            {{ t("auth.get_code") }}
          </CommonButton>
        </div>
        <NuxtLink
          v-t="'auth.back_to_login'"
          :to="{ name: 'personal-login' }"
          :class="$style.link"
        />
      </Form>
      <Form
        v-else
        @submit.prevent="timer === 0 ? requestForgotCode() : submitForgotCode()"
      >
        <FormInput
          v-model="code"
          name="code"
          :label="t('auth.enter_code')"
          :disabled="isLoading"
          required
          :invalid-message="errors.get('code')"
          :show-invalid-message="true"
          :aria-label="t('auth.aria_code')"
          @input="alert = null; errors.clear('code')"
        />
        <div
          v-if="timer > 0"
          :class="$style.timerWrap"
        >
          <span :class="$style.timerLabel">{{ t('auth.code_timer_label') }}</span>
          <span :class="$style.timer">
            {{ timerFormatted }}
          </span>
        </div>
        <div
          v-else
          :class="$style.timerWrap"
        >
          <span :class="$style.timerExpired">{{ t('auth.code_expired') }}</span>
        </div>
        <div :class="$style.buttons">
          <CommonButton
            :kind="timer === 0 ? 'white' : 'black'"
            :size="'lg'"
            type="submit"
            :disabled="isLoading"
            :class="$style.fullWidthBtn"
          >
            {{ timer === 0 ? t('auth.get_code_again') : t('auth.update_password') }}
          </CommonButton>
        </div>
        <NuxtLink
          v-if="timer > 0"
          :class="$style.getCodeAgainLink"
          :aria-label="t('auth.get_code_again')"
          :disabled="isLoading"
          tabindex="0"
          @click.prevent="requestForgotCode()"
        >
          {{ t('auth.get_code_again') }}
        </NuxtLink>
        <NuxtLink
          v-t="'auth.back_to_login'"
          :to="{ name: 'personal-login' }"
          :class="$style.link"
        />
      </Form>
    </div>
    <NuxtLink
      v-t="'auth.sign_up_second'"
      :to="{ name: 'personal-register' }"
      :class="$style.bottomLink"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { type Alert, AlertTypeEnum } from "@/types/common/alert"
import { ForgotSendCode, ForgotResetWithCode } from "@/types/requests/auth/forgot"
import type Response from "@/types/responses/response"
import Errors from "@/classes/errors"
import { useCodeTimer } from "@/composables/useCodeTimer"
import { personalPage } from "@/constants/pages"

definePageMeta({
  layout: "auth",
  auth: {
    unauthenticatedOnly: true,
  },
})

const { t } = useI18n()
const { sendResetCode } = useApiAuth()
const { resetWithCodeAndAuth } = useAuth()
const { isLoading, start, finish } = useLoadingIndicator()

const alert = ref<Alert | null>(null)
const errors = ref(new Errors())
const form = ref(new ForgotSendCode())

const code = ref<string>("")
const showCodeInput = ref<boolean>(false)
const { timer, startTimer, stopTimer } = useCodeTimer(300)

const timerFormatted = computed(() => {
  const min = Math.floor(timer.value / 60)
  const sec = (timer.value % 60).toString().padStart(2, "0")
  return `${min}:${sec}`
})

function onEmailInput() {
  errors.value.clear("email_phone")
  alert.value = null
  if (showCodeInput.value) {
    showCodeInput.value = false
    stopTimer()
    code.value = ""
  }
}

async function requestForgotCode() {
  start()
  alert.value = null
  errors.value.clear("email")
  try {
    await sendResetCode(form.value)
    alert.value = {
      type: AlertTypeEnum.Success,
      subtitle: t("auth.code_sent"),
    }
    showCodeInput.value = true
    code.value = ""
    startTimer()
  }
  catch (error: any) {
    const _error = (error?.data as Response<any>)
      ?? (error?.response?._data as Response<any>)
      ?? {}
    if (_error.errors) {
      errors.value.record(_error.errors)
    }
    else if (_error.message) {
      alert.value = {
        type: AlertTypeEnum.Error,
        subtitle: t(_error.message),
      }
    }
  }
  finish()
}

async function submitForgotCode() {
  start()
  alert.value = null
  errors.value.clear("code")
  errors.value.clear("email")
  try {
    const payload = new ForgotResetWithCode()
    payload.email_phone = form.value.email_phone
    payload.code = code.value
    await resetWithCodeAndAuth(payload, { callbackUrl: personalPage })
  }
  catch (error: any) {
    const _error = (error?.data as Response<any>) ?? {}
    if (_error.errors) {
      errors.value.record(_error.errors)
    }
    else if (_error.message) {
      alert.value = {
        type: AlertTypeEnum.Error,
        subtitle: _error.message,
      }
      if (_error.message === "auth.invalid_code") {
        errors.value.set({ path: "code", value: t("auth.invalid_code") })
      }
    }
  }
  finish()
}

onBeforeUnmount(() => {
  stopTimer()
})
</script>

<style module>
.wrapForm {
    @apply bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12;
}
.buttons {
    @apply flex flex-wrap gap-y-2 items-center justify-between;
}
.fullWidthBtn {
    @apply w-full mb-0;
}
.alert {
    @apply mb-2.5
}
.getCodeAgainLink {
  @apply block text-black underline text-sm text-left cursor-pointer;
}
.timerWrap {
  @apply flex items-center mb-2 text-left;
}
.timerLabel {
  @apply text-sm text-black mr-2;
}
.timer {
  @apply text-sm text-black font-medium;
}
.timerExpired {
  @apply text-sm text-black font-medium;
}
.bottomLink {
  @apply block mt-6 text-black underline text-sm text-left cursor-pointer;
}
.link {
  @apply block mt-2 text-black underline text-sm text-left cursor-pointer;
}
</style>
