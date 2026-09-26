<template>
  <LandingShowcase
    id="chat"
    :eyebrow="t('landing.chat.eyebrow')"
    :title="t('landing.chat.title')"
    :lead="t('landing.chat.lead')"
    :features="features"
    :hint="t('landing.chat.hint')"
    :demo-class="$style.demo"
  >
    <div :class="['ld-card', 'ld-float-a', $style.chat]">
      <div :class="$style.top">
        <h4>{{ t("landing.chat.car") }}</h4>
        <span>{{ t("landing.chat.spec") }}</span>
      </div>
      <div :class="$style.body">
        <div :class="[$style.bubble, $style.bubble_out]">
          {{ t("landing.chat.outgoing1") }}<span :class="$style.time">11:20</span>
        </div>
        <div :class="[$style.bubble, $style.bubble_in]">
          {{ showOriginal ? t("landing.chat.incomingOriginal") : t("landing.chat.incoming") }}
          <span :class="$style.time">{{ t("landing.chat.incomingMeta") }}</span>
        </div>
        <div :class="$style.translateLine">
          <button
            type="button"
            :class="[$style.trBtn, showOriginal && $style.trBtn_done]"
            aria-live="polite"
            @click="showOriginal = !showOriginal"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            ><path
              d="M4 5h7M7 5v3c0 3-2 5-4 6M5 8c0 2 3 4 6 4M13 20l4-9 4 9M14.5 17h5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            /></svg>
            <span>{{ showOriginal ? t("landing.chat.hide") : t("landing.chat.show") }}</span>
          </button>
          <span :class="$style.trHint">{{ showOriginal ? t("landing.chat.original") : t("landing.chat.translated") }}</span>
        </div>
        <div :class="[$style.bubble, $style.bubble_out]">
          {{ t("landing.chat.outgoing2") }}<span :class="$style.time">11:26</span>
        </div>
      </div>
    </div>
  </LandingShowcase>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { useLandingMessages } from "@/composables/useLandingMessages"

const { t } = useI18n()
const { list } = useLandingMessages()

const features = list("landing.chat.features")
const showOriginal = ref(false)
</script>

<style module>
.demo {
  display: flex;
  justify-content: center;
}

.chat {
  width: 100%;
  max-width: 440px;
}

.top {
  padding: 15px 18px;
  border-bottom: 1px solid var(--ld-line);
}

.top h4 {
  margin: 0;
  font-size: 14.5px;
  font-weight: 750;
}

.top span {
  font-size: 12px;
  color: var(--ld-muted);
}

.body {
  display: flex;
  flex-direction: column;
  gap: 13px;
  padding: 18px;
  background: linear-gradient(180deg, #fbfbfc, #fff);
}

.bubble {
  position: relative;
  max-width: 82%;
  padding: 11px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.45;
}

.bubble_in {
  align-self: flex-start;
  background: var(--ld-panel);
  border-bottom-left-radius: 5px;
  color: var(--ld-ink-soft);
}

.bubble_out {
  align-self: flex-end;
  background: var(--ld-blue);
  color: #fff;
  border-bottom-right-radius: 5px;
}

.time {
  display: block;
  margin-top: 5px;
  font-size: 10.5px;
  opacity: .6;
}

.translateLine {
  display: flex;
  align-items: center;
  gap: 10px;
  align-self: flex-start;
  margin-top: -4px;
}

.trBtn {
  display: inline-flex;
  line-height: normal;
  align-items: center;
  gap: 7px;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 650;
  cursor: pointer;
  background: var(--ld-accent-wash);
  color: var(--ld-accent-ink);
  border: 1px solid #f6c9cb;
  border-radius: 999px;
  padding: 6px 12px;
  transition: background .18s ease, transform .12s ease;
}

.trBtn:hover {
  background: #fbdcdd;
}

.trBtn:active {
  transform: scale(.96);
}

.trBtn_done,
.trBtn_done:hover {
  background: var(--ld-green-wash);
  color: var(--ld-green);
  border-color: #bfe6c9;
}

.trHint {
  font-size: 12px;
  color: var(--ld-muted-2);
}
</style>
