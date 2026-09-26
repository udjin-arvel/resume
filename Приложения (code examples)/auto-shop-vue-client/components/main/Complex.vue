<template>
  <div :class="$style.more">
    <div :class="$style.more__col">
      <MainAdv2
        icon="/w10.svg"
        :text="$t('land.adv4')"
        alt-text="icon1"
      />
    </div>
    <div :class="$style.more__col">
      <MainAdv2
        icon="/w11.svg"
        :text="$t('land.adv5')"
        alt-text="icon2"
      />
    </div>
  </div>

  <!--  Промо калькулятора, до реализации закомментировано -->
  <!-- <MainCalc /> -->
  <div :class="$style.more">
    <div :class="$style.more__cell">
      <MainAdv2
        icon="/w12.svg"
        :text="$t('land.adv6')"
        alt-text="icon1"
      />
    </div>
    <div :class="$style.more__cell">
      <MainAdv2
        icon="/w13.svg"
        :text="$t('land.adv7')"
        alt-text="icon1"
      />
    </div>
    <div :class="$style.more__cell">
      <MainAdv2
        icon="/w14.svg"
        :text="$t('land.adv8')"
        alt-text="icon1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">

</script>

<style module>
.more {
  @apply mx-auto flex flex-wrap rounded-[1.25rem] border border-[#AFA7AC] bg-white mb-[4.375rem] py-[2.5rem] px-[1.8125rem] shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.08)];
}

.more__cell {
  @apply  w-1/3 ;
}
.more__col {
  @apply w-1/2;
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
    @apply pl-[6rem]

  }
}

@media (max-width: 900px)
{
.more {
 @apply -mx-5 pt-10 pb-[0.625rem]   mb-[1.875rem];

}

.more__col,.more__cell {
  @apply w-full;
}
}
</style>
