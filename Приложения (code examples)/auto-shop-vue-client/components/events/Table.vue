<template>
  <div>
    <DataTable
      :table="table"
      :row-class-fn="rowClassFn"
    >
      <template #type="{ row }">
        <LinkOrSpan
          :to="getItemLink(row.original)"
          :class="$style.link"
          @click="onNavigate(row.original)"
        >
          {{ getEventTypeName(row.original.type) }}
        </LinkOrSpan>
      </template>
      <template #entity="{ row }">
        <LinkOrSpan
          :to="getItemLink(row.original)"
          :class="$style.link"
          @click="onNavigate(row.original)"
        >
          {{ getEntityName(row.original) }}
        </LinkOrSpan>
      </template>
      <template #details="{ row }">
        <div v-if="isCarLinkEvent(row.original)">
          <a
            v-if="row.original.entity.attributes.car_link_url"
            :href="row.original.entity.attributes.car_link_url"
            target="_blank"
            rel="noopener noreferrer"
            :class="[$style.carLink, $style.carLinkSpace]"
          >
            {{ row.original.entity.attributes.car_link_url }}
          </a>
          <div
            v-if="row.original.entity.attributes.car_link_wish"
            :class="$style.company"
          >
            {{ row.original.entity.attributes.car_link_wish }}
          </div>
        </div>
        <div v-else-if="isSearchRequestEvent(row.original)">
          <LinkOrSpan
            :to="getItemLink(row.original)"
            :class="[$style.carLink, $style.carLinkSpace]"
          >
            {{ t('search_request_events.request_number', { id: row.original.entity.attributes.id ?? '—' }) }}
          </LinkOrSpan>
          <span v-if="row.original.entity.attributes.search_request_title">
            {{ row.original.entity.attributes.search_request_title }}
          </span>
        </div>
        <div v-else-if="isListingSourceEvent(row.original)">
          <span>
            <LinkOrSpan
              :to="getItemLink(row.original)"
              :class="[$style.carLink, $style.carLinkSpace]"
            >
              {{ row.original.entity.attributes.name }}
            </LinkOrSpan>
            <span>
              <template v-if="row.original.entity.attributes.gearbox">
                <span> {{ t(`cars.gearbox.${row.original.entity.attributes.gearbox}`) }},</span>
              </template>
              {{ row.original.entity.attributes.year }}
            </span>
          </span>
          <div :class="$style.vin">
            VIN: {{ row.original.entity.attributes.vin }}
          </div>
          <div
            v-if="row.original.type === ActivityListingSourcePriceChanged"
            :class="$style.company"
          >
            {{ t('listing_source_events.price_was_now', {
              was: formatSourcePrice(row.original.payload?.old_price),
              now: formatSourcePrice(row.original.payload?.new_price),
            }) }}
          </div>
          <a
            v-if="row.original.entity.attributes.external_url"
            :href="row.original.entity.attributes.external_url"
            target="_blank"
            rel="noopener noreferrer"
            :class="$style.carLink"
          >
            {{ t('listing_source_events.open_source') }}
          </a>
        </div>
        <div v-else-if="isListingRequest(row.original)">
          <span>
            <LinkOrSpan
              :to="listingDetailsLink(row.original)"
              :class="[$style.carLink, $style.carLinkSpace]"
            >
              {{ row.original.entity.attributes.name }}
            </LinkOrSpan>
            <span>
              <template v-if="row.original.entity.attributes.gearbox">
                <span> {{ t(`cars.gearbox.${row.original.entity.attributes.gearbox}`) }},</span>
              </template>
              {{ row.original.entity.attributes.year }}
            </span>
          </span>
          <div :class="$style.vin">
            VIN: {{ row.original.entity.attributes.vin }}
          </div>
        </div>
      </template>
      <template #actions="{ row }">
        <div class="flex flex-col items-end gap-1">
          <ToChat
            v-if="isListingRequest(row.original) && row.original.entity.attributes.id"
            type="listing"
            :listing-id="row.original.entity.attributes.id"
            :seller-id="row.original.entity.attributes.listing_user_id"
            :buyer-id="row.original.entity.attributes.user_id"
          >
            <template #default="{ chatLoading, clickDisabled, goToChat }">
              <button
                type="button"
                :class="$style.chatLink"
                :disabled="clickDisabled"
                :aria-busy="chatLoading || undefined"
                @click="goToChat"
              >
                <span v-if="!chatLoading">{{ t('listing_request.chat') }}</span>
                <span v-else>{{ t('common.loading') }}</span>
              </button>
            </template>
          </ToChat>
          <template v-if="isPendingSourceEvent(row.original)">
            <template v-if="row.original.type === ActivityListingSourcePriceChanged">
              <Button
                kind="green"
                size="sm"
                :disabled="processingEventId === row.original.id"
                @click="confirmSourceEvent(row.original)"
              >
                {{ t('listing_request.action_confirm') }}
              </Button>
              <Button
                kind="redOutline"
                size="sm"
                :disabled="processingEventId === row.original.id"
                @click="declineSourceEvent(row.original)"
              >
                {{ t('listing_source_events.action_skip') }}
              </Button>
            </template>
            <Button
              v-else
              kind="redOutline"
              size="sm"
              :disabled="processingEventId === row.original.id"
              @click="askUnpublish(row.original)"
            >
              {{ t('listing_source_events.action_withdraw') }}
            </Button>
          </template>
          <template v-if="isTeamTable">
            <Badge
              class="text-nowrap"
              v-bind="getReadBadgeForTeamTable(row.original)"
            />
          </template>
          <template v-else>
            <button
              v-if="!row.original.read_at"
              type="button"
              :class="$style.readLink"
              @click="emit('read', row.original)"
            >
              {{ t('actions.read') }}
            </button>
          </template>
        </div>
      </template>
      <template #client="{ row }">
        <template v-if="row.original.entity.attributes.client">
          <div v-if="!isBuyer">
            <div>{{ row.original.entity.attributes.client.user_name }}</div>
            <div :class="$style.company">
              {{ row.original.entity.attributes.client.name }}
            </div>
          </div>
          <div v-else-if="isDirector">
            {{ row.original.entity.attributes.client.user_name }}
          </div>
        </template>
      </template>
      <template
        v-if="user !== null"
        #initiator="{ row }"
      >
        <Badge v-bind="getInitiatorBadge(row.original)" />
      </template>
    </DataTable>
    <ModalConfirm
      :is-open="confirmUnpublishOpen"
      :title="t('listing_source_events.delete_confirm_title')"
      :description="t('listing_source_events.delete_confirm_description')"
      :confirm-text="t('listing_source_events.action_withdraw')"
      confirm-kind="primary"
      @close="confirmUnpublishOpen = false"
      @confirm="confirmUnpublish"
    />
    <Pagination
      v-if="pagination.total > pagination.perPage"
      :current-page="pagination.page"
      :total="pagination.total"
      :limit="pagination.perPage"
      :limits="pageSizes"
      :show-limits="false"
      :show-total="false"
      class="mt-2"
      @change-page="emit('change-page', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { CellContext, Row as TableRow } from "@tanstack/vue-table"
