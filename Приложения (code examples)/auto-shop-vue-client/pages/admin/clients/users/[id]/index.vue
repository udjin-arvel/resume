<template>
  <div :class="$style.wrapper">
    <div :class="$style.container">
      <h2 :class="$style.title">
        {{ !isNew ? t('user.detail.block_personal_data') : t('user.detail.block_new_personal_data') }}
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
          <SearchableSelect
            v-model="selectedCompany"
            name="client_id"
            :label="t('columns.users.company') + ' *'"
            :options="companyOptions"
            :disabled="isLoading"
            :invalid-message="errors.get('client_id')"
            :show-invalid-message="true"
            required
            @update:model-value="onCompanyChange"
            @update:search-query="searchCompanyQuery = $event"
          />
          <FormSelect
            v-model="userUpdate.role"
            name="role"
            :label="t('columns.users.role') + ' *'"
            :options="roleOptions"
            :disabled="isLoading"
            :invalid-message="errors.get('role')"
            required
            @input="alert = null"
            @update:model-value="errors.clear('role')"
          />
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
            @input="alert = null"
            @update:model-value="errors.clear('preferred_lang')"
          />
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
    <div
      :class="$style.rightContainer"
    >
      <template v-if="!isNew">
        <h2 :class="$style.title">
          {{ t('user.detail.block_password_data') }}
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
                  v-model="userPasswordUpdate.password"
                  name="password"
                  :label="t('auth.password') + ' *'"
                  :disabled="isLoading"
                  type="password"
                  :invalid-message="errors.get('password')"
                  required
                  @input="passwordAlert = null"
                  @update:model-value="errors.clear('password')"
                />
              </div>
              <div :class="$style.passwordInputWrap">
                <FormInput
                  v-model="userPasswordUpdate.password_confirmation"
                  name="password_confirmation"
                  :label="t('auth.password_confirm') + ' *'"
                  :disabled="isLoading"
                  type="password"
                  :invalid-message="errors.get('password_confirmation')"
                  required
                  @input="passwordAlert = null"
                  @update:model-value="errors.clear('password_confirmation')"
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
      </template>

      <h2 :class="$style.title">
        {{ t('user.detail.permissions_title') }}
      </h2>
      <div :class="$style.form">
        <div :class="$style.permissionsWrapper">
          <div :class="$style.permissionGroup">
            <h3 :class="$style.permissionGroupTitle">
              {{ t('user.detail.permissions_cars_title') }}
            </h3>
            <div :class="$style.permissionList">
              <div :class="$style.switchRow">
                <Switch
                  :model-value="userPermissions.cars.view_assigned"
                  :class="[$style.switchBase, userPermissions.cars.view_assigned ? $style.switchActive : '']"
                  @update:model-value="() => {}"
                >
                  <span :class="[$style.switchThumb, userPermissions.cars.view_assigned ? $style.switchThumbActive : '']" />
                </Switch>
                <span :class="$style.switchLabel">{{ t('user.detail.permissions_cars_view_assigned') }}</span>
              </div>
              <div :class="$style.switchRow">
                <Switch
                  :model-value="userPermissions.cars.reassign_cars"
                  :class="[$style.switchBase, userPermissions.cars.reassign_cars ? $style.switchActive : '']"
                  @update:model-value="() => {}"
                >
                  <span :class="[$style.switchThumb, userPermissions.cars.reassign_cars ? $style.switchThumbActive : '']" />
                </Switch>
                <span :class="$style.switchLabel">{{ t('user.detail.permissions_cars_reassign') }}</span>
              </div>
              <div :class="$style.switchRow">
                <Switch
                  :model-value="userPermissions.cars.confirm_video_diag"
                  :class="[$style.switchBase, userPermissions.cars.confirm_video_diag ? $style.switchActive : '']"
                  @update:model-value="() => {}"
                >
                  <span :class="[$style.switchThumb, userPermissions.cars.confirm_video_diag ? $style.switchThumbActive : '']" />
                </Switch>
                <span :class="$style.switchLabel">{{ t('user.detail.permissions_cars_confirm_video') }}</span>
              </div>
              <div :class="$style.switchRow">
                <Switch
                  :model-value="userPermissions.cars.confirm_booking"
                  :class="[$style.switchBase, userPermissions.cars.confirm_booking ? $style.switchActive : '']"
                  @update:model-value="() => {}"
                >
                  <span :class="[$style.switchThumb, userPermissions.cars.confirm_booking ? $style.switchThumbActive : '']" />
                </Switch>
                <span :class="$style.switchLabel">{{ t('user.detail.permissions_cars_confirm_booking') }}</span>
              </div>
              <div :class="$style.switchRow">
                <Switch
                  :model-value="userPermissions.cars.view_events"
                  :class="[$style.switchBase, userPermissions.cars.view_events ? $style.switchActive : '']"
                  @update:model-value="() => {}"
                >
                  <span :class="[$style.switchThumb, userPermissions.cars.view_events ? $style.switchThumbActive : '']" />
                </Switch>
                <span :class="$style.switchLabel">{{ t('user.detail.permissions_cars_view_events') }}</span>
              </div>
            </div>
          </div>

          <div :class="$style.permissionGroup">
            <h3 :class="$style.permissionGroupTitle">
              {{ t('user.detail.permissions_orders_title') }}
            </h3>
            <div :class="$style.permissionList">
              <div :class="$style.switchRow">
                <Switch
                  :model-value="userPermissions.orders.view_list"
                  :class="[$style.switchBase, userPermissions.orders.view_list ? $style.switchActive : '']"
                  @update:model-value="() => {}"
                >
                  <span :class="[$style.switchThumb, userPermissions.orders.view_list ? $style.switchThumbActive : '']" />
                </Switch>
                <span :class="$style.switchLabel">{{ t('user.detail.permissions_orders_view_list') }}</span>
              </div>
              <div :class="$style.switchRow">
                <Switch
                  :model-value="userPermissions.orders.take_work"
                  :class="[$style.switchBase, userPermissions.orders.take_work ? $style.switchActive : '']"
                  @update:model-value="() => {}"
                >
                  <span :class="[$style.switchThumb, userPermissions.orders.take_work ? $style.switchThumbActive : '']" />
                </Switch>
                <span :class="$style.switchLabel">{{ t('user.detail.permissions_orders_take_work') }}</span>
              </div>
              <div :class="$style.switchRow">
                <Switch
                  :model-value="userPermissions.orders.change_status"
                  :class="[$style.switchBase, userPermissions.orders.change_status ? $style.switchActive : '']"
                  @update:model-value="() => {}"
                >
                  <span :class="[$style.switchThumb, userPermissions.orders.change_status ? $style.switchThumbActive : '']" />
                </Switch>
                <span :class="$style.switchLabel">{{ t('user.detail.permissions_orders_change_status') }}</span>
              </div>
              <div :class="$style.switchRow">
                <Switch
                  :model-value="userPermissions.orders.add_cars"
                  :class="[$style.switchBase, userPermissions.orders.add_cars ? $style.switchActive : '']"
                  @update:model-value="() => {}"
                >
                  <span :class="[$style.switchThumb, userPermissions.orders.add_cars ? $style.switchThumbActive : '']" />
                </Switch>
                <span :class="$style.switchLabel">{{ t('user.detail.permissions_orders_add_cars') }}</span>
              </div>
              <div :class="$style.switchRow">
                <Switch
                  :model-value="userPermissions.orders.finish_selection"
                  :class="[$style.switchBase, userPermissions.orders.finish_selection ? $style.switchActive : '']"
                  @update:model-value="() => {}"
                >
                  <span :class="[$style.switchThumb, userPermissions.orders.finish_selection ? $style.switchThumbActive : '']" />
                </Switch>
                <span :class="$style.switchLabel">{{ t('user.detail.permissions_orders_finish_selection') }}</span>
              </div>
            </div>
          </div>

          <div :class="$style.permissionGroup">
            <h3 :class="$style.permissionGroupTitle">
              {{ t('user.detail.permissions_chats_title') }}
            </h3>
            <div :class="$style.permissionList">
              <div :class="$style.switchRow">
                <Switch
                  :model-value="userPermissions.chats.view_chats"
                  :class="[$style.switchBase, userPermissions.chats.view_chats ? $style.switchActive : '']"
                  @update:model-value="() => {}"
                >
                  <span :class="[$style.switchThumb, userPermissions.chats.view_chats ? $style.switchThumbActive : '']" />
                </Switch>
                <span :class="$style.switchLabel">{{ t('user.detail.permissions_chats_view_chats') }}</span>
              </div>
              <div :class="$style.switchRow">
                <Switch
                  :model-value="userPermissions.chats.manage_roles"
                  :class="[$style.switchBase, userPermissions.chats.manage_roles ? $style.switchActive : '']"
                  @update:model-value="() => {}"
                >
                  <span :class="[$style.switchThumb, userPermissions.chats.manage_roles ? $style.switchThumbActive : '']" />
                </Switch>
                <span :class="$style.switchLabel">{{ t('user.detail.permissions_chats_manage_roles') }}</span>
              </div>
              <div :class="$style.switchRow">
                <Switch
                  :model-value="userPermissions.chats.tracking_view"
                  :class="[$style.switchBase, userPermissions.chats.tracking_view ? $style.switchActive : '']"
                  @update:model-value="() => {}"
                >
                  <span :class="[$style.switchThumb, userPermissions.chats.tracking_view ? $style.switchThumbActive : '']" />
                </Switch>
                <span :class="$style.switchLabel">{{ t('user.detail.permissions_chats_tracking_view') }}</span>
              </div>
              <div :class="$style.switchRow">
                <Switch
                  :model-value="userPermissions.chats.tracking_full"
                  :class="[$style.switchBase, userPermissions.chats.tracking_full ? $style.switchActive : '']"
                  @update:model-value="() => {}"
                >
                  <span :class="[$style.switchThumb, userPermissions.chats.tracking_full ? $style.switchThumbActive : '']" />
                </Switch>
                <span :class="$style.switchLabel">{{ t('user.detail.permissions_chats_tracking_full') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useRouter } from "vue-router"
import { Switch } from "@headlessui/vue"
import type { Alert } from "@/types/common/alert"
import { AlertTypeEnum } from "@/types/common/alert"
import useUser from "@/composables/useUser"
import { useApiClient } from "@/composables/api/useApiClient"
import { useApiUser } from "@/composables/api/useApiUser"
import type { Client } from "@/types/responses/client"
import SearchableSelect from "@/components/form/SearchableSelect.vue"
import type { OptionBase } from "@/types/form/optionType"
import { AdminCompanyId } from "@/constants/options"
import { russian, chinese } from "@/constants/lang"
import {
  RoleAdmin,
  RoleCompany,
  RoleDirector,
  RoleEmployee,
  RoleLogistic,
  RoleSellerContent,
  RoleSellerSearch,
  RoleSellerClient,
} from "@/constants/roles"

definePageMeta({
  layout: "personal",
  auth: true,
  roles: [RoleAdmin],
  hideTitle: true,
})

const route = useRoute()
const id = Number(route.params.id as string)
const isNew = id <= 0
const clientIdFromRoute = route.query.client_id ? Number(route.query.client_id) : null
const { t } = useI18n()
const router = useRouter()

const {
  isLoading,
  errors,
  userPasswordUpdate,
  userUpdate,
  update,
  updatePassword,
  store,
} = useUser()

const alert = ref<Alert | null>(null)
const passwordAlert = ref<Alert | null>(null)

const clients = ref<Client[]>([])
const { index: fetchClients } = useApiClient()
const searchCompanyQuery = ref("")

const companyOptions = computed(() =>
  clients.value.map(client => ({
    id: client.id,
    name: client.name,
    value: client.id,
    label: client.name,
    disabled: false,
  })),
)

const userPermissions = computed(() => {
  const role = userUpdate.value.role

  return {
    cars: {
      view_assigned: [RoleAdmin, RoleSellerClient].includes(role),
      reassign_cars: [RoleAdmin].includes(role),
      confirm_video_diag: [RoleAdmin, RoleSellerClient].includes(role),
      confirm_booking: [RoleAdmin, RoleSellerClient].includes(role),
      view_events: [RoleAdmin, RoleSellerClient].includes(role),
    },
    orders: {
      view_list: [RoleAdmin, RoleSellerSearch, RoleSellerClient].includes(role),
      take_work: [RoleAdmin, RoleSellerSearch, RoleSellerClient].includes(role),
      change_status: [RoleAdmin].includes(role),
      add_cars: [RoleAdmin, RoleSellerSearch, RoleSellerClient].includes(role),
      finish_selection: [RoleAdmin, RoleSellerSearch, RoleSellerClient].includes(role),
    },
    chats: {
      view_chats: [RoleAdmin, RoleSellerClient, RoleLogistic].includes(role),
      manage_roles: [RoleAdmin].includes(role),
      tracking_view: [RoleAdmin, RoleSellerClient].includes(role),
      tracking_full: [RoleAdmin, RoleLogistic].includes(role),
    },
  }
})

const roleOptions = computed(() => {
  if (userUpdate.value.client_id === AdminCompanyId) {
    return [
      { id: 4, name: t("roles.admin"), value: RoleAdmin, label: t("roles.admin"), disabled: false },
      { id: 6, name: t("roles.logistic"), value: RoleLogistic, label: t("roles.logistic"), disabled: false },
      { id: 7, name: t("roles.seller_content"), value: RoleSellerContent, label: t("roles.seller_content"), disabled: false },
      { id: 8, name: t("roles.seller_search"), value: RoleSellerSearch, label: t("roles.seller_search"), disabled: false },
      { id: 9, name: t("roles.seller_client"), value: RoleSellerClient, label: t("roles.seller_client"), disabled: false },
    ]
  }
  return [
    { id: 1, name: t("roles.director"), value: RoleDirector, label: t("roles.director"), disabled: false },
    { id: 2, name: t("roles.employee"), value: RoleEmployee, label: t("roles.employee"), disabled: false },
    { id: 3, name: t("roles.company"), value: RoleCompany, label: t("roles.company"), disabled: false },
  ]
})

const languageOptions = computed(() => [
  { id: 1, name: t("common.languages.ru"), value: russian, label: t("common.languages.ru"), disabled: false },
  { id: 2, name: t("common.languages.zh"), value: chinese, label: t("common.languages.zh"), disabled: false },
])

const selectedCompany = computed<OptionBase | undefined>({
  get() {
    return companyOptions.value.find(opt => opt.value === userUpdate.value.client_id)
  },
  set(option) {
    userUpdate.value.client_id = option && typeof option.value === "number" ? option.value : null
  },
})

function onCompanyChange(option: OptionBase | undefined) {
  userUpdate.value.client_id = option && typeof option.value === "number" ? option.value : null
}

const fetchClientsWithSearch = async (query: string) => {
  const params = query ? { name: query } : {}
  const res = await fetchClients(params)
  if (Array.isArray(res?.data)) {
    clients.value = res.data
  }
  else if (res?.data && Array.isArray((res.data as any).data)) {
    clients.value = (res.data as any).data
  }
}

const debouncedFetchClients = useDebounceFn((query: string) => {
  fetchClientsWithSearch(query)
}, 400)

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
      await router.replace({ name: "admin-clients-users-id", params: { id: newId } })
    }
  }
}

