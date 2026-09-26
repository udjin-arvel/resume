<template>
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="toast.show"
        class="app-toast"
        role="alert"
      >
        <div
          :class="[
            'md-snackbar mb-0 shadow-elevation-2 max-w-md',
            toast.type === 'error' ? 'md-snackbar-error' : 'md-snackbar-success',
          ]"
        >
          <Icon
            :name="toast.type === 'error' ? 'fa6-solid:circle-exclamation' : 'fa6-solid:circle-check'"
            class="w-4 h-4 shrink-0 opacity-90"
          />
          <span class="flex-1">{{ toast.message }}</span>
          <button
            type="button"
            class="shrink-0 opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
            aria-label="Закрыть"
            @click="hide"
          >
            <Icon name="fa6-solid:xmark" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const { toast, hide } = useToast();
</script>

<style scoped>
.app-toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  width: calc(100% - 2rem);
  max-width: 28rem;
  pointer-events: auto;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(0.5rem);
}
</style>
