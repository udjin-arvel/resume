<template>
  <div :class="$style.wrapper">
    <div :class="$style.container">
      <h1 :class="$style.h1__title">
        Политика конфиденциальности
      </h1>

      <div :class="$style.links">
        <a
          href="/Политика_конфиденциальности_10.03.docx"
          target="_blank"
          rel="noopener"
          :class="$style.link"
        >
          Политика конфиденциальности
        </a>

        <a
          href="/Согласие_на_обработку_персональных_данных.docx"
          target="_blank"
          rel="noopener"
          :class="$style.link"
        >
          Согласие на обработку персональных данных
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
usePageSeoMeta({
  title: "Политика конфиденциальности | AutoShop",
  ogTitle: "Политика конфиденциальности | AutoShop",
  description: "Политика конфиденциальности и обработки персональных данных компании AutoShop. Узнайте, как мы защищаем ваши данные.",
  ogDescription: "Политика конфиденциальности и обработки персональных данных компании AutoShop. Узнайте, как мы защищаем ваши данные.",
})
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

.links {
  @apply flex flex-col gap-4;
}

.link {
  @apply inline-flex items-center text-[1.125rem] text-primary underline underline-offset-4 decoration-1 hover:no-underline hover:text-primary/80 transition-colors duration-300;
}

@media (max-width: 640px) {
  .h1__title {
    @apply text-[2rem] mb-[2rem];
  }
  .wrapper {
    @apply py-[1.5rem] mb-[3rem];
  }
  .link {
    @apply text-[1rem];
  }
}
</style>
