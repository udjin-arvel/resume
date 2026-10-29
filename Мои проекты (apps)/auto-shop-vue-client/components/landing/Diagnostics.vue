<template>
  <LandingShowcase
    id="diagnostics"
    :eyebrow="t('landing.diagnostics.eyebrow')"
    :title="t('landing.diagnostics.title')"
    :lead="t('landing.diagnostics.lead')"
    :features="features"
    :demo-class="$style.demo"
  >
    <div
      :class="['ld-card', $style.card]"
      :aria-label="t('landing.diagnostics.aria')"
    >
      <div :class="$style.head">
        <div>
          <h4>{{ t("landing.diagnostics.car") }}</h4>
          <p>{{ t("landing.diagnostics.meta") }}</p>
        </div>
        <span :class="$style.sample">{{ t("landing.diagnostics.sample") }}</span>
      </div>

      <div
        :class="$style.tabs"
        role="tablist"
        :aria-label="t('landing.diagnostics.tabsAria')"
      >
        <button
          v-for="(tab, index) in tabs"
          :id="`inspect-tab-${tab.key}`"
          :key="tab.key"
          type="button"
          role="tab"
          :class="[$style.tab, active === tab.key && $style.tab_on]"
          :aria-selected="active === tab.key"
          :aria-controls="`inspect-panel-${tab.key}`"
          :tabindex="active === tab.key ? 0 : -1"
          @click="active = tab.key"
          @keydown="onTabKeydown($event, index)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div
        :id="`inspect-panel-${active}`"
        :key="active"
        :class="[$style.panel, 'ld-enter']"
        role="tabpanel"
        :aria-labelledby="`inspect-tab-${active}`"
        tabindex="0"
      >
        <ul :class="$style.findings">
          <li
            v-for="finding in findings[active].value"
            :key="finding.title"
          >
            <span
              :class="[$style.mark, $style[`mark_${finding.mark}`]]"
              aria-hidden="true"
            >{{ markSymbol(finding.mark) }}</span>
            <div>
              <h5>{{ finding.title }}</h5>
              <p>{{ finding.text }}</p>
            </div>
          </li>
        </ul>
      </div>

      <div :class="$style.photos">
        <button
          v-for="photo in photos"
          :key="photo.src"
          type="button"
          :class="$style.photo"
          :aria-label="photo.aria"
          aria-haspopup="dialog"
          @click="openPhoto(photo)"
        >
          <img
            :src="photo.src"
            :width="photo.width"
            :height="photo.height"
            :alt="photo.alt"
            loading="lazy"
          >
          <span :class="$style.photoLabel">
            {{ photo.label }}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            ><path
              d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            /></svg>
          </span>
        </button>
      </div>

      <div
        :class="$style.media"
        :aria-label="t('landing.diagnostics.mediaAria')"
      >
        <span><strong>140</strong> {{ t("landing.diagnostics.media.photos") }}</span>
        <span><strong>47</strong> {{ t("landing.diagnostics.media.defects") }}</span>
        <span><strong>8</strong> {{ t("landing.diagnostics.media.videos") }}</span>
      </div>
    </div>

    <a
      :href="diagnosticExamplePage"
      :class="['ld-btn', 'ld-btn--ghost', $style.example]"
      target="_blank"
      rel="noopener noreferrer"
    >
      {{ t("landing.diagnostics.fullReport") }}
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

    <LandingPhotoViewer
      v-model="isViewerOpen"
      :src="viewerPhoto.src"
      :alt="viewerPhoto.alt"
      :title="viewerPhoto.title"
      :caption="t('landing.diagnostics.viewer.caption')"
      :close-label="t('landing.diagnostics.viewer.close')"
    />
  </LandingShowcase>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { diagnosticExamplePage } from "@/constants/pages"
import { useLandingMessages } from "@/composables/useLandingMessages"

type InspectTab = "body" | "mechanics" | "interior"
type Mark = "warn" | "ok" | "info"

interface Finding {
  mark: Mark
  title: string
  text: string
}

interface DemoPhoto {
  src: string
  width: number
  height: number
  label: string
  title: string
  aria: string
  alt: string
}

const { t } = useI18n()
const { list, objects } = useLandingMessages()

const features = list("landing.diagnostics.features")

const findings = {
  body: objects<Finding>("landing.diagnostics.findings.body"),
  mechanics: objects<Finding>("landing.diagnostics.findings.mechanics"),
  interior: objects<Finding>("landing.diagnostics.findings.interior"),
}

const tabs = computed<{ key: InspectTab, label: string }[]>(() => [
  { key: "body", label: t("landing.diagnostics.tabs.body") },
  { key: "mechanics", label: t("landing.diagnostics.tabs.mechanics") },
  { key: "interior", label: t("landing.diagnostics.tabs.interior") },
])

const active = ref<InspectTab>("body")

const markSymbol = (mark: Mark): string => {
  if (mark === "ok") {
    return "✓"
  }
  if (mark === "info") {
    return "i"
  }
  return "!"
}

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
  const target = document.getElementById(`inspect-tab-${active.value}`)
  target?.focus({ preventScroll: true })
}