const onChangePassword = async () => {
  await updatePassword(id, userPasswordUpdate.value)
  if (!errors.value.any()) {
    passwordAlert.value = {
      type: AlertTypeEnum.Success,
      subtitle: t("notification.user.updated_password"),
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
      userUpdate.value.role = res.data.role
      userUpdate.value.client_id = res.data.client_id ?? null
      userUpdate.value.preferred_lang = res.data.preferred_lang ?? russian
    }
  }
  else {
    if (userUpdate.value.client_id == null) {
      userUpdate.value.client_id = clientIdFromRoute ?? 0
    }
    if (!userUpdate.value.preferred_lang) {
      userUpdate.value.preferred_lang = russian
    }
  }
  await fetchClientsWithSearch("")
})

watch(searchCompanyQuery, (val) => {
  debouncedFetchClients(val)
})
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
  @apply text-sm font-medium text-gray-700 mb-2;
}

.passwordHint {
  @apply text-xs text-gray-500 mb-4;
}

.permissionsWrapper {
  @apply flex flex-col gap-6;
}

.permissionGroup {
  @apply flex flex-col gap-3;
}

.permissionGroupTitle {
  @apply text-sm font-semibold text-black;
}

.permissionList {
  @apply flex flex-col gap-3;
}

.switchRow {
  @apply flex items-center gap-3;
}

.switchLabel {
  @apply text-sm text-gray-700 cursor-default select-none;
}

.switchBase {
  @apply relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-white border border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 cursor-default;
}

.switchActive {
  @apply bg-blue border-blue;
}

.switchThumb {
  @apply inline-block h-4 w-4 transform rounded-full bg-gray-400 transition pointer-events-none;
  transform: translateX(2px);
}

.switchThumbActive {
  @apply bg-white translate-x-6;
}
</style>
