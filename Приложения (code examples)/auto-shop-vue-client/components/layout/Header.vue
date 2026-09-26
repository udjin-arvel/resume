<template>
  <header
    :class="[$style.header, isLanding && $style.header_landing, isLanding && isScrolled && $style.header_scrolled]"
    itemscope
    itemtype="https://schema.org/WPHeader"
  >
    <div :class="$style.header__cont">
      <nav
        :class="$style.navigation"
        aria-label="Global"
      >
        <div :class="$style.header__left">
          <NuxtLink
            to="/personal/login?redirect=/personal"
            :class="$style.header__link"
            @click="closeMenu"
          >
            <span class="sr-only">{{ ('about.name') }}</span>
            <img
              :class="[$style.header__logo, isLanding && $style.header__logo_compact]"
              src="/logo.svg"
              :alt="('about.name')"
            >
          </NuxtLink>

          <div :class="$style.header__socials">
            <NuxtLink
              to="https://wa.me/79000000000"
              target="_blank"
              rel="nofollow noopener noreferrer"
              :class="$style.header__social_link"
            >
              <img
                src="/wa-ico.svg"
                alt="WhatsApp"
                :class="$style.header__social_icon"
              >
            </NuxtLink>
            <NuxtLink
              to="https://t.me/demo_manager"
              target="_blank"
              rel="nofollow noopener noreferrer"
              :class="$style.header__social_link"
            >
              <img
                src="/tg-ico.svg"
                alt="Telegram"
                :class="$style.header__social_icon"
              >
            </NuxtLink>
            <NuxtLink
              to="https://example.com/messenger"
              target="_blank"
              rel="nofollow noopener noreferrer"
              :class="$style.header__social_link"
            >
              <img
                src="/max-ico.svg"
                alt="MAX"
                :class="$style.header__social_icon"
              >
            </NuxtLink>
            <WechatModal :class="$style.header__social_link">
              <img
                src="/we-ico.svg"
                alt="WeChat"
                :class="$style.header__social_icon"
              >
            </WechatModal>
          </div>
        </div>

        <ul :class="$style.header__menu_desktop">
          <li
            v-for="item in menuItems"
            :key="item.label"
          >
            <NuxtLink
              :to="item.to"
              :class="$style.header__menu_link"
            >
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>

        <div :class="$style.header__right">
          <div :class="$style.header__contacts">
            <NuxtLink
              to="tel:+79000000000"
              :class="$style.header__contact_link"
            >
              +7 900 000 0000
            </NuxtLink>
            <NuxtLink
              to="mailto:hello@example.com"
              :class="$style.header__contact_link_email"
            >
              hello@example.com
            </NuxtLink>
          </div>

          <template v-if="isLanding">
            <a
              href="#market"
              :class="['ld-btn', 'ld-btn--ghost', 'ld-btn--sm', $style.header__ld_btn, $style.header__ld_desktop]"
              @click.prevent="handleFeaturesClick"
            >{{ $t('landing.nav.features') }}</a>
            <NuxtLink
              to="/personal/login?redirect=/personal"
              :class="['ld-btn', 'ld-btn--primary', 'ld-btn--sm', $style.header__ld_btn, $style.header__ld_desktop]"
            >
              {{ $t('landing.nav.login') }}
            </NuxtLink>
            <NuxtLink
              to="/personal/login?redirect=/personal"
              :class="['ld-btn', 'ld-btn--primary', 'ld-btn--sm', $style.header__ld_btn, $style.header__ld_mobile]"
            >
              {{ $t('landing.nav.loginShort') }}
            </NuxtLink>
          </template>
          <button
            v-else
            :class="$style.header__btn"
            @click="handleConsultClick"
          >
            {{ $t('land.call') }}
          </button>

          <button
            :class="$style.hamburger"
            aria-label="Toggle menu"
            @click="toggleMenu"
          >
            <span :class="[$style.hamburger_line, { [$style.hamburger_line_1_active]: isMenuOpen }]" />
            <span :class="[$style.hamburger_line, { [$style.hamburger_line_2_active]: isMenuOpen }]" />
            <span :class="[$style.hamburger_line, { [$style.hamburger_line_3_active]: isMenuOpen }]" />
          </button>
        </div>
      </nav>
    </div>

    <div
      v-if="isMenuOpen"
      :class="$style.mobile_overlay"
    >
      <ul :class="$style.mobile_menu">
        <li
          v-for="item in menuItems"
          :key="item.label"
        >
          <NuxtLink
            :to="item.to"
            :class="$style.mobile_menu_link"
            @click="closeMenu"
          >
            {{ item.label }}
          </NuxtLink>
        </li>

        <li :class="$style.mobile_contacts_wrapper">
          <NuxtLink
            to="tel:+79000000000"
            :class="$style.mobile_contact_link"
          >+7 900 000 0000</NuxtLink>
          <NuxtLink
            to="mailto:hello@example.com"
            :class="$style.mobile_contact_link"
          >hello@example.com</NuxtLink>
        </li>

        <li :class="$style.mobile_socials_wrapper">
          <NuxtLink
            to="https://wa.me/79000000000"
            target="_blank"
            rel="nofollow noopener noreferrer"
            :class="$style.mobile_social_link"
          >
            <img
              src="/wa-ico.svg"
              alt="WhatsApp"
              :class="$style.mobile_social_icon"
            >
          </NuxtLink>
          <NuxtLink
            to="https://t.me/demo_manager"
            target="_blank"
            rel="nofollow noopener noreferrer"
            :class="$style.mobile_social_link"
          >
            <img
              src="/tg-ico.svg"
              alt="Telegram"
              :class="$style.mobile_social_icon"
            >
          </NuxtLink>
          <NuxtLink
            to="https://example.com/messenger"
            target="_blank"
            rel="nofollow noopener noreferrer"
            :class="$style.mobile_social_link"
          >
            <img
              src="/max-ico.svg"
              alt="MAX"
              :class="$style.mobile_social_icon"
            >
          </NuxtLink>
          <WechatModal :class="$style.mobile_social_link">
            <img
              src="/we-ico.svg"
              alt="WeChat"
              :class="$style.mobile_social_icon"
            >
          </WechatModal>
        </li>

        <li
          v-if="isLanding"
          :class="$style.mobile_menu_ld_wrapper"
        >
          <NuxtLink
            to="/personal/login?redirect=/personal"
            :class="['ld-btn', 'ld-btn--primary', $style.header__ld_btn]"
            @click="closeMenu"
          >
            {{ $t('landing.nav.login') }}
          </NuxtLink>
          <a
            href="#market"
            :class="['ld-btn', 'ld-btn--ghost', $style.header__ld_btn]"
            @click.prevent="handleFeaturesClick"
          >{{ $t('landing.nav.features') }}</a>
        </li>
        <li
          v-else
          :class="$style.mobile_menu_btn_wrapper"
        >
          <button
            :class="$style.mobile_menu_btn"
            @click="handleConsultClick"
          >
            {{ $t('land.call') }}
          </button>
        </li>
      </ul>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue"
