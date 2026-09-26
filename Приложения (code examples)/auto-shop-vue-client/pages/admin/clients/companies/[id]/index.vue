<template>
  <div :class="$style.wrapper">
    <div :class="$style.container">
      <h2 :class="$style.title">
        {{ !isNew ? t('company.title') : t('company.title_new') }}
      </h2>
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
            v-model="clientData.name"
            name="name"
            :label="t('columns.clients.name') + ' *'"
            type="text"
            :disabled="isLoading"
            :placeholder="t('columns.clients.placeholder_name')"
            :invalid-message="errors.get('name')"
            required
            @input="alert = null"
            @update:model-value="errors.clear('name')"
          />
          <FormInput
            v-model="clientData.fio"
            name="fio"
            :label="t('columns.clients.fio') + ' *'"
            type="text"
            :disabled="isLoading"
            :placeholder="t('columns.clients.placeholder_fio')"
            :invalid-message="errors.get('fio')"
            required
            @input="alert = null"
            @update:model-value="errors.clear('fio')"
          />
          <FormInput
            v-model="clientData.phone"
            name="phone"
            :label="t('columns.clients.phone') + ' *'"
            :placeholder="t('columns.clients.placeholder_phone')"
            :disabled="isLoading"
            :invalid-message="errors.get('phone')"
            required
            @input="alert = null"
            @update:model-value="errors.clear('phone')"
          />
          <FormInput
            v-model="clientData.email"
            name="email"
            :label="t('columns.users.email') + ' *'"
            :placeholder="t('columns.clients.placeholder_email')"
            :disabled="isLoading"
            type="email"
            :invalid-message="errors.get('email')"
            required
            @input="alert = null"
            @update:model-value="errors.clear('email')"
          />
          <FormInput
            v-model="clientData.inn"
            name="inn"
            :label="t('columns.clients.inn') + ' *'"
            :placeholder="t('columns.clients.placeholder_inn')"
            :disabled="isLoading"
            :invalid-message="errors.get('inn')"
            required
            @input="alert = null"
            @update:model-value="errors.clear('inn')"
          />
          <FormInput
            v-model="clientData.address"
            name="address"
            :label="t('columns.clients.address') + ' *'"
            :placeholder="t('columns.clients.placeholder_address')"
            :disabled="isLoading"
            :invalid-message="errors.get('address')"
            required
            @input="alert = null"
            @update:model-value="errors.clear('address')"
          />
          <FormInput
            v-model="clientData.contact"
            name="contact"
            :label="t('columns.clients.contact')"
            :placeholder="t('columns.clients.placeholder_contact')"
            :helper-text="t('columns.clients.helper_contact')"
            :disabled="isLoading"
            :invalid-message="errors.get('contact')"
            @input="alert = null"
            @update:model-value="errors.clear('contact')"
          />
        </div>
        <div :class="$style.personalBtnWrap">
          <CommonButton
            type="submit"
            kind="black"
            size="lg"
            :disabled="isLoading"
          >
            {{ !isNew ? t("common.save") : t("common.register") }}
          </CommonButton>
        </div>
      </Form>
    </div>
    <div
      v-if="!isNew"
      :class="$style.rightContainer"
    >
      <h2 :class="$style.title">
        {{ t('company.balance') }}
      </h2>
      <div :class="$style.balanceBlock">
        <div :class="$style.balanceContent">
          <span :class="$style.balanceText">{{ formattedBalance }}</span>
          <NuxtLink
            :to="{ name: 'admin-clients-balances-id-main-change', params: { id } }"
            :class="$style.balanceLink"
          >
            {{ t('company.change_balance') }}
          </NuxtLink>
        </div>
      </div>
      <h2 :class="$style.title">
        {{ t('company.china_expenses_title') }}
      </h2>
      <div :class="$style.balanceBlock">
        <div
          v-if="chinaExpensesRows.length"
          :class="$style.chinaExpensesContent"
        >
          <div
            v-for="row in chinaExpensesRows"
            :key="row.portCode"
            :class="$style.chinaExpensesRow"
          >
            <span :class="$style.balanceText">{{ row.portName }}</span>
            <span :class="$style.chinaExpensesAmount">
              {{ row.text }}
              <span
                v-if="row.belowBase"
                :class="$style.chinaExpensesBelowBase"
              >
                {{ t('company.china_expenses_below_base') }}
              </span>
            </span>
          </div>
        </div>
        <div
          v-else
          :class="$style.chinaExpensesContent"
        >
          <span :class="$style.chinaExpensesAmount">{{ t('company.china_expenses_default') }}</span>
        </div>
      </div>
      <h2 :class="$style.title">
        {{ t('company.change_password') }}
      </h2>
      <div :class="$style.form">
        <div :class="$style.passwordTitleSmall">
          {{ t('company.change_password_second') }}
        </div>
        <div :class="$style.passwordHint">
          <span>
            {{ t('company.password_hint') }}<br>
            {{ t('company.password_min_length') }}
          </span>
        </div>
        <CommonAlert
          v-if="passwordAlert"
          :alert="passwordAlert"
          :class="$style.alert"
        />
        <Form
          @submit.prevent="onChangePassword"
        >
          <div :class="$style.passwordInputs">
            <div :class="$style.passwordInputWrap">
              <FormInput
                v-model="passwordData.password"
                name="password"
                :label="t('auth.password') + ' *'"
                :disabled="isLoading"
                type="password"
                :invalid-message="passwordErrors.get('password')"
                required
                @input="passwordAlert = null"
                @update:model-value="passwordErrors.clear('password')"
              />
            </div>
            <div :class="$style.passwordInputWrap">
              <FormInput
                v-model="passwordData.password_confirmation"
                name="password_confirmation"
                :label="t('auth.password_confirm') + ' *'"
                :disabled="isLoading"
                type="password"
                :invalid-message="passwordErrors.get('password_confirmation')"
                required
                @input="passwordAlert = null"
                @update:model-value="passwordErrors.clear('password_confirmation')"
              />
            </div>
          </div>
          <div :class="$style.personalBtnWrap">
            <CommonButton
              type="submit"
              kind="black"
              size="lg"
              :disabled="isLoading"
            >
              {{ t('company.change_password_second') }}
            </CommonButton>
          </div>
        </Form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router"
