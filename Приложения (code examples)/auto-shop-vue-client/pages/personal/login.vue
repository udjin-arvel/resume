<template>
  <div>
    <CommonAlert
      v-if="alert"
      :alert="alert"
      :class="$style.alert"
    />
    <div :class="$style.wrapForm">
      <TabGroup @change="onTabChange">
        <TabList :class="$style.tabList">
          <Tab :class="$style.tabLeft">
            {{ t('auth.by_login') }}
          </Tab>
          <Tab :class="$style.tabRight">
            {{ t('auth.by_code') }}
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Form @submit.prevent="loginByPassword">
              <FormInput
                v-model="loginFormData.email_phone"
                name="email"
                tabindex="0"
                :label="t('columns.users.email_phone')"
                :disabled="isLoading"
                required
                :invalid-message="errors.get('email_phone')"
                :show-invalid-message="true"
                :aria-label="t('auth.aria_email_phone')"
                @input="alert = null"
                @update:model-value="errors.clear('email_phone')"
              />
              <FormInput
                v-model="loginFormData.password"
                name="password"
                tabindex="0"
                :label="t('auth.password')"
                :disabled="isLoading"
                type="password"
                required
                :invalid-message="errors.get('password')"
                :show-invalid-message="true"
                :aria-label="t('auth.aria_password')"
                @input="alert = null"
                @update:model-value="errors.clear('password')"
              />
              <div :class="$style.buttons">
                <CommonButton
                  :kind="'black'"
                  :size="'lg'"
                  type="submit"
                  :disabled="isLoading"
                  :loading="isLoading"
                  :class="$style.loginBtn"
                  :aria-label="t('auth.sign_in')"
                >
                  {{ t('auth.sign_in') }}
                </CommonButton>
              </div>
            </Form>
            <NuxtLink
              v-t="'auth.forgot'"
              :to="{ name: 'personal-password-forgot' }"
              :class="$style.link"
            />
          </TabPanel>
          <TabPanel>
            <Form
              v-if="!showCodeInput"
              @submit.prevent="loginRequestCode"
            >
              <FormInput
                v-model="codeFormData.email_phone"
                name="email2"
                :label="t('columns.users.email_phone')"
                :disabled="isLoading || (timer > 0 && showCodeInput)"
                required
                :invalid-message="errors.get('email_phone')"
                :show-invalid-message="true"
                :aria-label="t('auth.aria_email_phone')"
                @input="onCodeEmailInput"
                @update:model-value="errors.clear('email_phone')"
              />
              <Hcaptcha
                v-model="captchaToken"
                :invalid-message="errors.get('h_captcha_response')"
              />
              <div :class="$style.buttons">
                <CommonButton
                  :kind="'black'"
                  :size="'lg'"
                  type="submit"
                  :disabled="isLoading || (timer > 0 && showCodeInput) || !captchaToken"
                  :loading="isLoading"
                  :class="$style.loginBtn"
                  :aria-label="t('auth.get_code')"
                >
                  {{ t('auth.get_code') }}
                </CommonButton>
              </div>
            </Form>
            <Form
              v-else
              @submit.prevent="timer === 0 ? requestNewCode() : submitCode()"
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
                @input="alert = null"
                @update:model-value="errors.clear('code')"
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
                  :disabled="isGetCodeAgainDisabled"
                  :loading="isLoading"
                  :class="$style.loginBtn"
                  :aria-label="timer === 0 ? t('auth.get_code_again') : t('auth.sign_in')"
                >
                  {{ timer === 0 ? t('auth.get_code_again') : t('auth.sign_in') }}
                </CommonButton>
              </div>
              <NuxtLink
                v-if="timer > 0"
                :class="$style.getCodeAgainLink"
                :aria-label="t('auth.get_code_again')"
                :disabled="isGetCodeAgainDisabled"
                tabindex="0"
                @click.prevent="requestNewCode()"
              >
                {{ t('auth.get_code_again') }}
              </NuxtLink>
            </Form>
          </TabPanel>
        </TabPanels>
      </TabGroup>
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
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@headlessui/vue"
import { SigIn as SigInRequest, CodeRequest } from "@/types/requests/auth/sigIn"
import { type Alert, AlertTypeEnum } from "@/types/common/alert"
import type Response from "@/types/responses/response"
import { personalPage } from "@/constants/pages"
import { useCodeTimer } from "@/composables/useCodeTimer"
import Hcaptcha from "@/components/common/Hcaptcha.vue"

definePageMeta({
  layout: "auth",
  auth: {
    unauthenticatedOnly: true,
  },
})

const route = useRoute()
const { t } = useI18n()
const { signIn, loginWithCode, requestCode, errors, clearErrors } = useAuth()
const { isLoading, start: loadingStart, finish: loadingFinish } = useLoadingIndicator()
const captchaToken = ref<string | null>(null)

