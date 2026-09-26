<template>
  <div class="mx-auto">
    <div :class="$style.head">
      <div>
        <NuxtLink
          :class="$style.link"
          :to="{ name: 'admin-notification-stats', query: { hours } }"
        >
          {{ t('admin_main.notification_stats.manager.back') }}
        </NuxtLink>
        <p :class="$style.hint">
          {{ t('admin_main.notification_stats.manager.hint') }}
        </p>
      </div>

      <div :class="$style.controls">
        <button
          v-for="option in windowOptions"
          :key="option"
          type="button"
          :class="[$style.windowButton, hours === option ? $style.windowButtonActive : '']"
          :disabled="loading"
          @click="selectWindow(option)"
        >
          {{ t('admin_main.notification_stats.window_' + option) }}
        </button>
      </div>
    </div>

    <div
      v-if="author"
      :class="$style.container"
    >
      <div :class="$style.sectionTitle">
        {{ author.user.name || '#' + author.user.id }}
        <span
          v-if="author.user.state !== 'active'"
          :class="[$style.kind, $style.kindDanger]"
        >
          {{ t('admin_main.notification_stats.state.' + author.user.state) }}
        </span>
      </div>

      <div :class="$style.metrics">
        <div
          v-for="metric in authorMetrics"
          :key="metric.key"
          :class="[$style.metric, metric.alert ? $style.metricAlert : '']"
        >
          <span :class="$style.metricValue">{{ metric.value }}</span>
          <span :class="$style.metricLabel">{{ t('admin_main.notification_stats.table.' + metric.key) }}</span>
        </div>
      </div>
    </div>

    <div :class="$style.container">
      <div :class="$style.filters">
        <FormSelect
          v-model="filters.type"
          :label="t('admin_main.notification_stats.filters.type')"
          :options="typeOptions"
        />
        <FormSelect
          v-model="filters.status"
          :label="t('admin_main.notification_stats.filters.status')"
          :options="statusOptions"
        />
        <FormSelect
          v-model="filters.reaction"
          :label="t('admin_main.notification_stats.filters.reaction')"
          :options="reactionOptions"
        />
      </div>

      <div
        v-if="rows.length === 0"
        :class="$style.empty"
      >
        {{ t('admin_main.notification_stats.manager.empty') }}
      </div>

      <div
        v-else
        :class="$style.tableWrap"
      >
        <table :class="$style.table">
          <thead>
            <tr>
              <th>{{ t('admin_main.notification_stats.events_table.time') }}</th>
              <th>{{ t('admin_main.notification_stats.events_table.type') }}</th>
              <th>{{ t('admin_main.notification_stats.events_table.listing') }}</th>
              <th>{{ t('admin_main.notification_stats.events_table.price') }}</th>
              <th>{{ t('admin_main.notification_stats.events_table.status') }}</th>
              <th>{{ t('admin_main.notification_stats.events_table.reaction') }}</th>
              <th>{{ t('admin_main.notification_stats.events_table.resolved_by') }}</th>
              <th>{{ t('admin_main.notification_stats.events_table.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.activityEventId"
            >
              <td>
                {{ dateTime(row.notifiedAt) }}
                <span
                  v-if="!row.delivered"
                  :class="[$style.kind, $style.kindDanger]"
                >
                  {{ t('admin_main.notification_stats.events_table.undelivered') }}
                </span>
              </td>
              <td>{{ t('user_notifications.types.listing_source_event_' + row.sourceEvent.type) }}</td>
              <td>
                <NuxtLink
                  v-if="row.listing"
                  :class="$style.link"
                  :to="{ name: 'catalog-id', params: { id: row.listing.id } }"
                >
                  {{ row.listing.name || row.listing.vin }}
                </NuxtLink>
                <span v-else>—</span>
                <a
                  v-if="row.listing?.externalUrl"
                  :class="$style.note"
                  :href="row.listing.externalUrl"
                  target="_blank"
                  rel="noopener"
                >
                  {{ row.listing.source }}
                </a>
              </td>
              <td>
                <span v-if="row.sourceEvent.newPrice !== null">
                  {{ row.sourceEvent.oldPrice }} → {{ row.sourceEvent.newPrice }}
                </span>
                <span v-else>{{ row.sourceEvent.oldPrice ?? '—' }}</span>
              </td>
              <td>{{ t('admin_main.notification_stats.status.' + row.sourceEvent.status) }}</td>
              <td>
                <span v-if="row.recipient.reactionKind === null">—</span>
                <span v-else>
                  {{ t('admin_main.notification_stats.reaction.' + row.recipient.reactionKind) }},
                  {{ duration(row.recipient.reactionSeconds) }}
                  <span
                    v-if="row.recipient.bulkRead"
                    :class="$style.note"
                  >
                    {{ t('admin_main.notification_stats.reaction.bulk') }}
                  </span>
                </span>
              </td>
              <td>
                <span v-if="row.sourceEvent.resolvedBy">{{ row.sourceEvent.resolvedBy.name }}</span>
                <span v-else-if="row.sourceEvent.resolvedAt">
                  {{ t('admin_main.notification_stats.reaction.system') }}
                </span>
                <span v-else>—</span>
              </td>
              <td>
                <div
                  v-if="row.sourceEvent.status === 'pending'"
                  :class="$style.actions"
                >
                  <template v-if="row.sourceEvent.type === 'price_changed'">
                    <Button
                      kind="green"
                      size="sm"
                      :disabled="processingEventId !== null"
                      @click="runAction(row, confirmEvent)"
                    >
                      {{ t('listing_request.action_confirm') }}
                    </Button>
                    <Button
                      kind="redOutline"
                      size="sm"
                      :disabled="processingEventId !== null"
                      @click="runAction(row, declineEvent)"
                    >
                      {{ t('listing_source_events.action_skip') }}
                    </Button>
                  </template>
                  <template v-else>
                    <Button
                      kind="redOutline"
                      size="sm"
                      :disabled="processingEventId !== null"
                      @click="askWithdraw(row)"
                    >
                      {{ t('listing_source_events.action_withdraw') }}
                    </Button>
                    <Button
                      kind="green"
                      size="sm"
                      :disabled="processingEventId !== null"
                      @click="runAction(row, declineEvent)"
                    >
                      {{ t('admin_main.notification_stats.actions.keep') }}
                    </Button>
                  </template>
                </div>
                <span v-else>—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="total > 0"
        :current-page="currentPage"
        :total="total"
        :limit="limit"
        :show-limits="false"
        @change-page="onPageChange"
      />
    </div>

    <ModalConfirm
      :is-open="confirmWithdrawOpen"
      :title="t('listing_source_events.delete_confirm_title')"
      :description="t('listing_source_events.delete_confirm_description')"
      :confirm-text="t('listing_source_events.action_withdraw')"
      confirm-kind="primary"
      @close="confirmWithdrawOpen = false"
      @confirm="confirmWithdraw"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute } from "vue-router"
import Pagination from "@/components/common/Pagination.vue"
import Button from "@/components/common/Button.vue"
import ModalConfirm from "@/components/reviews/ModalConfirm.vue"
import { RoleAdmin } from "@/constants/roles"
import { useApiNotificationStats } from "@/composables/api/useApiNotificationStats"
import { useApiListingSourceEvents } from "@/composables/api/useApiListingSourceEvents"
import type { AuthorEvent, NotificationAuthorStats } from "@/types/responses/notificationStats"
import type { OptionBase } from "@/types/form/optionType"

definePageMeta({
  auth: true,
  layout: "personal",
  roles: [RoleAdmin],
  hideTitle: true,
})

const { t, locale } = useI18n()
const route = useRoute()
const { getAuthorEvents } = useApiNotificationStats()
const { confirmEvent, declineEvent } = useApiListingSourceEvents()

const windowOptions = [24, 168, 720]
const userId = Number(route.params.id)

const rows = ref<AuthorEvent[]>([])
const author = ref<NotificationAuthorStats | null>(null)
const hours = ref(windowOptions.includes(Number(route.query.hours)) ? Number(route.query.hours) : 24)
const total = ref(0)
const currentPage = ref(1)
const limit = ref(25)
const loading = ref(false)

const filters = reactive({
  type: "",
  status: "",
  reaction: "",
})

const makeOptions = (values: string[], prefix: string): OptionBase[] => [
  { id: 0, value: "", name: t("common.all"), disabled: false },
  ...values.map((value, index) => ({
    id: index + 1,
    value,
    name: t(prefix + value),
    disabled: false,
  })),
]

const typeOptions = computed(() =>
  makeOptions(["price_changed", "unpublished"], "user_notifications.types.listing_source_event_"),
)

const statusOptions = computed(() =>
  makeOptions(
    ["pending", "confirmed", "declined", "superseded"],
    "admin_main.notification_stats.status.",
  ),
)

const reactionOptions = computed(() =>
  makeOptions(["reacted", "ignored"], "admin_main.notification_stats.filters."),
)

const load = async () => {
  loading.value = true

  try {
    const response = await getAuthorEvents(userId, {
      hours: hours.value,
      limit: limit.value,
      offset: (currentPage.value - 1) * limit.value,
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.reaction ? { reaction: filters.reaction } : {}),
    })

    rows.value = response.data
    total.value = response.meta?.total ?? 0
    author.value = response.meta?.author ?? null
  }
  finally {
    loading.value = false
  }
}

const selectWindow = (value: number) => {
  if (hours.value === value) {
    return
  }

  hours.value = value
  currentPage.value = 1
  load()
}

const onPageChange = (payload: { currentPage: number }) => {
  currentPage.value = payload.currentPage
  load()
}

watch(filters, () => {
  currentPage.value = 1
  load()
})

const dateTime = (value: string) =>
  new Date(value).toLocaleString(locale.value === "zh" ? "zh-CN" : "ru-RU")

const duration = (seconds: number | null) => {
  if (seconds === null) {
    return "—"
  }

  if (seconds < 60) {
    return `${seconds} ${t("admin_main.notification_stats.unit_seconds")}`
  }

  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} ${t("admin_main.notification_stats.unit_minutes")}`
  }

  const hoursPart = Math.floor(seconds / 3600)
  const minutesPart = Math.round((seconds % 3600) / 60)

  return `${hoursPart} ${t("admin_main.notification_stats.unit_hours")} ${minutesPart} ${t("admin_main.notification_stats.unit_minutes")}`
}

const percent = (value: number) => `${Math.round(value * 100)}%`

const authorMetrics = computed(() => {
  const stats = author.value

  if (!stats) {
    return []
  }

  return [
    { key: "received", value: stats.received, alert: false },
    { key: "reacted", value: stats.reacted, alert: false },
    {
      key: "reaction_rate",
      value: stats.reactionRate === null ? "—" : percent(stats.reactionRate),
      alert: stats.reactionRate !== null && stats.reactionRate < 0.5,
    },
    { key: "resolved", value: stats.resolved, alert: false },
    { key: "read_only", value: stats.readOnly, alert: false },
    { key: "still_pending", value: stats.stillPending, alert: false },
    { key: "auto_closed", value: stats.autoClosed, alert: false },
    { key: "median", value: duration(stats.reactionSeconds.median), alert: false },
    { key: "max", value: duration(stats.reactionSeconds.max), alert: false },
    { key: "overdue", value: stats.overdue, alert: stats.overdue > 0 },
  ]
})

const processingEventId = ref<number | null>(null)
const confirmWithdrawOpen = ref(false)
const pendingWithdraw = ref<AuthorEvent | null>(null)

const runAction = async (row: AuthorEvent, action: (eventId: number) => Promise<unknown>) => {
  if (processingEventId.value !== null) {
    return
  }

  processingEventId.value = row.sourceEvent.id

  try {
    await action(row.sourceEvent.id)
    await load()
  }
  catch (error) {
    console.error(error)
  }
  finally {
    processingEventId.value = null
  }
}

const askWithdraw = (row: AuthorEvent) => {
  pendingWithdraw.value = row
  confirmWithdrawOpen.value = true
}

const confirmWithdraw = () => {
  const row = pendingWithdraw.value
  confirmWithdrawOpen.value = false
  pendingWithdraw.value = null

  if (row) {
    void runAction(row, confirmEvent)
  }
}

onMounted(load)
</script>

<style module>
.head {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.hint {
  max-width: 560px;
  margin-top: 6px;
  font-size: 13px;
  color: #6b7280;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.windowButton {
  padding: 6px 12px;
  font-size: 13px;
  color: #374151;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}

.windowButtonActive {
  color: #fff;
  background: #111827;
  border-color: #111827;
}

.windowButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.container {
  padding: 20px;
  margin-bottom: 16px;
  background: #fff;
  border-radius: 12px;
}

.sectionTitle {
  font-size: 16px;
  font-weight: 600;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.metric {
  padding: 12px;
  background: #f9fafb;
  border-radius: 10px;
}

.metricAlert {
  background: #fef2f2;
}

.metricValue {
  display: block;
  font-size: 20px;
  font-weight: 600;
}

.metricLabel {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: #6b7280;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.tableWrap {
  margin-top: 12px;
  overflow-x: auto;
}

.table {
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 6px 8px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid #f3f4f6;
}

.table th {
  font-weight: 600;
  color: #6b7280;
}

.link {
  color: #2563eb;
}

.kind {
  padding: 1px 8px;
  margin-left: 6px;
  font-size: 12px;
  background: #f3f4f6;
  border-radius: 999px;
}

.kindDanger {
  color: #991b1b;
  background: #fee2e2;
}

.note {
  margin-left: 4px;
  font-size: 12px;
  color: #9ca3af;
}

.empty {
  padding: 24px;
  color: #6b7280;
  text-align: center;
}

.actions {
  display: flex;
  gap: 6px;
}
</style>
