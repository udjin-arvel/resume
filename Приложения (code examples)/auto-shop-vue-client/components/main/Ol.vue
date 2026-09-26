<template>
  <ol :class="$style.ol">
    <li
      v-for="(item, index) in items"
      :key="index"
      :class="$style.ol__li"
    >
      {{ $t(item.key) }}
    </li>
  </ol>
</template>

<script setup lang="ts">
defineProps<{
  items: { key: string }[]
}>()
</script>

<style module>
.ol {
   counter-reset: item;
      @apply pl-2 text-[24px] text-grey mb-[1.25rem];

}
.ol__li {
   @apply relative pl-[1.625rem] mb-1;
}
.ol__li:before {
     content: counter(item) ".";
    counter-increment: item;
    @apply absolute left-0 top-0 mr-[0.25rem];

}
@media (max-width: 900px)
{
  .ol {
    font-size: 18px;
    padding-left: 4px;
  }
  .ol__li {
    padding-left: 18px;
  }
}
</style>
