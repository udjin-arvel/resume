<template>
  <div :class="[$style.wrap, withIdent && $style.ident, overflowHidden ? $style.overflowHidden : '']">
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    withIdent?: boolean
    overflowHidden?: boolean
  }>(),
  {
    withIdent: false,
    overflowHidden: true,
  },
)
</script>

 <style module>
 .wrap {
     @apply -mx-4 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl sm:mx-0;
 }
 .ident {
     @apply px-4 py-6;
 }
 .overflowHidden {
     @apply overflow-hidden;
 }
</style>
