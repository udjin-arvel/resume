<template>
  <div class="app-shell">
    <!-- Main column -->
    <div class="app-main">
      <header class="page-header">
        <div class="flex items-center justify-between gap-4">
          <div
            class="bg-black/80 backdrop-blur-sm rounded-[50px] h-[50px] w-[320px] max-w-full flex items-center shadow-elevation-1 cursor-pointer"
            role="button"
            @click="router.push('/')"
            @dblclick="router.push('/stories')"
          >
            <img src="/logo_small.png" alt="Logo" class="w-6 ml-3 mr-2">
            <span class="text-white font-medium truncate pr-4">{{ pageTitle }}</span>
          </div>

          <!-- Mobile menu trigger -->
          <button
            type="button"
            class="md-icon-button w-8 h-8 border border-beige/40 md:hidden focus:outline-none"
            title="Меню"
            @click="showSideMenu = true"
          >
            <Icon name="fa6-solid:bars" class="w-4 h-4 text-beige" />
          </button>
        </div>
      </header>

      <main class="flex-1">
        <div class="page-content">
          <slot />
        </div>
      </main>
    </div>

    <!-- Desktop sidebar (in document flow) -->
    <AppSidebar
      v-model:show-add-content="showAddContent"
      @open-menu="showSideMenu = true"
      @open-contact="showContactModal = true"
      @open-font-settings="showFontSettingsModal = true"
      @open-error="showErrorModal = true"
      @open-dictionary="showDictionaryModal = true"
    />

    <!-- Side Menu Drawer -->
    <Transition name="sidebar-overlay">
      <div
        v-if="showSideMenu"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        @click.self="closeSideMenu"
      >
        <Transition name="sidebar-slide">
          <div
            v-if="showSideMenu"
            class="fixed top-0 right-0 md:right-[var(--sidebar-width)] h-full w-60 bg-surface-elevated shadow-elevation-3 flex flex-col z-50"
          >
            <div class="flex justify-between items-center px-3 py-3 border-b border-white/5 shrink-0">
              <div class="flex items-center gap-2">
                <img src="/logo_small.png" alt="Logo" class="w-5 h-5">
                <span class="text-sm text-white font-medium">Меню</span>
              </div>
              <button
                type="button"
                class="md-icon-button w-7 h-7 text-beige focus:outline-none"
                @click="closeSideMenu"
              >
                <Icon name="fa6-solid:xmark" class="w-4 h-4" />
              </button>
            </div>

            <nav class="flex-1 overflow-y-auto py-1.5 min-h-0">
              <!-- Mobile: main sections (sidebar hidden on <md) -->
              <div class="md:hidden">
                <p class="md-section-title mx-3 mt-1 mb-1.5 !text-xs">Разделы</p>

                <NuxtLink
                  to="/stories"
                  :class="['md-list-item mx-1.5', isActiveRoute('/stories') && 'md-list-item-active']"
                  @click="closeSideMenu"
                >
                  <div class="md-list-item-icon">
                    <Icon name="fa6-solid:book-open" class="md-list-item-icon-svg" />
                  </div>
                  <span class="text-white">Истории</span>
                </NuxtLink>
                <NuxtLink
                  to="/notions"
                  :class="['md-list-item mx-1.5', isActiveRoute('/notions') && 'md-list-item-active']"
                  @click="closeSideMenu"
                >
                  <div class="md-list-item-icon">
                    <Icon name="fa6-solid:file-lines" class="md-list-item-icon-svg" />
                  </div>
                  <span class="text-white">Понятия</span>
                </NuxtLink>
                <NuxtLink
                  to="/lore"
                  :class="['md-list-item mx-1.5', isActiveRoute('/lore') && 'md-list-item-active']"
                  @click="closeSideMenu"
                >
                  <div class="md-list-item-icon">
                    <Icon name="fa6-solid:wand-magic-sparkles" class="md-list-item-icon-svg" />
                  </div>
                  <span class="text-white">Элементы лора</span>
                </NuxtLink>
                <NuxtLink
                  to="/compositions"
                  :class="['md-list-item mx-1.5', isActiveRoute('/compositions') && 'md-list-item-active']"
                  @click="closeSideMenu"
                >
                  <div class="md-list-item-icon">
                    <Icon name="fa6-solid:layer-group" class="md-list-item-icon-svg" />
                  </div>
                  <span class="text-white">Композиции</span>
                </NuxtLink>

                <div class="my-2 mx-3 border-t border-white/5" />
              </div>

              <NuxtLink
                to="/notes"
                :class="['md-list-item mx-1.5', isActiveRoute('/notes') && 'md-list-item-active']"
                @click="closeSideMenu"
              >
                <div class="md-list-item-icon">
                  <Icon name="fa6-solid:note-sticky" class="md-list-item-icon-svg" />
                </div>
                <span class="text-white">Заметки</span>
              </NuxtLink>
              <NuxtLink
                to="/tutorial"
                :class="['md-list-item mx-1.5', isActiveRoute('/tutorial') && 'md-list-item-active']"
                @click="closeSideMenu"
              >
                <div class="md-list-item-icon">
                  <Icon name="fa6-solid:graduation-cap" class="md-list-item-icon-svg" />
                </div>
                <span class="text-white">Туториал</span>
              </NuxtLink>
              <NuxtLink
                to="/contact"
                :class="['md-list-item mx-1.5', isActiveRoute('/contact') && 'md-list-item-active']"
                @click="closeSideMenu"
              >
                <div class="md-list-item-icon">
                  <Icon name="fa6-solid:envelope" class="md-list-item-icon-svg" />
                </div>
                <span class="text-white">Контакты</span>
              </NuxtLink>

              <div class="my-2 mx-3 border-t border-white/5" />

              <NuxtLink
                to="/profile"
                :class="['md-list-item mx-1.5', isActiveRoute('/profile') && 'md-list-item-active']"
                @click="closeSideMenu"
              >
                <div class="md-list-item-icon">
                  <Icon name="fa6-solid:user" class="md-list-item-icon-svg" />
                </div>
                <span class="text-white">Профиль</span>
              </NuxtLink>
              <NuxtLink
                v-if="authStore.canAccessAdmin"
                to="/admin"
                :class="['md-list-item mx-1.5', isActiveRoute('/admin') && 'md-list-item-active']"
                @click="closeSideMenu"
              >
                <div class="md-list-item-icon">
                  <Icon name="fa6-solid:shield-halved" class="md-list-item-icon-svg" />
                </div>
                <span class="text-white">Админка</span>
              </NuxtLink>
              <NuxtLink
                v-if="!isAuthenticated"
                to="/auth"
                class="md-list-item mx-1.5"
                @click="closeSideMenu"
              >
                <div class="md-list-item-icon">
                  <Icon name="fa6-solid:right-to-bracket" class="md-list-item-icon-svg" />
                </div>
                <span class="text-white">Авторизоваться</span>
              </NuxtLink>
              <button
                v-else
                type="button"
                class="md-list-item mx-1.5 w-[calc(100%-0.75rem)] text-left focus:outline-none"
                @click="logout"
              >
                <div class="md-list-item-icon">
                  <Icon name="fa6-solid:right-from-bracket" class="md-list-item-icon-svg" />
                </div>
                <span class="text-white">Выйти</span>
              </button>
            </nav>

            <!-- Mobile: add content -->
            <div class="md:hidden shrink-0 border-t border-white/5 p-3 space-y-2">
              <Transition name="add-menu">
                <div
                  v-if="showMobileAddMenu"
                  class="bg-black border border-beige/40 rounded-lg overflow-hidden shadow-elevation-1"
                >
                  <button
                    v-for="item in mobileAddItems"
                    :key="item.path"
                    type="button"
                    class="w-full flex items-center gap-2.5 px-3 py-2 text-left text-beige/90 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-b-0 focus:outline-none"
                    @click="navigateFromMobileAdd(item.path)"
                  >
                    <Icon :name="item.icon" class="w-3.5 h-3.5 shrink-0 text-beige/70" />
                    <span class="text-sm">{{ item.label }}</span>
                  </button>
                </div>
              </Transition>

              <button
                type="button"
                class="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-gold text-black rounded hover:bg-golder transition-colors text-sm font-medium focus:outline-none"
                @click="showMobileAddMenu = !showMobileAddMenu"
              >
                <Icon
                  name="fa6-solid:plus"
                  class="w-3.5 h-3.5 transition-transform duration-200"
                  :class="{ 'rotate-45': showMobileAddMenu }"
                />
                {{ 'Добавить' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Mechanics Popup -->
    <div v-if="showMechanicsPopup" class="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div class="fixed top-0 left-0 right-0 bg-black border-b-2 border-beige p-4 transform transition-transform duration-300">
        <div class="max-w-content mx-auto px-6">
          <h3 class="text-beige text-lg font-bold mb-2">Механика текущей страницы</h3>
          <p class="text-white text-sm">
            {{ mechanicsDescription }}
          </p>
          <button
            type="button"
            class="mt-4 text-beige hover:text-white transition-colors focus:outline-none"
            @click="showMechanicsPopup = false"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ContactModal v-if="showContactModal" @close="showContactModal = false" />
    <FontSettingsModal v-if="showFontSettingsModal" @close="showFontSettingsModal = false" />
    <ErrorModal v-if="showErrorModal" @close="showErrorModal = false" />
    <DictionaryModal v-if="showDictionaryModal" @close="showDictionaryModal = false" />

    <CookieConsent />
    <AppToast />
  </div>
</template>

<script setup>
import { useFontSettingsStore } from '~/stores/fontSettings';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const fontSettingsStore = useFontSettingsStore();

onMounted(() => {
  authStore.initAuth();
  fontSettingsStore.loadSettings();
});

const showSideMenu = ref(false);
const showMobileAddMenu = ref(false);
const showAddContent = ref(false);
const showMechanicsPopup = ref(false);
const showContactModal = ref(false);
const showFontSettingsModal = ref(false);
const showErrorModal = ref(false);
const showDictionaryModal = ref(false);

const isActiveRoute = (path) => {
  return route.path === path || route.path.startsWith(path + '/');
};

const mobileAddItems = [
  { path: '/stories/create', label: 'Добавить историю', icon: 'fa6-solid:book-open' },
  { path: '/notions/create', label: 'Добавить понятие', icon: 'fa6-solid:file-lines' },
  { path: '/lore/create', label: 'Добавить элемент лора', icon: 'fa6-solid:wand-magic-sparkles' },
  { path: '/notes/create', label: 'Добавить заметку', icon: 'fa6-solid:note-sticky' }
];

const closeSideMenu = () => {
  showSideMenu.value = false;
  showMobileAddMenu.value = false;
};

const logout = () => {
  authStore.logout();
  closeSideMenu();
  router.push('/auth');
};

const navigateFromMobileAdd = (path) => {
  closeSideMenu();
  router.push(path);
};

watch(showSideMenu, (open) => {
  if (!open) {
    showMobileAddMenu.value = false;
  }
});

const pageTitle = computed(() => {
  const titles = {
    '/': 'Главная страница',
    '/stories': 'Список историй',
    '/notions': 'Список понятий',
    '/lore': 'Список элементов лора',
    '/compositions': 'Список композиций',
    '/notes': 'Список заметок',
    '/profile': 'Профиль',
    '/auth': 'Авторизация',
    '/tutorial': 'Туториал',
    '/contact': 'Контакты'
  };

  if (titles[route.path]) {
    return titles[route.path];
  }

  const nestedTitles = [
    { prefix: '/stories', title: 'История' },
    { prefix: '/notions', title: 'Понятие' },
    { prefix: '/lore', title: 'Элемент лора' },
    { prefix: '/compositions', title: 'Композиция' },
    { prefix: '/notes', title: 'Заметки' },
  ];

  for (const { prefix, title } of nestedTitles) {
    if (route.path.startsWith(prefix)) {
      return title;
    }
  }

  return 'Страница';
});

const mechanicsDescription = computed(() => {
  const descriptions = {
    '/stories': 'Не все истории доступны на 1 уровне. Работа фильтров: фильтрация по заголовку и типу. Опыт за комментирование/создание историй.',
    '/notions': 'Фильтрация по заголовку и типу. Возможность добавления изображений к понятиям.',
    '/lore': 'Фильтрация по заголовку. Просмотр элементов лора с обтекаемыми изображениями.',
    '/notes': 'Фильтрация по заголовку, типу и важности (1-10). Отображение в 3 колонки на больших экранах.',
    '/compositions': 'Фильтрация по заголовку и типу. Просмотр списка глав композиции.'
  };
  return descriptions[route.path] || 'Описание механики для данной страницы.';
});

const isAuthenticated = computed(() => authStore.isAuthenticated);
</script>

<style scoped>
.sidebar-overlay-enter-active,
.sidebar-overlay-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-overlay-enter-from,
.sidebar-overlay-leave-to {
  opacity: 0;
}

.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  transform: translateX(100%);
}

.add-menu-enter-active,
.add-menu-leave-active {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.add-menu-enter-from,
.add-menu-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
