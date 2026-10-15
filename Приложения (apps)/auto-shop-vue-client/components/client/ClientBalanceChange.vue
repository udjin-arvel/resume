<template>
  <div class="mx-auto">
    <div :class="$style.header">
      <h1 :class="$style.title">
        {{ accountType === 'deposit' ? t('balance.change.title_deposit') : t('balance.change.title_balance') }}: {{ formatBalance(currentAmount) }} ¥
      </h1>
      <p
        v-if="clientComposable.client.value"
        :class="$style.subtitle"
      >
        {{ clientComposable.client.value.name }}
      </p>
    </div>

    <div :class="$style.content">
      <div :class="$style.formContainer">
        <TabGroup
          :selected-index="selectedTab"
          as="div"
          @change="onTabChange"
        >
          <TabList :class="$style.tabList">
            <Tab :class="$style.tabLeft">
              {{ t('balance.change.tab_top_up') }}
            </Tab>
            <Tab :class="$style.tabMiddle">
              {{ t('balance.change.tab_decrease') }}
            </Tab>
            <Tab :class="$style.tabRight">
              {{ t('balance.change.tab_change') }}
            </Tab>
          </TabList>
          <TabPanels :class="$style.tabPanels">
            <TabPanel>
              <div :class="$style.formGrid">
                <div :class="$style.formRow">
                  <div :class="accountType === 'deposit' ? $style.formFullWidth : $style.formHalf">
                    <InputNumber
                      v-model="topUpAmount"
                      :label="accountType === 'deposit' ? t('balance.change.top_up_deposit_amount_label') : t('balance.change.top_up_amount_label')"
                      :placeholder="t('balance.change.top_up_amount_placeholder')"
                      :min="0"
                      :step="0.01"
                      :precision="2"
                      :invalid-message="balance.errors.value.get('amount')"
                      @update:model-value="balance.errors.value.clear('amount')"
                    />
                  </div>
                  <div
                    v-if="accountType !== 'deposit'"
                    :class="$style.formHalf"
                  >
                    <Select
                      :model-value="topUpReason"
                      :options="reasonOptions"
                      :label="t('balance.history.filter_reason')"
                      :invalid-message="balance.errors.value.get('reason')"
                      @update:model-value="(val: string) => { topUpReason = val; balance.errors.value.clear('reason') }"
                    />
                  </div>
                </div>
                <div :class="$style.formFullWidth">
                  <Textarea
                    v-model="topUpComment"
                    :label="t('balance.change.comment_label')"
                    :placeholder="t('balance.change.comment_placeholder')"
                    :rows="4"
                    :invalid-message="balance.errors.value.get('comment')"
                    @update:model-value="balance.errors.value.clear('comment')"
                  />
                </div>
                <div :class="$style.formFullWidth">
                  <InputFile
                    v-model:files="topUpFiles"
                    :type="InputsTypeEnum.File"
                    :max-files="1"
                    :multiple="false"
                    :button-text="t('balance.change.add_file_button')"
                    :restrictions-text="t('balance.change.file_restrictions')"
                    :disabled="balance.isLoading.value || balance.isUploading.value"
                    :loading="balance.isUploading.value"
                    :status-message="topUpStatusMessage || undefined"
                    :auto-dismiss-ms="3000"
                    mode="doc"
                    :invalid-message="balance.errors.value.get('file')"
                    @input="handleTopUpFileInput"
                    @delete="handleDeleteFile"
                    @update:files="balance.errors.value.clear('file')"
                  />
                </div>
                <div :class="$style.buttonContainer">
                  <Button
                    kind="black"
                    size="base"
                    :disabled="balance.isLoading.value || balance.isUploading.value"
                    @click="handleTopUp"
                  >
                    {{ t('balance.change.save_button') }}
                  </Button>
                  <div :class="$style.newBalanceContainer">
                    <span :class="$style.newBalanceLabel">
                      {{ t('balance.change.new_balance') }}:
                    </span>
                    <span :class="$style.newBalanceValue">
                      {{ formatBalance(newBalanceTopUp) }} ¥
                    </span>
                  </div>
                </div>
              </div>
            </TabPanel>

            <TabPanel>
              <div :class="$style.formGrid">
                <div :class="$style.formRow">
                  <div :class="accountType === 'deposit' ? $style.formFullWidth : $style.formHalf">
                    <InputNumber
                      v-model="decreaseAmount"
                      :label="accountType === 'deposit' ? t('balance.change.decrease_deposit_amount_label') : t('balance.change.decrease_amount_label')"
                      :placeholder="t('balance.change.decrease_amount_placeholder')"
                      :min="0"
                      :step="0.01"
                      :precision="2"
                      :invalid-message="balance.errors.value.get('amount')"
                      @update:model-value="balance.errors.value.clear('amount')"
                    />
                  </div>
                  <div
                    v-if="accountType !== 'deposit'"
                    :class="$style.formHalf"
                  >
                    <Select
                      :model-value="decreaseReason"
                      :options="reasonOptions"
                      :label="t('balance.history.filter_reason')"
                      :invalid-message="balance.errors.value.get('reason')"
                      @update:model-value="(val: string) => { decreaseReason = val; balance.errors.value.clear('reason') }"
                    />
                  </div>
                </div>
                <div :class="$style.formFullWidth">
                  <Textarea
                    v-model="decreaseComment"
                    :label="t('balance.change.comment_label')"
                    :placeholder="t('balance.change.comment_placeholder')"
                    :rows="4"
                    :invalid-message="balance.errors.value.get('comment')"
                    @update:model-value="balance.errors.value.clear('comment')"
                  />
                </div>
                <div :class="$style.formFullWidth">
                  <InputFile
                    v-model:files="decreaseFiles"
                    :type="InputsTypeEnum.File"
                    :max-files="1"
                    :multiple="false"
                    mode="doc"
                    :button-text="t('balance.change.add_file_button')"
                    :restrictions-text="t('balance.change.file_restrictions')"
                    :disabled="balance.isLoading.value || balance.isUploading.value"
                    :loading="balance.isUploading.value"
                    :status-message="decreaseStatusMessage || undefined"
                    :auto-dismiss-ms="3000"
                    :invalid-message="balance.errors.value.get('file')"
                    @input="handleDecreaseFileInput"
                    @delete="handleDeleteDecreaseFile"
                    @update:files="balance.errors.value.clear('file')"
                  />
                </div>
                <div :class="$style.buttonContainer">
                  <Button
                    kind="black"
                    size="base"
                    :disabled="balance.isLoading.value || balance.isUploading.value"
                    @click="handleDecrease"
                  >
                    {{ t('balance.change.save_button') }}
                  </Button>
                  <div :class="$style.newBalanceContainer">
                    <span :class="$style.newBalanceLabel">
                      {{ t('balance.change.new_balance') }}:
                    </span>
                    <span :class="$style.newBalanceValue">
                      {{ formatBalance(newBalanceDecrease) }} ¥
                    </span>
                  </div>
                </div>
              </div>
            </TabPanel>

            <TabPanel>
              <div :class="$style.formGrid">
                <div :class="$style.formRow">
                  <div :class="accountType === 'deposit' ? $style.formFullWidth : $style.formHalf">
                    <InputNumber
                      v-model="changeAmount"
                      :label="accountType === 'deposit' ? t('balance.change.change_deposit_amount_label') : t('balance.change.change_amount_label')"
                      :placeholder="t('balance.change.change_amount_placeholder')"
                      :min="0"
                      :step="0.01"
                      :precision="2"
                      :invalid-message="balance.errors.value.get('amount')"
                      @update:model-value="balance.errors.value.clear('amount')"
                    />
                  </div>
                  <div
                    v-if="accountType !== 'deposit'"
                    :class="$style.formHalf"
                  >
                    <Select
                      :model-value="changeReason"
                      :options="reasonOptions"
                      :label="t('balance.history.filter_reason')"
                      :invalid-message="balance.errors.value.get('reason')"
                      @update:model-value="(val: string) => { changeReason = val; balance.errors.value.clear('reason') }"
                    />
                  </div>
                </div>
                <div :class="$style.formFullWidth">
                  <Textarea
                    v-model="changeComment"
                    :label="t('balance.change.comment_label')"
                    :placeholder="t('balance.change.comment_placeholder')"
                    :rows="4"
                    :invalid-message="balance.errors.value.get('comment')"
                    @update:model-value="balance.errors.value.clear('comment')"
                  />
                </div>
                <div :class="$style.formFullWidth">
                  <InputFile
                    v-model:files="changeFiles"
                    :type="InputsTypeEnum.File"
                    :max-files="1"
                    :multiple="false"
                    mode="doc"
                    :button-text="t('balance.change.add_file_button')"
                    :restrictions-text="t('balance.change.file_restrictions')"
                    :disabled="balance.isLoading.value || balance.isUploading.value"
                    :loading="balance.isUploading.value"
                    :status-message="changeStatusMessage || undefined"
                    :auto-dismiss-ms="3000"
                    :invalid-message="balance.errors.value.get('file')"
                    @input="handleChangeFileInput"
                    @delete="handleDeleteChangeFile"
                    @update:files="balance.errors.value.clear('file')"
                  />
                </div>
                <div :class="$style.buttonContainer">
                  <Button
                    kind="black"
                    size="base"
                    :disabled="balance.isLoading.value || balance.isUploading.value"
                    @click="handleChange"
                  >
                    {{ t('balance.change.save_button') }}
                  </Button>
                  <div :class="$style.newBalanceContainer">
                    <span :class="$style.newBalanceLabel">
                      {{ t('balance.change.new_balance') }}:
                    </span>
                    <span :class="$style.newBalanceValue">
                      {{ formatBalance(newBalanceChange) }} ¥
                    </span>
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@headlessui/vue"
import { useI18n } from "vue-i18n"
import InputNumber from "~/components/form/InputNumber.vue"
import Textarea from "~/components/form/Textarea.vue"
import Select from "~/components/form/Select.vue"
import Button from "~/components/common/Button.vue"
import { useClientBalance } from "~/composables/useClientBalance"
import useClient from "~/composables/useClient"
import InputFile from "~/components/form/InputFile.vue"
import { InputsTypeEnum } from "~/types/form/inputsTypeEnum"
import type { FileResponse } from "~/types/form/file"
import type { SimpleFile } from "~/types/common/file"
import { BalanceReasonOrder, balanceReasonLabelKey } from "~/constants/balance"
import { useRouter } from "#vue-router"

