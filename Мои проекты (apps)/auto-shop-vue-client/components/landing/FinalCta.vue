<template>
  <section
    id="login"
    :class="$style.final"
  >
    <div class="ld-wrap">
      <div :class="['ld-reveal', $style.card]">
        <span :class="['ld-eyebrow', $style.eyebrow]">{{ t("landing.final.eyebrow") }}</span>
        <h2 :class="$style.title">
          {{ t("landing.final.title") }}
        </h2>
        <p :class="$style.text">
          {{ t("landing.final.text") }}
        </p>
        <div :class="$style.actions">
          <NuxtLink
            to="/personal/login?redirect=/personal"
            class="ld-btn ld-btn--white"
          >
            {{ t("landing.final.login") }}
          </NuxtLink>
          <button
            type="button"
            class="ld-btn ld-btn--outline-white"
            @click="emit('request-access')"
          >
            {{ t("landing.final.access") }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"

const emit = defineEmits<{
  (e: "request-access"): void
}>()

const { t } = useI18n()
</script>

<style module>
.final {
  padding: 96px 0;
  scroll-margin-top: 80px;
}

.card {
  position: relative;
  overflow: hidden;
  border-radius: 26px;
  padding: 64px 56px;
  text-align: center;
  background: linear-gradient(135deg, var(--ld-accent), #ff6a4d);
  color: #fff;
  box-shadow: 0 26px 60px rgba(225, 29, 36, .28);
}

.card::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(50% 80% at 82% 12%, rgba(255, 255, 255, .20), transparent 60%),
    radial-gradient(46% 70% at 10% 92%, rgba(255, 255, 255, .14), transparent 60%);
}

.card > * {
  position: relative;
  z-index: 1;
}

.card .eyebrow {
  color: rgba(255, 255, 255, .9);
}

.card .eyebrow::before {
  background: rgba(255, 255, 255, .9);
}

.title {
  margin: 18px auto 0;
  max-width: 17ch;
  color: #fff;
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 800;
  letter-spacing: -.022em;
  line-height: 1.07;
  text-wrap: balance;
}

.text {
  margin: 18px auto 0;
  max-width: 52ch;
  color: rgba(255, 255, 255, .9);
  font-size: 17px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
  margin-top: 34px;
}

@media (max-width: 640px) {
  .final {
    padding: 64px 0;
  }

  .card {
    padding: 44px 24px;
  }
}
</style>
