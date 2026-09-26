<template>
  <div>
    <div v-if="item">
      <div :class="$style.header">
        <div :class="$style.titleRow">
          <CommonBackButton @click="$router.back()" />

          <h1 :class="$style.title">
            {{ t('car_links.detail.title') }}
          </h1>
        </div>
      </div>

      <div :class="$style.content">
        <div :class="$style.statusRow">
          <div :class="$style.statusLeft">
            <Label
              :kind="getStatusLabelKind(item.status)"
              :text="getStatusName(item.status)"
            />

            <Label
              v-if="item.customerInterest === CustomerInterestEnum.INTERESTED"
              kind="green"
              :text="t('car_links.list.interest_yes')"
            />
            <Label
              v-if="item.customerInterest === CustomerInterestEnum.NOT_INTERESTED"
              kind="red"
              :text="t('car_links.list.interest_no')"
            />
            <Label
              v-if="item.closureOutcome"
              :kind="getOutcomeLabelKind(item.closureOutcome)"
              :text="getOutcomeName(item.closureOutcome)"
            />

            <template v-if="!userStore.isBuyer && canBeClosed && item.status !== CarLinkStatusEnum.ANSWERED">
              <AssigneeSelector
                v-if="userStore.isAdmin"
                :options="employeeOptions"
                :current-assignee="currentAssignee"
                show-dropdown-when-empty
                :show-take-to-work="false"
                :empty-text="t('car_links.detail.assign')"
                @assign="handleAssign"
              />

              <template v-else>
                <AssigneeSelector
                  v-if="!currentAssignee"
                  :options="employeeOptions"
                  :current-assignee="null"
                  :show-dropdown-when-empty="false"
                  @take-to-work="handleTakeToWork"
                />

                <div
                  v-else
                  class="flex items-center gap-2"
                >
                  <span class="text-sm text-gray-500">
                    {{ t('car_links.detail.label_assignee') }}
                  </span>
                  <CommonButton
                    kind="white"
                    size="sm"
                    disabled
                    class="pointer-events-none opacity-70"
                  >
                    {{ currentAssignee.name }}
                  </CommonButton>
                </div>
              </template>
            </template>
          </div>

          <Popover
            v-if="canBeClosed"
            v-slot="{ close }"
            :class="$style.relativeBlock"
          >
            <PopoverButton as="template">
              <CommonButton
                kind="black"
                size="sm"
                :class="$style.button"
              >
                {{ t('car_links.detail.close_task') }}
                <ChevronDownIcon :class="$style.arrowIcon" />
              </CommonButton>
            </PopoverButton>
            <transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1"
            >
              <PopoverPanel :class="$style.chatMenuPanel">
                <div>
                  <button
                    type="button"
                    :class="[$style.menuItem, $style.menuItemDanger]"
                    @click="openCancel(close)"
                  >
                    {{ t('car_links.detail.cancel') }}
                  </button>
                </div>
              </PopoverPanel>
            </transition>
          </Popover>

          <CommonButton
            v-if="canAskQuestion"
            kind="black"
            size="sm"
            :disabled="isLoading"
            @click="handleReopen"
          >
            {{ t('car_links.detail.ask_question') }}
          </CommonButton>
        </div>

        <div :class="$style.detailsCard">
          <div :class="$style.detailRow">
            <span :class="$style.detailLabel">{{ t('car_links.detail.label_created_at') }}</span>
            <span :class="$style.detailValue">{{ formatDateTime(item.createdAt, 'DD.MM.YYYY HH:mm') }}</span>
          </div>

          <div :class="$style.detailRow">
            <span :class="$style.detailLabel">{{ t('car_links.detail.label_condition') }}</span>
            <span :class="$style.detailValue">{{ getConditionName(item.condition) }}</span>
          </div>

          <div :class="$style.detailRow">
            <span :class="$style.detailLabel">{{ t('car_links.detail.label_link') }}</span>
            <a
              :href="item.url"
              target="_blank"
              rel="noopener noreferrer"
              :class="$style.detailLink"
            >
              {{ item.url }}
            </a>
          </div>

          <div :class="$style.detailRow">
            <span :class="$style.detailLabel">{{ t('car_links.detail.label_wishes') }}</span>
            <div :class="[$style.detailValue, 'relative pr-10']">
              <TranslatableWrapper
                v-if="item.wish || item.wishRu || item.wishZh"
                :data="item"
                :config="{
                  keys: {
                    ru: 'wishRu',
                    zh: 'wishZh',
                    original: 'originalLocale',
                  },
                }"
                control-class="absolute top-0 right-0 z-10"
              />
              <template v-else>
                {{ item.wish || '—' }}
              </template>
            </div>
          </div>
        </div>

        <div
          v-if="!userStore.isBuyer"
          :class="$style.noteCard"
        >
          <span :class="$style.blockTitle">{{ t('car_links.detail.internal_note_title') }}</span>
          <FormTextarea
            v-model="internalNote"
            :label="t('car_links.detail.internal_note_label')"
            :placeholder="t('car_links.detail.internal_note_placeholder')"
            :rows="3"
            :disabled="isLoading"
            :invalid-message="errors?.get('internal_note')"
            @input="errors?.clear('internal_note')"
          />
          <span :class="$style.hint">{{ t('car_links.detail.internal_note_hint') }}</span>
          <div :class="$style.noteActions">
            <CommonButton
              kind="white"
              :disabled="isLoading || !isInternalNoteChanged"
              @click="handleSaveInternalNote"
            >
              {{ t('car_links.detail.internal_note_btn') }}
            </CommonButton>
          </div>
        </div>

        <div
          v-if="visibleBlock === 'SELLER_REPLY'"
          :class="$style.replyCard"
        >
          <span :class="$style.blockTitle">{{ t('car_links.detail.seller_reply_title') }}</span>
          <FormTextarea
            v-model="employeeResponse"
            :label="t('car_links.detail.seller_reply_label')"
            :placeholder="t('car_links.detail.seller_reply_placeholder')"
            :rows="4"
            :disabled="isLoading"
            :invalid-message="errors?.get('reply')"
            @input="errors?.clear('reply')"
          />
          <div :class="$style.replyActions">
            <CommonButton
              kind="black"
              :disabled="isLoading || !employeeResponse"
              @click="handleSendResponse"
            >
              {{ t('car_links.detail.seller_reply_btn') }}
            </CommonButton>
          </div>
        </div>

        <div
          v-if="!userStore.isBuyer && canBeClosed"
          :class="[$style.linkInputCard, { [$style.linkInputCardMuted]: !hasManagerReply }]"
        >
          <span :class="$style.blockTitle">{{ t('car_links.detail.seller_catalog_link_title') }}</span>
          <FormInput
            v-model="addedCarLink"
            :label="t('car_links.detail.seller_link_input_label')"
            :placeholder="t('car_links.detail.seller_link_input_placeholder')"
            :disabled="isLoading || !hasManagerReply"
            :invalid-message="errors?.get('listing_url')"
            @input="errors?.clear('listing_url')"
          />
          <span :class="$style.hint">{{ t('car_links.detail.seller_reply_with_car_hint') }}</span>
          <div :class="$style.linkInputActions">
            <CommonButton
              kind="black"
              :disabled="isLoading || !addedCarLink || !hasManagerReply"
              @click="handleSendCarLink"
            >
              {{ t('car_links.detail.seller_link_input_btn') }}
            </CommonButton>
            <CommonButton
              kind="white"
              :class="$style.addCarAction"
              :disabled="!hasManagerReply"
              @click="goToAddCar"
            >
              {{ t('car_links.detail.seller_add_car_link') }}
            </CommonButton>
          </div>
        </div>

        <div
          v-if="managerReplyAction"
          :class="$style.responseCard"
        >
          <div :class="$style.responseHeader">
            <span :class="$style.blockTitle">{{ t('car_links.detail.manager_response_title') }}</span>
            <span :class="$style.responseDate">
              <template v-if="managerReplyAction.type === ActionTypeEnum.AUTO_REPLY">({{ t('car_links.detail.auto_reply') }}) </template>
              {{ formatDateTime(managerReplyAction.createdAt, 'DD.MM.YYYY HH:mm') }}
            </span>
          </div>
          <div :class="[$style.responseText, 'relative pr-10']">
            <TranslatableWrapper
              v-if="managerReplyAction.description || managerReplyAction.descriptionRu || managerReplyAction.descriptionZh"
              :data="managerReplyAction"
              :config="{
                keys: {
                  ru: 'descriptionRu',
                  zh: 'descriptionZh',
                  original: 'originalLocale',
                },
              }"
              control-class="absolute top-0 right-0 z-10"
            />
            <template v-else>
              {{ managerReplyAction.description }}
            </template>
          </div>
        </div>

        <div
          v-if="item && (item.customerInterest === CustomerInterestEnum.INTERESTED || item.customerInterest === CustomerInterestEnum.NOT_INTERESTED)"
          :class="$style.responseCard"
        >
          <div :class="$style.responseHeader">
            <span :class="$style.blockTitle">
              {{ item.customerInterest === CustomerInterestEnum.INTERESTED ? t('car_links.list.interest_yes') : t('car_links.list.interest_no') }}
            </span>
            <span
              v-if="customerDecisionAction"
              :class="$style.responseDate"
            >
              {{ formatDateTime(customerDecisionAction.createdAt, 'DD.MM.YYYY HH:mm') }}
            </span>
          </div>
        </div>

        <div
          v-if="carAddedAction"
          :class="$style.responseCard"
        >
          <div :class="$style.responseHeader">
            <span :class="$style.blockTitle">{{ t('car_links.detail.car_added_title') }}</span>
            <span :class="$style.responseDate">{{ formatDateTime(carAddedAction?.createdAt, 'DD.MM.YYYY HH:mm') }}</span>
          </div>
          <div :class="$style.carAddedAction">
            <CommonButton
              kind="green"
              @click="goToCar"
            >
              {{ t('car_links.detail.car_added_btn') }}
            </CommonButton>
          </div>
        </div>

        <div
          v-if="visibleBlock === 'BUYER_WAITING_INFO'"
          :class="$style.waitingCard"
        >
          <p>{{ t('car_links.detail.buyer_waiting_info') }}</p>
        </div>

        <div
          v-if="visibleBlock === 'BUYER_DECISION'"
          :class="$style.actionSplitCard"
        >
          <div :class="$style.splitCol">
            <div :class="$style.splitTitleBold">
              {{ t('car_links.detail.buyer_decision_title') }}
            </div>
            <CommonButton
              kind="black"
              :disabled="isLoading"
              @click="handleInterest(CustomerInterestEnum.INTERESTED)"
            >
              {{ t('car_links.detail.buyer_decision_btn_yes') }}
            </CommonButton>
          </div>

          <div :class="$style.splitCol">
            <div :class="$style.splitTitleRegular">
              {{ t('car_links.detail.buyer_decision_title_no') }}
            </div>
            <CommonButton
              kind="lightgrey"
              :disabled="isLoading"
              @click="handleInterest(CustomerInterestEnum.NOT_INTERESTED)"
            >
              {{ t('car_links.detail.buyer_decision_btn_no') }}
            </CommonButton>
          </div>
        </div>

        <div
          v-if="visibleBlock === 'BUYER_WAITING_CAR'"
          :class="$style.waitingCard"
        >
          <p>{{ t('car_links.detail.buyer_waiting_car') }}</p>
        </div>

        <div
          v-if="visibleBlock === 'SELLER_TAKE_WORK'"
          :class="$style.waitingCard"
        >
          <p>{{ t('car_links.detail.seller_take_work') }}</p>
        </div>

        <div
          v-if="visibleBlock === 'CLOSED' && !managerReplyAction && !carAddedAction"
          :class="$style.waitingCard"
        >
          <p>{{ t('car_links.detail.closed_task') }}</p>
        </div>

        <div
          v-if="visibleBlock === 'CANCELLED'"
          :class="$style.responseCard"
        >
          <div :class="$style.responseHeader">
            <span :class="$style.blockTitle">{{ cancelTitle }}</span>
            <span
              v-if="canceledAction"
              :class="$style.responseDate"
            >
              {{ formatDateTime(canceledAction.createdAt, 'DD.MM.YYYY HH:mm') }}
            </span>
          </div>
          <div :class="[$style.responseText, 'relative pr-10']">
            <TranslatableWrapper
              v-if="canceledAction?.description || canceledAction?.descriptionRu || canceledAction?.descriptionZh"
              :data="canceledAction"
              :config="{
                keys: {
                  ru: 'descriptionRu',
                  zh: 'descriptionZh',
                  original: 'originalLocale',
                },
              }"
              control-class="absolute top-0 right-0 z-10"
            />
            <template v-else>
              {{ canceledAction?.description }}
            </template>
          </div>
        </div>
      </div>

      <TransitionRoot
        appear
        :show="isCancelModalOpen"
        as="template"
      >
        <Dialog
          as="div"
          class="relative z-50"
          @close="closeCancelModal"
        >
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0"
            enter-to="opacity-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100"
            leave-to="opacity-0"
          >
            <div class="fixed inset-0 bg-black bg-opacity-50" />
          </TransitionChild>

          <div class="fixed inset-0 overflow-y-auto">
            <div class="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild
                as="template"
                enter="duration-300 ease-out"
                enter-from="opacity-0 scale-95"
                enter-to="opacity-100 scale-100"
                leave="duration-200 ease-in"
                leave-from="opacity-100 scale-100"
                leave-to="opacity-0 scale-95"
              >
                <DialogPanel :class="$style.modalPanel">
                  <button
                    type="button"
                    :class="$style.modalCloseBtn"
                    @click="closeCancelModal"
                  >
                    <XMarkIcon class="w-6 h-6 text-gray-400" />
                  </button>

                  <DialogTitle
                    as="h3"
                    :class="$style.modalTitle"
                  >
                    {{ t('car_links.detail.cancel_modal_title') }}
                  </DialogTitle>

                  <div class="mt-2">
                    <p class="text-sm text-gray-600 text-left mb-4 whitespace-pre-wrap">
                      {{ t('car_links.detail.cancel_modal_text') }}
                    </p>

                    <FormTextarea
                      v-model="cancelReason"
                      :label="t('car_links.detail.cancel_modal_reason')"
                      :rows="4"
                      :disabled="isLoading"
                      :invalid-message="errors?.get('description')"
                      @input="errors?.clear('description')"
                    />
                  </div>

                  <div class="mt-6 flex justify-between gap-4">
                    <CommonButton
                      kind="black"
                      class="flex-1"
                      :disabled="isLoading || !cancelReason"
                      @click="handleCancelSubmit"
                    >
                      {{ t('car_links.detail.cancel_modal_submit') }}
                    </CommonButton>
                    <CommonButton
                      kind="lightgrey"
                      class="flex-1"
                      :disabled="isLoading"
                      @click="closeCancelModal"
                    >
                      {{ t('car_links.detail.cancel_modal_back') }}
                    </CommonButton>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </TransitionRoot>
    </div>

    <CommonDataState
      :loading="isDetailPending"
      :has-data="!!item"
      :loading-text="t('common.loading')"
      :empty-text="t('common.no_results')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue"
