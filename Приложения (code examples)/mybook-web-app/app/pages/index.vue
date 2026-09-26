<script setup>
const authStore = useAuthStore();

useHead({
  title: 'TheBook - Книга нового поколения',
  meta: [
    { name: 'description', content: 'Платформа для создания и чтения уникальных историй в рамках одной вселенной. Присоединяйтесь к сообществу писателей и читателей.' },
    { name: 'keywords', content: 'книги, истории, лор, вселенная, писатели, читатели' }
  ]
});

const isAuthenticated = computed(() => authStore.isAuthenticated);

const sections = [
  {
    to: '/stories',
    icon: 'fa6-solid:book-open',
    title: 'Истории',
    description: 'Исследуйте увлекательные истории и анонсы'
  },
  {
    to: '/notions',
    icon: 'fa6-solid:file-lines',
    title: 'Понятия',
    description: 'Изучите определения, персонажей и места'
  },
  {
    to: '/lore',
    icon: 'fa6-solid:wand-magic-sparkles',
    title: 'Лор',
    description: 'Погрузитесь в элементы вселенной'
  },
  {
    to: '/compositions',
    icon: 'fa6-solid:layer-group',
    title: 'Композиции',
    description: 'Читайте полноценные книги и серии'
  }
];
</script>

<template>
  <div class="main-page space-y-6 md:space-y-8">
    <header class="space-y-2">
      <h1 class="text-2xl md:text-3xl font-semibold text-gold/90 leading-snug">
        Добро пожаловать на платформу!
      </h1>
      <p class="text-on-surface-muted text-sm md:text-base leading-relaxed">
        Книга нового поколения — одна вселенная, множество историй.
      </p>
    </header>

    <article class="bg-black border border-beige/40 rounded-lg p-4 md:p-6 space-y-4 md:space-y-5">
      <p class="text-white/90 text-sm md:text-base leading-relaxed mb-0">
        Перед вами дом, который не строил Джек, потому что у него не хватило бы на это квалификации.
        Создание уникальной огромной вселенной начинается с одного написанного слова, но когда будет та соломенка,
        что перевернет умы читателей и сломает хребет безжизненной бытовухе? Не имею ни малейшего представления.
        Я знаю только, что если писать по сто слов в день, можно написать войну и мир за три года.
      </p>

      <p class="text-white/90 text-sm md:text-base leading-relaxed mb-0">
        Но как же мучительно скучно ограничивать себя классической беллитристикой вроде Толстова или Достоевского.
        Маленький человек и левиафан. Личные трагедии просунутые сквозь игольное ушко деспотизма.
        Это перестало вызывать даже кроху сопереживания. Когда ты проворачиваешь колесо в десятый раз,
        но все еще стоишь на месте, можно с уверенностью сказать, что ты либо тонешь в болоте,
        либо проворачиваешь ты вовсе не колесо.
      </p>

      <p class="text-white/90 text-sm md:text-base leading-relaxed mb-0">
        Поэтому к черту писателей прошлого, из могилы особо нечему учить, здесь и сейчас я представляю вам
        <span class="text-gold/90 font-medium">книгу нового поколения</span>.
      </p>
    </article>

    <section>
      <p class="md-section-title mb-4">Разделы</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <NuxtLink
          v-for="section in sections"
          :key="section.to"
          :to="section.to"
          class="group flex flex-col bg-black border border-beige/40 rounded-lg p-4 md:p-5 transition-colors duration-200 hover:border-beige/60 active:bg-white/[0.02]"
        >
          <div class="w-11 h-11 rounded-full bg-beige/15 flex items-center justify-center mb-3 transition-colors group-hover:bg-beige/25">
            <Icon :name="section.icon" class="w-5 h-5 text-beige/90" />
          </div>
          <h2 class="text-base md:text-lg font-semibold text-gold/90 mb-1.5">
            {{ section.title }}
          </h2>
          <p class="text-on-surface-muted text-sm leading-relaxed">
            {{ section.description }}
          </p>
        </NuxtLink>
      </div>
    </section>

    <section class="bg-black border border-beige/40 rounded-lg overflow-hidden">
      <div class="p-4 md:p-6">
        <h2 class="text-lg md:text-xl font-semibold text-gold/90 mb-2">
          Присоединяйтесь к сообществу
        </h2>
        <p class="text-white/80 text-sm md:text-base leading-relaxed mb-0">
          Создавайте контент, комментируйте, получайте опыт и открывайте новые уровни доступа к контенту.
        </p>
      </div>

      <div class="flex flex-col justify-center sm:flex-row gap-3 px-4 md:px-6 pt-2 pb-6 border-t border-white/5" v-if="!isAuthenticated">
        <NuxtLink
          to="/auth"
          class="md-btn-filled justify-center sm:flex-1 sm:max-w-[220px]"
        >
          Авторизоваться
        </NuxtLink>
        <NuxtLink
          to="/tutorial"
          class="md-btn-text justify-center sm:flex-1 sm:max-w-[220px]"
        >
          Узнать больше
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
