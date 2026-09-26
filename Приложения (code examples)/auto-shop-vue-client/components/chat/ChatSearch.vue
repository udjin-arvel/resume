<template>
  <div :class="$style.wrapper">
    <div :class="$style.inputWrapper">
      <Input
        v-model="search"
        :placeholder="t('chat.search_in_chats')"
        :class="$style.input"
      >
        <template #input-icon>
          <MagnifyingGlassIcon :class="$style.searchIcon" />
        </template>
      </Input>
    </div>

    <Popover class="relative">
      <PopoverButton
        as="template"
        @click="loadFilterOptions"
      >
        <Button
          kind="transparent"
          size="sm"
        >
          <FunnelIcon :class="$style.filterIcon" />
          <div
            v-if="listingId"
            class="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"
          />
        </Button>
      </PopoverButton>

      <transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
      >
        <PopoverPanel :class="$style.popoverPanel">
          <Form :class="$style.compactForm">
            <Select
              v-if="isAdmin"
              v-model="chatType"
              :options="chatOptions"
              :disabled="isLoading"
            />
            <Select
              v-if="isAdmin"
              v-model="questionType"
              :options="questionOptions"
              :disabled="isLoading"
            />

            <SearchableSelect
              v-if="isAdmin"
              :key="sellerKey"
              v-model="seller"
              :label="t('chat.seller')"
              :options="[{ id: 1, name: t('chat.all'), value: '', disabled: false }, ...sellerOptions]"
              :disabled="isLoading"
            />

            <SearchableSelect
              v-if="!isBuyer"
              :key="buyerKey"
              v-model="buyer"
              :label="t('chat.buyer_company')"
              :options="[{ id: 1, name: t('chat.all'), value: '', disabled: false }, ...buyerOptions]"
              :disabled="isLoading"
            />

            <SearchableSelect
              v-if="isAdmin"
              :key="userKey"
              v-model="user"
              :label="t('chat.buyer_user')"
              :options="[{ id: 1, name: t('chat.all'), value: '', disabled: false }, ...userOptions]"
              :disabled="isLoading"
            />

            <SearchableSelect
              :key="brandKey"
              v-model="brand"
              :label="t('chat.car')"
              :options="[{ id: 1, name: t('chat.all'), value: '', disabled: false }, ...brandOptions]"
              :disabled="isLoading"
            />

            <SearchableSelect
              :key="modelKey"
              v-model="model"
              :label="t('chat.model')"
              :options="[{ id: 1, name: t('chat.all'), value: '', disabled: false }, ...modelOptions]"
              :disabled="isLoading"
            />

            <Input
              v-model="vin"
              :disabled="isLoading"
              :placeholder="t('chat.vin')"
            />
            <Input
              v-model="siteNumber"
              :disabled="isLoading"
              :placeholder="t('chat.site_car_number')"
            />
            <Input
              v-if="listingId"
              :model-value="t('chat.listing_number', { id: listingId })"
              disabled
            />
            <Button
              kind="black"
              :disabled="isLoading"
              :class="$style.fullWidthBtn"
              @click.prevent="triggerApply"
            >
              {{ t('chat.apply') }}
            </Button>
            <Button
              kind="unset"
              :disabled="isLoading"
              :class="$style.fullWidthBtn"
              @click.prevent="resetFilters"
            >
              {{ t('chat.reset_filter_with_icon') }}
            </Button>
          </Form>
        </PopoverPanel>
      </transition>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/vue/24/outline"
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/vue"
import { useDebounceFn } from "@vueuse/core"
import Input from "~/components/form/Input.vue"
import Select from "~/components/form/Select.vue"
import SearchableSelect from "~/components/form/SearchableSelect.vue"
import Button from "~/components/common/Button.vue"
import Form from "~/components/form/Form.vue"
import type { OptionBase } from "~/types/form/optionType"
import { useApiChat } from "~/composables/api/useApiChat"
import { useLoadingIndicator } from "#imports"
import { useChatStore } from "~/stores/chat"
import { useUserStore } from "~/stores/user"

const { start, finish, isLoading } = useLoadingIndicator()
const isLoaded = ref(false)
const { t } = useI18n()
const { filterOptions } = useApiChat()
const chatStore = useChatStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const isBuyer = computed(() => userStore.isBuyer)
const isAdmin = computed(() => userStore.isAdmin)

const search = ref("")
const chatType = ref<string | number>("")
const questionType = ref<string | number>("")
const seller = ref<OptionBase | undefined>()
const buyer = ref<OptionBase | undefined>()
const user = ref<OptionBase | undefined>()
const brand = ref<OptionBase | undefined>()
const model = ref<OptionBase | undefined>()
const vin = ref("")
const siteNumber = ref("")