import WechatModal from "@/components/common/WechatModal.vue"
import { useLandingScroll } from "@/composables/useLandingScroll"

const props = withDefaults(defineProps<{
  variant?: "default" | "landing"
}>(), {
  variant: "default",
})

const isLanding = computed(() => props.variant === "landing")
const isMenuOpen = ref(false)
const isScrolled = ref(false)

const onScroll = () => {
  isScrolled.value = window.scrollY > 8
}

onMounted(() => {
  if (!isLanding.value) {
    return
  }
  window.addEventListener("scroll", onScroll, { passive: true })
  onScroll()
})

const menuItems = [
  { label: "Отзывы", to: "/reviews" },
  { label: "О компании", to: "/about" },
  { label: "Частые вопросы", to: "/faq" },
]

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
  if (isMenuOpen.value) {
    document.body.style.overflow = "hidden"
  }
  else {
    document.body.style.overflow = ""
  }
}

const closeMenu = () => {
  if (isMenuOpen.value) {
    isMenuOpen.value = false
    document.body.style.overflow = ""
  }
}

const scrollToConsult = () => {
  const element = document.getElementById("consult")
  if (element) {
    element.scrollIntoView({ behavior: "smooth" })
    return
  }
  navigateTo("/contacts")
}

const handleConsultClick = () => {
  closeMenu()
  scrollToConsult()
}

const { scrollTo } = useLandingScroll()

const handleFeaturesClick = () => {
  closeMenu()
  scrollTo("market")
}

onUnmounted(() => {
  document.body.style.overflow = ""
  window.removeEventListener("scroll", onScroll)
})
</script>

<style module>
.header {
  @apply relative z-50 mb-[2.8125rem];
}

.header__cont {
  @apply mx-auto px-[0.625rem] max-w-[88.75rem] relative z-50 bg-white;
}

.navigation {
  @apply flex items-center justify-between pt-[1.75rem];
}

.header__left {
  @apply flex-1 flex justify-start items-center gap-[1.5rem];
}

.header__socials {
  @apply flex items-center gap-[0.75rem];
}

