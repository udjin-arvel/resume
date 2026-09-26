<template>
  <div class="mx-auto">
    <div :class="$style.head">
      <p :class="$style.hint">
        {{ t('admin_main.source_checks.hint', { sla: stats?.slaMinutes ?? 0, tick: stats?.tickMinutes ?? 0 }) }}
        <span v-if="stats">
          {{ t('admin_main.source_checks.window_hint', {
            start: stats.window.startsAt,
            ready: stats.window.readyBy,
            stop: stats.window.stopsAt,
          }) }}
        </span>
      </p>

      <div :class="$style.controls">
        <button
          v-for="option in windowOptions"
          :key="option"
          type="button"
          :class="[$style.windowButton, hours === option ? $style.windowButtonActive : '']"
          @click="selectWindow(option)"
        >
          {{ t('admin_main.source_checks.window_' + option) }}
        </button>
        <button
          type="button"
          :class="$style.refresh"
          :disabled="loading"
          @click="load"
        >
          {{ t('admin_main.source_checks.refresh') }}
        </button>
      </div>
    </div>

    <div
      v-if="!loading && stats && !stats.enabled"
      :class="[$style.banner, $style.bannerWarning]"
    >
      {{ t('admin_main.source_checks.disabled') }}
    </div>

    <div
      v-if="!loading && stats && !stats.window.open"
      :class="[$style.banner, $style.bannerInfo]"
    >
      {{ t('admin_main.source_checks.window_closed', {
        start: stats.window.startsAt,
        stop: stats.window.stopsAt,
        now: stats.window.localTime,
      }) }}
    </div>

    <div
      v-for="source in degradedSources"
      :key="'degraded-' + source.source"
      :class="[$style.banner, $style.bannerDanger]"
    >
      {{ t('admin_main.source_checks.degraded', { source: source.source, share: percent(source.health.brokenShare) }) }}
    </div>

    <div
      v-if="stats"
      :class="$style.container"
    >
      <div :class="$style.sectionTitle">
        {{ t('admin_main.source_checks.queue_title') }}
      </div>
      <div :class="$style.metrics">
        <div
          v-for="metric in queueMetrics"
          :key="metric.key"
          :class="[$style.metric, metric.alert ? $style.metricAlert : '']"
        >
          <span :class="$style.metricValue">{{ metric.value }}</span>
          <span :class="$style.metricLabel">{{ t('admin_main.source_checks.queue.' + metric.key) }}</span>
        </div>
      </div>
    </div>

    <div
      v-for="source in stats?.sources ?? []"
      :key="source.source"
      :class="$style.container"
    >
      <div :class="$style.sourceHead">
        <div :class="$style.sectionTitle">
          {{ source.source }}
        </div>
        <span :class="[$style.badge, source.health.degraded ? $style.badgeDanger : $style.badgeOk]">
          {{ source.health.degraded ? t('admin_main.source_checks.state_degraded') : t('admin_main.source_checks.state_ok') }}
        </span>
      </div>

      <div :class="$style.metrics">
        <div :class="$style.metric">
          <span :class="$style.metricValue">{{ source.monitored }}</span>
          <span :class="$style.metricLabel">{{ t('admin_main.source_checks.source.monitored') }}</span>
        </div>
        <div :class="$style.metric">
          <span :class="$style.metricValue">{{ source.checks }}</span>
          <span :class="$style.metricLabel">{{ t('admin_main.source_checks.source.checks') }}</span>
        </div>
        <div :class="[$style.metric, isLowSuccess(source) ? $style.metricAlert : '']">
          <span :class="$style.metricValue">{{ source.successRate === null ? '—' : percent(source.successRate) }}</span>
          <span :class="$style.metricLabel">{{ t('admin_main.source_checks.source.success_rate') }}</span>
        </div>
        <div :class="$style.metric">
          <span :class="$style.metricValue">{{ source.avgDurationMs === null ? '—' : seconds(source.avgDurationMs) }}</span>
          <span :class="$style.metricLabel">{{ t('admin_main.source_checks.source.avg_duration') }}</span>
        </div>
      </div>

      <div :class="$style.breakdown">
        <div :class="$style.breakdownGroup">
          <div :class="$style.breakdownTitle">
            {{ t('admin_main.source_checks.outcomes_title') }}
          </div>
          <div
            v-for="key in outcomeKeys"
            :key="key"
            :class="$style.breakdownRow"
          >
            <span>{{ t('admin_main.source_checks.outcome.' + key) }}</span>
            <span :class="$style.breakdownValue">{{ source.outcomes[key] ?? 0 }}</span>
          </div>
        </div>

        <div :class="$style.breakdownGroup">
          <div :class="$style.breakdownTitle">
            {{ t('admin_main.source_checks.failures_title') }}
          </div>
          <div
            v-for="key in failureKeys"
            :key="key"
            :class="$style.breakdownRow"
          >
            <span>{{ t('admin_main.source_checks.failure.' + key) }}</span>
            <span :class="[$style.breakdownValue, key === 'structure' && source.failures.structure > 0 ? $style.valueDanger : '']">
              {{ source.failures[key] ?? 0 }}
            </span>
          </div>
        </div>

        <div :class="$style.breakdownGroup">
          <div :class="$style.breakdownTitle">
            {{ t('admin_main.source_checks.timeline_title') }}
          </div>
          <div :class="$style.breakdownRow">
            <span>{{ t('admin_main.source_checks.source.failing_listings') }}</span>
            <span :class="[$style.breakdownValue, source.failingListings > 0 ? $style.valueDanger : '']">
              {{ source.failingListings }}
            </span>
          </div>
          <div :class="$style.breakdownRow">
            <span>{{ t('admin_main.source_checks.source.health_window', { minutes: source.health.windowMinutes }) }}</span>
            <span :class="$style.breakdownValue">{{ percent(source.health.brokenShare) }}</span>
          </div>
        </div>
      </div>

      <div
        v-if="charts[source.source]?.length"
        :class="$style.chart"
      >
        <div
          v-for="bar in charts[source.source]"
          :key="bar.bucket"
          :class="$style.chartColumn"
          :title="bar.title"
        >
          <div :class="$style.chartBar">
            <div
              :class="$style.chartFailed"
              :style="{ height: bar.failedHeight }"
            />
            <div
              :class="$style.chartOk"
              :style="{ height: bar.okHeight }"
            />
          </div>
          <span :class="$style.chartLabel">{{ bar.label }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="stats?.recentFailures?.length"
      :class="$style.container"
    >
      <div :class="$style.sectionTitle">
        {{ t('admin_main.source_checks.recent_title') }}
      </div>
      <p :class="$style.note">
        {{ t('admin_main.source_checks.recent_hint', { count: stats.failureLogAfter }) }}
      </p>
      <div :class="$style.tableWrap">
        <table :class="$style.table">
          <thead>
            <tr>
              <th>{{ t('admin_main.source_checks.table.time') }}</th>
              <th>{{ t('admin_main.source_checks.table.source') }}</th>
              <th>{{ t('admin_main.source_checks.table.listing') }}</th>
              <th>{{ t('admin_main.source_checks.table.kind') }}</th>
              <th>{{ t('admin_main.source_checks.table.fail_count') }}</th>
              <th>{{ t('admin_main.source_checks.table.reason') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in stats.recentFailures"
              :key="row.id"
            >
              <td>{{ dateTime(row.createdAt) }}</td>
              <td>{{ row.source }}</td>
              <td>
                <NuxtLink
                  :class="$style.link"
                  :to="`/personal/listings/${row.listingId}`"
                >
                  #{{ row.listingId }}
                </NuxtLink>
              </td>
              <td>
                <span :class="[$style.kind, row.failureKind === 'structure' ? $style.kindDanger : '']">
                  {{ row.failureKind ? t('admin_main.source_checks.failure.' + row.failureKind) : '—' }}
                </span>
              </td>
              <td>{{ row.failCount }}</td>
              <td :class="$style.reason">
                {{ row.reason ?? '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p
      v-if="!loading && stats && !stats.sources.some(source => source.checks > 0)"
      :class="$style.empty"
    >
      {{ t('admin_main.source_checks.empty') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { RoleAdmin } from "@/constants/roles"
import { useApiSourceChecks } from "@/composables/api/useApiSourceChecks"
import type { SourceCheckSource, SourceCheckStats } from "@/types/responses/sourceChecks"

definePageMeta({
  auth: true,
  layout: "personal",
  roles: [RoleAdmin],
})

const { t, locale } = useI18n()
const { getSourceCheckStats } = useApiSourceChecks()

const windowOptions = [24, 168, 720]
const outcomeKeys = ["ok", "priceChanged", "gone", "unpublished", "suppressed", "failed"] as const
const failureKeys = ["structure", "blocked", "network", "unknown"] as const

const stats = ref<SourceCheckStats | null>(null)
const hours = ref(24)
const loading = ref(false)

const load = async () => {
  loading.value = true

  try {
    const response = await getSourceCheckStats(hours.value)
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
  load()
}

const degradedSources = computed(() => (stats.value?.sources ?? []).filter(source => source.health.degraded))

const queueMetrics = computed(() => {
  const queue = stats.value?.queue

  if (!queue) {
    return []
  }

  return [
    { key: "monitored", value: queue.monitored, alert: false },
    { key: "due_now", value: queue.dueNow, alert: false },
    { key: "in_flight", value: queue.inFlight, alert: false },
    { key: "waiting_retry", value: queue.waitingRetry, alert: queue.waitingRetry > queue.monitored / 2 },
    { key: "over_sla", value: queue.overSla, alert: queue.overSla > 0 },
    { key: "failing", value: queue.failing, alert: queue.failing > 0 },
    { key: "backlog", value: `${queue.backlog} / ${queue.maxBacklog}`, alert: queue.backlog >= queue.maxBacklog },
    { key: "pending_events", value: queue.pendingEvents, alert: false },
  ]
})

const isLowSuccess = (source: SourceCheckSource) => source.successRate !== null && source.checks > 0 && source.successRate < 0.9

const charts = computed(() => {
  const bySource: Record<string, Array<{ bucket: string, label: string, okHeight: string, failedHeight: string, title: string }>> = {}

  for (const source of stats.value?.sources ?? []) {
    const rows = (stats.value?.hourly ?? []).filter(row => row.source === source.source).slice(-48)
    const max = Math.max(1, ...rows.map(row => row.total))

    bySource[source.source] = rows.map((row) => {
      const ok = row.total - row.failed

      return {
        bucket: row.bucket,
        label: row.bucket.slice(11, 13),
        okHeight: `${Math.round((ok / max) * 100)}%`,
        failedHeight: `${Math.round((row.failed / max) * 100)}%`,
        title: `${row.bucket} — ${row.total} / ${row.failed}`,
      }
    })
  }

  return bySource
})

const percent = (value: number | null) => value === null ? "—" : `${Math.round(value * 100)}%`

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} ${t("units.second_short")}`

const dateTime = (value: string | null) => {
  if (!value) {
    return "—"
  }

  return new Date(value).toLocaleString(locale.value === "zh" ? "zh-CN" : "ru-RU")
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

.bannerWarning {
  color: #92400e;
  background: #fef3c7;
}

.bannerInfo {
  color: #1e40af;
  background: #dbeafe;
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

.sourceHead {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.badge {
  padding: 2px 10px;
  font-size: 12px;
  border-radius: 999px;
}

.badgeOk {
  color: #065f46;
  background: #d1fae5;
}

.badgeDanger {
  color: #991b1b;
  background: #fee2e2;
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

.breakdown {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.breakdownGroup {
  font-size: 13px;
}

.breakdownTitle {
  margin-bottom: 6px;
  font-weight: 600;
}

.breakdownRow {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  color: #4b5563;
  border-bottom: 1px solid #f3f4f6;
}

.breakdownValue {
  font-variant-numeric: tabular-nums;
  color: #111827;
}

.valueDanger {
  color: #b91c1c;
  font-weight: 600;
}

.chart {
  display: flex;
  gap: 2px;
  align-items: flex-end;
  height: 90px;
  margin-top: 16px;
  overflow-x: auto;
}

.chartColumn {
  display: flex;
  flex: 0 0 14px;
  flex-direction: column;
  align-items: center;
}

.chartBar {
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-start;
  width: 10px;
  height: 70px;
}

.chartOk {
  width: 100%;
  background: #93c5fd;
}

.chartFailed {
  width: 100%;
  background: #f87171;
}

.chartLabel {
  margin-top: 2px;
  font-size: 9px;
  color: #9ca3af;
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
  border-bottom: 1px solid #f3f4f6;
}

.table th {
  font-weight: 600;
  color: #6b7280;
}

.kind {
  padding: 1px 8px;
  font-size: 12px;
  background: #f3f4f6;
  border-radius: 999px;
}

.kindDanger {
  color: #991b1b;
  background: #fee2e2;
}

.reason {
  max-width: 420px;
  color: #6b7280;
  word-break: break-word;
}

.link {
  color: #2563eb;
}

.note {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.empty {
  padding: 24px;
  color: #6b7280;
  text-align: center;
}
</style>