import DataTable from "~/components/table/DataTable.vue"
import Badge from "~/components/common/Badge.vue"
import Button from "~/components/common/Button.vue"
import ModalConfirm from "~/components/reviews/ModalConfirm.vue"
import Pagination from "~/components/common/Pagination.vue"
import LinkOrSpan from "~/components/common/LinkOrSpan.vue"
import ToChat from "~/components/chat/ToChat.vue"
import type { ExternalColumn } from "~/types/common/tanstackTable"
import useTanstackTable from "~/composables/useTanstackTable"
import { useUserStore } from "~/stores/user"
import { RoleEmployee } from "~/constants/roles"
import {
  type ActivityEvent,
  isCarLinkEvent,
  isListingRequest,
  isListingSourceEvent,
  isSearchRequestEvent,
} from "~/types/responses/activityEvent"
import {
  ActivityListingSourcePriceChanged,
  ListingSourceEventStatusPending,
} from "~/constants/listingSourceEvents"
import { useApiListingSourceEvents } from "~/composables/api/useApiListingSourceEvents"
import { activityEventItemLink } from "~/utils/activityEventLink"

type PaginationState = {
  page: number
  perPage: number
  total: number
}

type PaginationChange = {
  currentPage: number
  limit: number
}

interface Badge {
  value: string
  kind: "blue" | "green" | "gray" | "red"
}

const props = defineProps<{
  events: ActivityEvent[]
  pagination: PaginationState
  isTeamTable?: boolean
  highlightedEventId?: number | null
}>()

const emit = defineEmits<{
  "read": [item: ActivityEvent]
  "read-on-navigate": [item: ActivityEvent]
  "change-page": [value: PaginationChange]
  "refresh": []
}>()

