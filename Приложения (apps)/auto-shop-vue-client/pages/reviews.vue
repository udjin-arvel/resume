<template>
  <div>
    <h1 :class="$style.h1__title">
      Отзывы
    </h1>
    <MainRev :hide-title="true" />
  </div>
</template>

<script setup lang="ts">
usePageSeoMeta({
  title: "Отзывы клиентов о доставке автомобилей из Китая | AutoShop",
  ogTitle: "Отзывы клиентов о доставке автомобилей из Китая | AutoShop",
  description: "Читайте реальные отзывы клиентов о покупке и доставке автомобилей из Китая через AutoShop. Честные оценки и опыт наших покупателей.",
  ogDescription: "Читайте реальные отзывы клиентов о покупке и доставке автомобилей из Китая через AutoShop. Честные оценки и опыт наших покупателей.",
})
</script>

<style module>
.h1__title {
  @apply font-bold text-black leading-none text-[3rem] mb-5 text-center;
}
</style>
