<template>
  <LandingShowcase
    id="requests"
    :eyebrow="t('landing.requests.eyebrow')"
    :title="t('landing.requests.title')"
    :lead="t('landing.requests.lead')"
    :features="features"
    align-start
    :demo-class="$style.demo"
  >
    <template #action>
      <NuxtLink
        :to="catalogPage"
        class="ld-btn ld-btn--primary"
      >
        {{ t("landing.requests.catalog") }}
      </NuxtLink>
    </template>
    <div
      ref="root"
      :aria-label="t('landing.requests.aria')"
    >
      <div :class="['ld-card', $style.window]">
        <div :class="$style.top">
          <div :class="$style.crumb">
            <span>{{ t("landing.requests.crumbCabinet") }}</span>
            <span aria-hidden="true">/</span>
            <span>{{ t("landing.requests.crumbRequests") }}</span>
          </div>
          <div :class="$style.heading">
            <h4>{{ t("landing.requests.heading") }} <span :class="$style.total">{{ requests.length }}</span></h4>
            <button
              type="button"
              :class="$style.newBtn"
              aria-haspopup="dialog"
              @click="isAuthOpen = true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              ><path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              /></svg>{{ t("landing.requests.new") }}
            </button>
          </div>
        </div>

        <div
          :class="$style.tabs"
          role="group"
          :aria-label="t('landing.requests.tabsAria')"
        >
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            :class="[$style.tab, filter === tab.key && $style.tab_on]"
            :aria-pressed="filter === tab.key"
            @click="selectFilter(tab.key, tab.label)"
          >
            {{ tab.label }}
          </button>
        </div>

        <div :class="$style.list">
          <article
            v-for="request in visible"
            :key="request.id"
            :class="[$style.row, request.id === selected && $style.row_open]"
          >
            <button
              type="button"
              :class="$style.summary"
              :aria-expanded="request.id === selected"
              :aria-controls="`rq-detail-${request.id}`"
              @click="toggleRequest(request.id)"
            >
              <span :class="$style.summaryMain">
                <span :class="$style.ident">
                  <span :class="$style.number">№ {{ request.id }}</span>
                  <span>{{ t("landing.requests.ident") }}</span>
                </span>
                <span :class="$style.model">{{ request.model }} <span :class="$style.year">{{ request.years }}</span></span>
              </span>
              <span :class="$style.summarySide">
                <span :class="[$style.status, request.status === 'active' ? $style.status_active : $style.status_done]">
                  {{ t(`landing.requests.status.${request.status}`) }}
                </span>
                <span :class="$style.found">
                  {{ t("landing.requests.found") }} <strong>{{ request.matches.length }}</strong>
                  <svg
                    :class="$style.chevron"
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  ><path
                    d="m3 4 3 3 3-3"
                    stroke="currentColor"
                    stroke-width="1.3"
                  /></svg>
                </span>
              </span>
            </button>

            <div
              v-if="request.id === selected"
              :id="`rq-detail-${request.id}`"
              :class="['ld-enter', $style.details]"
            >
              <p :class="$style.spec">
                {{ t(`landing.requests.specs.${request.model}`) }}
              </p>
              <div :class="$style.limits">
                <div :class="$style.limit">
                  <span>{{ t("landing.requests.priceTo") }}</span>
                  <strong>{{ formatInt(request.price, locale) }}</strong>
                </div>
                <div :class="$style.limit">
                  <span>{{ t("landing.requests.mileageTo") }}</span>
                  <strong>{{ formatInt(request.mileage, locale) }}</strong>
                </div>
              </div>

              <template v-if="request.matches.length">
                <button
                  type="button"
                  :class="$style.resultsToggle"
                  :aria-expanded="resultsOpen"
                  :aria-controls="`rq-matches-${request.id}`"
                  @click="toggleResults(request.id)"
                >
                  <span>
                    <span
                      :class="$style.check"
                      aria-hidden="true"
                    >✓</span>
                    {{ t("landing.requests.variants", { n: request.matches.length }, request.matches.length) }}
                  </span>
                  <span>{{ resultsOpen ? t("landing.requests.hide") : t("landing.requests.view") }}</span>
                </button>
                <div
                  v-if="resultsOpen"
                  :id="`rq-matches-${request.id}`"
                  :class="$style.matches"
                >
                  <div
                    v-for="match in request.matches"
                    :key="match.year + match.km"
                    :class="['ld-enter', $style.match]"
                  >
                    <svg
                      width="30"
                      height="20"
                      viewBox="0 0 40 26"
                      fill="none"
                      aria-hidden="true"
                    ><path
                      d="m6 14 5-8h17l5 8 3 2v6H4v-6zM11 6l-2 8h23M8 18h4m16 0h4"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linejoin="round"
                    /><circle
                      cx="10"
                      cy="23"
                      r="2"
                      fill="currentColor"
                    /><circle
                      cx="30"
                      cy="23"
                      r="2"
                      fill="currentColor"
                    /></svg>
                    <div>
                      <b>{{ request.model }} {{ match.year }}</b>
                      <small>{{ t("landing.requests.match", { mileage: formatInt(match.km, locale) }) }}</small>
                    </div>
                    <span :class="$style.matchPrice">{{ formatInt(match.price, locale) }} ¥</span>
                  </div>
                </div>
              </template>
              <div
                v-else
                :class="$style.waiting"
              >
                {{ t("landing.requests.waiting") }}
              </div>
            </div>
          </article>

          <p
            v-if="!visible.length"
            :class="$style.empty"
          >
            {{ t("landing.requests.empty") }}
          </p>
        </div>

        <div :class="$style.foot">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          ><path
            d="m5 12 4 4L19 6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          /></svg>{{ t("landing.requests.foot") }}
        </div>
      </div>

      <p :class="$style.hint">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        ><path
          d="m7 3 11 10-6 1-3 6z"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linejoin="round"
        /></svg>{{ t("landing.requests.hint") }}
      </p>
      <span
        class="ld-sr"
        role="status"
        aria-live="polite"
      >{{ announcement }}</span>

      <LandingAuthDialog v-model="isAuthOpen" />
    </div>
  </LandingShowcase>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { formatInt } from "@/utils/formatters"
