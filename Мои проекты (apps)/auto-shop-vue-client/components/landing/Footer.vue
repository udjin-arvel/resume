<template>
  <footer :class="$style.footer">
    <div class="ld-wrap">
      <div :class="$style.foot">
        <div :class="$style.brandCol">
          <a
            href="#top"
            :class="$style.brand"
            :aria-label="t('about.name')"
            @click.prevent="scrollToTop"
          >
            <img
              :class="$style.logo"
              src="/logo.svg"
              :alt="t('about.name')"
              width="132"
              height="54"
            >
          </a>
          <p :class="$style.address">
            {{ t("landing.footer.address") }}
          </p>
        </div>
        <div :class="$style.links">
          <div
            v-for="column in columns"
            :key="column.title"
            :class="$style.col"
          >
            <h5>{{ column.title }}</h5>
            <template
              v-for="link in column.links"
              :key="link.label"
            >
              <a
                v-if="link.anchor"
                :href="`#${link.anchor}`"
                @click.prevent="scrollTo(link.anchor)"
              >{{ link.label }}</a>
              <NuxtLink
                v-else
                :to="link.to"
              >
                {{ link.label }}
              </NuxtLink>
            </template>
          </div>
        </div>
      </div>
      <div :class="$style.bottom">
        <span>{{ t("landing.footer.copyright") }}</span>
        <span>{{ t("landing.footer.cities") }}</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { useLandingScroll } from "@/composables/useLandingScroll"

interface FooterLink {
  label: string
  anchor?: string
  to?: string
}

const { t } = useI18n()
const { scrollTo } = useLandingScroll()

const columns = computed<{ title: string, links: FooterLink[] }[]>(() => [
  {
    title: t("landing.footer.platform"),
    links: [
      { label: t("landing.footer.catalog"), to: "/catalog" },
      { label: t("landing.footer.history"), anchor: "vehicle-history" },
      { label: t("landing.footer.diagnostics"), anchor: "diagnostics" },
      { label: t("landing.footer.logistics"), anchor: "logistics" },
    ],
  },
  {
    title: t("landing.footer.dealer"),
    links: [
      { label: t("landing.footer.login"), to: "/personal/login?redirect=/personal" },
      { label: t("landing.footer.access"), anchor: "login" },
      { label: t("landing.footer.chat"), anchor: "chat" },
    ],
  },
  {
    title: t("landing.footer.company"),
    links: [
      { label: t("landing.footer.about"), to: "/about" },
      { label: t("landing.footer.reviews"), to: "/reviews" },
      { label: t("landing.footer.contacts"), to: "/contacts" },
    ],
  },
])

const scrollToTop = () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })
}
</script>

<style module>
.footer {
  border-top: 1px solid var(--ld-line);
  padding: 44px 0 40px;
}

.foot {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 30px;
  flex-wrap: wrap;
}

.brandCol {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  max-width: 320px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
}

.address {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ld-ink-soft);
}

.logo {
  height: 34px;
  width: auto;
  display: block;
}

.links {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}

.col h5 {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--ld-muted-2);
}

.col a {
  display: block;
  font-size: 14px;
  color: var(--ld-ink-soft);
  padding: 5px 0;
  transition: color .18s ease;
}

.col a:hover {
  color: var(--ld-accent);
}

.bottom {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 36px;
  padding-top: 22px;
  border-top: 1px solid var(--ld-line);
  font-size: 13px;
  color: var(--ld-muted-2);
}
</style>
