import { defineStore } from 'pinia';

interface FontSettings {
  fontSize: number;
  lineHeight: number;
}

const DEFAULT_SETTINGS: FontSettings = {
  fontSize: 16,
  lineHeight: 1.5
};

export const useFontSettingsStore = defineStore('fontSettings', {
  state: () => ({
    fontSize: DEFAULT_SETTINGS.fontSize,
    lineHeight: DEFAULT_SETTINGS.lineHeight
  }),

  actions: {
    loadSettings() {
      if (import.meta.client) {
        const saved = localStorage.getItem('fontSettings');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            this.fontSize = parsed.fontSize ?? DEFAULT_SETTINGS.fontSize;
            this.lineHeight = parsed.lineHeight ?? DEFAULT_SETTINGS.lineHeight;
          } catch (e) {
            console.error('Failed to parse font settings:', e);
          }
        }
      }
    },

    saveSettings(settings: FontSettings) {
      this.fontSize = settings.fontSize;
      this.lineHeight = settings.lineHeight;
      
      if (import.meta.client) {
        localStorage.setItem('fontSettings', JSON.stringify(settings));
      }
    },

    resetSettings() {
      this.fontSize = DEFAULT_SETTINGS.fontSize;
      this.lineHeight = DEFAULT_SETTINGS.lineHeight;
      
      if (import.meta.client) {
        localStorage.removeItem('fontSettings');
      }
    }
  }
});
