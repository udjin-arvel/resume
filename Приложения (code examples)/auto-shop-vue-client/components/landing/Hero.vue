<template>
  <section :class="$style.hero">
    <div :class="['ld-wrap', $style.grid]">
      <div>
        <span :class="['ld-eyebrow', $style.el, $style.d1]">{{ t("landing.hero.eyebrow") }}</span>
        <h1 :class="['ld-h1', $style.el, $style.d2]">
          {{ t("landing.hero.titleLine1") }}<br>{{ t("landing.hero.titleLine2") }}
        </h1>
        <p :class="['ld-lead', $style.lead, $style.el, $style.d3]">
          {{ t("landing.hero.lead") }}
        </p>
        <div :class="[$style.actions, $style.el, $style.d4]">
          <NuxtLink
            to="/personal/login?redirect=/personal"
            class="ld-btn ld-btn--primary"
          >
            {{ t("landing.hero.login") }}
          </NuxtLink>
          <a
            href="#market"
            class="ld-btn ld-btn--ghost"
            @click.prevent="scrollTo('market')"
          >
            {{ t("landing.hero.how") }}
          </a>
        </div>
        <div :class="[$style.trust, $style.el, $style.d4]">
          <span
            v-for="chip in trustChips"
            :key="chip"
            :class="$style.tchip"
          ><span :class="$style.dot" />{{ chip }}</span>
        </div>
      </div>

      <div :class="['ld-demo', $style.demo]">
        <div
          :class="$style.dotgrid"
          aria-hidden="true"
        />
        <div :class="$style.cardWrap">
          <div :class="$style.card">
            <div :class="$style.filterbar">
              <span
                v-for="(chip, index) in chips"
                :key="chip"
                :class="[$style.fchip, index < 2 && $style.fchip_on]"
              >{{ chip }}</span>
            </div>
            <div :class="$style.car">
              <LandingCarThumb
                :src="landingCarPhoto(landingHeroCar.lot)"
                :alt="landingHeroCar.name"
                :class="$style.photo"
              >
                <span :class="$style.tag">{{ t("landing.hero.card.photoTag", { n: 12 }) }}</span>
              </LandingCarThumb>
              <div :class="$style.info">
                <h4 :class="$style.name">
                  {{ landingHeroCar.name }}
                </h4>
                <p :class="$style.spec">
                  {{ t("landing.hero.card.spec", { mileage: formatInt(landingHeroCar.mileage, locale) }) }}
                </p>
                <div :class="$style.price">
                  <div :class="$style.big">
                    {{ formatInt(landingHeroCar.price, locale) }} ¥
                  </div>
                  <span :class="$style.badgeOk">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                    ><path
                      d="M20 6 9 17l-5-5"
                      stroke="currentColor"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    /></svg>{{ t("landing.hero.card.verified") }}
                  </span>
                </div>
              </div>
            </div>
            <div :class="$style.actionsRow">
              <button
                type="button"
                :class="$style.miniBlue"
              >
                {{ t("landing.hero.card.book") }}
              </button>
              <button
                type="button"
                :class="$style.miniGhost"
              >
                {{ t("landing.hero.card.diagnostic") }}
              </button>
            </div>
          </div>

          <div :class="[$style.badge, $style.badgeDiag]">
            <span
              :class="[$style.ic, $style.icGreen]"
              aria-hidden="true"
            ><svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
            ><path
              d="M20 6 9 17l-5-5"
              stroke="#fff"
              stroke-width="2.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            /></svg></span>
            <span>{{ t("landing.hero.badges.diag") }}<small>{{ t("landing.hero.badges.diagSub") }}</small></span>
          </div>
          <div :class="[$style.badge, $style.badgeTrack]">
            <span
              :class="[$style.ic, $style.icBlue]"
              aria-hidden="true"
            ><svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
            ><path
              d="M3 7h11v8H3zM14 10h4l3 3v2h-7z"
              stroke="#fff"
              stroke-width="2"
              stroke-linejoin="round"
            /><circle
              cx="7"
              cy="17"
              r="2"
              fill="#fff"
            /><circle
              cx="17"
              cy="17"
              r="2"
              fill="#fff"
            /></svg></span>
            <span>{{ t("landing.hero.badges.track") }}<small>{{ t("landing.hero.badges.trackSub") }}</small></span>
          </div>
          <div :class="[$style.badge, $style.badgeCount]">
            <span
              :class="[$style.ic, $style.icRed]"
              aria-hidden="true"
            ><svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
            ><path
              d="M4 6h16M4 12h16M4 18h10"
              stroke="#fff"
              stroke-width="2.4"
              stroke-linecap="round"
            /></svg></span>
            <span>{{ t("landing.hero.badges.count") }}<small>{{ t("landing.hero.badges.countSub") }}</small></span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { landingCarPhoto, landingHeroCar } from "@/constants/landing"