const { confirmEvent, declineEvent } = useApiListingSourceEvents()

const { t, locale } = useI18n()
const { isBuyer, isDirector, isEmployee, isAdmin, isSellerClient, isSellerContent, isSellerSearch, user } = storeToRefs(useUserStore())

const pageSizes = [
  { id: 1, value: 10, name: 10, disabled: false },
  { id: 2, value: 20, name: 20, disabled: false },
  { id: 3, value: 50, name: 50, disabled: false },
]

const columns = computed<ExternalColumn<any>[]>(() => {
  const dynamicColumns: ExternalColumn<any>[] = [
    {
      header: t("notifications.table.initiator"),
      id: "initiator",
      meta: {
        headerClass: "px-4 py-3 text-left font-medium",
        cellClassFn: ({ row }: CellContext<ActivityEvent, unknown>) => getCellClass(row.original),
        style: "width: 20px",
      },
    },
    {
      header: t("notifications.table.event"),
      accessorKey: "type",
      meta: {
        headerClass: "px-4 py-3 text-left font-medium",
        cellClassFn: ({ row }: CellContext<ActivityEvent, unknown>) => getCellClass(row.original),
        style: "width: 260px",
      },
    },
    {
      header: t("notifications.table.date"),
      accessorKey: "created_at",
      cell: ({ row }: CellContext<ActivityEvent, unknown>) => formatDate(row.original.created_at),
      meta: {
        headerClass: "px-4 py-3 text-left font-medium",
        cellClassFn: ({ row }: CellContext<ActivityEvent, unknown>) => getCellClass(row.original),
        style: "width: 150px",
      },
    },
    {
      header: t("notifications.table.details"),
      accessorKey: "details",
      meta: {
        headerClass: "px-4 py-3 text-left font-medium",
        cellClassFn: ({ row }: CellContext<ActivityEvent, unknown>) => getCellClass(row.original),
        style: "width: 260px",
      },
    },
  ]

  if (!isBuyer.value) {
    dynamicColumns.push({
      header: "Клиент",
      accessorKey: "client",
      meta: {
        headerClass: "px-4 py-3 text-left font-medium",
        cellClassFn: ({ row }: CellContext<ActivityEvent, unknown>) => getCellClass(row.original),
        style: "width: 200px",
      },
    })
  }

  dynamicColumns.push({
    header: "",
    id: "actions",
    meta: {
      headerClass: "px-4 py-3 text-right",
      cellClassFn: ({ row }: CellContext<ActivityEvent, unknown>) => `${getCellClass(row.original)} text-right`,
      style: "width: 1%",
    },
  })
  return dynamicColumns
})

const tableData = computed(() => props.events)
const { table } = useTanstackTable(tableData, columns)

function getCellClass(item: ActivityEvent) {
  return `px-4 py-3 ${!item.read_at ? "tableBlueUnreadBg" : ""}`
}

function onNavigate(item: ActivityEvent) {
  emit("read-on-navigate", item)
}

