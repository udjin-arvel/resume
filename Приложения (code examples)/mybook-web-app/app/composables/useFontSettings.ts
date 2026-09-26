import { useFontSettingsStore } from '~/stores/fontSettings';

export const useFontSettings = () => {
  const fontSettingsStore = useFontSettingsStore();

  const contentTextStyle = computed(() => ({
    fontSize: `${fontSettingsStore.fontSize}px`,
    lineHeight: fontSettingsStore.lineHeight
  }));

  return {
    contentTextStyle
  };
};