.header__social_link {
  @apply inline-flex items-center justify-center w-[2rem] h-[2rem] rounded-full transition-transform duration-300 hover:scale-110;
}

.header__social_icon {
  @apply w-[1.5rem] h-[1.5rem] object-contain;
}

.header__right {
  @apply flex-1 flex justify-end items-center gap-[1.5rem];
}

.header__contacts {
  @apply flex flex-col items-end justify-center gap-[0.125rem];
}

.header__contact_link {
  @apply text-[1.125rem] font-bold text-black hover:text-primary transition-colors duration-300 no-underline whitespace-nowrap;
}

.header__contact_link_email {
  @apply text-[0.875rem] font-medium text-grey hover:text-primary transition-colors duration-300 no-underline whitespace-nowrap;
}

.header__link {
  @apply inline-block pt-[0.125rem];
}

.header__logo {
  @apply w-[11.25rem];
}

.header__menu_desktop {
  @apply flex items-center gap-[2rem] list-none p-0 m-0;
}

.header__menu_link {
  @apply text-[1rem] font-medium text-black hover:text-primary transition-colors duration-300;
}

.header__btn {
  @apply inline-block text-[1.125rem] font-normal text-primary bg-white rounded-[0.75rem] px-[1.875rem] py-[0.9rem] border border-primary hover:bg-primary hover:text-white transition-colors duration-300 cursor-pointer;
}

.hamburger {
  @apply hidden flex-col justify-between w-[30px] h-[20px] cursor-pointer bg-transparent border-none p-0 z-50;
}

.hamburger_line {
  @apply w-full h-[2px] bg-black rounded transition-all duration-300 origin-left;
}

.hamburger_line_1_active { @apply rotate-45; }
.hamburger_line_2_active { @apply opacity-0; }
.hamburger_line_3_active { @apply -rotate-45; }

.mobile_overlay {
  @apply fixed inset-0 top-[5rem] bg-white z-40 overflow-y-auto pb-10;
}

.mobile_menu {
  @apply flex flex-col items-center gap-[1.5rem] pt-10 list-none p-0 m-0;
}

.mobile_menu_link {
  @apply text-[1.25rem] font-medium text-black hover:text-primary transition-colors duration-300;
}

.mobile_contacts_wrapper {
  @apply flex flex-col items-center gap-[0.5rem] mt-[1rem];
}

.mobile_contact_link {
  @apply text-[1.125rem] font-bold text-black no-underline;
}

.mobile_socials_wrapper {
  @apply flex items-center justify-center gap-[1rem] my-[0.5rem];
}

.mobile_social_link {
  @apply inline-flex items-center justify-center w-[2.5rem] h-[2.5rem];
}

.mobile_social_icon {
  @apply w-[2rem] h-[2rem] object-contain;
}

.mobile_menu_btn_wrapper {
  @apply mt-4;
}

.mobile_menu_btn {
  @apply text-[1.125rem] font-normal text-primary bg-white rounded-[0.75rem] px-[2.5rem] py-[1rem] border border-primary active:bg-primary active:text-white transition-colors duration-300;
}

@media (max-width: 1024px) {
  .header__menu_desktop,
  .header__socials,
  .header__contacts,
  .header__btn {
    @apply hidden;
  }
  .hamburger {
    @apply flex;
  }
}

@media (max-width: 640px) {
  .header {
    @apply mb-0;
  }
  .navigation {
    @apply pt-[1.25rem] pb-[1.25rem];
  }
  .header__logo {
    @apply w-[9rem];
  }
  .header__left, .header__right {
    @apply flex-none;
  }
}

.header__logo_compact {
  @apply h-[1.875rem] w-auto;
}

.header_landing {
  position: sticky;
  top: 0;
  margin-bottom: 0;
  background: rgba(255, 255, 255, .82);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid transparent;
  transition: border-color .3s ease;
}

.header_scrolled {
  border-bottom-color: #e7e9ee;
}

.header_landing .header__cont {
  background: transparent;
}

.header_landing .navigation {
  height: 68px;
  padding: 0;
  gap: 20px;
}

.header_landing .mobile_overlay {
  top: 69px;
}

.header_landing .header__ld_btn {
  font-family: var(--ld-font);
}

.header_landing .header__ld_mobile {
  display: none;
}

.mobile_menu_ld_wrapper {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  width: 100%;
  max-width: 320px;
  margin-top: 16px;
  padding: 0 24px;
}

@media (max-width: 1024px) {
  .header_landing .header__ld_desktop {
    display: none;
  }

  .header_landing .header__ld_mobile {
    display: inline-flex;
  }
}
</style>
