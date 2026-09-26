<template>
  <LandingShowcase
    :eyebrow="t('landing.purchases.eyebrow')"
    :title="t('landing.purchases.title')"
    :lead="t('landing.purchases.lead')"
    :features="features"
    reverse
    alt
  >
    <div class="ld-card">
      <div :class="$style.top">
        <h4>{{ t("landing.purchases.heading") }}</h4>
        <span :class="$style.cnt">{{ t("landing.purchases.count") }}</span>
      </div>
      <div
        v-for="car in landingPurchases"
        :key="car.lot"
        :class="$style.row"
      >
        <LandingCarThumb
          :src="landingCarPhoto(car.lot)"
          :alt="car.name"
          :class="$style.thumb"
        />
        <div :class="$style.info">
          <b>{{ car.name }}</b>
          <span>{{ t("landing.purchases.status") }}</span>
        </div>
        <div :class="$style.price">
          <b>{{ formatInt(car.price, locale) }} ¥</b>
          <span>{{ car.date }}</span>
        </div>
      </div>
    </div>
  </LandingShowcase>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { landingCarPhoto, landingPurchases } from "@/constants/landing"
import { formatInt } from "@/utils/formatters"
import { useLandingMessages } from "@/composables/useLandingMessages"

const { t, locale } = useI18n()
const { list } = useLandingMessages()

const features = list("landing.purchases.features")
</script>

<style module>
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--ld-line);
}

.top h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 750;
}

.cnt {
  font-size: 12px;
  font-weight: 650;
  color: var(--ld-ink-soft);
  background: var(--ld-panel);
  border: 1px solid var(--ld-line);
  border-radius: 999px;
  padding: 4px 11px;
}

.row {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  gap: 13px;
  align-items: center;
  padding: 13px 20px;
  border-bottom: 1px solid var(--ld-line);
  transition: background .18s ease;
}

.row:last-child {
  border-bottom: none;
}

.row:hover {
  background: var(--ld-panel);
}

.thumb {
  width: 44px;
  height: 34px;
  border-radius: 8px;
}

.info {
  min-width: 0;
}

.info b {
  display: block;
  font-size: 13.5px;
  font-weight: 650;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info span {
  font-size: 11.5px;
  color: var(--ld-muted);
}

.price {
  text-align: right;
}

.price b {
  font-size: 14px;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.price span {
  display: block;
  font-size: 11px;
  color: var(--ld-muted-2);
}
</style>
