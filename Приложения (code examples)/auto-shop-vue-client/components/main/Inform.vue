<template>
  <div :class="$style.more">
    <div :class="$style.more__cell">
      <MainAdv
        icon="/w1.svg"
        :text="$t('land.adv1')"
        alt-text="icon1"
      />
    </div>
    <div :class="$style.more__cell">
      <MainAdv
        icon="/w2.svg"
        :text="$t('land.adv2')"
        alt-text="icon2"
      />
    </div>
    <div :class="$style.more__cell">
      <MainAdv
        icon="/w3.svg"
        :text="$t('land.adv3')"
        alt-text="icon3"
      />
    </div>
  </div>
</template>

<script setup lang="ts">

</script>

<style module>
.more {
  @apply mx-auto flex flex-wrap rounded-[1.25rem] border border-[#AFA7AC] bg-white mb-[4.375rem] py-[2.5rem] px-[1.8125rem] shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.08)];;

}

.more__cell {
  @apply  w-1/3 ;
}
@media (max-width: 1100px)
{
  .more__cell {
    @apply w-[50%]

  }
}
@media (min-width: 1100px)
{
  .more {
    @apply pl-[5rem]

  }
}
@media (max-width: 900px)
{
.more {
  @apply p-0 bg-transparent shadow-none border-0 mb-[1.875rem];
}

.more__cell {
  @apply w-full;
}
}
</style>