import { catalogPage } from "@/constants/pages"
import { useLandingMessages } from "@/composables/useLandingMessages"

type RequestStatus = "active" | "done"
type RequestFilter = "all" | RequestStatus

interface DemoMatch {
  year: number
  km: number
  price: number
}

interface DemoRequest {
  id: string
  model: string
  years: string
  price: number
  mileage: number
  status: RequestStatus
  matches: DemoMatch[]
}

const { t, locale } = useI18n()
const { list } = useLandingMessages()

const features = list("landing.requests.features")

const requests: DemoRequest[] = [
  {
    id: "0136",
    model: "Audi Q3",
    years: "2022–2024",
    price: 150000,
    mileage: 30000,
    status: "active",
    matches: [
      { year: 2023, km: 18200, price: 142000 },
      { year: 2022, km: 24600, price: 136500 },
      { year: 2024, km: 12100, price: 149000 },
    ],
  },
  {
    id: "0128",
    model: "Subaru Forester",
    years: "2021–2023",
    price: 225000,
    mileage: 30000,
    status: "done",
    matches: [
      { year: 2022, km: 21600, price: 189000 },
      { year: 2023, km: 15400, price: 208000 },
    ],
  },
  {
    id: "0129",
    model: "Audi Q3",
    years: "2022–2023",
    price: 185000,
    mileage: 50000,
    status: "done",
    matches: [
      { year: 2023, km: 31000, price: 164000 },
    ],
  },
]

const tabs = computed<{ key: RequestFilter, label: string }[]>(() => [
  { key: "all", label: t("landing.requests.tabs.all") },
  { key: "active", label: t("landing.requests.tabs.active") },
  { key: "done", label: t("landing.requests.tabs.done") },
])

const root = ref<HTMLElement | null>(null)
const filter = ref<RequestFilter>("all")
const selected = ref<string | null>("0136")
const resultsOpen = ref(false)
const isAuthOpen = ref(false)
const announcement = ref("")

const visible = computed(() => requests.filter(request => filter.value === "all" || request.status === filter.value))

const selectFilter = (key: RequestFilter, label: string) => {
  filter.value = key
  resultsOpen.value = false
  selected.value = visible.value.length ? visible.value[0].id : null
  announcement.value = t("landing.requests.announce", { tab: label })
}

const toggleRequest = (id: string) => {
  selected.value = selected.value === id ? null : id
  resultsOpen.value = false
}

const toggleResults = (id: string) => {
  selected.value = id
  resultsOpen.value = !resultsOpen.value
}
</script>

<style module>
.demo {
  width: 100%;
  max-width: 520px;
  isolation: isolate;
}

.demo button {
  cursor: pointer;
}

.demo button:focus-visible {
  outline: 2px solid var(--ld-accent);
  outline-offset: 3px;
}

.window {
  text-align: left;
}

.top {
  padding: 21px 22px 17px;
}

.crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10.5px;
  color: var(--ld-muted-2);
  margin-bottom: 12px;
}

.crumb span:last-child {
  color: var(--ld-muted);
}

.heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.heading h4 {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -.025em;
}

.total {
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0;
  color: var(--ld-muted);
  background: var(--ld-panel-2);
  padding: 3px 7px;
  border-radius: 6px;
}

.newBtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 11px;
  background: var(--ld-green-wash);
  border: 1px solid #bfe6c9;
  border-radius: 8px;
  color: #217c43;
  font-size: 11.5px;
  font-weight: 650;
  white-space: nowrap;
  transition: background .2s, transform .2s;
}

.newBtn:hover {
  background: #d5f1de;
  transform: translateY(-1px);
}

.newBtn svg {
  width: 14px;
  height: 14px;
}

.tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: center;
  gap: 6px;
  padding: 12px 14px;
  border-top: 1px solid var(--ld-line);
  border-bottom: 1px solid var(--ld-line);
  background: #fff;
}