import { computed } from "vue"
import type { Alert } from "@/types/common/alert"
import type Response from "@/types/responses/response"
import type { Client } from "@/types/responses/client"
import { useApiClient } from "@/composables/api/useApiClient"
import { useApiPorts } from "@/composables/api/useApiPorts"
import type { Port } from "@/types/responses/port"
import useClient from "@/composables/useClient"
import { AlertTypeEnum } from "@/types/common/alert"
import { useMoney } from "@/composables/useMoney"
import { CNY } from "@/constants/currency"
import { RoleAdmin } from "@/constants/roles"

definePageMeta({
  layout: "personal",
  auth: true,
  roles: [RoleAdmin],
  hideTitle: true,
})

const router = useRouter()
const route = useRoute()
const id = Number(route.params.id as string)
const isNew = id <= 0
const { t } = useI18n()
const { show } = useApiClient()
const { adminIndex } = useApiPorts()
const { data: client } = !isNew
  ? await useAsyncData<Response<Client>>(
      `client-${id}`,
      () => show(Number(id)),
    )
  : { data: ref(null) }
const {
  isLoading,
  errors,
  passwordErrors,
  clientData,
  passwordData,
  balance,
  update,
  store,
  changePassword,
} = useClient(client.value?.data)

const alert = ref<Alert | null>(null)
const passwordAlert = ref<Alert | null>(null)

const { formatBalance } = useMoney()

