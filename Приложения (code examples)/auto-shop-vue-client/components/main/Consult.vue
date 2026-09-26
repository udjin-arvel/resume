<template>
  <div
    id="consult"
    :class="$style.consult"
  >
    <div :class="$style.consult__left">
      <div :class="$style.consult__title">
        Консультации по всем вопросам сотрудничества в 1 клик
      </div>

      <div :class="$style.consult__flex">
        <NuxtLink
          to="https://wa.me/79000000000"
          target="_blank"
          rel="nofollow noopener noreferrer"
          class="group"
          :class="$style.consult__btn_outline"
        >
          <img
            src="/wa-ico.svg"
            :class="$style.consult__btn_icon"
            alt="WhatsApp"
          >
          WhatsApp
        </NuxtLink>

        <NuxtLink
          to="https://t.me/demo_manager"
          target="_blank"
          rel="nofollow noopener noreferrer"
          class="group"
          :class="$style.consult__btn_outline"
        >
          <img
            src="/tg-ico.svg"
            :class="$style.consult__btn_icon"
            alt="Telegram"
          >
          Telegram
        </NuxtLink>

        <NuxtLink
          to="https://example.com/messenger"
          target="_blank"
          rel="nofollow noopener noreferrer"
          class="group"
          :class="$style.consult__btn_outline"
        >
          <img
            src="/max-ico.svg"
            :class="$style.consult__btn_icon"
            alt="MAX"
          >
          MAX
        </NuxtLink>

        <WechatModal
          class="group"
          :class="$style.consult__btn_outline"
        >
          <img
            src="/we-ico.svg"
            :class="$style.consult__btn_icon"
            alt="WeChat"
          >
          WeChat
        </WechatModal>
      </div>

      <NuxtLink
        :to="'tel:+79000000000'"
        :class="$style.consult__tel"
      >
        <img
          src="/phone.svg"
          :class="$style.consult__icon"
          alt="иконка телефона"
        >+7 900 000 0000
      </NuxtLink>
      <div :class="$style.consult__time">
        с 10:00 до 20:00 время Владивостока (МСК +7)
      </div>
      <NuxtLink
        :to="'tel:+8600000000000'"
        :class="$style.consult__tel"
      >
        <img
          src="/phone.svg"
          :class="$style.consult__icon"
          alt="иконка телефона"
        >+86 000 0000 0000
      </NuxtLink>
      <div :class="$style.consult__time">
        Номер в Китае, время Пекинское (МСК +5)
      </div>
    </div>

    <div :class="$style.consult__right">
      <div :class="$style.consult__item">
        <div :class="$style.consult__first">
          <img
            src="/map-pin.svg"
            :class="$style.consult__ico"
            alt="иконка карты"
          >
        </div>
        <div :class="$style.consult__second">
          <div :class="$style.consult__office">
            Офис в России
          </div>
          <div :class="$style.consult__text">
            ул. Примерная, 1, г. Примерск, Россия
          </div>
          <div :class="$style.consult__place">
            На карте:
            <NuxtLink
              :to="'https://example.com/map-ru'"
              target="_blank"
              rel="nofollow noopener noreferrer"
              :class="$style.consult__yandex"
            >
              https://example.com/map-ru
            </NuxtLink>
          </div>
        </div>
        <div :class="$style.consult__third">
          <img
            src="/map3.png"
            :class="$style.consult__canv"
            alt=""
          >
        </div>
      </div>
      <div :class="$style.consult__item">
        <div :class="$style.consult__first">
          <img
            src="/map-pin.svg"
            :class="$style.consult__ico"
            alt="иконка карты"
          >
        </div>
        <div :class="$style.consult__second">
          <div :class="$style.consult__office">
            Офис в Китае
          </div>
          <div :class="$style.consult__text">
            Demo Street 1, Example City
          </div>
          <div :class="$style.consult__text">
            示例市示例路 1 号
          </div>
          <div :class="$style.consult__place">
            На карте:
            <NuxtLink
              :to="'https://example.com/map-cn'"
              target="_blank"
              rel="nofollow noopener noreferrer"
              :class="$style.consult__yandex"
            >
              https://example.com/map-cn
            </NuxtLink>
            <div :class="$style.consult__place">
              <NuxtLink
                :to="'https://surl.amap.com/jp5ks2y3gwr'"
                target="_blank"
                rel="nofollow noopener noreferrer"
                :class="$style.consult__yandex"
              >
                https://surl.amap.com/jp5ks2y3gwr
              </NuxtLink>
            </div>
          </div>
        </div>
        <div :class="$style.consult__third">
          <img
            src="/map2.png?v=2"
            :class="$style.consult__canv"
            alt=""
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import WechatModal from "@/components/common/WechatModal.vue"
</script>