.tab {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  line-height: 1.2;
  border: 0;
  background: transparent;
  color: var(--ld-muted);
  font-size: 11.5px;
  padding: 8px 6px;
  border-radius: 7px;
  transition: background .2s, color .2s;
  white-space: nowrap;
}

.tab_on {
  background: var(--ld-ink);
  color: #fff;
}

.list {
  display: grid;
  gap: 8px;
  align-content: start;
  padding: 14px;
  background: linear-gradient(#f8f9fb, #fff);
}

.row {
  border: 1px solid var(--ld-line);
  border-radius: 11px;
  background: #fff;
  overflow: hidden;
}

.row_open {
  border-color: #f0bfc1;
  box-shadow: 0 3px 12px rgba(225, 29, 36, .045);
}

.summary {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  width: 100%;
  padding: 13px 14px;
  text-align: left;
  background: #fff;
  border: 0;
  color: var(--ld-ink);
}

.summary:hover {
  background: #fcfcfd;
}

.summaryMain {
  min-width: 0;
}

.ident {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: var(--ld-muted-2);
  margin-bottom: 4px;
}

.number {
  color: var(--ld-blue);
  font-variant-numeric: tabular-nums;
}

.model {
  display: block;
  font-size: 13px;
  font-weight: 750;
  letter-spacing: -.015em;
  line-height: 1.4;
}

.year {
  font-weight: 500;
  color: var(--ld-muted);
  margin-left: 5px;
  font-size: 11px;
  white-space: nowrap;
}

.summarySide {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 9.5px;
  line-height: 1.5;
  white-space: nowrap;
}

.status_active {
  color: #a66a1b;
  background: var(--ld-amber-wash);
}

.status_active::before {
  content: "";
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
}

.status_done {
  color: #258348;
  background: var(--ld-green-wash);
}

.found {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: var(--ld-muted);
}

.found strong {
  color: var(--ld-green);
  font-weight: 750;
}

.chevron {
  transition: transform .2s;
}

.row_open .chevron {
  transform: rotate(180deg);
}

.details {
  padding: 0 14px 13px;
}

.spec {
  margin: 0 0 12px;
  font-size: 10.5px;
  color: var(--ld-muted);
}

.limits {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.limit {
  display: grid;
  gap: 2px;
  padding: 9px 11px;
  background: var(--ld-panel);
  border-radius: 7px;
}

.limit span {
  font-size: 9px;
  color: var(--ld-muted);
}

.limit strong {
  font-size: 13px;
  letter-spacing: -.01em;
  font-variant-numeric: tabular-nums;
}

.resultsToggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 11px;
  border: 0;
  border-radius: 7px;
  padding: 10px 11px;
  color: #258348;
  background: var(--ld-green-wash);
  font-size: 11px;
  font-weight: 650;
  transition: background .2s;
}

.resultsToggle:hover {
  background: #d5f1de;
}

.resultsToggle > span:first-child {
  display: flex;
  align-items: center;
  gap: 7px;
}

.check {
  display: grid;
  place-items: center;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: var(--ld-green);
  color: #fff;
  font-size: 10px;
}

.matches {
  display: grid;
  gap: 6px;
  margin-top: 9px;
}

.match {
  display: grid;
  grid-template-columns: 30px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 9px 0;
  border-top: 1px solid var(--ld-line);
  font-size: 10px;
}

.match svg {
  color: var(--ld-muted-2);
}

.match b {
  display: block;
  font-weight: 650;
  font-size: 10.5px;
}

.match small {
  color: var(--ld-muted);
  font-size: 9px;
}

.matchPrice {
  font-weight: 700;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.waiting {
  margin-top: 11px;
  font-size: 11px;
  color: var(--ld-muted);
}

.empty {
  margin: 0;
  padding: 34px 16px;
  text-align: center;
  color: var(--ld-muted);
  font-size: 12px;
}

.foot {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 12px 20px;
  border-top: 1px solid var(--ld-line);
  color: var(--ld-muted);
  font-size: 10px;
  line-height: 1.5;
}

.foot svg {
  width: 14px;
  height: 14px;
  flex: none;
  color: var(--ld-accent);
}

.hint {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 14px 2px 0;
  color: var(--ld-muted-2);
  font-size: 11px;
}

.hint svg {
  width: 13px;
  height: 13px;
  flex: none;
}

@media (max-width: 640px) {
  .top {
    padding: 17px 15px 14px;
  }

  .tabs {
    padding: 10px;
    gap: 4px;
  }

  .tab {
    min-height: 36px;
    padding: 8px 4px;
    font-size: 11px;
  }

  .list {
    padding: 10px;
  }

  .summary {
    padding: 11px;
    gap: 6px;
  }

  .details {
    padding: 0 11px 11px;
  }

  .model {
    font-size: 12px;
  }

  .year {
    font-size: 10px;
  }

  .heading h4 {
    font-size: 19px;
  }

  .status,
  .found {
    font-size: 9px;
  }

  .foot {
    padding: 11px 15px;
  }

  .match {
    grid-template-columns: 24px 1fr auto;
    gap: 5px;
  }

  .match svg {
    width: 24px;
  }
}
</style>
