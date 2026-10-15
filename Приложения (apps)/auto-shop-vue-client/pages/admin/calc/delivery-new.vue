<template>
  <div :class="$style.container">
    <div :class="$style.formContainer">
      <div
        v-for="(item, index) in formDataList"
        :key="index"
        :class="$style.formRow"
      >
        <div :class="$style.fieldStack">
          <Input
            v-model="item.russianCity"
            :label="t('calc.russian_city')"
            :placeholder="t('calc.city_name_placeholder')"
            :class="$style.formInput"
            :disabled="isLoading"
            :is-invalid="hasRowError(index, 'name_ru')"
            :show-invalid-message="false"
          />
          <div :class="[$style.errorCollapse, { [$style.errorCollapseOpen]: hasRowError(index, 'name_ru') }]">
            <span
              v-if="hasRowError(index, 'name_ru')"
              :class="$style.errorText"
            >
              {{ getFirstRowError(index, 'name_ru') }}
            </span>
          </div>
        </div>

        <div :class="$style.fieldStack">
          <Input
            v-model="item.chineseCity"
            :label="t('calc.chinese_city')"
            :placeholder="t('calc.chinese_city_placeholder')"
            :class="$style.formInput"
            :disabled="isLoading"
            :is-invalid="hasRowError(index, 'name_zh')"
            :show-invalid-message="false"
          />
          <div :class="[$style.errorCollapse, { [$style.errorCollapseOpen]: hasRowError(index, 'name_zh') }]">
            <span
              v-if="hasRowError(index, 'name_zh')"
              :class="$style.errorText"
            >
              {{ getFirstRowError(index, 'name_zh') }}
            </span>
          </div>
        </div>

        <div
          v-for="port in ports"
          :key="port.code"
          :class="$style.fieldStack"
        >
          <InputNumber
            v-model="item.costs[port.code]"
            :label="portName(port)"
            :placeholder="t('calc.yuan_placeholder')"
            :class="$style.formInput"
            :disabled="isLoading"
          />
        </div>

        <div :class="$style.fieldStack">
          <Button
            kind="white"
            size="base"
            :disabled="isLoading"
            :class="$style.deleteButton"
            @click="removeRow(index)"
          >
            <TrashIcon :class="$style.trashIcon" />
          </Button>
        </div>
      </div>

      <div :class="$style.additionalButtons">
        <Button
          kind="green"
          size="base"
          :disabled="isLoading"
          :class="$style.addButton"
          @click="addRow"
        >
          <PlusIcon :class="$style.plusIcon" />
          {{ t('calc.add_more') }}
        </Button>
      </div>

      <div :class="$style.saveButtonContainer">
        <Button
          kind="black"
          size="base"
          :disabled="isLoading"
          :class="$style.saveButton"
          @click="saveAll"
        >
          {{ t('calc.save') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import { PlusIcon, TrashIcon } from "@heroicons/vue/24/solid"
import { RoleAdmin, RoleLogistic } from "~/constants/roles"
import Input from "@/components/form/Input.vue"
import InputNumber from "@/components/form/InputNumber.vue"
import Button from "@/components/common/Button.vue"
import { useLoadingIndicator } from "#imports"
import { useApiCities } from "@/composables/api/useApiCities"
import usePorts from "@/composables/usePorts"
import Errors from "@/classes/errors"
import type { DeliveryCostInput } from "~/types/responses/city"

const { t } = useI18n()
const { start, finish, isLoading } = useLoadingIndicator()
const { store } = useApiCities()
const { ports, reload: reloadPorts, portName } = usePorts()

definePageMeta({
  auth: true,
  layout: "personal",
  roles: [RoleAdmin, RoleLogistic],
})

interface FormDataItem {
  russianCity: string
  chineseCity: string
  costs: Record<string, number | undefined>
}

const createRow = (): FormDataItem => ({ russianCity: "", chineseCity: "", costs: {} })

const formDataList = ref<FormDataItem[]>([createRow()])

const errors = ref<(Errors | null)[]>([null])

function ensureErrorsLength() {
  while (errors.value.length < formDataList.value.length) {
    errors.value.push(null)
  }
  while (errors.value.length > formDataList.value.length) {
    errors.value.pop()
  }
}

function addRow() {
  formDataList.value.push(createRow())
  errors.value.push(null)
}

function removeRow(index: number) {
  if (formDataList.value.length > 1) {
    formDataList.value.splice(index, 1)
    errors.value.splice(index, 1)
  }
}

function getRowErrors(index: number): Errors {
  if (!errors.value[index]) {
    errors.value[index] = new Errors()
  }
  return errors.value[index] as Errors
}

function hasRowError(index: number, field: string): boolean {
  return !!errors.value[index]?.has(field)
}

function getFirstRowError(index: number, field: string): string | undefined {
  const errs = errors.value[index]?.get(field)
  if (!errs) {
    return
  }
  if (Array.isArray(errs)) {
    return errs[0]
  }
  if (typeof errs === "string") {
    return errs.split(/[\n,;]+/)[0].trim()
  }
  return errs
}

function buildDeliveryCosts(item: FormDataItem): DeliveryCostInput[] {
  const result: DeliveryCostInput[] = []
  for (const port of ports.value) {
    const value = item.costs[port.code]
    if (value != null) {
      result.push({ port_id: port.id, delivery_cost: value })
    }
  }
  return result
}

async function saveAll() {
  if (isLoading.value) {
    return
  }
  start()
  try {
    ensureErrorsLength()
    for (let i = 0; i < errors.value.length; i++) {
      errors.value[i]?.clear()
    }

    const payloads = formDataList.value.map((item, idx) => ({
      idx,
      body: {
        name_ru: item.russianCity,
        name_zh: item.chineseCity,
        delivery_costs: buildDeliveryCosts(item),
        hidden: false,
      },
    }))

    for (const p of payloads) {
      try {
        await store(p.body)
      }
      catch (error: any) {
        const resp = error?.data || {}
        if (resp.errors) {
          getRowErrors(p.idx).record(resp.errors)
        }
      }
    }

    const hasAnyErrors = errors.value.some(e => e?.any && e.any())
    if (!hasAnyErrors) {
      formDataList.value = [createRow()]
      errors.value = [null]
    }
  }
  finally {
    finish()
  }
}

onMounted(async () => {
  await reloadPorts()
})
</script>

<style module>
.container { @apply mx-auto; }
.formContainer { @apply w-full p-6 border border-gray-300 rounded-lg; }
.formRow { @apply flex flex-wrap gap-4 items-end mb-6; }
.fieldStack { @apply flex-1 min-w-[150px] relative pb-8; }
.formInput { @apply w-full; }
.deleteButton { @apply p-2 h-[38px]; }
.trashIcon { @apply w-5 h-5; }
.additionalButtons { @apply flex justify-start mb-4; }
.addButton { @apply inline-flex items-center; }
.plusIcon { @apply w-4 h-4 mr-2; }
.saveButtonContainer { @apply flex justify-start; }
.saveButton { @apply whitespace-nowrap; }
.errorCollapse { @apply absolute left-0 w-full; bottom: -4px; max-height:0; overflow:hidden; transition:max-height 180ms ease; }
.errorCollapseOpen { max-height:40px; }
.errorText { font-size:12px; color:#dc2626; word-break:break-word; overflow-wrap:anywhere; line-height:20px; padding-top:2px; }
</style>