const props = defineProps<{
  clientId: number
  accountType: "balance" | "deposit"
}>()

const { t } = useI18n()
const router = useRouter()

const balance = useClientBalance(props.clientId)
const clientComposable = useClient()

const selectedTab = ref(0)

const topUpAmount = ref<number | null>(null)
const topUpReason = ref("")
const topUpComment = ref("")
const topUpFiles = ref<FileResponse[]>([])

const decreaseAmount = ref<number | null>(null)
const decreaseReason = ref("")
const decreaseComment = ref("")
const decreaseFiles = ref<FileResponse[]>([])

const changeAmount = ref<number | null>(null)
const changeReason = ref("")
const changeComment = ref("")
const changeFiles = ref<FileResponse[]>([])

const topUpStatusMessage = ref<string | null>(null)
const decreaseStatusMessage = ref<string | null>(null)
const changeStatusMessage = ref<string | null>(null)

const currentAmount = computed(() => {
  if (!clientComposable.client.value) {
    return 0
  }
  return props.accountType === "deposit"
    ? Number(clientComposable.client.value.deposit || 0)
    : Number(clientComposable.client.value.balance || 0)
})

const newBalanceTopUp = computed(() => {
  if (topUpAmount.value === null || topUpAmount.value === undefined) {
    return currentAmount.value
  }
  return currentAmount.value + Number(topUpAmount.value)
})