import { useRouter, useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { ChevronDownIcon, XMarkIcon } from "@heroicons/vue/24/outline"
import { Popover, PopoverButton, PopoverPanel, Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from "@headlessui/vue"
import CommonButton from "@/components/common/Button.vue"
import CommonDataState from "@/components/common/DataState.vue"
import Label from "@/components/common/Label.vue"
import AssigneeSelector from "@/components/common/AssigneeSelector.vue"
import FormTextarea from "@/components/form/Textarea.vue"
import FormInput from "@/components/form/Input.vue"
import type { AssigneeOption } from "@/components/common/AssigneeSelector.vue"
import TranslatableWrapper from "@/components/common/TranslatableWrapper.vue"

import { useUserStore } from "@/stores/user"
import { useCarLinkAssigneeStore } from "@/stores/carLinkAssignee"
import { useCarLink } from "@/composables/useCarLink"
import { useDate } from "@/composables/useDate"
import { ActionTypeEnum, CarLinkStatusEnum, CustomerInterestEnum, CarConditionEnum, CarLinkClosureOutcomeEnum } from "@/constants/carLink"
import { RoleAdmin, RoleDirector, RoleEmployee, RoleSellerClient, RoleSellerSearch } from "~/constants/roles"

definePageMeta({
  layout: "personal",
  auth: true,
  hideTitle: true,
  roles: [RoleDirector, RoleAdmin, RoleEmployee, RoleSellerSearch, RoleSellerClient],
})

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const assigneeStore = useCarLinkAssigneeStore()
const { t } = useI18n()
const { formatDateTime } = useDate()
const {
  item,
  isLoading,
  errors,
  fetchCarLink,
  assignCarLink,
  replyCarLink,
  setCarLinkInterest,
  attachCarLinkListing,
  cancelCarLink,
  updateCarLinkInternalNote,
  reopenCarLink,
} = useCarLink()

const linkId = route.params.id as string

const currentAssignee = ref<AssigneeOption | null>(null)
const employeeResponse = ref("")
const addedCarLink = ref("")

const internalNote = ref("")

const isCancelModalOpen = ref(false)
const cancelReason = ref("")

const awaitingAddedCar = ref(false)

const hasFetched = ref(false)
const isDetailPending = computed(() => !hasFetched.value || isLoading.value)

const employeeOptions = computed<AssigneeOption[]>(() => assigneeStore.assignees)

const managerReplyAction = computed(() => {
  return item.value?.actions?.find(a =>
    a.type === ActionTypeEnum.MANAGER_REPLY
    || a.type === ActionTypeEnum.AUTO_REPLY,
  )
})

const hasManagerReply = computed(() => !!managerReplyAction.value)

const carAddedAction = computed(() => {
  return item.value?.actions?.find(a => a.type === ActionTypeEnum.CAR_ADDED)
})

const customerDecisionAction = computed(() => {
  return item.value?.actions?.find(a => a.type === ActionTypeEnum.CUSTOMER_DECISION)
})

const canceledAction = computed(() => {
  return item.value?.actions?.find(a => a.type === ActionTypeEnum.CANCELED)
})

const isInternalNoteChanged = computed(() => {
  return internalNote.value.trim() !== (item.value?.internalNote ?? "")
})

const canBeClosed = computed(() => {
  return item.value
    && item.value.status !== CarLinkStatusEnum.CLOSED
    && item.value.status !== CarLinkStatusEnum.CANCELLED
})

const canAskQuestion = computed(() => {
  return userStore.isBuyer
    && item.value?.status === CarLinkStatusEnum.CLOSED
})

const visibleBlock = computed(() => {
  if (!item.value) {
    return null
  }
  if (item.value.status === CarLinkStatusEnum.CLOSED) {
    return "CLOSED"
  }
  if (item.value.status === CarLinkStatusEnum.CANCELLED) {
    return "CANCELLED"
  }

  const hasCarAdded = !!carAddedAction.value
  const hasManagerReply = !!managerReplyAction.value
  const interest = item.value.customerInterest
  const isAssigned = !!item.value.assigneeId || !!currentAssignee.value

  const isActive = item.value.status === CarLinkStatusEnum.OPEN
    || item.value.status === CarLinkStatusEnum.IN_PROGRESS
    || item.value.status === CarLinkStatusEnum.ANSWERED

  if (userStore.isBuyer) {
    if (isActive) {
      if (hasCarAdded) {
        return "CAR_ADDED"
      }
      if (hasManagerReply && interest === CustomerInterestEnum.INTERESTED) {
        return "BUYER_WAITING_CAR"
      }
      if (hasManagerReply && interest === CustomerInterestEnum.PENDING) {
        return "BUYER_DECISION"
      }
      return "BUYER_WAITING_INFO"
    }
  }
  else {
    if (interest === CustomerInterestEnum.INTERESTED && !hasCarAdded) {
      return "SELLER_ADD_CAR"
    }

    if (!isAssigned) {
      if (item.value.status === CarLinkStatusEnum.ANSWERED && hasManagerReply) {
        return "SELLER_VIEW_REPLY"
      }

      return "SELLER_TAKE_WORK"
    }

    if (item.value.status === CarLinkStatusEnum.IN_PROGRESS || !hasManagerReply) {
      return "SELLER_REPLY"
    }

    if (hasManagerReply) {
      return "SELLER_VIEW_REPLY"
    }
  }

  return null
})

const cancelTitle = computed(() => {
  if (!canceledAction.value || !item.value) {
    return t("car_links.list.status_cancelled")
  }

  const isCanceledByBuyer = canceledAction.value.userId === item.value.creatorId

  return isCanceledByBuyer ? t("car_links.list.cancelled_by_buyer") : t("car_links.list.cancelled_by_site")
})

function getStatusName(status: string): string {
  const map: Record<string, string> = {
    [CarLinkStatusEnum.OPEN]: t("car_links.list.status_open"),
    [CarLinkStatusEnum.IN_PROGRESS]: t("car_links.list.status_in_progress"),
    [CarLinkStatusEnum.ANSWERED]: t("car_links.list.status_answered"),
    [CarLinkStatusEnum.CLOSED]: t("car_links.list.status_closed"),
    [CarLinkStatusEnum.CANCELLED]: t("car_links.list.status_cancelled"),
  }
  return map[status] || status
}

type LabelKind = "blue" | "darkBlue" | "yellow" | "gray" | "green" | "red" | "darkRed" | "violet" | "darkgray"

function getStatusLabelKind(status: string): LabelKind {
  const map: Record<string, LabelKind> = {
    [CarLinkStatusEnum.OPEN]: "darkgray",
    [CarLinkStatusEnum.IN_PROGRESS]: "darkBlue",
    [CarLinkStatusEnum.ANSWERED]: "violet",
    [CarLinkStatusEnum.CLOSED]: "gray",
    [CarLinkStatusEnum.CANCELLED]: "red",
  }
  return map[status] || "gray"
}

function getConditionName(condition: string): string {
  return condition === CarConditionEnum.NEW
    ? t("car_links.create.condition_new")
    : t("car_links.create.condition_used")
}

function getOutcomeName(outcome: string): string {
  const map: Record<string, string> = {
    [CarLinkClosureOutcomeEnum.CAR_OFFERED]: t("car_links.list.outcome_car_offered"),
    [CarLinkClosureOutcomeEnum.CLIENT_DECLINED]: t("car_links.list.outcome_client_declined"),
    [CarLinkClosureOutcomeEnum.REFUSED_NO_LISTING]: t("car_links.list.outcome_refused_no_listing"),
  }
  return map[outcome] || outcome
}

function getOutcomeLabelKind(outcome: string): LabelKind {
  const map: Record<string, LabelKind> = {
    [CarLinkClosureOutcomeEnum.CAR_OFFERED]: "green",
    [CarLinkClosureOutcomeEnum.CLIENT_DECLINED]: "red",
    [CarLinkClosureOutcomeEnum.REFUSED_NO_LISTING]: "gray",
  }
  return map[outcome] || "gray"
}

async function handleTakeToWork() {
  if (userStore.user?.id) {
    await assignCarLink(linkId, { assigneeId: userStore.user.id })
    currentAssignee.value = { id: userStore.user.id, name: userStore.user.name || "" }
  }
}

async function handleAssign(id: number | string) {
  const selected = employeeOptions.value.find(emp => emp.id === Number(id))
  if (selected) {
    await assignCarLink(linkId, { assigneeId: Number(id) })
    currentAssignee.value = selected
  }
}

async function handleSendResponse() {
  const response = await replyCarLink(linkId, {
    reply: employeeResponse.value,
  })

  if (response) {
    employeeResponse.value = ""
  }
}

async function handleInterest(interest: typeof CustomerInterestEnum[keyof typeof CustomerInterestEnum]) {
  await setCarLinkInterest(linkId, { interest })
}

async function handleSendCarLink() {
  const response = await attachCarLinkListing(linkId, {
    listingUrl: addedCarLink.value.trim(),
  })

  if (response) {
    addedCarLink.value = ""
  }
}

async function handleSaveInternalNote() {
  const note = internalNote.value.trim()
  const response = await updateCarLinkInternalNote(linkId, { internalNote: note || null })

  if (response) {
    internalNote.value = response.internalNote ?? ""
  }
}

function openCancel(closePopover?: () => void) {
  if (closePopover) {
    closePopover()
  }
  cancelReason.value = ""
  errors.value?.clear()
  isCancelModalOpen.value = true
}

function closeCancelModal() {
  isCancelModalOpen.value = false
}

async function handleCancelSubmit() {
  const result = await cancelCarLink(linkId, { description: cancelReason.value })
  if (result) {
    closeCancelModal()
  }
}

async function handleReopen() {
  await reopenCarLink(linkId)
}

function goToAddCar() {
  const routeData = router.resolve({
    name: "personal-listings-id",
    params: { id: 0 },
    query: {
      car_link_id: linkId,
      import_url: item.value?.url || undefined,
    },
  })
  awaitingAddedCar.value = true
  window.open(routeData.href, "_blank")
}

async function handleVisibilityChange() {
  if (document.visibilityState !== "visible" || !awaitingAddedCar.value) {
    return
  }

  await fetchCarLink(linkId)

  if (carAddedAction.value) {
    awaitingAddedCar.value = false
  }
}

function goToCar() {
  if (carAddedAction.value?.listingId) {
    let routeData = router.resolve({ name: "personal-listings-id", params: { id: carAddedAction.value.listingId } })
    if (userStore.isBuyer) {
      routeData = router.resolve({ name: "catalog-id", params: { id: carAddedAction.value.listingId } })
    }
    window.open(routeData.href, "_blank")
  }
}

onMounted(async () => {
  document.addEventListener("visibilitychange", handleVisibilityChange)

  try {
    const promises: Promise<any>[] = [fetchCarLink(linkId)]

    if (!userStore.isBuyer) {
      promises.push(assigneeStore.loadAssignees())
    }

    await Promise.all(promises)

    internalNote.value = item.value?.internalNote ?? ""

    if (item.value?.assigneeId) {
      const assignee = employeeOptions.value.find(emp => emp.id === item.value?.assigneeId)
      if (assignee) {
        currentAssignee.value = assignee
      }
      else if (item.value.assigneeId === userStore.user?.id) {
        currentAssignee.value = { id: userStore.user.id, name: userStore.user.name || "" }
      }
    }
  }
  finally {
    hasFetched.value = true
  }
})

onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange)
})
</script>