const formattedBalance = computed(() => {
  return formatBalance(balance.value, CNY)
})

const { data: portsRes } = await useAsyncData(
  "admin-ports-full",
  () => adminIndex(),
)

const portByCode = computed(() => {
  const map = new Map<string, Port>()
  for (const port of portsRes.value?.data ?? []) {
    map.set(port.code, port)
  }
  return map
})

interface ChinaExpensesRow {
  portCode: string
  portName: string
  text: string
  belowBase: boolean
}

const chinaExpensesRows = computed<ChinaExpensesRow[]>(() => {
  const settings = client.value?.data?.china_expenses_settings ?? []

  return settings
    .filter(setting => setting.mode !== "base" && setting.amount)
    .map((setting) => {
      const port = portByCode.value.get(setting.port_code)
      const amount = Number(setting.amount)

      let belowBase = false
      if (setting.mode === "fixed" && port) {
        const base = port.pricing_type === "fixed"
          ? Number(port.surcharge ?? 0) + Number(port.fixed_delivery_cost ?? 0)
          : Number(port.surcharge ?? 0)
        belowBase = base > 0 && amount < base
      }

      const modeLabel = setting.mode === "fixed"
        ? t("china_expenses.settings.mode_fixed")
        : t("china_expenses.settings.mode_markup")

      return {
        portCode: setting.port_code,
        portName: port?.name_ru || setting.port_code,
        text: `${modeLabel}: ${formatBalance(amount, CNY)}`,
        belowBase,
      }
    })
})

const onSubmit = async () => {
  if (!isNew) {
    const updated = await update(Number(id), clientData.value)
    if (updated !== false) {
      await refreshNuxtData(`client-${id}`)
      alert.value = {
        type: AlertTypeEnum.Success,
        subtitle: t("notification.client.updated"),
      }
    }
  }
  else {
    const newId = await store(clientData.value)
    if (newId) {
      await router.replace({ name: "admin-clients-companies-id", params: { id: newId } })
    }
  }
}

const onChangePassword = async () => {
  await changePassword()
  if (!passwordErrors.value.any()) {
    passwordAlert.value = {
      type: AlertTypeEnum.Success,
      subtitle: t("notification.client.updated_password"),
    }
  }
}
</script>

<style module>
.wrapper {
  @apply flex flex-col lg:flex-row gap-4;
}

.container {
  @apply w-full lg:w-1/2 pr-4;
}

.rightContainer {
  @apply w-full lg:w-1/2 pl-4 flex flex-col gap-4;
}

.formContentWrap {
  @apply flex flex-col gap-y-6;
}

.form {
  @apply bg-white px-4 py-6 shadow sm:rounded-lg sm:px-6;
}

.balanceBlock {
  @apply bg-white px-4 py-6 shadow sm:rounded-lg sm:px-6;
}

.balanceContent {
  @apply flex justify-between items-center;
}

.balanceText {
  @apply text-base font-medium text-black;
}

.balanceLink {
  @apply text-blue-500 cursor-pointer underline;
}

.chinaExpensesContent {
  @apply flex flex-col gap-2;
}

.chinaExpensesRow {
  @apply flex flex-col gap-0.5;
}

.chinaExpensesAmount {
  @apply text-sm text-gray-600;
}

.chinaExpensesBelowBase {
  @apply text-red-600 font-medium ml-1;
}

.passwordInputs {
  @apply flex flex-row gap-4 w-full;
}
.passwordInputWrap {
  flex: 1 1 0%;
  min-width: 0;
  max-width: 50%;
}

.personalBtnWrap {
  @apply flex items-center justify-start mt-6;
}

.alert {
  @apply mb-2.5;
}

.title {
  @apply text-2xl font-semibold text-black mb-4;
}

.passwordTitleSmall {
  @apply text-sm font-medium text-black mb-1;
}

.passwordHint {
  @apply text-xs text-gray-400 mb-4;
}
</style>
