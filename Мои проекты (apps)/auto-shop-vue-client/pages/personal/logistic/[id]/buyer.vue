<template>
  <div>
    <div :class="$style.header">
      <div :class="$style.titleRow">
        <CommonBackButton :to="{ name: 'personal-logistic-tracking-id', params: { id: orderId } }" />
        <div>
          <h1 :class="$style.title">
            {{ t('logistic.buyer_form.title') }}
          </h1>
        </div>
      </div>
    </div>

    <div :class="$style.wrapper">
      <div :class="$style.container">
        <div :class="$style.section">
          <div class="inline-flex items-center gap-2">
            <ExclamationCircleIcon class="w-5 h-5 text-gray-400 flex-shrink-0" />
            <span>{{ t('logistic.buyer_form.buyer_is_payer') }}</span>
          </div>

          <TransliteratedPair
            v-model="fullname.state.ru"
            v-model:latin="fullname.state.manualLatin"
            :persisted-latin="fullname.state.savedLatin"
            :label="t('logistic.buyer_form.fullname')"
            :placeholder="t('logistic.buyer_form.fullname_example')"
            :latin-placeholder="t('logistic.buyer_form.fullname_latin_example')"
            :disabled="isLoading"
            :invalid-message="errors.get('fullname')"
            @update:model-value="errors.clear('fullname')"
          />

          <FormInput
            :model-value="form.passportNumber"
            :label="t('logistic.buyer_form.passport_number')"
            :helper-text="t('logistic.buyer_form.passport_example')"
            helper-position="bottom"
            :disabled="isLoading"
            :invalid-message="errors.get('passport_number')"
            inputmode="numeric"
            maxlength="11"
            @update:model-value="updatePassportNumber"
            @keydown="filterKeyPress"
            @paste="onPaste"
            @input="onInput"
          />

          <TransliteratedPair
            v-model="address.state.ru"
            v-model:latin="address.state.manualLatin"
            :persisted-latin="address.state.savedLatin"
            :label="t('logistic.buyer_form.address')"
            :placeholder="t('logistic.buyer_form.address_example')"
            :latin-placeholder="t('logistic.buyer_form.address_latin_example')"
            :disabled="isLoading"
            :invalid-message="errors.get('address')"
            @update:model-value="errors.clear('address')"
          />

          <FormTextarea
            v-model="form.additionalInfo"
            :label="t('logistic.buyer_form.additional_info')"
            :rows="3"
            :disabled="isLoading"
            :invalid-message="errors.get('additionalInfo')"
            @update:model-value="errors.clear('additionalInfo')"
          />
        </div>

        <UiWarningBlock
          :title="t('logistic.buyer_form.warning_title')"
          kind="warning"
          class="mb-6"
        >
          {{ t('logistic.buyer_form.warning_text') }}
        </UiWarningBlock>

        <Button
          kind="black"
          :disabled="isLoading"
          @click="handleSave"
        >
          {{ t('common.save_and_continue') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExclamationCircleIcon } from "@heroicons/vue/24/outline"
import { ref, onMounted, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import FormInput from "@/components/form/Input.vue"
import FormTextarea from "@/components/form/Textarea.vue"
import TransliteratedPair from "@/components/form/TransliteratedPair.vue"
import Button from "@/components/common/Button.vue"
import UiWarningBlock from "@/components/ui/UiWarningBlock.vue"
import { useNumericInput } from "~/composables/useNumericInput"
import { useLogistic } from "~/composables/useLogistic"
import { useTransliteratedField } from "~/composables/useTransliteratedField"
import usePorts from "@/composables/usePorts"
import { RoleEmployee, RoleDirector, RoleAdmin, RoleLogistic } from "~/constants/roles"

definePageMeta({
  auth: true,
  roles: [RoleEmployee, RoleDirector, RoleAdmin, RoleLogistic],
  layout: "personal",
  hideTitle: true,
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const orderId = computed(() => Number(route.params.id))

const { reload: reloadPorts } = usePorts()
const { filterKeyPress } = useNumericInput({ maxLength: 10 })
const { isLoading, errors, buyerProfile, loadBuyerForm, submitBuyerForm } = useLogistic()

const fullname = useTransliteratedField()
const address = useTransliteratedField()

const form = ref({
  passportNumber: "",
  additionalInfo: "",
})

const passportRawValue = ref("")

function updatePassportNumber(value: string | number) {
  const str = String(value)
  passportRawValue.value = str
  form.value.passportNumber = str
  errors.value.clear("passport_number")
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  passportRawValue.value = target.value
  form.value.passportNumber = target.value
  errors.value.clear("passport_number")
}

function onPaste(event: ClipboardEvent) {
  event.preventDefault()
  const pastedText = event.clipboardData?.getData("text") || ""
  passportRawValue.value = pastedText
  form.value.passportNumber = pastedText
  errors.value.clear("passport_number")
}

async function handleSave() {
  const passportRaw = passportRawValue.value.replace(/\s/g, "")

  if (passportRaw && !/^\d{10}$/.test(passportRaw)) {
    errors.value.record({ passport_number: [t("logistic.buyer_form.passport_invalid")] })
    return
  }

  const ok = await submitBuyerForm(orderId.value, {
    fullname: fullname.latin.value,
    passportNumber: passportRaw || null,
    address: address.latin.value,
    additionalInfo: form.value.additionalInfo,
  })

  if (ok) {
    await router.push({
      name: "personal-logistic-id-invoice",
      params: { orderId: orderId.value },
    })
  }
}

onMounted(async () => {
  await Promise.all([reloadPorts(), loadBuyerForm(orderId.value)])
  form.value.passportNumber = buyerProfile.value.passportNumber ?? ""
  form.value.additionalInfo = buyerProfile.value.additionalInfo ?? ""
  passportRawValue.value = form.value.passportNumber
  fullname.initFromSaved(buyerProfile.value.fullname)
  address.initFromSaved(buyerProfile.value.address)
})
</script>

<style module>
.header {
  @apply flex items-start justify-between gap-4 mb-6;
}
.title {
  @apply text-3xl font-bold leading-tight;
}
.titleRow {
  @apply flex items-center gap-3;
}
.wrapper {
  @apply flex flex-col lg:flex-row gap-4;
}
.container {
  @apply w-full lg:w-1/2 pr-4;
}
.section {
  @apply mb-8 bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-y-6;
}
</style>
