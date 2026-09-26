<template>
  <div :class="$style.wrap">
    <div :class="$style.spacings">
      <p>{{ t("verify.check_email") }}</p>
      <p>
        <CommonButton
          :kind="'black'"
          :size="'base'"
          :disabled="isLoading"
          @click="resend"
        >
          {{ t('verify.resend') }}
        </CommonButton>
      </p>
      <p>
        <CommonButton
          :kind="'white'"
          :size="'base'"
          :disabled="isLoading"
          @click="signOut"
        >
          {{ t("navigation.personal-logout") }}
        </CommonButton>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "auth",
  auth: false,
})

const { t } = useI18n()
const { signOut } = useAuth()
const { resendEmailVerification } = useApiAuth()
const { isLoading, start, finish } = useLoadingIndicator()

const resend = async () => {
  start()
  await resendEmailVerification()
  finish()
}
</script>

<style module>
.wrap {
  @apply bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12;
}
.spacings {
  @apply space-y-6;
}
</style>