<style module>
.header {
  @apply mb-6;
}

.titleRow {
  @apply flex items-center gap-3;
}

.title {
  @apply text-3xl font-bold leading-tight;
}

.content {
  @apply w-full lg:w-2/3 xl:w-1/2 mt-6;
}

.statusRow {
  @apply flex items-center justify-between mb-4 flex-wrap gap-4;
}

.statusLeft {
  @apply flex items-center gap-4 flex-wrap;
}

.relativeBlock {
  @apply relative inline-block text-left;
}

.button {
  @apply flex items-center justify-center;
}

.arrowIcon {
  @apply w-4 h-4 ml-2 -mr-1;
}

.chatMenuPanel {
  @apply absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100 overflow-hidden;
}

.menuItem {
  @apply block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 transition-colors;
}

.menuItemDanger {
  @apply text-red-600 hover:bg-red-50;
}

.card {
  @apply bg-white rounded-lg border border-gray-200;
}

.detailsCard {
  @apply card flex flex-col;
}

.detailRow {
  @apply flex flex-col sm:flex-row sm:items-start px-6 py-4 border-b border-gray-100 last:border-b-0 gap-2;
}

.detailLabel {
  @apply text-gray-500 text-sm sm:w-1/3 flex-shrink-0;
}

.detailValue {
  @apply text-gray-900 text-sm sm:w-2/3 break-words whitespace-pre-wrap;
}

