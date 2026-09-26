<template>
  <div :class="$style.wrapper">
    <div :class="$style.container">
      <div :class="$style.scanner">
        <div :class="$style.scanner__icon">
          <img
            src="/scanner-frame.svg"
            :class="$style.scanner__frame"
            alt=""
          >
          <img
            src="/scanner-car.svg"
            :class="$style.scanner__car"
            alt=""
          >
          <img
            src="/scanner-line.svg"
            :class="$style.scanner__line"
            alt=""
          >
        </div>
        <p :class="$style.scanner__text">
          Ищем автомобили для вас
        </p>
      </div>

      <h1 :class="$style.h1__title">
        Карта сайта
      </h1>

      <ul :class="$style.sitemap__list">
        <li
          v-for="item in menuItems"
          :key="item.label"
          :class="$style.sitemap__item"
        >
          <NuxtLink
            :to="item.to"
            :class="$style.sitemap__link"
          >
            {{ item.label }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
usePageSeoMeta({
  title: "Карта сайта | AutoShop",
  ogTitle: "Карта сайта | AutoShop",
  description: "Карта всех страниц сайта AutoShop — доставка и экспорт автомобилей из Китая.",
  ogDescription: "Карта всех страниц сайта AutoShop — доставка и экспорт автомобилей из Китая.",
})
const menuItems = [
  { label: "Главная", to: "/" },
  { label: "Отзывы", to: "/reviews" },
  { label: "Контакты", to: "/contacts" },
  { label: "FAQ", to: "/faq" },
  { label: "Карта сайта", to: "/sitemap" },
  { label: "Политика конфиденциальности", to: "/privacy" },
  { label: "О компании", to: "/about" },
]
</script>

<style module>
.wrapper {
  @apply py-[2.5rem] mb-[5rem];
}

.container {
  @apply mx-auto px-[0.625rem] max-w-[88.75rem];
}

.h1__title {
  @apply font-bold text-black leading-none text-[3rem] mb-[3rem] text-center;
}

.sitemap__list {
  @apply max-w-[40rem] flex flex-col gap-[1rem] list-none p-0;
}

.sitemap__item {
  @apply border-b border-gray-200 pb-[1rem] last:border-b-0;
}

.sitemap__link {
  @apply text-[1.25rem] text-gray-800 font-medium hover:text-primary transition-colors duration-300 flex items-center gap-[0.75rem];
}

.sitemap__link::before {
  content: '';
  @apply block w-[6px] h-[6px] rounded-full bg-primary opacity-70;
}

.sitemap__link:hover::before {
  @apply opacity-100;
}

.sitemap__link.router-link-exact-active {
  @apply text-primary cursor-default;
}

.scanner {
  @apply flex flex-col items-center gap-[5px] mb-[3rem];
}

.scanner__icon {
  position: relative;
  width: 54px;
  height: 58px;
  overflow: hidden;
}

.scanner__frame {
  position: relative;
  z-index: 2;
  @apply w-full h-full;
}

.scanner__car {
  position: absolute;
  z-index: 1;
  width: 38px;
  height: 38px;
  left: 14px;
  top: 8px;
  animation: scanner-car 3s linear infinite;
}

.scanner__line {
  position: absolute;
  z-index: 1;
  width: 6px;
  height: 100%;
  left: 25px;
  top: 0;
  animation: scanner-line 2.4s linear infinite;
  animation-delay: 0s;
}

.scanner__text {
  @apply text-[1rem] text-grey whitespace-nowrap;
}

@keyframes scanner-car {
  0%   { transform: translateX(-90px); }
  100% { transform: translateX(94px); }
}

@keyframes scanner-line {
  0%   { transform: translateX(-10px); }
  50% { transform: translateX(10px); }
  100% { transform: translateX(-10px); }
}

@media (max-width: 640px) {
  .h1__title {
    @apply text-[2rem] mb-[2rem];
  }
  .wrapper {
    @apply py-[1.5rem] mb-[3rem];
  }
  .sitemap__link {
    @apply text-[1.125rem];
  }
}
</style>
