<template>
  <LandingShowcase
    id="vehicle-history"
    :eyebrow="t('landing.history.eyebrow')"
    :title="t('landing.history.title')"
    :lead="t('landing.history.lead')"
    :features="features"
    reverse
    alt
    :demo-class="$style.demo"
  >
    <div
      :class="['ld-card', $style.card]"
      :aria-label="t('landing.history.aria')"
    >
      <div :class="$style.head">
        <span :class="$style.icon">
          <svg
            width="23"
            height="26"
            viewBox="0 0 24 28"
            fill="none"
            aria-hidden="true"
          ><path
            d="M14 3H6a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V10zM14 3v7h7M8 15h9M8 19h6"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          /></svg>
        </span>
        <div>
          <h4>{{ t("landing.history.heading") }}</h4>
          <p>{{ t("landing.history.car") }}</p>
        </div>
        <span :class="$style.sample">{{ t("landing.history.sample") }}</span>
      </div>

      <div
        :class="$style.tabs"
        role="tablist"
        :aria-label="t('landing.history.tabsAria')"
      >
        <button
          v-for="(tab, index) in tabs"
          :id="`history-tab-${tab.key}`"
          :key="tab.key"
          type="button"
          role="tab"
          :class="[$style.tab, active === tab.key && $style.tab_on]"
          :aria-selected="active === tab.key"
          :aria-controls="`history-panel-${tab.key}`"
          :tabindex="active === tab.key ? 0 : -1"
          @click="active = tab.key"
          @keydown="onTabKeydown($event, index)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div
        v-if="active === 'service'"
        id="history-panel-service"
        :class="[$style.panel, 'ld-enter']"
        role="tabpanel"
        aria-labelledby="history-tab-service"
        tabindex="0"
      >
        <div :class="$style.panelHeading">
          <h5>{{ t("landing.history.serviceHeading") }}</h5>
          <span>{{ t("landing.history.serviceCount") }}</span>
        </div>
        <ol :class="$style.visits">
          <li
            v-for="visit in visits"
            :key="visit.iso"
          >
            <div :class="$style.visitMeta">
              <time :datetime="visit.iso">{{ visit.date }}</time>
              <strong>{{ visit.mileage }}</strong>
            </div>
            <p>{{ visit.text }}</p>
          </li>
        </ol>
        <div :class="$style.conclusion">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          ><circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            stroke-width="1.7"
          /><path
            d="M12 7v6m0 4v.1"
            stroke="currentColor"
            stroke-width="1.9"
            stroke-linecap="round"
          /></svg>
          <div>
            <strong>{{ t("landing.history.serviceConclusion") }}</strong>
            <p>{{ t("landing.history.serviceConclusionText") }}</p>
          </div>
        </div>
      </div>

      <div
        v-else
        id="history-panel-insurance"
        :class="[$style.panel, 'ld-enter']"
        role="tabpanel"
        aria-labelledby="history-tab-insurance"
        tabindex="0"
      >
        <div :class="$style.panelHeading">
          <h5>{{ t("landing.history.insuranceHeading") }}</h5>
          <span>{{ t("landing.history.insuranceCount") }}</span>
        </div>
        <div
          v-for="claim in claims"
          :key="claim.period"
          :class="$style.claim"
        >
          <div :class="$style.claimTop">
            <span>{{ claim.period }}</span>
            <strong>{{ claim.sum }}</strong>
          </div>
          <p>{{ claim.text }}</p>
        </div>
        <div :class="$style.conclusion">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          ><circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            stroke-width="1.7"
          /><path
            d="M12 7v6m0 4v.1"
            stroke="currentColor"
            stroke-width="1.9"
            stroke-linecap="round"
          /></svg>
          <div>
            <strong>{{ t("landing.history.insuranceConclusion") }}</strong>
            <p>{{ t("landing.history.insuranceConclusionText") }}</p>
          </div>
        </div>
      </div>

      <div :class="$style.mileage">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        ><path
          d="m4 16 6-6 4 3 6-8M15 5h5v5"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        /></svg>{{ t("landing.history.mileage") }}
      </div>
    </div>

    <a
      :href="landingHistoryReportExample"
      :class="['ld-btn', 'ld-btn--ghost', $style.example]"
      target="_blank"
      rel="noopener noreferrer"
    >
      {{ t("landing.history.examples") }}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      ><path
        d="M7 17 17 7M7 7h10v10"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      /></svg>
    </a>
  </LandingShowcase>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { landingHistoryReportExample } from "@/constants/landing"
import { useLandingMessages } from "@/composables/useLandingMessages"

type HistoryTab = "service" | "insurance"

interface Visit {
  date: string
  iso: string
  mileage: string
  text: string
}

interface Claim {
  period: string
  sum: string
  text: string
}

const { t } = useI18n()
const { list, objects } = useLandingMessages()

const features = list("landing.history.features")
const visits = objects<Visit>("landing.history.visits")
const claims = objects<Claim>("landing.history.claims")

const tabs = computed<{ key: HistoryTab, label: string }[]>(() => [
  { key: "service", label: t("landing.history.tabService") },
  { key: "insurance", label: t("landing.history.tabInsurance") },
])

const active = ref<HistoryTab>("service")