.detailLink {
  @apply text-blue-500 hover:text-primary-500 underline text-sm sm:w-2/3 break-all;
}

.noteCard {
  @apply card mt-6 p-6 flex flex-col gap-2 border-dashed;
}

.hint {
  @apply text-gray-400 text-xs;
}

.noteActions {
  @apply flex items-center gap-3 mt-2;
}

.replyCard {
  @apply card mt-6 p-6 flex flex-col gap-2;
}

.replyActions {
  @apply flex justify-start mt-2;
}

.linkInputCard {
  @apply card mt-6 p-6 flex flex-col gap-2;
}

.linkInputActions {
  @apply flex flex-wrap items-center justify-between mt-2 gap-3;
}

.linkInputCardMuted {
  opacity: 0.55;
}

.addCarAction {
  @apply ml-auto;
}

.waitingCard {
  @apply card mt-6 px-6 py-8 text-center text-gray-500 leading-relaxed whitespace-pre-wrap;
}

.responseCard {
  @apply card mt-6 p-6 flex flex-col gap-4;
}

.responseHeader {
  @apply flex items-baseline justify-start gap-3;
}

.blockTitle {
  @apply font-bold text-gray-900 text-lg;
}

.responseDate {
  @apply text-gray-500 text-sm;
}

.responseText {
  @apply text-black whitespace-pre-wrap text-base;
}

.carAddedAction {
  @apply flex;
}

.actionSplitCard {
  @apply card mt-6 p-6 flex flex-col sm:flex-row gap-8 sm:gap-4;
}

.splitCol {
  @apply flex-1 flex flex-col items-start gap-4;
}

.splitTitleBold {
  @apply font-bold text-gray-900 text-base;
}

.splitTitleRegular {
  @apply text-gray-900 text-base;
}

.modalPanel {
  @apply w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all relative;
}

.modalCloseBtn {
  @apply absolute top-4 right-4 outline-none hover:bg-gray-100 rounded-full p-1 transition-colors;
}

.modalTitle {
  @apply text-xl font-bold leading-6 text-gray-900 mb-4 pr-6;
}

@media (max-width: 640px) {
  .detailValue,
  .detailLink {
    @apply w-full mt-1;
  }

  .actionSplitCard {
    @apply flex-col;
  }
}
</style>
