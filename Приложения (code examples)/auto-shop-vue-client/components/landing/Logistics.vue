<template>
  <LandingShowcase
    id="logistics"
    :eyebrow="t('landing.logistics.eyebrow')"
    :title="t('landing.logistics.title')"
    :lead="t('landing.logistics.lead')"
    :features="features"
  >
    <div class="ld-card">
      <div :class="$style.ph">
        <h4>{{ t("landing.logistics.heading") }}</h4>
        <span class="ld-pill ld-pill--blue">{{ t("landing.logistics.inTransit") }}</span>
      </div>
      <div
        v-for="car in cars"
        :key="car.name"
        :class="$style.card"
      >
        <div :class="$style.row">
          <b>{{ car.name }}</b>
          <span :class="['ld-pill', `ld-pill--${car.pill}`]">{{ car.status }}</span>
        </div>
        <div :class="$style.steps">
          <div
            v-for="(step, index) in steps"
            :key="step"
            :class="[$style.ts, index < car.step && $style.ts_done, index === car.step && $style.ts_now]"
          >
            <div :class="$style.tsdot">
              <template v-if="index < car.step">
                ✓
              </template>
              <template v-else-if="index === car.step">
                ●
              </template>
            </div>
            <div :class="$style.tsl">
              {{ step }}
            </div>
          </div>
        </div>
        <div :class="$style.port">
          {{ t("landing.logistics.port", { port: car.port }) }}
        </div>
      </div>
    </div>
  </LandingShowcase>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { useLandingMessages } from "@/composables/useLandingMessages"

interface LogisticsCar {
  name: string
  status: string
  pill: string
  step: number
  port: string
}

const { t } = useI18n()
const { list, objects } = useLandingMessages()

const features = list("landing.logistics.features")
const steps = list("landing.logistics.steps")
const cars = objects<LogisticsCar>("landing.logistics.cars")
</script>

<style module>
.ph {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--ld-line);
}

.ph h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 750;
}

.card {
  padding: 20px;
  border-bottom: 1px solid var(--ld-line);
}

.card:last-child {
  border-bottom: none;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.row b {
  font-size: 14px;
}

.steps {
  display: flex;
  align-items: flex-start;
}

.ts {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
}

.ts::before {
  content: "";
  position: absolute;
  top: 11px;
  left: -50%;
  width: 100%;
  height: 2px;
  background: var(--ld-line-strong);
  z-index: 1;
}

.ts:first-child::before {
  display: none;
}

.ts_done::before,
.ts_now::before {
  background: var(--ld-green);
}

.tsdot {
  position: relative;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid var(--ld-line-strong);
  font-size: 12px;
  color: var(--ld-muted-2);
}

.ts_done .tsdot {
  background: var(--ld-green);
  border-color: var(--ld-green);
  color: #fff;
}

.ts_now .tsdot {
  background: var(--ld-blue);
  border-color: var(--ld-blue);
  color: #fff;
  box-shadow: 0 0 0 4px var(--ld-blue-wash);
}

.tsl {
  font-size: 11px;
  color: var(--ld-muted);
  font-weight: 550;
  text-align: center;
  line-height: 1.2;
}

.ts_done .tsl,
.ts_now .tsl {
  color: var(--ld-ink-soft);
  font-weight: 650;
}

.port {
  margin-top: 16px;
  font-size: 12px;
  color: var(--ld-muted);
}
</style>