function formatDate(date: string) {
  return new Date(date).toLocaleString(locale.value === "zh" ? "zh-CN" : "ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(/,/, "")
}

function getEventTypeName(type: string) {
  return t(`user_notifications.types.${type}`)
}

function getReadBadgeForTeamTable(item: ActivityEvent): Badge {
  return item.read_at
    ? { value: t("notifications.is_read"), kind: "green" }
    : { value: t("notifications.is_not_read"), kind: "gray" }
}

function getInitiatorBadge(item: ActivityEvent): Badge {
  if (isAdmin.value || isSellerClient.value || isSellerSearch.value || isSellerContent.value) {
    return getInitiatorBadgeForStaff(item)
  }

  if (isDirector.value) {
    return getInitiatorBadgeForDirector(item)
  }

  if (isEmployee.value) {
    return getInitiatorBadgeForEmployee(item)
  }

  throw new Error(`Unreachable case`)
}

function getInitiatorBadgeForDirector(item: ActivityEvent): Badge {
  if (!item.initiator) {
    return { value: t("notifications.initiators.service_team"), kind: "green" }
  }

  if (props.isTeamTable) {
    if (item.initiator.role === RoleEmployee) {
      return { value: `${t("roles.employee")} ${item.initiator.name}`, kind: "blue" }
    }

    return { value: t("notifications.initiators.service_team"), kind: "green" }
  }

  if (item.initiator.id === user.value!.id) {
    return { value: t("notifications.initiators.you"), kind: "blue" }
  }

  return { value: t("notifications.initiators.service_team"), kind: "green" }
}

function getInitiatorBadgeForEmployee(item: ActivityEvent): Badge {
  if (props.isTeamTable) {
    throw new Error("Unreachable case")
  }

  if (!item.initiator) {
    return { value: t("notifications.initiators.service_team"), kind: "green" }
  }

  if (item.initiator.id === user.value!.id) {
    return { value: t("notifications.initiators.you"), kind: "blue" }
  }

  return { value: t("notifications.initiators.service_team"), kind: "green" }
}

function getInitiatorBadgeForStaff(item: ActivityEvent): Badge {
  if (!item.initiator) {
    return { value: t("notifications.initiators.system"), kind: "gray" }
  }

  if (item.initiator.id === user.value!.id) {
    return { value: t("notifications.initiators.you"), kind: "blue" }
  }

  if (!props.isTeamTable) {
    return { value: `${t(`roles.${item.initiator.role}`)} ${item.initiator.name}`, kind: "green" }
  }

  throw new Error("Unreachable case")
}

function rowClassFn(row: TableRow<ActivityEvent>): string {
  return row.original.id === props.highlightedEventId ? "tableHighlightedRow" : ""
}

const processingEventId = ref<number | null>(null)
const confirmUnpublishOpen = ref(false)
const pendingUnpublishEvent = ref<ActivityEvent | null>(null)

function isPendingSourceEvent(item: ActivityEvent): boolean {
  if (props.isTeamTable || !isListingSourceEvent(item)) {
    return false
  }

  return item.entity.attributes.source_event_status === ListingSourceEventStatusPending
}

function formatSourcePrice(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "—"
  }

  return `${Number(value).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ¥`
}

async function runSourceAction(item: ActivityEvent, action: (eventId: number) => Promise<unknown>) {
  if (processingEventId.value !== null || !isListingSourceEvent(item)) {
    return
  }

  processingEventId.value = item.id

  try {
    await action(item.entity.attributes.source_event_id)
    emit("refresh")
  }
  catch (error) {
    console.error(error)
  }
  finally {
    processingEventId.value = null
  }
}

function confirmSourceEvent(item: ActivityEvent) {
  void runSourceAction(item, confirmEvent)
}

function declineSourceEvent(item: ActivityEvent) {
  void runSourceAction(item, declineEvent)
}

function askUnpublish(item: ActivityEvent) {
  pendingUnpublishEvent.value = item
  confirmUnpublishOpen.value = true
}

function confirmUnpublish() {
  const item = pendingUnpublishEvent.value
  confirmUnpublishOpen.value = false
  pendingUnpublishEvent.value = null

  if (item) {
    void runSourceAction(item, confirmEvent)
  }
}

function getEntityName(item: ActivityEvent) {
  if (isListingRequest(item)) {
    return item.entity.attributes.name
  }
  if (isCarLinkEvent(item)) {
    return t("car_link_events.link_number", { id: item.entity.attributes.id })
  }
  if (isSearchRequestEvent(item)) {
    return t("search_request_events.request_number", { id: item.entity.attributes.id ?? "—" })
  }
  if (isListingSourceEvent(item)) {
    return item.entity.attributes.name ?? `#${item.entity.attributes.id}`
  }
  return `#${item.entity.id}`
}

function getItemLink(item: ActivityEvent) {
  return activityEventItemLink(item, isBuyer.value)
}

function listingDetailsLink(item: ActivityEvent) {
  const id = item.entity.attributes.id
  if (!id) {
    return null
  }

  return isBuyer.value
    ? { name: "catalog-id", params: { id } }
    : { name: "personal-listings-id", params: { id }, query: { from: "events" } }
}
</script>

<style module>
.link {
  @apply text-blue-600 underline hover:text-blue-800 transition-colors;
}
.readLink {
  @apply text-gray-400 underline hover:text-gray-600 transition-colors px-2 text-sm;
}
.company {
  @apply text-gray-400 text-sm;
}
.chatLink {
  @apply text-blue-600 underline hover:text-blue-800 transition-colors px-2;
}
.carLink {
  @apply text-blue-600 underline hover:text-blue-800 transition-colors;
}
.carLinkSpace {
  @apply mr-1;
}
.vin {
  @apply text-gray-400 text-sm;
}
</style>