const onTabKeydown = (event: KeyboardEvent, index: number) => {
  const count = tabs.value.length
  let next: number
  if (event.key === "ArrowRight") {
    next = (index + 1) % count
  }
  else if (event.key === "ArrowLeft") {
    next = (index + count - 1) % count
  }
  else if (event.key === "Home") {
    next = 0
  }
  else if (event.key === "End") {
    next = count - 1
  }
  else {
    return
  }
  event.preventDefault()
  active.value = tabs.value[next].key
  const target = document.getElementById(`history-tab-${active.value}`)
  target?.focus({ preventScroll: true })
}
</script>

<style module>
.demo {
  width: 100%;
  max-width: 520px;
}

.head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
}

.head h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -.02em;
  line-height: 1.3;
}

.head p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ld-muted);
}

.icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 44px;
  background: var(--ld-accent-wash);
  border: 1px solid #f8d9db;
  border-radius: 10px;
  color: var(--ld-accent);
}

.sample {
  margin-left: auto;
  font-size: 10px;
  color: var(--ld-muted);
  background: var(--ld-panel);
  padding: 4px 7px;
  border-radius: 6px;
  white-space: nowrap;
}

.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  padding: 5px;
  margin: 0 18px 18px;
  background: var(--ld-panel);
  border: 1px solid var(--ld-line);
  border-radius: 10px;
}

.tab {
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  line-height: 1.35;
  min-height: 39px;
  padding: 8px 4px;
  border: 0;
  border-radius: 7px;
  color: var(--ld-muted);
  background: transparent;
  cursor: pointer;
  transition: background .2s, color .2s, box-shadow .2s;
}

.tab_on {
  background: #fff;
  color: var(--ld-ink);
  box-shadow: 0 1px 4px #0e111610;
}

.tab:focus-visible {
  outline: 2px solid var(--ld-accent);
  outline-offset: 3px;
}

.panel {
  padding: 0 20px 18px;
}

.panelHeading {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
  margin-bottom: 14px;
}

.panelHeading h5 {
  margin: 0;
  font-size: 12px;
  font-weight: 650;
  color: var(--ld-ink-soft);
}

.panelHeading span {
  font-size: 11px;
  color: var(--ld-muted);
}

.visits {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0 0 0 15px;
}

.visits::before {
  content: "";
  position: absolute;
  left: 3px;
  top: 8px;
  bottom: 27px;
  width: 1px;
  background: var(--ld-line-strong);
}

.visits li {
  position: relative;
  padding: 0 0 14px 7px;
}

.visits li:last-child {
  padding-bottom: 0;
}

.visits li::before {
  content: "";
  position: absolute;
  left: -15px;
  top: 6px;
  width: 7px;
  height: 7px;
  background: #fff;
  border: 2px solid var(--ld-accent);
  border-radius: 50%;
}

.visitMeta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
  color: var(--ld-muted);
  font-variant-numeric: tabular-nums;
}

.visitMeta strong {
  color: var(--ld-ink-soft);
  font-size: 11px;
  font-weight: 650;
}

.visits p {
  margin: 3px 0 0;
  font-size: 12px;
  font-weight: 550;
  line-height: 1.45;
}

.conclusion {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-top: 17px;
  padding: 12px;
  border-radius: 9px;
  background: var(--ld-amber-wash);
}

.conclusion svg {
  color: #ab691d;
  flex: none;
  margin-top: 1px;
}

.conclusion strong {
  display: block;
  font-size: 12px;
  color: #87521b;
  font-weight: 650;
}

.conclusion p {
  margin: 3px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: #916d43;
}

.claim {
  border: 1px solid var(--ld-line);
  border-radius: 9px;
  padding: 12px;
  margin-bottom: 9px;
}

.claim:last-of-type {
  margin-bottom: 0;
}

.claimTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
  color: var(--ld-muted);
  margin-bottom: 5px;
}

.claimTop strong {
  font-size: 13px;
  color: var(--ld-ink);
  font-variant-numeric: tabular-nums;
}

.claim p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ld-ink-soft);
}

.mileage {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--ld-line);
  font-size: 11px;
  color: var(--ld-muted);
  line-height: 1.5;
  background: #fcfdfc;
}

.mileage svg {
  color: var(--ld-green);
  flex: none;
}

.demo .example {
  margin-top: 18px;
  width: 100%;
  font-size: 13px;
  padding: 12px 16px;
  box-shadow: var(--ld-shadow-1);
}

.example svg {
  width: 15px;
  height: 15px;
  flex: none;
}

@media (max-width: 640px) {
  .head {
    padding: 17px 15px;
    gap: 10px;
  }

  .head h4 {
    font-size: 16px;
  }

  .head p {
    font-size: 11px;
  }

  .icon {
    width: 34px;
    height: 39px;
  }

  .sample {
    font-size: 9px;
    padding: 3px 5px;
  }

  .tabs {
    margin: 0 12px 16px;
  }

  .tab {
    font-size: 11px;
    min-height: 38px;
  }

  .panel {
    padding: 0 15px 16px;
  }

  .mileage {
    padding: 12px 15px;
  }

  .visitMeta {
    font-size: 10px;
  }

  .panelHeading {
    gap: 6px;
  }

  .panelHeading h5 {
    font-size: 11px;
  }

  .panelHeading span {
    font-size: 10px;
  }
}
</style>
