<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        class="md-modal-root"
        @click.self="$emit('close')"
      >
        <div class="md-modal-overlay" />

        <div class="md-modal-panel">
          <div class="md-modal-header">
            <h3 class="md-modal-title">Настройки шрифта</h3>
            <button
              type="button"
              class="md-modal-close"
              @click="$emit('close')"
            >
              <Icon name="fa6-solid:xmark" class="w-5 h-5" />
            </button>
          </div>

          <div class="md-modal-body space-y-6">
            <div class="md-field">
              <label class="md-label">Размер шрифта</label>
              <div class="flex items-center gap-4">
                <input
                  v-model.number="localSettings.fontSize"
                  type="range"
                  min="12"
                  max="24"
                  step="1"
                  class="flex-1 accent-beige"
                >
                <span class="text-beige/80 text-sm w-10 text-right">{{ localSettings.fontSize }}px</span>
              </div>
            </div>

            <div class="md-field">
              <label class="md-label">Межстрочный интервал</label>
              <div class="flex items-center gap-4">
                <input
                  v-model.number="localSettings.lineHeight"
                  type="range"
                  min="1.2"
                  max="2.0"
                  step="0.1"
                  class="flex-1 accent-beige"
                >
                <span class="text-beige/80 text-sm w-10 text-right">{{ localSettings.lineHeight }}</span>
              </div>
            </div>
          </div>

          <div class="md-modal-footer">
            <button
              type="button"
              class="md-btn-text"
              @click="resetSettings"
            >
              Сбросить
            </button>
            <button
              type="button"
              class="md-btn-filled"
              @click="saveSettings"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useFontSettingsStore } from '~/stores/fontSettings';

const emit = defineEmits(['close']);
const fontSettingsStore = useFontSettingsStore();

const localSettings = ref({
  fontSize: fontSettingsStore.fontSize,
  lineHeight: fontSettingsStore.lineHeight
});

const saveSettings = () => {
  fontSettingsStore.saveSettings({
    fontSize: localSettings.value.fontSize,
    lineHeight: localSettings.value.lineHeight
  });
  emit('close');
};

const resetSettings = () => {
  fontSettingsStore.resetSettings();
  localSettings.value = {
    fontSize: fontSettingsStore.fontSize,
    lineHeight: fontSettingsStore.lineHeight
  };
};
</script>