const alert = ref<Alert | null>(null)
const loginFormData = ref<SigInRequest>(new SigInRequest())
const codeFormData = ref<CodeRequest>(new CodeRequest())
const code = ref<string>("")
const showCodeInput = ref<boolean>(false)

const { timer, startTimer, stopTimer } = useCodeTimer(300)

const timerFormatted = computed(() => {
  const min = Math.floor(timer.value / 60)
  const sec = (timer.value % 60).toString().padStart(2, "0")
  return `${min}:${sec}`
})

const isGetCodeAgainDisabled = computed(() => isLoading.value)

function resetLoginFields() {
  loginFormData.value = new SigInRequest()
  codeFormData.value = new CodeRequest()
  code.value = ""
  alert.value = null
  showCodeInput.value = false
  captchaToken.value = null
  stopTimer()
}

function onTabChange() {
  clearErrors()
  alert.value = null
  resetLoginFields()
}

function onCodeEmailInput() {
  alert.value = null
  clearErrors("email_phone")
  if (showCodeInput.value) {
    showCodeInput.value = false
    stopTimer()
    code.value = ""
  }
}

async function requestNewCode() {
  if (!captchaToken.value) {
    return
  }

  loadingStart()
  alert.value = null
  clearErrors("email_phone")
  clearErrors("h_captcha_response")
  try {
    await requestCode(
      { email_phone: codeFormData.value.email_phone, h_captcha_response: captchaToken.value },
      { callbackUrl: undefined },
    )
    alert.value = {
      type: AlertTypeEnum.Success,
      subtitle: t("auth.code_sent"),
    }
    showCodeInput.value = true
    code.value = ""
    captchaToken.value = null
    startTimer()
  }
  catch (error: any) {
    const _error = (error?.data as Response<any>) ?? {}
    if (!_error.errors) {
      alert.value = {
        type: AlertTypeEnum.Error,
        subtitle: t(_error.message || "auth.unknown"),
      }
    }
    captchaToken.value = null
  }
  finally {
    loadingFinish()
  }
}

async function submitCode() {
  loadingStart()
  alert.value = null
  clearErrors("code")
  clearErrors("email_phone")
  try {
    await loginWithCode(
      { email_phone: codeFormData.value.email_phone, code: code.value },
      { callbackUrl: route.query.redirect ? String(route.query.redirect) : personalPage },
    )
    resetLoginFields()
  }
  catch (error: any) {
    const _error = (error?.data as Response<any>) ?? {}
    if (!_error.errors) {
      alert.value = {
        type: AlertTypeEnum.Error,
        subtitle: t(_error.message || "auth.unknown"),
      }
      if (_error.message === "auth.invalid_code") {
        errors.value.set({ path: "code", value: t("auth.invalid_code") })
      }
    }
  }
  finally {
    loadingFinish()
  }
}

async function loginByPassword() {
  loadingStart()
  alert.value = null
  clearErrors("email_phone")
  clearErrors("password")
  try {
    await signIn(loginFormData.value, {
      callbackUrl: route.query.redirect ? String(route.query.redirect) : personalPage,
    })
    resetLoginFields()
  }
  catch (error: any) {
    const _error = (error?.data as Response<any>) ?? {}
    if (!_error.errors) {
      alert.value = {
        type: AlertTypeEnum.Error,
        subtitle: t(_error.message || "auth.unknown"),
      }
    }
  }
  finally {
    loadingFinish()
  }
}

async function loginRequestCode() {
  await requestNewCode()
}

onBeforeUnmount(() => {
  stopTimer()
})
</script>

<style module>
.wrapForm {
  @apply bg-white px-6 py-12 border border-gray-200 sm:rounded-lg sm:px-12 mb-6;
}
.tabList {
  @apply flex mt-[-16px] mb-8;
}
.tabLeft {
  @apply flex-1 px-4 py-1.5 focus:outline-none rounded-tl transition-colors duration-150 border-b;
}
.tabRight {
  @apply flex-1 px-4 py-1.5 focus:outline-none rounded-tr transition-colors duration-150 border-b;
}
.tabLeft[data-headlessui-state~='selected'],
.tabRight[data-headlessui-state~='selected'] {
  @apply bg-transparent font-bold border-b-2 border-b-black;
}
.tabLeft[data-headlessui-state~='unselected'],
.tabRight[data-headlessui-state~='unselected'] {
  @apply bg-gray-100 border-b border-b-gray-300;
}
.buttons {
  @apply flex items-center justify-between;
}
.alert {
  @apply mb-2.5;
}
.loginBtn {
  @apply w-full mb-6;
}
.link {
  @apply block mt-2 text-black underline text-sm text-left cursor-pointer;
}
.getCodeAgainLink {
  @apply block text-black underline text-sm text-left cursor-pointer;
}
.bottomLink {
  @apply block mt-6 text-black underline text-sm text-left cursor-pointer;
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
</style>
