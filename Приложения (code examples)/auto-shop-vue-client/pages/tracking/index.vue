<template>
  <div>
    <div :class="$style.wrapForm">
      <p :class="$style.hint">
        {{ t('logistic.tracking_incognito_form.hint') }}
      </p>

      <Form @submit.prevent="onSubmit">
        <FormInput
          v-model="vinOrId"
          name="vin_or_id"
          :label="t('logistic.tracking_incognito_form.input_label')"
          :disabled="isLoading"
          required
          :invalid-message="errors.get('vin_or_id')"
          :show-invalid-message="true"
          :aria-label="t('logistic.tracking_incognito_form.input_label')"
          @update:model-value="clearFieldError('vin_or_id')"
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
            :disabled="isLoading || !captchaToken"
            :loading="isLoading"
            :class="$style.submitBtn"
            :aria-label="t('logistic.tracking_incognito_form.submit_btn')"
          >
            {{ t('logistic.tracking_incognito_form.submit_btn') }}
          </CommonButton>
        </div>
      </Form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { useLoadingIndicator } from "#imports"
import Hcaptcha from "@/components/common/Hcaptcha.vue"
import { useApiTracking } from "@/composables/api/useApiTracking"
import Errors from "@/classes/errors"

definePageMeta({
  auth: false,
  layout: "auth",
})

const { t } = useI18n()
const vinOrId = ref<string>("")
const captchaToken = ref<string | null>(null)
const errors = ref(new Errors())

const { track } = useApiTracking()
const { start, finish, isLoading } = useLoadingIndicator()

function clearFieldError(path?: string) {
  if (!path) {
    return
  }
  errors.value.clear(path)
}

async function onSubmit() {
  if (!captchaToken.value) {
    return
  }

  start()
  errors.value.clear()

  try {
    const response = await track({
      "vin_or_id": vinOrId.value,
      "h-captcha-response": captchaToken.value,
    })

    void response

    captchaToken.value = null
  }
  catch (error: any) {
    const resp = error?.data || {}
    if (resp.errors) {
      errors.value.record(resp.errors)
    }

    captchaToken.value = null
  }
  finally {
    finish()
  }
}
</script>

<style module>
.wrapForm {
  @apply bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12 mb-6 border border-gray-200 w-full sm:max-w-[480px] mx-auto;
}
.hint {
  @apply text-sm text-gray-500 mb-6;
}
.buttons {
  @apply flex items-center justify-between;
}
.submitBtn {
  @apply w-full;
}
</style>