import { formatInt } from "@/utils/formatters"
import { useLandingMessages } from "@/composables/useLandingMessages"
import { useLandingScroll } from "@/composables/useLandingScroll"

const { t, locale } = useI18n()
const { list } = useLandingMessages()
const { scrollTo } = useLandingScroll()

const chips = list("landing.hero.card.chips")
const trustChips = computed(() => [
  t("landing.hero.trust.check"),
  t("landing.hero.trust.chat"),
  t("landing.hero.trust.track"),
])
</script>

<style module>
.hero {
  position: relative;
  padding: 66px 0 78px;
  overflow: hidden;
}

.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(60% 55% at 84% 6%, rgba(225, 29, 36, .06), transparent 70%),
    radial-gradient(52% 46% at 6% 34%, rgba(47, 107, 255, .05), transparent 70%);
}

.grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.05fr .95fr;
  gap: 56px;
  align-items: center;
}

.grid .lead {
  margin-top: 22px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 32px;
}

.trust {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 34px;
}

.tchip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 550;
  color: var(--ld-ink-soft);
  background: #fff;
  border: 1px solid var(--ld-line);
  border-radius: 999px;
  padding: 8px 14px;
  transition: border-color .2s ease, transform .2s ease;
}

.tchip:hover {
  border-color: var(--ld-line-strong);
  transform: translateY(-1px);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ld-green);
}

.demo {
  position: relative;
}

.dotgrid {
  position: absolute;
  inset: -44px -66px -44px 18%;
  z-index: 0;
  background-image: radial-gradient(rgba(14, 17, 22, .11) 2.4px, transparent 2.7px);
  background-size: 34px 34px;
  -webkit-mask-image: radial-gradient(78% 78% at 80% 42%, #000 28%, transparent 82%);
  mask-image: radial-gradient(78% 78% at 80% 42%, #000 28%, transparent 82%);
  pointer-events: none;
}

.cardWrap {
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 30px 50px rgba(14, 17, 22, .10));
  opacity: 0;
  transform: translateY(26px) scale(.98);
  animation: card-in .9s cubic-bezier(.2, .7, .2, 1) .3s forwards, float-soft 6s ease-in-out 1.2s infinite;
}

.card {
  background: #fff;
  border: 1px solid var(--ld-line);
  border-radius: 18px;
  padding: 16px;
  box-shadow: var(--ld-shadow-1);
}

.filterbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.fchip {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ld-ink-soft);
  background: var(--ld-panel);
  border: 1px solid var(--ld-line);
  border-radius: 999px;
  padding: 6px 12px;
}

.fchip_on {
  background: var(--ld-accent-wash);
  border-color: #f6c9cb;
  color: var(--ld-accent-ink);
}

.car {
  display: grid;
  grid-template-columns: 132px 1fr;
  gap: 14px;
  align-items: center;
}

.photo {
  aspect-ratio: 4 / 3;
  width: 100%;
  border-radius: 12px;
}

