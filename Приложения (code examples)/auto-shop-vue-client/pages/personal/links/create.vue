<template>
  <div>
    <div :class="$style.header">
      <div :class="$style.titleRow">
        <CommonBackButton @click="$router.back()" />
        <h1 :class="$style.title">
          {{ t('car_links.create.title') }}
        </h1>
      </div>
    </div>

    <div :class="$style.wrapper">
      <div :class="$style.subtitle">
        {{ t('car_links.create.subtitle') }}
      </div>

      <form
        :class="$style.formContainer"
        @submit.prevent="handleSubmit"
      >
        <FormInput
          v-model="form.link"
          name="url"
          :label="t('car_links.create.label_url')"
          :placeholder="t('car_links.create.placeholder_url')"
          :disabled="isLoading"
          :invalid-message="errors?.get('url')"
          @input="errors?.clear('url')"
        />

        <FormTextarea
          v-model="form.wishes"
          name="wish"
          :label="t('car_links.create.label_wishes')"
          :placeholder="t('car_links.create.placeholder_wishes')"
          :rows="4"
          :disabled="isLoading"
          :invalid-message="errors?.get('wish')"
          @input="errors?.clear('wish')"
        />

        <div :class="$style.actions">
          <CommonButton
            type="submit"
            kind="black"
            :class="$style.submitButton"
            :disabled="isLoading"
          >
            {{ isLoading ? t('car_links.create.btn_submitting') : t('car_links.create.btn_submit') }}
          </CommonButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import CommonButton from "@/components/common/Button.vue"
import FormInput from "@/components/form/Input.vue"
import FormTextarea from "@/components/form/Textarea.vue"

import { useCarLink } from "@/composables/useCarLink"
import { CarConditionEnum, ActionTypeEnum } from "@/constants/carLink"
import { RoleDirector, RoleEmployee } from "~/constants/roles"

definePageMeta({
  layout: "personal",
  auth: true,
  hideTitle: true,
  roles: [RoleDirector, RoleEmployee],
})

const { t } = useI18n()
const router = useRouter()
const { createCarLink, isLoading, errors } = useCarLink()

const form = ref({
  condition: CarConditionEnum.USED,
  link: "",
  wishes: "",
})

async function handleSubmit() {
  const payload = {
    url: form.value.link,
    condition: form.value.condition,
    wish: form.value.wishes || null,
  }

  const response = await createCarLink(payload)

  if (response) {
    const hasAutoReply = response.actions?.some(
      (a: any) => a.type === ActionTypeEnum.AUTO_REPLY,
    )

    if (hasAutoReply) {
      await router.push({ name: "personal-links-id", params: { id: response.id } })
    }
    else {
      await router.push({ name: "personal-links" })
    }
  }
}
</script>

<style module>
.header {
  @apply mb-4;
}

.titleRow {
  @apply flex gap-3;
}

.title {
  @apply text-3xl font-bold leading-tight;
}

.subtitle {
  @apply text-base text-gray-500 mb-4;
}

.wrapper {
  @apply w-full lg:w-1/2;
}

.formContainer {
  @apply bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-4;
}

.actions {
  @apply mt-2 flex justify-start;
}

.submitButton {
  @apply px-6 py-3 text-[15px];
}
</style>