const newBalanceDecrease = computed(() => {
  if (decreaseAmount.value === null || decreaseAmount.value === undefined) {
    return currentAmount.value
  }
  return currentAmount.value - Number(decreaseAmount.value)
})

const newBalanceChange = computed(() => {
  if (changeAmount.value === null || changeAmount.value === undefined) {
    return currentAmount.value
  }
  return Number(changeAmount.value)
})

const reasonOptions = BalanceReasonOrder.map((reason, index) => ({
  id: index,
  value: reason,
  name: t(balanceReasonLabelKey(reason)),
  disabled: false,
}))

function toFileResponse(f: SimpleFile): FileResponse {
  return {
    id: f.id,
    name: f.name,
    url: f.url,
    mime_type: f.mimeType,
    size: f.size,
  } as FileResponse
}

function onTabChange(tabIndex: number) {
  selectedTab.value = tabIndex
  balance.errors.value.clear()
}

async function handleTopUpFileInput(files: FileList | null) {
  if (!files?.length) {
    return
  }
  topUpStatusMessage.value = null
  const file = files[0]
  const uploaded = await balance.uploadFile(file)
  if (uploaded) {
    topUpFiles.value = [toFileResponse(uploaded)]
    balance.errors.value.clear("file")
    topUpStatusMessage.value = t("files.upload_success")
  }
}