const listingId = ref(route.query.listingId ? String(route.query.listingId) : "")

const sellerKey = ref(0)
const buyerKey = ref(0)
const userKey = ref(0)
const brandKey = ref(0)
const modelKey = ref(0)

const chatOptions: OptionBase[] = [
  { id: 1, name: t("chat.all_chats"), value: "", disabled: false },
  { id: 2, name: t("chat.with_buyer"), value: "buyer", disabled: false },
  { id: 3, name: t("chat.with_seller"), value: "seller", disabled: false },
]

const questionOptions: OptionBase[] = [
  { id: 1, name: t("chat.all_questions"), value: "", disabled: false },
  { id: 2, name: t("chat.common_questions"), value: "common", disabled: false },
  { id: 3, name: t("chat.by_brands"), value: "auto", disabled: false },
]

const sellerOptions = ref<OptionBase[]>([])
const buyerOptions = ref<OptionBase[]>([])
const userOptions = ref<OptionBase[]>([])
const brandOptions = ref<OptionBase[]>([])
const modelOptions = ref<OptionBase[]>([])

const loadFilterOptions = async () => {
  if (isLoaded.value || isLoading.value) {
    return
  }
  start()
  try {
    const response = await filterOptions({ camelize: true })
    const filters = response.data
    sellerOptions.value = filters.sellers.map((s: any) => ({ id: s.id, name: s.name, value: s.id, disabled: false }))
    buyerOptions.value = filters.clients.map((c: any) => ({ id: c.id, name: c.name, value: c.id, disabled: false }))
    userOptions.value = (filters.users ?? []).map((u: any) => ({ id: u.id, name: u.name, value: u.id, disabled: false }))
    brandOptions.value = filters.brands.map((b: any) => ({ id: b.id, name: b.name, value: b.id, disabled: false, image: b.image }))
    modelOptions.value = filters.series.map((m: any) => ({ id: m.id, name: m.name, value: m.id, disabled: false }))
    isLoaded.value = true
  }
  finally {
    finish()
  }
}

function normalizeFilterValue<T extends string | number | undefined>(value: T): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined
  }
  return String(value)
}

const applyFilters = async () => {
  const filters = {
    subject: chatStore.filters.subject,
    chatType: normalizeFilterValue(chatType.value),
    questionType: normalizeFilterValue(questionType.value),
    sellerId: normalizeFilterValue(seller.value?.value),
    buyerId: normalizeFilterValue(buyer.value?.value),
    userId: normalizeFilterValue(user.value?.value),
    brandId: normalizeFilterValue(brand.value?.value),
    modelId: normalizeFilterValue(model.value?.value),
    vin: normalizeFilterValue(vin.value),
    siteNumber: normalizeFilterValue(siteNumber.value),
    search: normalizeFilterValue(search.value),
    listingId: normalizeFilterValue(listingId.value),
  }

  chatStore.setFilters(filters)
  chatStore.clearChats()

  const res = await chatStore.fetchChats({ filters })
  if (res?.data) {
    chatStore.setChats(res.data)
  }
}

const triggerApply = () => {
  applyFilters()
}

watch(
  () => route.query.listingId,
  (newId) => {
    listingId.value = newId ? String(newId) : ""
    applyFilters()
  },
  { immediate: true },
)

const debouncedUpdateSearch = useDebounceFn(() => {
  applyFilters()
}, 1000)

watch(search, debouncedUpdateSearch)

const resetFilters = () => {
  chatType.value = ""
  questionType.value = ""
  seller.value = undefined
  buyer.value = undefined
  user.value = undefined
  brand.value = undefined
  model.value = undefined
  vin.value = ""
  siteNumber.value = ""
  search.value = ""

  listingId.value = ""
  if (route.query.listingId) {
    const query = { ...route.query }
    delete query.listingId
    router.replace({ query })
  }

  chatStore.resetFilters()
  sellerKey.value++
  buyerKey.value++
  userKey.value++
  brandKey.value++
  modelKey.value++

  applyFilters()
}
</script>

<style module>
.wrapper { @apply h-16 flex items-center gap-2 px-3 border-b border-gray-200 bg-gray-50 flex-none; }
.inputWrapper { @apply flex-1; }
.input { @apply w-full rounded-full h-10; }
.searchIcon { @apply w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none; }
.filterIcon { @apply w-5 h-5 text-gray-500; }
.popoverPanel { @apply absolute left-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-gray-900/5 p-4 z-50 sm:left-0 sm:w-80; }
.compactForm { @apply space-y-2; }
.fullWidthBtn { @apply w-full; }
@media (max-width: 767px) { .popoverPanel { @apply left-auto right-0 w-[90vw] max-w-[360px] max-h-[80vh] overflow-y-auto; } }
</style>
