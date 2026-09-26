<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="md-modal-root"
        @click.self="close"
      >
        <div class="md-modal-overlay" @click="close" />

        <div class="md-modal-panel md-modal-panel-lg mx-4 fragment-content-view-modal">
          <div class="md-modal-header pb-0">
            <h2 class="md-modal-title">Дополнительный контент к фрагменту</h2>
            <button
              type="button"
              class="md-modal-close"
              @click="close"
            >
              <Icon name="fa6-solid:xmark" class="w-5 h-5" />
            </button>
          </div>

          <div class="md-modal-body fragment-content-view-modal__body flex flex-col gap-4 items-center">
            <div class="w-full" v-if="authorNote">
              <p class="text-white/85 leading-relaxed whitespace-pre-wrap">
                {{ authorNote }}
              </p>
            </div>

            <div v-if="images.length">
              <img
                v-for="image in images"
                :key="image.id"
                :src="resolveMediaUrl(image.path)"
                :alt="image.title || 'Изображение к фрагменту'"
                class="max-w-full rounded-lg border border-white/10"
              >
            </div>

            <div class="w-full" v-if="audios.length">
              <audio
                v-for="audio in audios"
                :key="audio.id"
                :src="resolveMediaUrl(audio.path)"
                controls
                class="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  authorNote: {
    type: String,
    default: ''
  },
  images: {
    type: Array,
    default: () => []
  },
  audios: {
    type: Array,
    default: () => []
  },
  mediaBaseUrl: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const resolveMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${props.mediaBaseUrl}${path}`;
};

const close = () => {
  emit('update:modelValue', false);
};
</script>

<style scoped>
.fragment-content-view-modal {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 2rem);
}

.fragment-content-view-modal__body {
  overflow-y: auto;
  min-height: 0;
  flex: 1 1 auto;
}
</style>