function handleDeleteFile(fileId: number) {
  topUpFiles.value = topUpFiles.value.filter(f => f.id !== fileId)
  balance.clearUploadedFile()
  balance.errors.value.clear("file")
  topUpStatusMessage.value = null
}

async function handleDecreaseFileInput(files: FileList | null) {
  if (!files?.length) {
    return
  }
  decreaseStatusMessage.value = null
  const file = files[0]
  const uploaded = await balance.uploadFile(file)
  if (uploaded) {
    decreaseFiles.value = [toFileResponse(uploaded)]
    balance.errors.value.clear("file")
    decreaseStatusMessage.value = t("files.upload_success")
  }
}

function handleDeleteDecreaseFile(fileId: number) {
  decreaseFiles.value = decreaseFiles.value.filter(f => f.id !== fileId)
  balance.clearUploadedFile()
  balance.errors.value.clear("file")
  decreaseStatusMessage.value = null
}

async function handleChangeFileInput(files: FileList | null) {
  if (!files?.length) {
    return
  }
  changeStatusMessage.value = null
  const file = files[0]
  const uploaded = await balance.uploadFile(file)
  if (uploaded) {
    changeFiles.value = [toFileResponse(uploaded)]
    balance.errors.value.clear("file")
    changeStatusMessage.value = t("files.upload_success")
  }
}

function handleDeleteChangeFile(fileId: number) {
  changeFiles.value = changeFiles.value.filter(f => f.id !== fileId)
  balance.clearUploadedFile()
  balance.errors.value.clear()
  changeStatusMessage.value = null
}

async function handleTopUp() {
  if (!topUpAmount.value) {
    return
  }

  const payload: any = {
    accountType: props.accountType,
    amount: topUpAmount.value,
    type: "increase",
    comment: topUpComment.value || undefined,
    fileId: topUpFiles.value[0]?.id,
  }

  if (props.accountType !== "deposit") {
    payload.reason = topUpReason.value !== "" ? topUpReason.value : null
  }

  const id = await balance.adjustBalance(payload)
  if (id) {
    await redirectToHistory()
  }
}

