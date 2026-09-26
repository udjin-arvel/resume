<template>
  <section
    id="market"
    :class="$style.manifest"
  >
    <div :class="['ld-wrap', $style.wrap]">
      <div :class="$style.grid">
        <div class="ld-reveal">
          <span class="ld-eyebrow">{{ t("landing.market.eyebrow") }}</span>
          <div
            ref="numberRef"
            :class="$style.num"
          >
            {{ percent }}%
          </div>
          <h2 :class="['ld-h2', $style.title]">
            {{ t("landing.market.title") }}
          </h2>
          <p class="ld-lead">
            {{ t("landing.market.lead") }}
          </p>
          <div :class="$style.tags">
            <span :class="$style.tag">
              <span :class="$style.ci"><svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
              ><path
                d="M12 7v5l3 2"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              /><circle
                cx="12"
                cy="12"
                r="8.5"
                stroke="currentColor"
                stroke-width="2.2"
              /></svg></span>{{ t("landing.market.tags.always") }}
            </span>
            <span :class="$style.tag">
              <span :class="$style.ci"><svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
              ><path
                d="M20 6 9 17l-5-5"
                stroke="currentColor"
                stroke-width="2.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              /></svg></span>{{ t("landing.market.tags.known") }}
            </span>
            <span :class="$style.tag">
              <span :class="$style.ci"><svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
              ><path
                d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linejoin="round"
              /></svg></span>{{ t("landing.market.tags.verified") }}
            </span>
          </div>
        </div>

        <div class="ld-reveal">
          <div :class="['ld-card', 'ld-float-a', $style.feed]">
            <div :class="$style.feedTop">
              <span :class="$style.feedTitle">{{ t("landing.market.feed.title") }}</span>
              <span class="ld-live">{{ t("landing.market.feed.live") }}</span>
            </div>
            <div
              v-if="total !== null"
              :class="$style.counter"
            >
              <span
                ref="counterRef"
                :class="$style.fcNum"
              >{{ formatInt(totalCount, locale) }}</span>
              <span :class="$style.fcLbl">{{ t("landing.market.feed.total") }}</span>
              <NuxtLink
                :to="catalogPage"
                :class="['ld-btn', 'ld-btn--primary', 'ld-btn--sm', $style.fcBtn]"
              >
                {{ t("landing.market.feed.catalog") }}
              </NuxtLink>
            </div>
            <div :class="$style.list">
              <div
                v-for="car in landingFeedCars"
                :key="car.lot"
                :class="$style.item"
              >
                <LandingCarThumb
                  :src="landingCarPhoto(car.lot)"
                  :alt="car.name"
                  :class="$style.thumb"
                />
                <span :class="$style.info">
                  <b>{{ car.name }}</b>
                  <span>{{ t("landing.market.feed.item", { mileage: formatInt(car.mileage, locale) }) }}</span>
                </span>
                <span :class="$style.itemPrice">{{ formatInt(car.price, locale) }} ¥</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { landingCarPhoto, landingFeedCars } from "@/constants/landing"
import { catalogPage } from "@/constants/pages"
import { formatInt } from "@/utils/formatters"
import { useCountUp } from "@/composables/useCountUp"

const props = defineProps<{
  total: number | null
}>()

const { t, locale } = useI18n()

const numberRef = ref<HTMLElement | null>(null)
const counterRef = ref<HTMLElement | null>(null)

const { value: percent } = useCountUp(numberRef, 80, 1100)
const { value: totalCount } = useCountUp(counterRef, props.total ?? 0, 1400)
</script>

<style module>
.manifest {
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #fff, #fbf3f3 120%);
  scroll-margin-top: 80px;
}

.manifest::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(46% 60% at 88% 12%, rgba(225, 29, 36, .09), transparent 62%),
    radial-gradient(40% 55% at 6% 90%, rgba(47, 107, 255, .06), transparent 60%);
}

.wrap {
  position: relative;
  z-index: 1;
}

.grid {
  display: grid;
  grid-template-columns: 1.02fr .98fr;
  gap: 60px;
  align-items: center;
  padding: 84px 0;
}

.grid > * {
  min-width: 0;
}

.num {
  display: inline-block;
  font-size: clamp(72px, 12vw, 132px);
  font-weight: 800;
  letter-spacing: -.03em;
  line-height: 1.04;
  padding-right: .14em;
  background: linear-gradient(120deg, var(--ld-accent), #ff6a4d);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-variant-numeric: tabular-nums;
}

.grid .title {
  margin-top: 14px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 26px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ld-ink-soft);
  background: #fff;
  border: 1px solid var(--ld-line);
  border-radius: 12px;
  padding: 11px 15px;
  box-shadow: var(--ld-shadow-1);
}

.ci {
  display: grid;
  place-items: center;
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: var(--ld-accent-wash);
  color: var(--ld-accent);
}

.grid .feed {
  border-radius: 20px;
}

.feedTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--ld-line);
}

.feedTitle {
  font-size: 14.5px;
  font-weight: 750;
}

.counter {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--ld-line);
  background: linear-gradient(180deg, #fbfbfc, #fff);
}

.fcNum {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -.03em;
  font-variant-numeric: tabular-nums;
}

.fcLbl {
  font-size: 13px;
  color: var(--ld-muted);
}

.counter .fcBtn {
  margin-left: auto;
  align-self: center;
}

.list {
  padding: 8px;
}

.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 10px;
  border-radius: 12px;
  transition: background .18s ease;
}

.item:hover {
  background: var(--ld-panel);
}

.thumb {
  width: 52px;
  height: 40px;
  border-radius: 8px;
}

.info {
  flex: 1;
  min-width: 0;
}

.info b {
  display: block;
  font-size: 13px;
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info span {
  font-size: 11.5px;
  color: var(--ld-muted);
}

.itemPrice {
  font-size: 13px;
  font-weight: 750;
  white-space: nowrap;
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 44px;
    padding: 64px 0;
  }
}
</style>
