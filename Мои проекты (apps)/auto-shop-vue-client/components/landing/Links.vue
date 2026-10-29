<template>
  <LandingShowcase
    :eyebrow="t('landing.links.eyebrow')"
    :title="t('landing.links.title')"
    :lead="t('landing.links.lead')"
    :features="features"
    :hint="t('landing.links.hint')"
    reverse
    alt
  >
    <div class="ld-card">
      <div :class="$style.top">
        {{ t("landing.links.heading") }}
      </div>
      <form
        :class="$style.input"
        @submit.prevent="send"
      >
        <input
          v-model="link"
          type="text"
          :aria-label="t('landing.links.fieldAria')"
        >
        <button
          type="submit"
          :class="$style.send"
        >
          {{ t("landing.links.check") }}
        </button>
      </form>
      <div :class="$style.list">
        <TransitionGroup name="ld-link-row">
          <div
            v-for="row in rows"
            :key="row.id"
            :class="$style.row"
          >
            <span :class="$style.url">{{ row.url }}</span>
            <span :class="$style.time">{{ row.time }}</span>
            <span :class="['ld-pill', pillClass[row.status]]">{{ t(`landing.links.status.${row.status}`) }}</span>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </LandingShowcase>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useLandingMessages } from "@/composables/useLandingMessages"

type LinkStatus = "sent" | "work" | "interested" | "notInterested"

interface LinkRow {
  id: number
  url: string
  time: string
  status: LinkStatus
}

const { t } = useI18n()
const { list } = useLandingMessages()

const features = list("landing.links.features")

const pillClass: Record<LinkStatus, string> = {
  sent: "ld-pill--red",
  work: "ld-pill--blue",
  interested: "ld-pill--green",
  notInterested: "ld-pill--gray",
}

const link = ref("https://che168.com/dealer/495137/59114598.html")
const rows = ref<LinkRow[]>([
  { id: 1, url: "che168.com/dealer/673586/59110566", time: "11:21", status: "interested" },
  { id: 2, url: "che168.com/dealer/652429/59035301", time: "11:20", status: "work" },
  { id: 3, url: "che168.com/dealer/683055/59130580", time: "09:47", status: "notInterested" },
])

let nextId = 4
const timers: ReturnType<typeof setTimeout>[] = []

const send = () => {
  const value = link.value.trim()
  if (!value) {
    return
  }
  const clean = value.replace(/^https?:\/\/(www\.)?/, "").replace(/\.html.*$/, "").slice(0, 42)
  const id = nextId++
  rows.value.unshift({ id, url: clean, time: t("landing.links.justNow"), status: "sent" })
  link.value = ""

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (reduceMotion) {
    return
  }
  timers.push(setTimeout(() => {
    const row = rows.value.find(item => item.id === id)
    if (row) {
      row.status = "work"
    }
  }, 1100))
}

onBeforeUnmount(() => {
  timers.forEach(timer => clearTimeout(timer))
})
</script>

<style module>
.top {
  padding: 16px 18px;
  border-bottom: 1px solid var(--ld-line);
  font-size: 15px;
  font-weight: 750;
}

.input {
  display: flex;
  gap: 8px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--ld-line);
}

.input input {
  flex: 1;
  min-width: 0;
  font-family: inherit;
  font-size: 13.5px;
  color: var(--ld-ink);
  background: var(--ld-panel);
  border: 1px solid var(--ld-line);
  border-radius: 10px;
  padding: 11px 13px;
}

.input input::placeholder {
  color: var(--ld-muted-2);
}

.input input:focus {
  outline: 2px solid var(--ld-blue);
  outline-offset: 0;
  background: #fff;
  border-color: var(--ld-line);
  box-shadow: none;
}

.send {
  background: var(--ld-accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0 18px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 650;
  cursor: pointer;
  transition: background .18s ease;
  white-space: nowrap;
}

.send:hover {
  background: var(--ld-accent-ink);
}

.list {
  padding: 6px 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px;
  border-radius: 11px;
  transition: background .18s ease;
}

.row:hover {
  background: var(--ld-panel);
}

.url {
  flex: 1;
  min-width: 0;
  font-size: 12.5px;
  color: var(--ld-blue);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 550;
}

.time {
  font-size: 11px;
  color: var(--ld-muted-2);
  white-space: nowrap;
}
</style>

<style>
.ld-link-row-enter-active {
  transition: opacity .4s ease, transform .4s ease;
}

.ld-link-row-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
