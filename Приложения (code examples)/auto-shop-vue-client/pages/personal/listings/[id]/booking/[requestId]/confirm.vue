<template>
  <div>
    <div :class="$style.header">
      <div :class="$style.titleRow">
        <CommonBackButton @click="$router.back()" />

        <div>
          <h1 :class="$style.title">
            {{ t('booking.confirm.title') }}
          </h1>
        </div>
      </div>
    </div>

    <div :class="$style.wrapper">
      <div :class="$style.container">
        <h2 :class="$style.sectionTitle">
          {{ t('booking.confirm.seller_contacts_china') }}
        </h2>
        <div :class="$style.section">
          <FormInput
            v-model="form.wechat"
            :label="t('booking.confirm.wechat_seller')"
            :disabled="isLoading"
            :invalid-message="errors.get('wechat')"
            :show-invalid-message="errors.has('wechat')"
            @update:model-value="errors.clear('wechat')"
          />

          <FormInput
            v-model="form.phone"
            :label="t('booking.confirm.phone_seller')"
            :helper-text="t('booking.confirm.phone_example')"
            helper-position="bottom"
            :disabled="isLoading"
            :invalid-message="errors.get('phone')"
            :show-invalid-message="errors.has('phone')"
            @update:model-value="errors.clear('phone')"
          />

          <FormInput
            v-model="form.address"
            :label="t('booking.confirm.address_china')"
            :helper-text="t('booking.confirm.address_helper')"
            helper-position="bottom"
            :disabled="isLoading"
            :invalid-message="errors.get('address')"
            :show-invalid-message="errors.has('address')"
            @update:model-value="errors.clear('address')"
          />

          <FormTextarea
            v-model="form.additionalInfo"
            :label="t('booking.confirm.additional_info')"
            :rows="3"
            :disabled="isLoading"
            :invalid-message="errors.get('additionalInfo')"
            @update:model-value="errors.clear('additionalInfo')"
          />
        </div>

        <h2 :class="$style.sectionTitle">
          {{ t('booking.confirm.shipping_data') }}
        </h2>
        <div :class="$style.section">
          <div :class="$style.cityBlock">
            <div :class="$style.cityLabelRow">
              <label :class="$style.cityLabel">
                {{ t('booking.confirm.departure_city') }}
              </label>
              <Label
                kind="yellow"
                :text="t('booking.confirm.verify')"
              />
            </div>
            <div :class="$style.cityValue">
              {{ departureCityName }}
            </div>
          </div>
        </div>

        <h2 :class="$style.sectionTitle">
          {{ t('booking.confirm.insurance') }}
        </h2>
        <div :class="$style.section">
          <Date
            v-model="form.insuranceExpiryDate"
            :label="`${t('booking.confirm.insurance_expiry_date')}`"
            :placeholder="t('booking.confirm.insurance_date_placeholder')"
            :disabled="isLoading"
            :invalid-message="errors.get('insuranceExpiryDate')"
            :show-invalid-message="errors.has('insuranceExpiryDate')"
            @update:model-value="errors.clear('insuranceExpiryDate')"
          />
        </div>

        <div :class="$style.warning">
          <Label
            kind="yellow"
            :text="t('booking.confirm.warning_text')"
          />
        </div>

        <div :class="$style.actions">
          <Button
            kind="black"
            :class="$style.submitButton"
            :disabled="isLoading"
            @click="handleSubmit"
          >
            {{ t('booking.confirm.submit_button') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import FormInput from "@/components/form/Input.vue"
import FormTextarea from "@/components/form/Textarea.vue"
import Date from "@/components/form/Date.vue"
import Button from "@/components/common/Button.vue"
import Label from "@/components/common/Label.vue"
import { useLogistic } from "~/composables/useLogistic"
import useCities from "@/composables/useCities"
import { RoleAdmin, RoleSellerClient } from "@/constants/roles"
import type { ValidationFieldError } from "@/types/common/validation"

definePageMeta({
  auth: true,
  roles: [RoleAdmin, RoleSellerClient],
  hideTitle: true,
  layout: "catalog",
})

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const {
  confirmBookingAndSaveSellerData,
  isLoading,
  errors,
  departureCityCode,
  sellerProfile,
  loadListingCityCode,
  loadSellerProfile,
} = useLogistic()
const { cities: citiesList, reload: reloadCities } = useCities()

const listingId = computed(() => Number(route.params.id))
const requestId = computed(() => Number(route.params.requestId))

const form = ref({
  wechat: "",
  phone: "",
  address: "",
  additionalInfo: "",
  insuranceExpiryDate: "",
})

const departureCityName = computed(() => {
  if (!departureCityCode.value) {
    return t("booking.confirm.city_not_specified")
  }
  const city = citiesList.value.find(c => c.code === departureCityCode.value)
  if (!city) {
    return departureCityCode.value
  }
  if (locale.value === "ru" && city.name_ru) {
    return city.name_ru
  }
  if (locale.value === "zh" && city.name_zh) {
    return city.name_zh
  }
  return city.name_ru || city.code
})

function mapErrorToUI(e: unknown) {
  const code = e instanceof Error ? e.message : ""
  const map: Record<string, ValidationFieldError> = {
    validation_wechat_required: { field: "wechat", msg: t("booking.confirm.error_wechat_required") },
    validation_phone_required: { field: "phone", msg: t("booking.confirm.error_phone_required") },
    validation_address_required: { field: "address", msg: t("booking.confirm.error_address_required") },
    validation_insurance_expiry_date_required: {
      field: "insuranceExpiryDate",
      msg: t("booking.confirm.error_insurance_required"),
    },
    validation_insurance_expiry_date_format: {
      field: "insuranceExpiryDate",
      msg: t("booking.confirm.error_insurance_format_dmy"),
    },
    invalid_date_format: {
      field: "insuranceExpiryDate",
      msg: t("booking.confirm.error_insurance_format_dmy"),
    },
  }
  const entry = map[code.replace(/\./g, "_")]
  if (entry) {
    errors.value.record({ [entry.field]: [entry.msg] })
    return true
  }
  return false
}

async function handleSubmit() {
  errors.value.clear()

  try {
    await confirmBookingAndSaveSellerData(listingId.value, requestId.value, {
      wechat: form.value.wechat,
      phone: form.value.phone,
      address: form.value.address,
      additional_info: form.value.additionalInfo,
      insurance_expiry_date: form.value.insuranceExpiryDate,
    })
    await router.replace({
      name: "personal-listings",
      state: { tabIndex: 1 },
    })
  }
  catch (e: any) {
    if (!mapErrorToUI(e)) {
      if (e?.data?.errors) {
        errors.value.record(e.data.errors ?? {})
      }
      else if (e?.data?.message) {
        errors.value.record({ _common: [e.data.message] })
      }
      else {
        console.error(e)
      }
    }
  }
}

onMounted(async () => {
  await Promise.all([
    reloadCities(),
    loadListingCityCode(listingId.value),
    loadSellerProfile(listingId.value),
  ])
  Object.assign(form.value, sellerProfile.value)
})
</script>

<style module>
.wrapper {
  @apply flex flex-col lg:flex-row gap-4;
}

.container {
  @apply w-full lg:w-1/2 pr-4;
}

.header {
  @apply flex items-start justify-between gap-4 mb-6;
}

.title {
  @apply text-3xl font-bold leading-tight;
}

.titleRow {
  @apply flex items-center gap-3;
}

.section {
  @apply mb-6 bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-y-6;
}

.sectionTitle {
  @apply text-xl font-semibold mb-3;
}

.cityBlock {
  @apply mb-4;
}

.cityLabelRow {
  @apply flex items-center gap-2 mb-2;
}

.cityLabel {
  @apply text-sm font-medium text-gray-700;
}

.cityValue {
  @apply text-base text-gray-900 bg-gray-50 border border-gray-300 rounded px-3 py-2 mb-1;
}

.warning {
  @apply mb-4 px-2 py-4;
}

.actions {
  @apply flex justify-start;
}

.submitButton {
  @apply px-8 py-3 text-lg;
}
</style>
