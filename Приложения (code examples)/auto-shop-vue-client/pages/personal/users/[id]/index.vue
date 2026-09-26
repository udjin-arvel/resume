<template>
  <div :class="$style.wrapper">
    <div :class="$style.container">
      <CommonAlert
        v-if="alert"
        :alert="alert"
        :class="$style.alert"
      />
      <Form
        :class="$style.form"
        @submit.prevent="onSubmit"
      >
        <div :class="$style.formContentWrap">
          <FormInput
            v-model="userUpdate.name"
            name="name"
            :label="t('columns.users.name') + ' *'"
            type="text"
            :disabled="isLoading"
            :invalid-message="errors.get('name')"
            required
            @input="alert = null"
            @update:model-value="errors.clear('name')"
          />
          <FormInput
            v-model="userUpdate.phone"
            name="phone"
            :label="t('columns.users.phone') + ' *'"
            type="text"
            :disabled="isLoading"
            :invalid-message="errors.get('phone')"
            :placeholder="t('columns.clients.placeholder_phone')"
            required
            @input="alert = null"
            @update:model-value="errors.clear('phone')"
          />
          <FormInput
            v-model="userUpdate.email"
            name="email"
            :label="t('columns.users.email') + ' *'"
            type="email"
            :disabled="isLoading"
            :invalid-message="errors.get('email')"
            required
            @input="alert = null"
            @update:model-value="errors.clear('email')"
          />
          <FormSelect
            v-model="userUpdate.preferred_lang"
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
        <div :class="$style.personalBtnWrap">
          <CommonButton
            type="submit"
            kind="black"
            size="lg"
            :disabled="isLoading"
          >
            {{ isNew ? t("common.register") : t("common.save") }}
          </CommonButton>
        </div>
      </Form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { useRouter } from "vue-router"
import useUser from "@/composables/useUser"
import { useApiUser } from "@/composables/api/useApiUser"
import type { Alert } from "@/types/common/alert"
import { AlertTypeEnum } from "@/types/common/alert"
import { russian, chinese } from "@/constants/lang"

definePageMeta({
  layout: "personal",
  auth: true,
})

const route = useRoute()
const id = Number(route.params.id as string)
const isNew = id <= 0
const { t } = useI18n()
const router = useRouter()

const {
  isLoading,
  errors,
  userUpdate,
  update,
  store,
} = useUser()

const alert = ref<Alert | null>(null)
const acceptTerms = ref(false)

const languageOptions = computed(() => [
  { id: 1, name: t("common.languages.ru"), value: russian, label: t("common.languages.ru"), disabled: false },
  { id: 2, name: t("common.languages.zh"), value: chinese, label: t("common.languages.zh"), disabled: false },
])

const onSubmit = async () => {
  if (!isNew) {
    const updated = await update(Number(id), userUpdate.value)
    if (updated !== false) {
      await refreshNuxtData(`user-${id}`)
      alert.value = {
        type: AlertTypeEnum.Success,
        subtitle: t("notification.user.updated"),
      }
    }
  }
  else {
    const newId = await store(userUpdate.value)
    if (newId) {
      await router.replace({ name: "personal-users-id", params: { id: newId } })
    }
  }
}

const { show: showUser } = useApiUser()

onMounted(async () => {
  if (!isNew) {
    const res = await showUser(id)
    if (res?.data) {
      userUpdate.value.name = res.data.name
      userUpdate.value.email = res.data.email
      userUpdate.value.phone = res.data.phone ?? ""
      userUpdate.value.preferred_lang = res.data.preferred_lang ?? russian
    }
  }
  else {
    if (!userUpdate.value.preferred_lang) {
      userUpdate.value.preferred_lang = russian
    }
  }
})
</script>

<style module>
.wrapper {
  @apply flex flex-col lg:flex-row gap-4;
}
.container {
  @apply w-full lg:w-1/2 pr-4;
}
.formContentWrap {
  @apply flex flex-col gap-y-6;
}
.form {
  @apply bg-white px-4 py-6 shadow sm:rounded-lg sm:px-6;
}
.personalBtnWrap {
  @apply flex items-center justify-start mt-6;
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
</style>
