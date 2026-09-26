<template>
  <LayoutCookieConsent />

  <footer
    :class="$style.footer"
    itemscope
    itemtype="https://schema.org/WPFooter"
  >
    <div :class="$style.footer__cont">
      <div :class="$style.footer__top_row">
        <div :class="$style.footer__col_left">
          <NuxtLink :to="{ name: 'personal' }">
            <img
              src="/logo.svg"
              :alt="t('about.name')"
              :class="$style.footer__logo"
            >
          </NuxtLink>

          <p :class="$style.footer__address">
            Demo Street 1, Example City
          </p>

          <p :class="$style.footer__copy">
            © 2026 {{ t('about.copyright') }}
          </p>
          <p :class="$style.footer__china">
            {{ t('land.delivery') }}
          </p>
        </div>

        <div :class="$style.footer__col_center">
          <ul :class="$style.footer__menu">
            <li>
              <NuxtLink
                to="/reviews"
                :class="$style.footer__menu_link"
              >Отзывы</NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/faq"
                :class="$style.footer__menu_link"
              >FAQ</NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/sitemap"
                :class="$style.footer__menu_link"
              >Карта сайта</NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/about"
                :class="$style.footer__menu_link"
              >О компании</NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/contacts"
                :class="$style.footer__menu_link"
              >Контакты</NuxtLink>
            </li>
          </ul>
        </div>

        <div :class="$style.footer__col_right">
          <div :class="$style.footer__contacts">
            <a
              href="mailto:hello@example.com"
              :class="$style.footer__contact_email"
            >hello@example.com</a>
            <a
              href="tel:+79000000000"
              :class="$style.footer__contact_tel"
            >+7 900 000 0000</a>
          </div>

          <div :class="$style.footer__socials">
            <NuxtLink
              to="https://wa.me/79000000000"
              target="_blank"
              rel="nofollow noopener noreferrer"
              :class="$style.footer__social_link"
            >
              <img
                src="/wa-ico.svg"
                alt="WhatsApp"
                :class="$style.footer__social_icon"
              >
            </NuxtLink>
            <NuxtLink
              to="https://t.me/demo_manager"
              target="_blank"
              rel="nofollow noopener noreferrer"
              :class="$style.footer__social_link"
            >
              <img
                src="/tg-ico.svg"
                alt="Telegram"
                :class="$style.footer__social_icon"
              >
            </NuxtLink>
            <NuxtLink
              to="https://example.com/messenger"
              target="_blank"
              rel="nofollow noopener noreferrer"
              :class="$style.footer__social_link"
            >
              <img
                src="/max-ico.svg"
                alt="MAX"
                :class="$style.footer__social_icon"
              >
            </NuxtLink>
            <WechatModal :class="$style.footer__social_link">
              <img
                src="/we-ico.svg"
                alt="WeChat"
                :class="$style.footer__social_icon"
              >
            </WechatModal>
          </div>

          <div
            :class="$style.footer__btn"
            @click="scrollToTop"
            @mouseenter="isHovered = true"
            @mouseleave="isHovered = false"
          >
            <img
              :src="isHovered ? '/arr-up-black.svg' : '/arr-up.svg'"
              alt="up"
              :class="$style.footer__up"
            > {{ t('land.top') }}
          </div>
        </div>
      </div>

      <div :class="$style.footer__bottom_row">
        <NuxtLink
          :to="{ name: 'privacy' }"
          :class="$style.footer__bottom_link"
        >
          Политика конфиденциальности
        </NuxtLink>
        <NuxtLink
          to="/sitemap"
          :class="$style.footer__bottom_link"
        >
          Карта сайта
        </NuxtLink>
      </div>
    </div>
  </footer>

  <div
    v-show="showElement"
    :class="[$style.up, { [$style.up_hidden]: !showElement }]"
    @click="scrollToConsult"
  >
    <img
      :class="$style.up__logo"
      src="/logo.svg"
      :alt="t('about.name')"
    >
    {{ t('land.call') }}
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import WechatModal from "@/components/common/WechatModal.vue"

const { t } = useI18n()
const showElement = ref(false)
const isHovered = ref(false)
const { hasCookieConsent } = useCookieConsent()

const checkScroll = () => {
  const scrollY = window.scrollY
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  const threshold = 500
  showElement.value = scrollY > 900 && (scrollY + windowHeight < documentHeight - threshold) && hasCookieConsent.value
}

