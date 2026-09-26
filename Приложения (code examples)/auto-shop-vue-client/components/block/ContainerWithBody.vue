<template>
  <div :class="$style.wrap">
    <div
      v-if="withHeader"
      :class="$style.headWrap"
    >
      <slot name="head" />
    </div>
    <BlockContainer :with-ident="false">
      <template #default>
        <div :class="withBodyIdent && $style.ident">
          <slot name="body" />
        </div>
        <div
          v-if="withFooter"
          :class="$style.footerWrap"
        >
          <slot name="footer" />
        </div>
      </template>
    </BlockContainer>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    withHeader?: boolean
    withFooter?: boolean
    withBodyIdent?: boolean
  }>(),
  {
    withHeader: true,
    withFooter: true,
    withBodyIdent: true,
  },
)
</script>

<style module>
.wrap {
  @apply flex flex-col;
}

.ident {
  @apply px-4 pt-4 pb-6;
}

.headWrap {
  @apply mb-3;
}

.footerWrap {
  @apply px-4 pt-4 pb-6;
}
</style>
