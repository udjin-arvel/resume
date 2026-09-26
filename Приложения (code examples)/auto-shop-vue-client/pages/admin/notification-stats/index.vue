<template>
  <div class="mx-auto">
    <div :class="$style.head">
      <p :class="$style.hint">
        {{ t('admin_main.notification_stats.hint', { sla: stats?.responseSlaMinutes ?? 0, from: stats?.responseWindow?.from ?? '', to: stats?.responseWindow?.to ?? '' }) }}
      </p>

      <div :class="$style.controls">
        <button
          v-for="option in windowOptions"
          :key="option"
          type="button"
          :class="[$style.windowButton, hours === option ? $style.windowButtonActive : '']"
          @click="selectWindow(option)"
        >
          {{ t('admin_main.notification_stats.window_' + option) }}
        </button>
        <button
          type="button"
          :class="$style.refresh"
          :disabled="loading"
          @click="load"
        >
          {{ t('admin_main.notification_stats.refresh') }}
        </button>
      </div>
    </div>

    <div
      v-if="stats && stats.totals.undelivered > 0"
      :class="[$style.banner, $style.bannerDanger]"
    >
      {{ t('admin_main.notification_stats.undelivered_banner', { count: stats.totals.undelivered }) }}
    </div>

    <div
      v-if="stats"
      :class="$style.container"
    >
      <div :class="$style.sectionTitle">
        {{ t('admin_main.notification_stats.totals_title') }}
      </div>
      <div :class="$style.metrics">
        <div
          v-for="metric in totalMetrics"
          :key="metric.key"
          :class="[$style.metric, metric.alert ? $style.metricAlert : '']"
        >
          <span :class="$style.metricValue">{{ metric.value }}</span>
          <span :class="$style.metricLabel">{{ t('admin_main.notification_stats.totals.' + metric.key) }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="stats"
      :class="$style.container"
    >
      <div :class="$style.sectionTitle">
        {{ t('admin_main.notification_stats.authors_title') }}
      </div>

      <div
        v-if="sortedAuthors.length === 0"
        :class="$style.empty"
      >
        {{ t('admin_main.notification_stats.empty') }}
      </div>

      <div
        v-else
        :class="$style.tableWrap"
      >
        <table :class="$style.table">
          <thead>
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                :class="$style.sortable"
                @click="toggleSort(column.key)"
              >
                {{ t('admin_main.notification_stats.table.' + column.key) }}
                <span v-if="sortKey === column.key">{{ sortDesc ? '▾' : '▴' }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="author in sortedAuthors"
              :key="author.user.id"
            >
              <td>
                <NuxtLink
                  :class="$style.link"
                  :to="{ name: 'admin-notification-stats-id', params: { id: author.user.id }, query: { hours } }"
                >
                  {{ author.user.name || '#' + author.user.id }}
                </NuxtLink>
                <span
                  v-if="author.user.state !== 'active'"
                  :class="[$style.kind, $style.kindDanger]"
                >
                  {{ t('admin_main.notification_stats.state.' + author.user.state) }}
                </span>
              </td>
              <td>
                {{ author.received }}
                <span :class="$style.note">
                  {{ author.receivedPriceChanged }} / {{ author.receivedUnpublished }}
                </span>
              </td>
              <td :class="author.undelivered > 0 ? $style.valueDanger : ''">
                {{ author.undelivered }}
              </td>
              <td>{{ author.reacted }}</td>
              <td>{{ author.reactionRate === null ? '—' : percent(author.reactionRate) }}</td>
              <td>{{ author.resolved }}</td>
              <td>
                {{ author.readOnly }}
                <span
                  v-if="author.bulkRead > 0"
                  :class="$style.note"
                >
                  {{ t('admin_main.notification_stats.bulk_suffix', { count: author.bulkRead }) }}
                </span>
              </td>
              <td>{{ author.stillPending }}</td>
              <td>{{ author.autoClosed }}</td>
              <td>{{ duration(author.reactionSeconds.median) }}</td>
              <td>{{ duration(author.reactionSeconds.max) }}</td>
              <td :class="author.overdue > 0 ? $style.valueDanger : ''">
                {{ author.overdue }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p :class="$style.legend">
        {{ t('admin_main.notification_stats.note_cohort') }}
        {{ t('admin_main.notification_stats.note_superseded') }}
        {{ t('admin_main.notification_stats.note_bulk') }}
        {{ t('admin_main.notification_stats.note_undelivered') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import { RoleAdmin } from "@/constants/roles"
import { useApiNotificationStats } from "@/composables/api/useApiNotificationStats"
import type { NotificationAuthorStats, NotificationStats } from "@/types/responses/notificationStats"

definePageMeta({
  auth: true,
  layout: "personal",
  roles: [RoleAdmin],
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { getNotificationStats } = useApiNotificationStats()

const windowOptions = [24, 168, 720]

const columns = [
  { key: "name" },
  { key: "received" },
  { key: "undelivered" },
  { key: "reacted" },
  { key: "reaction_rate" },
  { key: "resolved" },
  { key: "read_only" },
  { key: "still_pending" },
  { key: "auto_closed" },
  { key: "median" },
  { key: "max" },
  { key: "overdue" },
] as const

type ColumnKey = typeof columns[number]["key"]

const stats = ref<NotificationStats | null>(null)
const hours = ref(windowOptions.includes(Number(route.query.hours)) ? Number(route.query.hours) : 24)
const loading = ref(false)
const sortKey = ref<ColumnKey>("received")
const sortDesc = ref(true)

const load = async () => {
  loading.value = true

  try {
    const response = await getNotificationStats(hours.value)
    stats.value = response.data
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
  router.replace({ query: { ...route.query, hours: value } })
  load()
}

const toggleSort = (key: ColumnKey) => {
  if (sortKey.value === key) {
    sortDesc.value = !sortDesc.value

    return
  }

  sortKey.value = key
  sortDesc.value = true
}

const sortValue = (author: NotificationAuthorStats, key: ColumnKey): number | string => {
  switch (key) {
    case "name":
      return author.user.name ?? ""
    case "reaction_rate":
      return author.reactionRate ?? -1
    case "read_only":
      return author.readOnly
    case "still_pending":
      return author.stillPending
    case "auto_closed":
      return author.autoClosed
    case "median":
      return author.reactionSeconds.median ?? -1
    case "max":
      return author.reactionSeconds.max ?? -1
    default:
      return author[key]
  }
}

const sortedAuthors = computed(() => {
  const rows = [...(stats.value?.authors ?? [])]

  return rows.sort((a, b) => {
    const left = sortValue(a, sortKey.value)
    const right = sortValue(b, sortKey.value)

    const result = typeof left === "string" && typeof right === "string"
      ? left.localeCompare(right)
      : Number(left) - Number(right)

    return sortDesc.value ? -result : result
  })
})

const percent = (value: number) => `${Math.round(value * 100)}%`

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

const totalMetrics = computed(() => {
  const totals = stats.value?.totals

  if (!totals) {
    return []
  }

  return [
    { key: "events", value: totals.events, alert: false },
    { key: "authors", value: totals.authors, alert: false },
    { key: "delivered", value: totals.delivered, alert: false },
    { key: "undelivered", value: totals.undelivered, alert: totals.undelivered > 0 },
    { key: "reacted", value: totals.reacted, alert: false },
    {
      key: "reaction_rate",
      value: totals.reactionRate === null ? "—" : percent(totals.reactionRate),
      alert: totals.reactionRate !== null && totals.reactionRate < 0.5,
    },
    { key: "median", value: duration(totals.reactionSeconds.median), alert: false },
    { key: "max", value: duration(totals.reactionSeconds.max), alert: false },
    { key: "pending", value: totals.pendingEvents, alert: false },
    { key: "overdue", value: totals.overdue, alert: totals.overdue > 0 },
    { key: "superseded", value: totals.supersededEvents, alert: false },
    ...(totals.negativeReactions > 0
      ? [{ key: "negative", value: totals.negativeReactions, alert: true }]
      : []),
  ]
})

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
  font-size: 13px;
  color: #6b7280;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.windowButton,
.refresh {
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

.refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.banner {
  padding: 12px 16px;
  margin-bottom: 12px;
  font-size: 14px;
  border-radius: 10px;
}

.bannerDanger {
  color: #991b1b;
  background: #fee2e2;
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

.table td {
  font-variant-numeric: tabular-nums;
}

.sortable {
  cursor: pointer;
  user-select: none;
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

.valueDanger {
  color: #b91c1c;
  font-weight: 600;
}

.note {
  margin-left: 4px;
  font-size: 12px;
  color: #9ca3af;
}

.legend {
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.6;
  color: #6b7280;
}

.empty {
  padding: 24px;
  color: #6b7280;
  text-align: center;
}
</style>
