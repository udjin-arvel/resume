<template>
  <LandingShowcase
    :eyebrow="t('landing.events.eyebrow')"
    :title="t('landing.events.title')"
    :lead="t('landing.events.lead')"
    :features="features"
  >
    <div class="ld-card">
      <div :class="$style.ph">
        <h4>{{ t("landing.events.heading") }}</h4>
        <span :class="['ld-live', $style.live]">{{ t("landing.events.live") }}</span>
      </div>
      <div
        v-for="(item, index) in items"
        :key="item.title"
        :class="$style.evt"
      >
        <span
          :class="$style.eic"
          :style="{ background: icons[index].color }"
        >
          <LandingEventIcon :kind="icons[index].kind" />
        </span>
        <div :class="$style.etxt">
          <b>{{ item.title }}</b>
          <span>{{ item.text }}</span>
        </div>
        <span :class="$style.etime">{{ item.time }}</span>
      </div>
    </div>
  </LandingShowcase>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { useLandingMessages } from "@/composables/useLandingMessages"

interface EventItem {
  title: string
  text: string
  time: string
}

const { t } = useI18n()
const { list, objects } = useLandingMessages()

const features = list("landing.events.features")
const items = objects<EventItem>("landing.events.items")

const icons: { color: string, kind: "check" | "booking" | "video" | "truck" }[] = [
  { color: "var(--ld-green)", kind: "check" },
  { color: "var(--ld-blue)", kind: "booking" },
  { color: "var(--ld-accent)", kind: "video" },
  { color: "var(--ld-muted-2)", kind: "truck" },
]
</script>

<style module>
.ph {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--ld-line);
}

.ph .live {
  gap: 6px;
  font-size: 11px;
}

.ph .live::before {
  width: 7px;
  height: 7px;
}

.ph h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 750;
}

.evt {
  display: flex;
  gap: 13px;
  padding: 15px 20px;
  border-bottom: 1px solid var(--ld-line);
  transition: background .18s ease;
}

.evt:last-child {
  border-bottom: none;
}

.evt:hover {
  background: var(--ld-panel);
}

.eic {
  display: grid;
  place-items: center;
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  color: #fff;
}

.etxt {
  flex: 1;
  min-width: 0;
}

.etxt b {
  font-size: 14px;
  font-weight: 650;
  letter-spacing: -.01em;
}

.etxt span {
  display: block;
  margin-top: 2px;
  font-size: 12.5px;
  color: var(--ld-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.etime {
  flex: none;
  align-self: center;
  font-size: 11.5px;
  color: var(--ld-muted-2);
}
</style>
