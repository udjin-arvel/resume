<template>
  <ClientOnly>
    <Teleport to="body">
      <div
        v-if="visible"
        class="fixed inset-0 z-40"
        @click="emit('close')"
        @contextmenu.prevent="emit('close')"
      />

      <div
        v-if="visible"
        class="fixed z-50 min-w-[180px] py-1 rounded-lg border border-white/10 bg-[#1a1a1a] shadow-xl"
        :style="{ top: `${y}px`, left: `${x}px` }"
        role="menu"
        @click.stop
      >
        <button
          type="button"
          class="w-full px-4 py-2 text-left text-sm text-white/90 hover:bg-white/5 transition-colors focus:outline-none"
          role="menuitem"
          @click="emit('edit')"
        >
          Редактировать
        </button>
        <button
          type="button"
          class="w-full px-4 py-2 text-left text-sm text-white/90 hover:bg-white/5 transition-colors focus:outline-none"
          role="menuitem"
          @click="emit('add-content')"
        >
          Добавить контент
        </button>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup>
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  x: {
    type: Number,
    default: 0
  },
  y: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['edit', 'add-content', 'close']);

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    emit('close');
  }
};

const handleScroll = () => {
  emit('close');
};

const addListeners = () => {
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('scroll', handleScroll, true);
};

const removeListeners = () => {
  document.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('scroll', handleScroll, true);
};

watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    addListeners();
  } else {
    removeListeners();
  }
});

onUnmounted(() => {
  removeListeners();
});
</script>
