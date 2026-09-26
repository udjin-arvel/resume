<script setup>
useHead({
  title: 'Туториал - TheBook',
  meta: [
    { name: 'description', content: 'Узнайте о рейтинговой системе, типах контента и навигации на платформе TheBook' }
  ]
});

const experienceActions = [
  'Создание историй',
  'Создание композиций',
  'Создание понятий',
  'Создание элементов лора',
  'Создание публичных заметок',
  'Добавление персонажей и описаний',
  'Добавление комментария',
  'Поставление лайка',
  'Исправление орфографии и пунктуации',
  'Выполнение заданий'
];

const contentTypes = [
  {
    title: 'Истории',
    description: 'Основной контент платформы. Могут быть самостоятельными или входить в состав композиций.'
  },
  {
    title: 'Композиции',
    description: 'Сборники историй, объединённые общей темой или сюжетной линией.'
  },
  {
    title: 'Понятия',
    description: 'Определения, персонажи, места, объекты, сущности и события вселенной.'
  },
  {
    title: 'Элементы лора',
    description: 'Дополнительная информация о вселенной, не входящая в основные понятия.'
  },
  {
    title: 'Заметки',
    description: 'Личные заметки пользователей, которые могут быть сделаны публичными.'
  },
  {
    title: 'Платный контент',
    description: 'Специальные заметки с секретами вселенной, доступные за токены.'
  }
];

const achievements = [
  { title: 'Опытный писатель', description: 'Пользователь написал 10 историй' },
  { title: 'Комментатор', description: 'Оставил 50 комментариев' },
  { title: 'Корректор', description: 'Исправил 100 ошибок в текстах' },
  { title: 'Поддерживающий', description: 'Потратил 1000 токенов на поддержку' }
];

const navSections = [
  {
    to: '/stories',
    icon: 'fa6-solid:book-open',
    title: 'Истории',
    description: 'Просмотр всех доступных историй с фильтрацией'
  },
  {
    to: '/notions',
    icon: 'fa6-solid:file-lines',
    title: 'Понятия',
    description: 'Словарь терминов и персонажей вселенной'
  },
  {
    to: '/lore',
    icon: 'fa6-solid:wand-magic-sparkles',
    title: 'Лор',
    description: 'Дополнительная информация о вселенной'
  },
  {
    to: '/compositions',
    icon: 'fa6-solid:layer-group',
    title: 'Композиции',
    description: 'Книги и серии историй'
  }
];
</script>

<template>
  <div class="tutorial-page space-y-6 md:space-y-8">
    <header class="space-y-2">
      <h1 class="text-2xl md:text-3xl font-semibold text-gold/90 leading-snug">
        Туториал
      </h1>
      <p class="text-on-surface-muted text-sm md:text-base leading-relaxed">
        Как устроена платформа, рейтинговая система и типы контента.
      </p>
    </header>

    <section class="bg-black border border-beige/40 rounded-lg p-4 md:p-6 space-y-4">
      <h2 class="text-lg md:text-xl font-semibold text-gold/90">
        Рейтинговая система
      </h2>
      <p class="text-white/90 text-sm md:text-base leading-relaxed mb-0">
        На сайте реализована рейтинговая система. У вас есть уровень, и в зависимости от него вам доступно
        разное количество контента. Более высокий уровень не только открывает новый контент, но также
        расширяет старый — например, добавляет понятиям или элементам лора новые описания.
      </p>
      <p class="text-white/90 text-sm md:text-base leading-relaxed mb-0">
        Уровень повышается, когда пользователь набирает достаточно опыта. Опыт даётся за следующие действия:
      </p>
      <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 pt-1">
        <li
          v-for="action in experienceActions"
          :key="action"
          class="flex items-start gap-2.5 text-sm md:text-base text-white/80 leading-snug"
        >
          <Icon
            name="fa6-solid:circle-check"
            class="w-4 h-4 text-beige/80 flex-shrink-0 mt-0.5"
          />
          <span>{{ action }}</span>
        </li>
      </ul>
    </section>

    <section class="bg-black border border-beige/40 rounded-lg p-4 md:p-6">
      <h2 class="text-lg md:text-xl font-semibold text-gold/90 mb-3">
        Покупка опыта
      </h2>
      <p class="text-white/90 text-sm md:text-base leading-relaxed mb-0">
        Также вы можете купить необходимое количество опыта в качестве поддержки проекта.
        Это поможет быстрее получить доступ к закрытому контенту и поддержать развитие платформы.
      </p>
    </section>

    <section>
      <p class="md-section-title mb-4">
        Типы контента
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <article
          v-for="item in contentTypes"
          :key="item.title"
          class="bg-black border border-beige/40 rounded-lg p-4 md:p-5"
        >
          <h3 class="text-base font-semibold text-gold/90 mb-1.5">
            {{ item.title }}
          </h3>
          <p class="text-on-surface-muted text-sm leading-relaxed mb-0">
            {{ item.description }}
          </p>
        </article>
      </div>
    </section>

    <section>
      <p class="md-section-title mb-4">
        Достижения
      </p>
      <p class="text-white/90 text-sm md:text-base leading-relaxed mb-4">
        На платформе есть система достижений, которые отмечают ваши успехи. Например:
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <article
          v-for="item in achievements"
          :key="item.title"
          class="bg-black border border-beige/40 rounded-lg p-4"
        >
          <h3 class="text-base font-medium text-beige/90 mb-1">
            {{ item.title }}
          </h3>
          <p class="text-on-surface-muted text-sm leading-relaxed mb-0">
            {{ item.description }}
          </p>
        </article>
      </div>
    </section>

    <section>
      <p class="md-section-title mb-4">
        Навигация
      </p>
      <div class="bg-black border border-beige/40 rounded-lg overflow-hidden divide-y divide-white/5">
        <NuxtLink
          v-for="section in navSections"
          :key="section.to"
          :to="section.to"
          class="flex items-center gap-3 md:gap-4 px-4 py-3 md:py-4 transition-colors hover:bg-white/[0.03] active:bg-white/[0.05]"
        >
          <div class="w-10 h-10 md:w-11 md:h-11 rounded-full bg-beige/15 flex items-center justify-center flex-shrink-0">
            <Icon :name="section.icon" class="w-5 h-5 text-beige/90" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-base font-medium text-gold/90">
              {{ section.title }}
            </div>
            <div class="text-on-surface-muted text-sm leading-snug mt-0.5">
              {{ section.description }}
            </div>
          </div>
          <Icon
            name="fa6-solid:chevron-right"
            class="w-4 h-4 text-on-surface-muted flex-shrink-0"
          />
        </NuxtLink>
      </div>
    </section>

    <section class="bg-black border border-beige/40 rounded-lg overflow-hidden">
      <div class="p-4 md:p-6">
        <h2 class="text-lg md:text-xl font-semibold text-gold/90 mb-2">
          Готовы начать?
        </h2>
        <p class="text-white/80 text-sm md:text-base leading-relaxed mb-0">
          Авторизуйтесь, чтобы создавать контент, зарабатывать опыт и открывать новые уровни доступа.
        </p>
      </div>
      <div class="flex flex-col sm:flex-row gap-3 px-4 md:px-6 py-4 border-t border-white/5">
        <NuxtLink
          to="/auth"
          class="md-btn-filled justify-center sm:max-w-[220px]"
        >
          Авторизоваться
        </NuxtLink>
        <NuxtLink
          to="/"
          class="md-btn-text justify-center sm:max-w-[220px]"
        >
          На главную
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