async function handleDecrease() {
  if (!decreaseAmount.value) {
    return
  }

  const payload: any = {
    accountType: props.accountType,
    amount: decreaseAmount.value,
    type: "decrease",
    comment: decreaseComment.value || undefined,
    fileId: decreaseFiles.value[0]?.id,
  }

  if (props.accountType !== "deposit") {
    payload.reason = decreaseReason.value !== "" ? decreaseReason.value : null
  }

  const id = await balance.adjustBalance(payload)
  if (id) {
    await redirectToHistory()
  }
}

async function handleChange() {
  if (!changeAmount.value) {
    return
  }

  const payload: any = {
    accountType: props.accountType,
    amount: changeAmount.value,
    type: "change",
    comment: changeComment.value || undefined,
    fileId: changeFiles.value[0]?.id,
  }

  if (props.accountType !== "deposit") {
    payload.reason = changeReason.value !== "" ? changeReason.value : null
  }

  const id = await balance.adjustBalance(payload)
  if (id) {
    await redirectToHistory()
  }
}

async function redirectToHistory() {
  const routeName = props.accountType === "deposit"
    ? "admin-clients-balances-id-deposits"
    : "admin-clients-balances-id-main"
  await router.push({ name: routeName, params: { id: props.clientId } })
}

function formatBalance(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

onMounted(async () => {
  await clientComposable.show(props.clientId)
})
</script>

<style module>
.header {
  @apply mb-6;
}
.title {
  @apply text-3xl font-bold mb-2;
}
.subtitle {
  @apply text-gray-600 text-lg;
}
.content {
  @apply flex h-full;
}
.formContainer {
  @apply w-1/2 p-6 border border-gray-300 rounded-lg;
}
.formGrid {
  @apply flex flex-col gap-6;
}
.formRow {
  @apply flex gap-6;
}
.formHalf {
  @apply flex-1;
}
.formFullWidth {
  @apply w-full;
}
.buttonContainer {
  @apply flex items-center justify-start gap-6 mt-2;
}
.newBalanceContainer {
  @apply flex items-center;
}
.newBalanceLabel {
  @apply text-base font-medium text-gray-700 inline-block mr-2;
}
.newBalanceValue {
  @apply text-base font-semibold text-gray-700 inline-block;
}
.tabList {
  @apply flex mt-[-16px] mb-8 w-full;
}
.tabLeft {
  @apply flex-1 px-4 py-1.5 focus:outline-none rounded-tl transition-colors duration-150 border-b text-center cursor-pointer;
}
.tabMiddle {
  @apply flex-1 px-4 py-1.5 focus:outline-none transition-colors duration-150 border-b text-center cursor-pointer;
}
.tabRight {
  @apply flex-1 px-4 py-1.5 focus:outline-none rounded-tr transition-colors duration-150 border-b text-center cursor-pointer;
}
.tabLeft[data-headlessui-state~='selected'],
.tabMiddle[data-headlessui-state~='selected'],
.tabRight[data-headlessui-state~='selected'] {
  @apply font-bold border-b-2 border-b-black;
}
.tabLeft[data-headlessui-state~='unselected'],
.tabMiddle[data-headlessui-state~='unselected'],
.tabRight[data-headlessui-state~='unselected'] {
  @apply border-b border-b-gray-300 text-gray-600;
}
.tabPanels {
  @apply mt-4;
}

@media (max-width: 1024px) {
  .formContainer {
    @apply w-full p-4;
  }
  .formRow {
    @apply flex-col gap-4;
  }
  .tabList {
    @apply mb-6;
  }
  .title {
    @apply text-2xl;
  }
  .subtitle {
    @apply text-base;
  }
}

@media (max-width: 768px) {
  .formContainer {
    @apply p-3;
  }
  .title {
    @apply text-xl;
  }
  .header {
    @apply mb-4;
  }
  .buttonContainer {
    @apply flex-col items-start gap-4;
  }
}

@media (max-width: 480px) {
  .tabLeft,
  .tabMiddle,
  .tabRight {
    @apply px-3 py-1 text-sm;
  }
  .formContainer {
    @apply p-2;
  }
}
</style>
