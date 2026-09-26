<template>
  <div :class="$style.adv">
    <div :class="$style.adv__icon">
      <img
        :src="icon"
        :alt="altText"
      >
    </div>
    <div :class="$style.adv__text">
      {{ text }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  icon: {
    type: String,
    required: true,
  },
  altText: {
    type: String,
    default: "icon",
  },
  text: {
    type: String,
    required: true,
  },
})
</script>

<style module>
.adv {
@apply flex flex-wrap;
}

.adv__icon {
  @apply max-w-[15%];
}

.adv__text {
  @apply font-medium pl-5 pr-[2.4375rem] text-[1.5rem] w-[85%];
}
@media (max-width: 1100px)
{
  .adv {
    @apply mb-10;
  }
}
@media (max-width: 640px)
{
  .adv {
  @apply  flex flex-row flex-wrap;
}

.adv__icon {

  @apply max-w-[20%] flex flex-row flex-wrap justify-center mb-[0.9375rem];
}

.adv__text {
  @apply w-[80%]  pl-[1.25rem] text-[1.125rem] font-medium pr-0;
}
}
</style>
