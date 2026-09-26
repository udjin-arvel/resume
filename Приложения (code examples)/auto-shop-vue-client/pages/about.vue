<template>
  <div :class="$style.wrapper">
    <div :class="$style.container">
      <h1 :class="$style.h1__title">
        О компании
      </h1>

      <div :class="$style.text">
        <p>
          AutoShop — надёжный экспортёр автомобилей из Китая! Наша команда профессионалов предоставляет лучший русскоязычный сервис полного цикла — от подбора до экспорта автомобилей из Китая.
        </p>
        <p>
          Мы работаем без посредников с собственной командой в Китае, что гарантирует нашим клиентам максимальную финансовую выгоду и полный контроль качества.
        </p>
        <p>
          Наша экспертиза позволяет нам искать и находить для вас автомобили в любом ценовом сегменте и с конкретными требованиями, будь то эксклюзивный цвет кузова или уникальная комплектация. Если такие автомобили доступны на рынке Китая — мы привезём их для вас!
        </p>
        <p>
          Для поиска машин мы используем все возможные ресурсы: кроме общедоступных платформ по продаже автомобилей, активно работаем с закрытыми ресурсами для автодилеров внутри Китая. Благодаря наработанным партнёрским отношениям с дилерами по всей стране, мы получаем информацию о продаже автомобилей до их публикации в общий доступ.
        </p>
        <p>
          Наши менеджеры оказывают непрерывное сопровождение на каждом этапе со стабильной и быстрой обратной связью!
        </p>
        <p>
          AutoShop — это больше, чем просто посредник между клиентом и китайским автопромом. Мы создаём экосистему, в которой каждый этап закупки и доставки автомобиля продуман до мелочей. Наша команда обеспечивает полную прозрачность процесса, юридическую безопасность сделки и оперативное решение любых возникающих вопросов — от первого запроса до получения ключей.
        </p>
        <p>
          Мы понимаем, что покупка автомобиля за границей может вызывать опасения. Именно поэтому наша миссия — устранить все препятствия и риски, предоставив клиентам простой, понятный и надёжный сервис. Каждый член нашей команды работает над тем, чтобы сотрудничество с AutoShop было максимально комфортным и результативным.
        </p>
      </div>

      <div :class="$style.gallery">
        <div :class="$style.gallery_item">
          <img
            src="/about-1.jpg"
            alt="AutoShop — команда и офис"
            :class="$style.gallery_img"
          >
        </div>
        <div :class="$style.gallery_item">
          <img
            src="/about-2.jpg"
            alt="Процесс подбора автомобилей в Китае"
            :class="$style.gallery_img"
          >
        </div>
        <div :class="$style.gallery_item">
          <img
            src="/about-3.jpg"
            alt="Автомобили на площадке в Китае"
            :class="$style.gallery_img"
          >
        </div>
        <div :class="$style.gallery_item">
          <img
            src="/about-4.webp"
            alt="Доставка автомобилей для клиентов"
            :class="$style.gallery_img"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
usePageSeoMeta({
  title: "О компании AutoShop — экспорт автомобилей из Китая",
  ogTitle: "О компании AutoShop — экспорт автомобилей из Китая",
  description: "AutoShop — профессиональный экспортёр автомобилей из Китая. Офисы в России и Китае. Работаем с юридическими лицами.",
  ogDescription: "AutoShop — профессиональный экспортёр автомобилей из Китая. Офисы в России и Китае. Работаем с юридическими лицами.",
})

useHead({
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify([
        {
          "@context": "https://schema.org",
          "@type": "ImageObject",
          "url": "https://example.com/about-1.jpg",
          "name": "AutoShop — команда и офис",
        },
        {
          "@context": "https://schema.org",
          "@type": "ImageObject",
          "url": "https://example.com/about-2.jpg",
          "name": "Процесс подбора автомобилей в Китае",
        },
        {
          "@context": "https://schema.org",
          "@type": "ImageObject",
          "url": "https://example.com/about-3.jpg",
          "name": "Автомобили на площадке в Китае",
        },
        {
          "@context": "https://schema.org",
          "@type": "ImageObject",
          "url": "https://example.com/about-4.webp",
          "name": "Доставка автомобилей для клиентов",
        },
      ]),
    },
  ],
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

.text {
  @apply max-w-[50rem] mx-auto mb-[3rem] text-[1.0625rem] leading-[1.8] text-gray-800 space-y-[1rem];
}

.gallery {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-[1.25rem] max-w-[60rem] mx-auto;
}

.gallery_item {
  @apply overflow-hidden rounded-[1rem] shadow-md;
}

.gallery_img {
  @apply w-full h-full object-cover transition-transform duration-500 hover:scale-105;
}

@media (max-width: 640px) {
  .h1__title {
    @apply text-[2rem] mb-[2rem];
  }
  .wrapper {
    @apply py-[1.5rem] mb-[3rem];
  }
  .text {
    @apply text-[1rem] mb-[2rem];
  }
}
</style>