<style module>
.consult {
  @apply shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.08)] border border-grey-300 rounded-[1.25rem] px-[3.75rem] pt-[3.125rem] pb-[1.25rem] bg-white flex flex-row flex-wrap mb-[2.55rem];
}

.consult__canv {
  @apply rounded-[1.25rem] mb-[0.625rem] border border-grey-300;
}

.consult__place {
  @apply text-[1rem] font-semibold mb-[0.625rem];
}

.consult__yandex {
  @apply text-[1rem] font-semibold text-primary inline break-all no-underline;
}

.consult__right {
  @apply w-[44%] pt-0;
}

.consult__item {
  @apply flex flex-row flex-wrap mb-[0.625rem];
}

.consult__first {
  @apply w-[6%] pt-[0.688rem];
}

.consult__second {
  @apply pt-[0.563rem] w-[66%] pr-[1.25rem];
}

.consult__third {
  @apply pt-[0.563rem] w-[28%];
}

.consult__text {
  @apply text-[1rem] font-semibold text-grey mb-[0.625rem];
}

.consult__tel {
  @apply flex flex-row flex-wrap text-[1.5rem] font-semibold text-black mb-[0.688rem];
}

.consult__icon {
  @apply mr-[0.688rem];
}

.consult__time {
  @apply mb-[1.813rem] text-[1rem] font-semibold text-grey;
}

.consult__title {
  @apply text-[2rem] font-bold mb-[1.188rem];
}

.consult__flex {
  @apply flex flex-row flex-wrap mb-[1.813rem] gap-y-[1.25rem];
}

.consult__btn_outline {
  @apply inline-flex items-center mr-[1.25rem] rounded-[0.75rem] px-[1.5rem] py-[0.75rem] text-[1rem] font-bold border border-primary text-primary bg-transparent transition-colors duration-300;
}

.consult__btn_outline:hover {
  @apply bg-primary text-white;
}

/* При наведении на родителя (кнопку), инвертируем иконку, делая её белой */
:global(.group:hover) .consult__btn_icon {
  filter: brightness(0) invert(1);
}

.consult__btn_icon {
  @apply mr-[0.5rem] w-[1.5rem] h-[1.5rem] transition-all duration-300;
}

.consult__left {
  @apply w-[55.5%];
}

.consult__office {
  @apply text-[1.5rem] font-semibold mb-[0.688rem];
}

.consult__ico {
  @apply w-[1.5rem] h-[1.5rem];
}

@media (max-width: 1100px) {
  .consult__left {
    @apply w-full;
  }
  .consult__right {
    @apply w-full;
  }
}

@media (max-width: 640px) {
  .consult {
    @apply px-[1.25rem] pt-[2.5rem] pb-[0.625rem] -mx-[1.25rem];
  }
  .consult__title {
    @apply text-center mb-[1.25rem];
  }
  .consult__first {
    @apply w-[11%];
  }
  .consult__second {
    @apply w-[89%];
  }
  .consult__third {
    @apply hidden;
  }
  .consult__btn_outline {
    @apply mr-[0.5rem] mb-[0.5rem] px-[1rem];
  }
  .consult__flex {
    @apply justify-center;
  }
}
</style>
