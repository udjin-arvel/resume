<template>
  <LandingShowcase
    id="booking"
    :eyebrow="t('landing.booking.eyebrow')"
    :title="t('landing.booking.title')"
    :lead="t('landing.booking.lead')"
    :features="features"
    :hint="t('landing.booking.hint')"
    reverse
    alt
    :demo-class="$style.demo"
  >
    <div
      :class="['ld-card', $style.book, booked && $style.book_done]"
      :aria-label="t('landing.booking.aria')"
    >
      <div :class="$style.head">
        <div :class="$style.context">
          <span :class="$style.contextLabel">{{ t("landing.booking.context") }}</span>
          <span :class="$style.status">{{ booked ? t("landing.booking.statusBooked") : t("landing.booking.statusSale") }}</span>
        </div>
        <div :class="$style.heading">
          <span :class="$style.key">
            <svg
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            ><circle
              cx="8"
              cy="8"
              r="4"
              stroke="currentColor"
              stroke-width="1.7"
            /><path
              d="m11 11 9 9m-4-4 3-3m-6 0 3-3"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            /></svg>
          </span>
          <div>
            <h4>{{ t("landing.booking.car") }}</h4>
            <p>{{ t("landing.booking.trim") }}</p>
          </div>
        </div>
      </div>
      <div :class="$style.body">
        <span :class="$style.priceLabel">{{ t("landing.booking.priceLabel") }}</span>
        <strong :class="$style.price">{{ formatInt(landingBookingCar.price, locale) }} ¥</strong>
        <dl :class="$style.specs">
          <div
            v-for="spec in specs"
            :key="spec.label"
          >
            <dt>{{ spec.label }}</dt>
            <dd>{{ spec.value }}</dd>
          </div>
        </dl>
        <div :class="$style.terms">
          <div>
            <div :class="$style.termsLabel">
              {{ booked ? t("landing.booking.depositDone") : t("landing.booking.deposit") }}
            </div>
            <p :class="$style.termsSub">
              {{ t("landing.booking.depositSub") }}
            </p>
          </div>
          <strong :class="$style.deposit">5 000 ¥</strong>
        </div>
        <button
          type="button"
          :class="$style.btn"
          :aria-disabled="booked"
          @click="book"
        >
          <svg
            v-if="booked"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          ><path
            d="m5 12 4 4L19 6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          /></svg>
          <svg
            v-else
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          ><path
            d="M6 5h12v16l-6-4-6 4z"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linejoin="round"
          /></svg>
          <span>{{ booked ? t("landing.booking.buttonDone") : t("landing.booking.button") }}</span>
        </button>
        <p
          :class="$style.note"
          role="status"
          aria-live="polite"
        >
          {{ booked ? t("landing.booking.noteDone") : t("landing.booking.note") }}
        </p>
      </div>
    </div>
  </LandingShowcase>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { landingBookingCar } from "@/constants/landing"
import { formatInt } from "@/utils/formatters"
import { useLandingMessages } from "@/composables/useLandingMessages"

interface Spec {
  label: string
  value: string
}

const { t, locale } = useI18n()
const { list, objects } = useLandingMessages()

const features = list("landing.booking.features")
const specs = objects<Spec>("landing.booking.specs")

const booked = ref(false)

const book = () => {
  booked.value = true
}
</script>

<style module>
.demo {
  width: 100%;
  max-width: 520px;
}

.book {
  width: 100%;
}

.head {
  padding: 20px 22px 18px;
  border-bottom: 1px solid var(--ld-line);
}

.context {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 17px;
}

.contextLabel {
  font-size: 11px;
  color: var(--ld-muted);
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 4px 9px;
  font-size: 10px;
  font-weight: 650;
  color: #217c43;
  background: var(--ld-green-wash);
  white-space: nowrap;
}

.status::before {
  content: "";
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.heading {
  display: flex;
  align-items: center;
  gap: 13px;
}

.key {
  display: grid;
  place-items: center;
  flex: none;
  width: 43px;
  height: 43px;
  border-radius: 12px;
  background: var(--ld-accent-wash);
  color: var(--ld-accent);
}

.heading h4 {
  margin: 0;
  font-size: 21px;
  line-height: 1.25;
  letter-spacing: -.025em;
  font-weight: 800;
}

.heading p {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--ld-muted);
}

.body {
  padding: 19px 22px 20px;
}

.priceLabel {
  font-size: 11px;
  color: var(--ld-muted);
}

.price {
  display: block;
  margin-top: 3px;
  font-size: 29px;
  line-height: 1.25;
  letter-spacing: -.03em;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.specs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 15px 12px;
  margin: 20px 0;
  padding: 17px 0;
  border-top: 1px solid var(--ld-line);
  border-bottom: 1px solid var(--ld-line);
}

.specs div {
  min-width: 0;
}

.specs dt {
  font-size: 10px;
  color: var(--ld-muted);
  line-height: 1.4;
}

.specs dd {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 650;
  color: var(--ld-ink-soft);
  line-height: 1.4;
  font-variant-numeric: tabular-nums;
}

.terms {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--ld-line);
  border-radius: 10px;
  background: var(--ld-panel);
  transition: background .2s, border-color .2s;
}

.book_done .terms {
  background: #f3fbf5;
  border-color: #cce8d3;
}

.termsLabel {
  font-size: 11px;
  color: var(--ld-muted);
  line-height: 1.5;
}

.termsSub {
  margin: 2px 0 0;
  font-size: 10px;
  color: var(--ld-muted);
  line-height: 1.5;
}

.deposit {
  font-size: 16px;
  font-weight: 750;
  white-space: nowrap;
  letter-spacing: -.02em;
  font-variant-numeric: tabular-nums;
}

.btn {
  width: 100%;
  min-height: 48px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--ld-blue);
  color: #fff;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 12px 10px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.4;
  cursor: pointer;
  transition: background .2s, transform .2s;
}

.btn:hover {
  background: #2459df;
  transform: translateY(-1px);
}

.btn:focus-visible {
  outline: 2px solid var(--ld-accent);
  outline-offset: 3px;
}

.btn svg {
  width: 17px;
  height: 17px;
  flex: none;
}

.book_done .btn,
.book_done .btn:hover {
  background: var(--ld-green-wash);
  color: #217c43;
  border-color: #bfe6c9;
  cursor: default;
  transform: none;
}

.note {
  margin: 11px 0 0;
  font-size: 10px;
  color: var(--ld-muted);
  text-align: center;
  line-height: 1.5;
  min-height: 15px;
}

@media (max-width: 640px) {
  .head {
    padding: 17px 16px 16px;
  }

  .body {
    padding: 17px 16px 18px;
  }

  .heading {
    gap: 10px;
  }

  .heading h4 {
    font-size: 19px;
  }

  .heading p {
    font-size: 10px;
  }

  .key {
    width: 37px;
    height: 39px;
  }

  .price {
    font-size: 27px;
  }

  .specs {
    gap: 14px 8px;
    margin: 18px 0;
  }

  .specs dd {
    font-size: 11px;
  }

  .specs dt {
    font-size: 9.5px;
  }

  .terms {
    padding: 11px;
    gap: 8px;
  }

  .termsLabel {
    font-size: 10.5px;
  }

  .deposit {
    font-size: 15px;
  }

  .btn {
    font-size: 12px;
  }
}
</style>
