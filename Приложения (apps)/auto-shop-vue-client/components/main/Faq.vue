<template>
  <div :class="$style.wrapper">
    <div :class="$style.container">
      <component
        :is="isPage ? 'h1' : 'h2'"
        :class="$style.h1__title"
      >
        Частые вопросы
      </component>

      <div :class="$style.faq_list">
        <Disclosure
          v-for="(faq, index) in faqs"
          :key="index"
          v-slot="{ open }"
          as="div"
          :class="$style.faq_item"
        >
          <DisclosureButton :class="$style.faq_button">
            <span :class="$style.faq_question">{{ faq.question }}</span>
            <svg
              :class="[$style.faq_icon, { [$style.faq_icon_open]: open }]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </DisclosureButton>

          <transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform -translate-y-2 opacity-0"
            enter-to-class="transform translate-y-0 opacity-100"
            leave-active-class="transition duration-150 ease-out"
            leave-from-class="transform translate-y-0 opacity-100"
            leave-to-class="transform -translate-y-2 opacity-0"
          >
            <DisclosurePanel :class="$style.faq_panel">
              <p
                v-for="(paragraph, pIdx) in faq.answer"
                :key="pIdx"
                :class="$style.faq_text"
              >
                {{ paragraph }}
              </p>
            </DisclosurePanel>
          </transition>
        </Disclosure>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/vue"

defineProps({
  isPage: {
    type: Boolean,
    default: false,
  },
})

const faqs = [
  {
    question: "Могу ли я привезти автомобиль для себя через вашу компанию?",
    answer: [
      "Наша компания работает только с юридическими лицами и осуществляет полный цикл экспорта авто в РФ.",
    ],
  },
  {
    question: "Сколько времени занимает доставка автомобиля из Китая?",
    answer: [
      "Процесс экспорта автомобиля от момента оплаты занимает, в среднем, от 2 до 5 недель. Сроки зависят от месторасположения автомобиля в Китае, очереди на переоформление документов в ГАИ, расписания рейсов на погрузку на автовоз через границу или морской фрахт, а также от погодных условий и праздничных дней.",
      "Мы используем только проверенные логистические каналы, а движение авто отслеживается на каждом этапе.",
    ],
  },
  {
    question: "Доставляете ли вы автомобиль не только во Уссурийск?",
    answer: [
      "Помимо устоявшейся транспортной ветки Суйфэньхэ - Уссурийск, также мы доставляем автомобили морским путём Циндао - Владивосток и сухопутным путём Хоргос - Москва.",
    ],
  },
  {
    question: "Можно ли привезти автомобиль редкой модели, с конкретной комплектацией или в определённом цвете?",
    answer: [
      "Наша экспертиза позволяет искать и находить для вас автомобили в любом ценовом сегменте и с конкретными требованиями, будь то эксклюзивный цвет кузова или уникальная комплектация, если такие автомобили доступны на рынке Китая.",
      "При направлении заявки, формируете ТЗ и пожелания, а мы используем все наши ресурсы, чтобы точно подобрать и привезти именно ваш идеальный автомобиль.",
    ],
  },
  {
    question: "Как проверяется автомобиль? Как быть уверенным в качестве?",
    answer: [
      "По выбранному вами варианту мы предварительно запрашиваем фото и видео дефектов, которые возможно выявить до диагностики. Далее ставим автомобиль на диагностику в проверенные сервисы. В список диагностики входит:",
      "1. Проверка крупных аварий",
      "2. Проверка на возгорание",
      "3. Проверка на затопление",
      "4. Проверка на окрасы и замены внешних частей кузова",
      "5. Внутренний осмотр на царапины и дефекты салона",
      "6. Проверка освещения и электрооборудования",
      "7. Диагностика запуска двигателя",
      "8. Проверка двигателя и трансмиссии",
      "9. Осмотр подкапотного пространства",
      "Все эти отчёты также предоставляются клиенту для полной уверенности в качестве автомобиля. По приходу автомобиля на территорию нашей экспортной компании мы делаем повторную тщательную сверку состояния и направляем отчёт клиенту.",
    ],
  },
  {
    question: "Какие возможны дополнительные услуги?",
    answer: [
      "Ввиду того, что наша компания находится в Китае, мы имеем возможность организовать оказание дополнительных услуг для автомобиля до его отправки в Россию. Особой популярностью пользуются установка подогревов, оклейка кузова в защитную TPU плёнку, электропривода багажника, а также подключение дополнительного ключа, покраска и полировка.",
      "Вы просто высказываете нам свои пожелания, и мы реализуем их на месте, гарантируя качество исполнения перед отправкой.",
    ],
  },
  {
    question: "Как происходит оплата за автомобиль?",
    answer: [
      "Для приобретения автомобиля из Китая мы выставляем вам инвойс и контракт для оформления валютного платежа в юанях.",
      "Важно: вы переводите средства не напрямую продавцу, а на счет нашей официальной экспортной компании, открытый в VTB Shanghai. Это означает, что мы несем полную финансовую ответственность за эти средства до момента получения вами автомобиля. Для перевода рекомендуем использовать только банк ВТБ, платежи доходят за 1-3 дня после оплаты.",
    ],
  },
  {
    question: "Где покупаются автомобили в Китае?",
    answer: [
      "Для поиска машин мы используем все возможные ресурсы, такие как платформы по продаже машин, при этом не только общедоступные, но и закрытые для автодилеров внутри Китая. Также у нас есть наработанные партнерские отношения с дилерами по всей стране, которые могут предоставить варианты автомобилей до их публикации в общий доступ.",
    ],
  },
]
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

.faq_list {
  @apply max-w-[50rem] mx-auto flex flex-col gap-[1rem];
}

.faq_item {
  @apply border border-gray-200 rounded-[1rem] bg-white overflow-hidden shadow-sm;
}

.faq_button {
  @apply flex w-full justify-between items-center px-[1.5rem] py-[1.25rem] text-left text-[1.125rem] font-medium text-black hover:bg-gray-50 transition-colors duration-300;
}

.faq_question {
  @apply pr-[1rem];
  font-size: 20px;
}

.faq_icon {
  @apply w-[1.5rem] h-[1.5rem] text-primary transition-transform duration-300 flex-shrink-0;
}

.faq_icon_open {
  @apply rotate-180;
}

.faq_panel {
  @apply px-[1.5rem] pb-[1.5rem] text-[1rem] leading-[1.6] text-gray-600;
}

.faq_text {
  @apply mb-[0.5rem] last:mb-0;
  font-size: 18px;
}

@media (max-width: 640px) {
  .h1__title {
    @apply text-[2rem] mb-[2rem];
  }
  .wrapper {
    @apply py-[1.5rem] mb-[3rem];
  }
  .faq_button {
    @apply px-[1rem] py-[1rem] text-[1rem];
  }
  .faq_panel {
    @apply px-[1rem] pb-[1rem];
  }
  .faq_icon {
    @apply w-[1.25rem] h-[1.25rem];
  }
}
</style>