onMounted(() => {
  window.addEventListener("scroll", checkScroll)
  checkScroll()
})

onUnmounted(() => {
  window.removeEventListener("scroll", checkScroll)
})

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  })
}

const scrollToConsult = () => {
  const element = document.getElementById("consult")
  if (element) {
    element.scrollIntoView({ behavior: "smooth" })
    return
  }
  navigateTo("/contacts")
}
</script>

<style module>
.up {
  @apply fixed right-[2.6875rem] inline-flex items-center bottom-[1.9375rem]
  bg-white cursor-pointer border border-primary rounded-[0.75rem] z-30
  shadow-[0px_4px_15px_0px_#00000033] text-[1.125rem] font-bold
  text-primary transition-opacity duration-300 opacity-100 hover:opacity-90 py-[0.625rem] px-[1.4375rem];
}
.up_hidden {
  @apply opacity-0 hidden pointer-events-none;
}
.up__logo {
  @apply w-[4.5625rem] mr-[1.1875rem];
}
.footer {
  @apply pb-[4.8125rem] w-full text-base pt-0 font-semibold bg-white;
}
.footer__cont {
  @apply mx-auto max-w-[87rem] pl-[1.25rem] pr-[1.25rem] pt-[2rem] border-t border-grey-900;
}

.footer__top_row {
  @apply flex flex-col lg:flex-row justify-between items-start gap-[2rem] lg:gap-[1rem] mb-[2.5rem];
}

.footer__col_left {
  @apply flex flex-col items-start w-full lg:w-[35%] gap-[0.75rem];
}
.footer__logo {
  @apply w-[11.25rem] mb-[0.5rem];
}
.footer__address {
  @apply text-[0.875rem] font-normal text-grey leading-[1.4] max-w-[20rem] m-0;
}
.footer__copy {
  @apply m-0;
}
.footer__china {
  @apply text-[0.875rem] text-grey font-normal m-0;
}

.footer__col_center {
  @apply flex flex-col w-full lg:w-[30%] lg:items-center;
}
.footer__menu {
  @apply flex flex-col gap-[1rem] list-none p-0 m-0;
}
.footer__menu_link {
  @apply text-[1rem] font-medium text-black hover:text-primary transition-colors duration-300 no-underline;
}

.footer__col_right {
  @apply flex flex-col items-start lg:items-end w-full lg:w-[35%] gap-[1.5rem];
}
.footer__contacts {
  @apply flex flex-col items-start lg:items-end gap-[0.25rem];
}
.footer__contact_email {
  @apply text-[1rem] font-medium text-grey hover:text-primary transition-colors duration-300 no-underline;
}
.footer__contact_tel {
  @apply text-[1.25rem] font-bold text-black hover:text-primary transition-colors duration-300 no-underline;
}
.footer__socials {
  @apply flex items-center gap-[0.75rem];
}
.footer__social_link {
  @apply inline-flex items-center justify-center w-[2rem] h-[2rem] rounded-full transition-transform duration-300 hover:scale-110;
}
.footer__social_icon {
  @apply w-[1.5rem] h-[1.5rem] object-contain;
}
.footer__btn {
  @apply cursor-pointer inline-flex rounded-lg bg-grey-500 py-2 px-[0.6875rem] text-base font-bold text-white border border-transparent hover:bg-white hover:text-black hover:border-black transition-colors duration-300;
}
.footer__up {
  @apply mr-2;
}

.footer__bottom_row {
  @apply flex flex-wrap justify-center gap-[2rem] pt-[1.5rem] border-t border-grey-300;
}
.footer__bottom_link {
  @apply text-[0.875rem] font-normal text-grey hover:text-primary transition-colors duration-300 no-underline text-center;
}

@media (max-width: 1440px) {
  .footer__cont {
    @apply pt-[1.5rem];
  }
}

@media (max-width: 1024px) {
  .footer__top_row {
    @apply flex-col gap-[2.5rem];
  }
  .footer__col_left, .footer__col_center, .footer__col_right {
    @apply items-start w-full;
  }
  .footer__contacts {
    @apply items-start;
  }
  .footer__bottom_row {
    @apply flex-col gap-[1rem] items-center;
  }
}

@media (max-width: 640px) {
  .footer__china {
    @apply mb-0;
  }
  .up {
    @apply right-auto left-1/2 transform -translate-x-1/2 px-[2rem] whitespace-nowrap min-w-[20rem];
  }
}
</style>
