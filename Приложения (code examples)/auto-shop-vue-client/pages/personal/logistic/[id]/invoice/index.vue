<template>
  <div>
    <div :class="$style.header">
      <div :class="$style.titleRow">
        <CommonBackButton :to="{ name: 'personal-logistic-tracking-id', params: { id: orderId } }" />
        <div>
          <h1 :class="$style.title">
            {{ t('logistic.invoice.title') }}
          </h1>
        </div>
      </div>
    </div>

    <div :class="$style.wrapper">
      <div :class="$style.container">
        <div
          v-if="invoiceGenerated"
          :class="$style.generatedNotice"
        >
          <div :class="$style.noticeContent">
            <p :class="$style.noticeText">
              {{ t('logistic.invoice.already_generated') }}
            </p>
            <Button
              kind="blue"
              @click="goToInvoiceView"
            >
              {{ t('logistic.invoice.view_invoice') }}
            </Button>
          </div>
        </div>
        <div :class="$style.section">
          <div :class="$style.infoRow">
            <div :class="$style.infoSubBox">
              <FormInput
                v-model="form.invoiceNumber"
                :label="t('logistic.invoice.number')"
                :disabled="true"
                :invalid-message="errors.get('invoiceNumber')"
              />
            </div>
            <div :class="$style.infoSubBox">
              <FormInput
                v-model="form.invoiceDate"
                :label="t('logistic.invoice.date')"
                :disabled="true"
                :invalid-message="errors.get('invoiceDate')"
              />
            </div>
          </div>

          <div :class="$style.infoBox">
            <div :class="$style.vinLabelRow">
              <span :class="$style.vinLabel">VIN</span>
              <Button
                v-if="nameplates.length"
                kind="unset"
                size="unset"
                :title="t('logistic.invoice.view_nameplate')"
                :class="$style.verifyBtn"
                @click="openFullscreenPhoto(nameplates[0].url)"
              >
                <Label
                  kind="yellow"
                  :text="t('logistic.invoice.verify')"
                />
              </Button>
              <Label
                v-else
                kind="yellow"
                :text="t('logistic.invoice.verify')"
              />
            </div>
            <div
              v-if="nameplates.length"
              :class="$style.nameplatesContainer"
            >
              <div
                v-for="(file, i) in nameplates"
                :key="file.id || i"
                :class="$style.nameplateItem"
                @click="openFullscreenPhoto(file.url)"
              >
                <img
                  :src="file.thumb || file.url"
                  :alt="t('logistic.invoice.nameplate_alt')"
                  :class="$style.nameplateImage"
                >
              </div>
            </div>

            <FormInput
              v-model="form.vin"
              :disabled="isLoading"
              :invalid-message="errors.get('vin')"
              @update:model-value="errors.clear('vin')"
            />
          </div>

          <FormInput
            v-model="form.carPriceCny"
            :class="$style.infoBox"
            :label="t('logistic.invoice.car_price_cny')"
            :disabled="true"
            :invalid-message="errors.get('carPriceCny')"
            @update:model-value="errors.clear('carPriceCny')"
          />

          <Select
            v-model="form.arrivalPortCode"
            :class="$style.infoBox"
            :options="portOptions"
            :label="t('logistic.invoice.arrival_port')"
            :disabled="isLoading"
            :invalid-message="errors.get('arrivalPortCode')"
            @update:model-value="onPortChange"
          />

          <FormInput
            v-model="form.deliveryToPortCny"
            :class="$style.infoBox"
            :label="t('logistic.invoice.delivery_to_port_cny')"
            :disabled="true"
            :invalid-message="errors.get('deliveryToPortCny')"
            @update:model-value="errors.clear('deliveryToPortCny')"
          />

          <div :class="$style.serviceGrid">
            <div :class="$style.serviceCountWrapper">
              <Select
                v-model="form.diagnosticCount"
                :options="serviceCountOptions"
                :label="t('logistic.invoice.diagnostic_count')"
                :disabled="isLoading"
                :invalid-message="errors.get('diagnosticCount')"
                @update:model-value="errors.clear('diagnosticCount')"
              />
            </div>

            <div :class="$style.servicePriceWrapper">
              <span :class="$style.serviceSymbolMobile">x</span>
              <div :class="$style.serviceMultiply">
                <span :class="$style.serviceSymbolDesktop">x</span>
                <FormInput
                  v-model="form.diagnosticPriceCny"
                  :label="t('logistic.invoice.diagnostic_price')"
                  :disabled="true"
                  :invalid-message="errors.get('diagnosticPriceCny')"
                />
              </div>
            </div>

            <div :class="$style.serviceTotalWrapper">
              <span :class="$style.serviceSymbolMobile">=</span>
              <div :class="$style.serviceEquals">
                <span :class="$style.serviceSymbolDesktop">=</span>
                <FormInput
                  v-model="form.diagnosticTotalCny"
                  :label="t('logistic.invoice.diagnostic_total')"
                  :disabled="true"
                  :invalid-message="errors.get('diagnosticTotalCny')"
                />
              </div>
            </div>
          </div>

          <div :class="$style.serviceGrid">
            <div :class="$style.serviceCountWrapper">
              <Select
                v-model="form.compensationCount"
                :options="serviceCountOptions"
                :label="t('logistic.invoice.compensation_count')"
                :disabled="isLoading"
                :invalid-message="errors.get('compensationCount')"
                @update:model-value="errors.clear('compensationCount')"
              />
            </div>

            <div :class="$style.servicePriceWrapper">
              <span :class="$style.serviceSymbolMobile">x</span>
              <div :class="$style.serviceMultiply">
                <span :class="$style.serviceSymbolDesktop">x</span>
                <FormInput
                  v-model="form.compensationPriceCny"
                  :label="t('logistic.invoice.compensation_price')"
                  :disabled="true"
                  :invalid-message="errors.get('compensationPriceCny')"
                />
              </div>
            </div>

            <div :class="$style.serviceTotalWrapper">
              <span :class="$style.serviceSymbolMobile">=</span>
              <div :class="$style.serviceEquals">
                <span :class="$style.serviceSymbolDesktop">=</span>
                <FormInput
                  v-model="form.compensationTotalCny"
                  :label="t('logistic.invoice.compensation_total')"
                  :disabled="true"
                  :invalid-message="errors.get('compensationTotalCny')"
                />
              </div>
            </div>
          </div>

          <FormInput
            v-model="form.invoiceSumCny"
            :label="t('logistic.invoice.invoice_sum_cny')"
            :disabled="isLoading"
            :invalid-message="errors.get('invoiceSumCny')"
          />

          <Select
            v-model="form.oformitel"
            :options="ofOptions"
            :label="t('logistic.invoice.oformitel')"
            :disabled="isLoading"
            :invalid-message="errors.get('payerType')"
            @update:model-value="errors.clear('payerType')"
          />

          <FormInput
            v-model="form.broker"
            :label="t('logistic.invoice.broker')"
            :disabled="true"
            :invalid-message="errors.get('broker')"
            @update:model-value="errors.clear('broker')"
          />
        </div>

        <h2 :class="$style.sectionTitle">
          {{ t('logistic.invoice.payer') }}
        </h2>

        <div :class="$style.section">
          <TransliteratedPair
            v-model="payerFullname.state.ru"
            v-model:latin="payerFullname.state.manualLatin"
            :persisted-latin="payerFullname.state.savedLatin"
            :label="t('logistic.invoice.payer_fullname')"
            :placeholder="t('logistic.buyer_form.fullname_example')"
            :latin-placeholder="t('logistic.buyer_form.fullname_latin_example')"
            :disabled="isLoading"
            :invalid-message="errors.get('payerFullname')"
            @update:model-value="errors.clear('payerFullname')"
          />
          <TransliteratedPair
            v-model="payerAddress.state.ru"
            v-model:latin="payerAddress.state.manualLatin"
            :persisted-latin="payerAddress.state.savedLatin"
            :label="t('logistic.invoice.payer_address')"
            :placeholder="t('logistic.buyer_form.address_example')"
            :latin-placeholder="t('logistic.buyer_form.address_latin_example')"
            :disabled="isLoading"
            :invalid-message="errors.get('payerAddress')"
            @update:model-value="errors.clear('payerAddress')"
          />
          <FormInput
            v-model="form.payerPhone"
            :label="t('logistic.invoice.payer_phone')"
            :disabled="isLoading"
            :invalid-message="errors.get('payerPhone')"
            @update:model-value="errors.clear('payerPhone')"
          />
        </div>

        <UiWarningBlock
          :title="t('logistic.invoice.warning_title')"
          kind="warning"
          :class="$style.warningBlock"
        >
          {{ t('logistic.invoice.warning_text') }}
        </UiWarningBlock>

        <div :class="$style.checkboxContainer">
          <CheckBox
            v-model="form.invoiceVerified"
            :option-label="t('logistic.invoice.confirm')"
            :disabled="isLoading"
          />
        </div>
        <div
          v-if="errors.has('invoiceVerified')"
          :class="$style.errorMessage"
        >
          {{ errors.get('invoiceVerified') }}
        </div>

        <div :class="$style.actions">
          <Button
            kind="black"
            :disabled="isLoading"
            @click="handleGenerateInvoice"
          >
            {{ invoiceGenerated ? t('logistic.invoice.regenerate_invoice') : t('logistic.invoice.generate_invoice') }}
          </Button>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div
        v-if="fullscreenPhoto"
        :class="$style.fullscreenPhoto"
        @click.self="closeFullscreenPhoto"
      >
        <Button
          kind="unset"
          size="unset"
          :class="$style.closeFullscreenBtn"
          @click="closeFullscreenPhoto"
        >
          <XMarkIcon class="w-7 h-7 text-white" />
        </Button>
        <img
          :src="fullscreenPhoto"
          :alt="t('logistic.invoice.nameplate_alt')"
          :class="$style.fullscreenImage"
        >
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { XMarkIcon } from "@heroicons/vue/24/outline"
import { ref, computed, onMounted, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import Label from "@/components/common/Label.vue"
import FormInput from "@/components/form/Input.vue"
import TransliteratedPair from "@/components/form/TransliteratedPair.vue"
import Select from "@/components/form/Select.vue"
import Button from "@/components/common/Button.vue"
import CheckBox from "@/components/form/CheckBox.vue"
import UiWarningBlock from "@/components/ui/UiWarningBlock.vue"
import { useLogistic } from "~/composables/useLogistic"
import usePorts from "@/composables/usePorts"
import type { OptionBase } from "@/types/form/optionType"
import type { Port } from "@/types/responses/port"
import { CompensationCost, DiagnosticCost } from "@/constants/catalog"
import { RoleEmployee, RoleDirector, RoleAdmin, RoleLogistic } from "~/constants/roles"
import { useTransliteratedField } from "~/composables/useTransliteratedField"

definePageMeta({
  auth: true,
  roles: [RoleEmployee, RoleDirector, RoleAdmin, RoleLogistic],
  layout: "personal",
  hideTitle: true,
})

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const orderId = computed(() => Number(route.params.id))
const {
  saveInvoice,
  isLoading,
  errors,
  invoiceData,
  invoiceGenerated,
  nameplates,
  loadInvoice,
  calculateDeliveryForPort,
} = useLogistic()
const { ports, reload: reloadPorts } = usePorts()

const diagnosticCost = DiagnosticCost
const compensationCost = CompensationCost

const ofOptions = computed<OptionBase[]>(() => ([
  { id: 1, value: "phys", name: t("logistic.invoice.oformitel_phys"), disabled: false },
  { id: 2, value: "juridical", name: t("logistic.invoice.oformitel_juridical"), disabled: false },
]))

const serviceCountOptions = computed<OptionBase[]>(() => {
  const maxCount = Math.max(
    5,
    Number(invoiceData.value.diagnosticCount ?? 0),
    Number(invoiceData.value.compensationCount ?? 0),
  )

  return Array.from({ length: maxCount + 1 }, (_, i) => ({
    id: i,
    value: String(i),
    name: String(i),
    disabled: false,
  }))
})

const payerFullname = useTransliteratedField()
const payerAddress = useTransliteratedField()

const form = ref({
  invoiceNumber: "",
  invoiceDate: "",
  vin: "",
  carPriceCny: "",
  arrivalPortCode: "",
  deliveryToPortCny: "",
  diagnosticCount: "0",
  diagnosticPriceCny: String(diagnosticCost),
  diagnosticTotalCny: "0",
  compensationCount: "0",
  compensationPriceCny: String(compensationCost),
  compensationTotalCny: "0",
  invoiceSumCny: "",
  oformitel: "phys",
  broker: "",
  payerPhone: "",
  invoiceVerified: false,
})

const portOptions = computed<OptionBase[]>(() =>
  ports.value.map((p: Port, idx: number) => {
    let name = p.destination_ru || p.code

    if (locale.value === "zh" && p.destination_zh) {
      name = p.destination_zh
    }
    else if (p.destination_ru) {
      name = p.destination_ru
    }

    return {
      id: idx + 1,
      value: p.code,
      name: name,
      disabled: false,
    }
  }),
)

const calculatedMinSum = computed(() => {
  const carPrice = Number(form.value.carPriceCny || 0)
  const delivery = Number(form.value.deliveryToPortCny || 0)
  const diagnostic = Number(form.value.diagnosticTotalCny || 0)
  const compensation = Number(form.value.compensationTotalCny || 0)
  return carPrice + delivery + diagnostic + compensation
})

const fullscreenPhoto = ref<string | null>(null)

function openFullscreenPhoto(img: string) {
  fullscreenPhoto.value = img
}

function closeFullscreenPhoto() {
  fullscreenPhoto.value = null
}

watch(
  () => form.value.diagnosticCount,
  (val) => {
    const count = Number(val || 0)
    const total = count * diagnosticCost
    form.value.diagnosticPriceCny = String(diagnosticCost)
    form.value.diagnosticTotalCny = String(total)
  },
  { immediate: true },
)

watch(
  () => form.value.compensationCount,
  (val) => {
    const count = Number(val || 0)
    const total = count * compensationCost
    form.value.compensationPriceCny = String(compensationCost)
    form.value.compensationTotalCny = String(total)
  },
  { immediate: true },
)

watch(
  () => [form.value.carPriceCny, form.value.deliveryToPortCny, form.value.diagnosticTotalCny, form.value.compensationTotalCny],
  () => {
    const current = Number(form.value.invoiceSumCny || 0)
    if (!form.value.invoiceSumCny || current < calculatedMinSum.value) {
      form.value.invoiceSumCny = String(calculatedMinSum.value)
    }
  },
  { deep: true },
)

watch(
  () => form.value.invoiceSumCny,
  (newVal) => {
    const currentVal = Number(newVal)
    if (currentVal < calculatedMinSum.value) {
      errors.value.record({
        invoiceSumCny: [t("validation.sum_too_low", { min: calculatedMinSum.value })],
      })
    }
    else {
      errors.value.clear("invoiceSumCny")
    }
  },
)

async function onPortChange(val: string) {
  errors.value.clear("arrivalPortCode")
  if (!val) {
    form.value.deliveryToPortCny = ""
    return
  }
  form.value.deliveryToPortCny = await calculateDeliveryForPort(orderId.value, val)
}

async function load() {
  await loadInvoice(orderId.value)
  const data = invoiceData.value
  if (Object.keys(data).length) {
    const numToStr = (v: any) => (v === null || v === undefined ? "" : String(v))
    Object.assign(form.value, {
      invoiceNumber: data.invoiceNumber ?? "",
      invoiceDate: data.invoiceDate ? String(data.invoiceDate).substring(0, 10) : "",
      vin: data.vin ?? "",
      carPriceCny: numToStr(data.carPriceCny),
      arrivalPortCode: data.arrivalPortCode ?? "",
      deliveryToPortCny: numToStr(data.deliveryToPortCny),
      diagnosticCount: numToStr(data.diagnosticCount ?? "0"),
      diagnosticPriceCny: numToStr(data.diagnosticPriceCny ?? diagnosticCost),
      diagnosticTotalCny: numToStr(data.diagnosticTotalCny ?? 0),
      compensationCount: numToStr(data.compensationCount ?? "0"),
      compensationPriceCny: numToStr(data.compensationPriceCny ?? compensationCost),
      compensationTotalCny: numToStr(data.compensationTotalCny ?? 0),
      invoiceSumCny: numToStr(data.invoiceSumCny),
      oformitel: data.payerType ?? "phys",
      broker: data.broker ?? "",
      payerPhone: data.payerPhone ?? "",
      invoiceVerified: !!data.invoiceVerified,
    })
    payerFullname.initFromSaved(data.payerFullname)
    payerAddress.initFromSaved(data.payerAddress)
    if (form.value.arrivalPortCode && (!form.value.deliveryToPortCny || form.value.deliveryToPortCny === "0")) {
      await onPortChange(form.value.arrivalPortCode)
    }
  }
  else {
    form.value.diagnosticCount = "0"
    form.value.diagnosticPriceCny = String(diagnosticCost)
    form.value.diagnosticTotalCny = "0"
    form.value.compensationCount = "0"
    form.value.compensationPriceCny = String(compensationCost)
    form.value.compensationTotalCny = "0"
  }
}

async function handleGenerateInvoice() {
  errors.value.clear()

  const num = (v: string) => (v.trim() === "" ? 0 : Number(v))

  try {
    const payload = {
      invoiceNumber: form.value.invoiceNumber,
      invoiceDate: form.value.invoiceDate,
      vin: form.value.vin,
      carPriceCny: num(form.value.carPriceCny),
      arrivalPortCode: form.value.arrivalPortCode,
      deliveryToPortCny: num(form.value.deliveryToPortCny),
      diagnosticCount: num(form.value.diagnosticCount),
      diagnosticPriceCny: diagnosticCost,
      diagnosticTotalCny: num(form.value.diagnosticTotalCny),
      compensationCount: num(form.value.compensationCount),
      compensationPriceCny: compensationCost,
      compensationTotalCny: num(form.value.compensationTotalCny),
      invoiceSumCny: num(form.value.invoiceSumCny),
      payerType: form.value.oformitel,
      broker: form.value.broker,
      payerFullname: payerFullname.latin.value,
      payerAddress: payerAddress.latin.value,
      payerPhone: form.value.payerPhone,
      invoiceVerified: form.value.invoiceVerified,
    }

    await saveInvoice(orderId.value, payload)

    router.push({
      name: "personal-logistic-id-invoice-view",
      params: { id: orderId.value },
    })
  }
  catch (e) {
    console.error(e)
  }
}

function goToInvoiceView() {
  router.push({
    name: "personal-logistic-id-invoice-view",
    params: { id: orderId.value },
  })
}

onMounted(async () => {
  await reloadPorts()
  await load()
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

.sectionTitle {
  @apply text-xl font-semibold mb-4;
}

.infoRow {
  @apply flex flex-col sm:flex-row gap-4;
}

.infoBox {
  @apply w-full;
}

.infoSubBox {
  @apply w-full sm:w-1/2;
}

.vinLabelRow {
  @apply flex items-center gap-2 mb-2;
}

.vinLabel {
  @apply text-sm font-medium text-gray-700;
}

.serviceGrid {
  @apply grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-6;
}

.serviceCountWrapper {
  @apply w-full;
}

.servicePriceWrapper,
.serviceTotalWrapper {
  @apply w-full flex flex-col sm:block relative;
}

.serviceMultiply,
.serviceEquals {
   @apply w-full sm:flex sm:items-end sm:gap-4;
}

.serviceSymbolDesktop {
  @apply hidden sm:block pb-2 text-lg font-bold text-gray-500;
}

.serviceSymbolMobile {
  @apply sm:hidden text-center text-lg font-bold text-gray-500 py-1 block;
}

.warningBlock {
  @apply mb-6 whitespace-pre-line;
}

.checkboxContainer {
  @apply mt-4 mb-6;
}

.verifyBtn {
  @apply p-0 shadow-none border-none bg-transparent rounded-none focus:ring-0 focus:ring-offset-0 cursor-pointer;
}

.errorMessage {
  @apply text-red-600 text-sm mt-1;
}

.actions {
  @apply flex gap-4;
}

.generatedNotice {
  @apply mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4;
}

.noticeContent {
  @apply flex items-center justify-between;
}

.noticeText {
  @apply text-blue-800 font-medium;
}

.nameplatesContainer {
  @apply flex flex-wrap gap-3 mb-3;
}

.nameplateItem {
  @apply relative w-16 h-16 shrink-0 cursor-zoom-in;
}

.nameplateImage {
  @apply w-full h-full object-cover rounded-md border border-gray-300 shadow-sm transition-transform hover:scale-105;
}

.fullscreenPhoto {
  @apply fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90;
}

.closeFullscreenBtn {
  @apply absolute top-6 right-6 z-10 bg-black bg-opacity-60 rounded-full p-2 hover:bg-opacity-90 transition;
}

.fullscreenImage {
  @apply max-w-full max-h-full rounded-xl shadow-2xl bg-[#111] object-contain;
}
</style>