.tag {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
  font-size: 10px;
  font-weight: 700;
  background: rgba(14, 17, 22, .72);
  color: #fff;
  padding: 3px 7px;
  border-radius: 6px;
}

.info {
  min-width: 0;
}

.name {
  margin: 0;
  font-size: 15px;
  font-weight: 750;
  letter-spacing: -.01em;
  line-height: 1.25;
}

.spec {
  margin: 5px 0 0;
  font-size: 12.5px;
  color: var(--ld-muted);
  line-height: 1.4;
}

.price {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--ld-line-strong);
}

.big {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -.02em;
  white-space: nowrap;
}

.badgeOk {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 650;
  color: var(--ld-green);
  background: var(--ld-green-wash);
  border: 1px solid #bfe6c9;
  border-radius: 999px;
  padding: 5px 10px;
  white-space: nowrap;
}

.badgeOk svg {
  width: 12px;
  height: 12px;
}

.actionsRow {
  display: flex;
  gap: 9px;
  margin-top: 14px;
}

.miniBlue {
  flex: 1;
  line-height: normal;
  background: var(--ld-blue);
  color: #fff;
  font-size: 13.5px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  padding: 11px;
  cursor: pointer;
  transition: filter .18s ease, transform .18s ease;
}

.miniBlue:hover {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.miniGhost {
  background: #fff;
  line-height: normal;
  color: var(--ld-ink-soft);
  border: 1px solid var(--ld-line-strong);
  font-size: 13.5px;
  font-weight: 600;
  border-radius: 10px;
  padding: 11px 14px;
  cursor: pointer;
  transition: border-color .18s ease;
}

.miniGhost:hover {
  border-color: var(--ld-ink);
}

.badge {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid var(--ld-line);
  border-radius: 12px;
  box-shadow: var(--ld-shadow-2);
  padding: 10px 13px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
}

.badge small {
  display: block;
  font-weight: 500;
  color: var(--ld-muted-2);
  font-size: 11px;
}

.ic {
  display: grid;
  place-items: center;
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: #fff;
}

.icGreen {
  background: var(--ld-green);
}

.icBlue {
  background: var(--ld-blue);
}

.icRed {
  background: var(--ld-accent);
}

.badgeDiag {
  top: -22px;
  right: -14px;
  opacity: 0;
  animation: badge-in .6s cubic-bezier(.2, .7, .2, 1) .95s forwards, float-soft 7s ease-in-out 1.6s infinite;
}

.badgeTrack {
  bottom: -20px;
  left: -18px;
  opacity: 0;
  animation: badge-in .6s cubic-bezier(.2, .7, .2, 1) 1.1s forwards;
}

.badgeCount {
  top: -24px;
  left: -22px;
  opacity: 0;
  animation: badge-in .6s cubic-bezier(.2, .7, .2, 1) 1.25s forwards, float-soft 7s ease-in-out 1.9s infinite;
}

.el {
  opacity: 0;
  transform: translateY(18px);
  animation: hero-in .8s cubic-bezier(.2, .7, .2, 1) forwards;
}

.d1 { animation-delay: .05s; }
.d2 { animation-delay: .15s; }
.d3 { animation-delay: .25s; }
.d4 { animation-delay: .35s; }

@keyframes hero-in {
  to { opacity: 1; transform: none; }
}

@keyframes card-in {
  to { opacity: 1; transform: none; }
}

@keyframes badge-in {
  from { opacity: 0; transform: translateY(8px) scale(.94); }
  to { opacity: 1; transform: none; }
}

@keyframes float-soft {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 52px;
  }

  .demo {
    max-width: 480px;
  }
}

@media (max-width: 640px) {
  .hero {
    padding: 48px 0 56px;
  }

  .actions a {
    flex: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .el,
  .cardWrap,
  .badgeDiag,
  .badgeTrack,
  .badgeCount {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
</style>
