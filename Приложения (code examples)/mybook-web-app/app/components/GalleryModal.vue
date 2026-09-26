<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue && images.length > 0"
        class="md-modal-root"
        @click.self="close"
      >
        <div class="md-modal-overlay" />

        <div class="md-modal-panel md-modal-panel-gallery">
          <div class="md-modal-header">
            <div class="min-w-0">
              <h3 class="md-modal-title">
                {{ title }}
              </h3>
              <p
                v-if="currentImage?.title"
                class="text-on-surface-muted text-sm mt-1 truncate"
              >
                {{ currentImage.title }}
              </p>
            </div>

            <button
              type="button"
              class="md-modal-close"
              aria-label="Закрыть"
              @click="close"
            >
              <Icon name="fa6-solid:xmark" class="w-5 h-5" />
            </button>
          </div>

          <div class="md-modal-body pt-0">
            <div class="md-gallery-viewport">
              <Transition name="gallery-slide" mode="out-in">
                <img
                  :key="currentIndex"
                  :src="currentImageUrl"
                  :alt="currentImage?.title || 'Изображение галереи'"
                  class="max-w-full max-h-[70vh] object-contain"
                >
              </Transition>

              <button
                v-if="images.length > 1"
                type="button"
                class="md-gallery-nav left-3"
                aria-label="Предыдущее изображение"
                @click="previousImage"
              >
                <Icon name="fa6-solid:chevron-left" class="w-5 h-5" />
              </button>

              <button
                v-if="images.length > 1"
                type="button"
                class="md-gallery-nav right-3"
                aria-label="Следующее изображение"
                @click="nextImage"
              >
                <Icon name="fa6-solid:chevron-right" class="w-5 h-5" />
              </button>
            </div>

            <div
              v-if="images.length > 1"
              class="flex flex-col items-center gap-4 mt-5"
            >
              <span class="md-chip text-on-surface-muted">
                {{ currentIndex + 1 }} из {{ images.length }}
              </span>

              <div class="flex gap-2 overflow-x-auto max-w-full pb-1 px-1">
                <button
                  v-for="(image, index) in images"
                  :key="index"
                  type="button"
                  class="shrink-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-beige/40"
                  :aria-label="`Изображение ${index + 1}`"
                  :aria-current="index === currentIndex ? 'true' : undefined"
                  @click="currentIndex = index"
                >
                  <img
                    :src="getImageUrl(image)"
                    :alt="image.title || `Миниатюра ${index + 1}`"
                    class="md-gallery-thumb"
                    :class="{ 'md-gallery-thumb-active': index === currentIndex }"
                  >
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const config = useRuntimeConfig();
const apiBase = config.public.apiBase || 'http://localhost:3001';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  images: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: 'Галерея изображений'
  }
});

const emit = defineEmits(['update:modelValue']);

const currentIndex = ref(0);

const currentImage = computed(() => props.images[currentIndex.value] || null);

const currentImageUrl = computed(() => getImageUrl(currentImage.value));

const getImageUrl = (image) => {
  if (!image) return '';
  const path = image.path || image;
  if (typeof path === 'string' && path.startsWith('http')) return path;
  return `${apiBase}${path}`;
};

const close = () => {
  emit('update:modelValue', false);
};

const previousImage = () => {
  currentIndex.value = currentIndex.value > 0
    ? currentIndex.value - 1
    : props.images.length - 1;
};

const nextImage = () => {
  currentIndex.value = currentIndex.value < props.images.length - 1
    ? currentIndex.value + 1
    : 0;
};

const onKeydown = (event) => {
  if (!props.modelValue || props.images.length === 0) return;

  if (event.key === 'Escape') {
    close();
  } else if (event.key === 'ArrowLeft') {
    previousImage();
  } else if (event.key === 'ArrowRight') {
    nextImage();
  }
};

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    currentIndex.value = 0;
  }
});

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.gallery-slide-enter-active,
.gallery-slide-leave-active {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.gallery-slide-enter-from,
.gallery-slide-leave-to {
  opacity: 0;
}
</style>
