<template>
  <aside class="app-sidebar">
    <!-- Top buttons -->
    <div class="px-1.5 pt-3 pb-1 flex justify-center gap-2">
      <button
        type="button"
        class="md-icon-button w-6 h-6 border border-beige/40 focus:outline-none"
        title="Назад"
        @click="router.back()"
      >
        <Icon name="fa6-solid:arrow-left" class="w-2.5 h-2.5 text-beige" />
      </button>
      <button
        type="button"
        class="md-icon-button w-6 h-6 border border-beige/40 focus:outline-none"
        title="Профиль"
        @click="router.push('/profile')"
      >
        <Icon name="fa6-solid:user" class="w-2.5 h-2.5 text-beige" />
      </button>
    </div>

    <!-- Avatar -->
    <div class="px-1.5 py-1.5">
      <button
        type="button"
        class="w-9 h-9 rounded-full overflow-hidden bg-surface-muted border border-beige/30 flex items-center justify-center mx-auto hover:border-beige/60 transition-colors active:scale-95 focus:outline-none"
        @click="router.push('/profile')"
      >
        <ClientOnly>
          <img
            :key="avatarKey"
            :src="avatarUrl"
            :alt="displayLogin"
            class="w-full h-full object-cover"
          >
          <template #fallback>
            <img
              src="/avatar.png"
              alt=""
              class="w-full h-full object-cover opacity-60"
            >
          </template>
        </ClientOnly>
      </button>
    </div>

    <!-- Menu and Add Content buttons -->
    <div class="px-1.5 py-1 flex flex-col items-center gap-1.5">
      <button
        type="button"
        class="md-icon-button w-6 h-6 border border-beige/40 focus:outline-none"
        title="Меню"
        @click="emit('open-menu')"
      >
        <Icon name="fa6-solid:bars" class="w-3 h-3 text-beige" />
      </button>
      <button
        type="button"
        class="md-icon-button w-6 h-6 border border-beige/40 focus:outline-none"
        title="Добавить контент"
        @click="emit('update:showAddContent', !showAddContent)"
      >
        <Icon v-if="showAddContent" name="fa6-solid:xmark" class="w-3 h-3 text-beige" />
        <Icon v-else name="fa6-solid:plus" class="w-3 h-3 text-beige" />
      </button>
    </div>

    <!-- Add Content Submenu -->
    <div v-if="showAddContent" class="px-1.5 pb-2 flex flex-col gap-1.5 text-center">
      <button
        type="button"
        class="text-[10px] leading-tight text-beige hover:text-white transition-colors focus:outline-none"
        @click="navigateAndClose('/stories/create')"
      >
        Добавить историю
      </button>
      <button
        type="button"
        class="text-[10px] leading-tight text-beige hover:text-white transition-colors focus:outline-none"
        @click="navigateAndClose('/notions/create')"
      >
        Добавить понятие
      </button>
      <button
        type="button"
        class="text-[10px] leading-tight text-beige hover:text-white transition-colors focus:outline-none"
        @click="navigateAndClose('/lore/create')"
      >
        Добавить элемент лора
      </button>
      <button
        type="button"
        class="text-[10px] leading-tight text-beige hover:text-white transition-colors focus:outline-none"
        @click="navigateAndClose('/notes/create')"
      >
        Добавить заметку
      </button>
    </div>

    <!-- Center Navigation -->
    <div class="px-1.5 flex-1 flex flex-col justify-center items-center gap-2.5">
      <NuxtLink
        to="/stories"
        class="md-icon-button w-9 h-9 bg-black/50 border border-beige/40 focus:outline-none"
        title="Истории"
      >
        <Icon name="fa6-solid:book-open" class="w-4 h-4 text-white" />
      </NuxtLink>
      <button
        type="button"
        class="md-icon-button w-9 h-9 bg-black/50 border border-beige/40 focus:outline-none"
        title="Понятия"
        @click="router.push('/notions')"
      >
        <Icon name="fa6-solid:file-lines" class="w-4 h-4 text-white" />
      </button>
      <button
        type="button"
        class="md-icon-button w-9 h-9 bg-black/50 border border-beige/40 focus:outline-none"
        title="Элементы лора"
        @click="router.push('/lore')"
      >
        <Icon name="fa6-solid:wand-magic-sparkles" class="w-4 h-4 text-white" />
      </button>
      <button
        type="button"
        class="md-icon-button w-9 h-9 bg-black/50 border border-beige/40 focus:outline-none"
        title="Композиции"
        @click="router.push('/compositions')"
      >
        <Icon name="fa6-solid:layer-group" class="w-4 h-4 text-white" />
      </button>
    </div>

    <!-- Bottom buttons -->
    <div class="px-1.5 pb-3 grid grid-cols-2 gap-1.5 mx-auto">
      <button
        type="button"
        class="md-icon-button w-6 h-6 border border-beige/40 focus:outline-none"
        title="Написать автору проекта"
        @click="emit('open-contact')"
      >
        <Icon name="fa6-solid:envelope" class="w-3 h-3 text-beige" />
      </button>
      <button
        type="button"
        class="md-icon-button w-6 h-6 border border-beige/40 focus:outline-none"
        title="Настройки шрифта"
        @click="emit('open-font-settings')"
      >
        <Icon name="fa6-solid:sliders" class="w-3 h-3 text-beige" />
      </button>
      <button
        type="button"
        class="md-icon-button w-6 h-6 border border-beige/40 focus:outline-none"
        title="Указать на ошибку в тексте"
        @click="emit('open-error')"
      >
        <Icon name="fa6-solid:triangle-exclamation" class="w-3 h-3 text-beige" />
      </button>
      <button
        type="button"
        class="md-icon-button w-6 h-6 border border-beige/40 focus:outline-none"
        title="Быстрый словарь"
        @click="emit('open-dictionary')"
      >
        <Icon name="fa6-solid:magnifying-glass" class="w-3 h-3 text-beige" />
      </button>
    </div>
  </aside>
</template>

<script setup>
import { storeToRefs } from 'pinia';

const router = useRouter();
const authStore = useAuthStore();
const { avatarUrl, avatarPath } = useAuthAvatarUrl();
const { user } = storeToRefs(authStore);

defineProps({
  showAddContent: {
    type: Boolean,
    default: false
  }
});

const avatarKey = computed(() => avatarPath.value || 'default');
const displayLogin = computed(() => user.value?.login);

const emit = defineEmits([
  'open-menu',
  'update:showAddContent',
  'open-contact',
  'open-font-settings',
  'open-error',
  'open-dictionary'
]);

const navigateAndClose = (path) => {
  router.push(path);
  emit('update:showAddContent', false);
};
</script>

<style scoped>
.app-sidebar :is(button, a) {
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.app-sidebar :is(button, a):focus,
.app-sidebar :is(button, a):focus-visible,
.app-sidebar :is(button, a):active {
  outline: none;
  box-shadow: none;
}
</style>