const photos = computed<DemoPhoto[]>(() => [
  {
    src: "/landing/diag-overview.jpg",
    width: 1706,
    height: 1279,
    label: t("landing.diagnostics.photos.overview"),
    title: t("landing.diagnostics.photos.overview"),
    aria: t("landing.diagnostics.photos.overviewAria"),
    alt: t("landing.diagnostics.photos.overviewAlt"),
  },
  {
    src: "/landing/diag-defect.jpg",
    width: 1279,
    height: 1706,
    label: t("landing.diagnostics.photos.defect"),
    title: t("landing.diagnostics.photos.defectTitle"),
    aria: t("landing.diagnostics.photos.defectAria"),
    alt: t("landing.diagnostics.photos.defectAlt"),
  },
])

const isViewerOpen = ref(false)
const viewerPhoto = ref<DemoPhoto>(photos.value[0])

const openPhoto = (photo: DemoPhoto) => {
  viewerPhoto.value = photo
  isViewerOpen.value = true
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
  justify-content: space-between;
  gap: 10px;
  padding: 20px;
}

.head h4 {
  margin: 0;
  font-size: 19px;
  line-height: 1.3;
  font-weight: 800;
  letter-spacing: -.025em;
}

.head p {
  margin: 5px 0 0;
  font-size: 11px;
  color: var(--ld-muted);
  font-variant-numeric: tabular-nums;
}

.sample {
  font-size: 10px;
  padding: 5px 8px;
  border-radius: 6px;
  background: var(--ld-panel);
  color: var(--ld-muted);
  white-space: nowrap;
}

.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr 1.35fr;
  gap: 4px;
  padding: 5px;
  margin: 0 18px;
  background: var(--ld-panel);
  border: 1px solid var(--ld-line);
  border-radius: 10px;
}

.tab {
  font: inherit;
  font-size: 12px;
  line-height: 1.3;
  font-weight: 650;
  padding: 9px 3px;
  min-height: 38px;
  background: transparent;
  color: var(--ld-muted);
  border: 0;
  border-radius: 7px;
  cursor: pointer;
  transition: background .2s, color .2s, box-shadow .2s;
}

.tab_on {
  background: var(--ld-ink);
  color: #fff;
  box-shadow: 0 2px 5px #0e111610;
}

.tab:focus-visible,
.photo:focus-visible {
  outline: 2px solid var(--ld-accent);
  outline-offset: 3px;
}

.panel {
  padding: 4px 20px 3px;
}

.findings {
  list-style: none;
  margin: 0;
  padding: 0;
}

.findings li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 13px 0;
  border-bottom: 1px solid var(--ld-line);
}

.findings li:last-child {
  border-bottom: 0;
}

.mark {
  display: grid;
  place-items: center;
  flex: none;
  margin-top: 2px;
  width: 19px;
  height: 19px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 750;
}

.mark_warn {
  background: var(--ld-amber-wash);
  color: #a06420;
}

.mark_ok {
  background: var(--ld-green-wash);
  color: #258348;
}

.mark_info {
  background: var(--ld-blue-wash);
  color: var(--ld-blue);
}

.findings h5 {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.4;
  font-weight: 650;
  color: var(--ld-ink-soft);
}

.findings p {
  margin: 3px 0 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--ld-muted);
}

.photos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 0 20px 14px;
}

.photo {
  position: relative;
  overflow: hidden;
  padding: 0;
  border: 1px solid var(--ld-line);
  border-radius: 9px;
  background: var(--ld-panel);
  cursor: zoom-in;
  min-width: 0;
  font: inherit;
  text-align: left;
}

.photo img {
  display: block;
  width: 100%;
  height: 88px;
  object-fit: cover;
  object-position: 50% 40%;
  transition: transform .3s ease;
}

.photo:hover img {
  transform: scale(1.04);
}

.photoLabel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  line-height: 1.4;
  font-weight: 550;
  padding: 7px 9px;
  background: #fff;
  color: var(--ld-ink-soft);
}

.photoLabel svg {
  width: 12px;
  height: 12px;
  color: var(--ld-muted);
  flex: none;
}

.media {
  display: grid;
  grid-template-columns: 1fr 1.2fr .65fr;
  padding: 12px 16px;
  border-top: 1px solid var(--ld-line);
  background: var(--ld-panel);
  text-align: center;
}

.media span {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 10px;
  color: var(--ld-muted);
  border-right: 1px solid var(--ld-line-strong);
}

.media span:last-child {
  border-right: 0;
}

.media strong {
  font-size: 13px;
  color: var(--ld-ink-soft);
  font-weight: 750;
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
    padding: 16px 14px;
  }

  .head h4 {
    font-size: 17px;
  }

  .head p {
    font-size: 10px;
  }

  .sample {
    font-size: 9px;
    padding: 4px 6px;
  }

  .tabs {
    margin: 0 12px;
  }

  .tab {
    font-size: 11px;
    padding: 8px 2px;
    min-height: 39px;
  }

  .panel {
    padding: 3px 14px;
  }

  .findings li {
    gap: 8px;
    padding: 12px 0;
  }

  .findings h5 {
    font-size: 12px;
  }

  .findings p {
    font-size: 11px;
  }

  .photos {
    padding: 0 14px 12px;
    gap: 8px;
  }

  .photo img {
    height: 78px;
  }

  .photoLabel {
    font-size: 10px;
    padding: 6px;
  }

  .media {
    padding: 11px 8px;
    gap: 3px;
  }

  .media span {
    flex-direction: column;
    gap: 1px;
    font-size: 9.5px;
  }

  .media strong {
    font-size: 14px;
  }
}
</style>
