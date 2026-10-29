/** Семантические цвета приложения. */
export type AppColors = {
  canvas: string;
  surface: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
  line: string;
  brand: string;
  brandSoft: string;
  warm: string;
  warmSoft: string;
  white: string;
  destructive: string;
  badgeBrandBorder: string;
  badgeWarmBorder: string;
  disclaimerBorder: string;
};

/** Светлая тема (прототип `.lovable`). */
export const lightColors: AppColors = {
  canvas: '#F2F4F9',
  surface: '#FCFCFD',
  ink: '#1A1F2E',
  inkSoft: '#5C6478',
  inkFaint: '#8E95A8',
  line: '#D8DCE6',
  brand: '#2563A8',
  brandSoft: '#E8F0FA',
  warm: '#9A7340',
  warmSoft: '#FBF3E0',
  white: '#FFFFFF',
  destructive: '#C0392B',
  badgeBrandBorder: '#2563A826',
  badgeWarmBorder: '#9A734033',
  disclaimerBorder: '#9A734026',
};

/** Тёмная тема (системная). */
export const darkColors: AppColors = {
  canvas: '#141820',
  surface: '#1E2433',
  ink: '#F4F6FA',
  inkSoft: '#B0B8C8',
  inkFaint: '#7A8498',
  line: 'rgba(255, 255, 255, 0.12)',
  brand: '#7EB0E8',
  brandSoft: '#243048',
  warm: '#C9A56E',
  warmSoft: '#3A3020',
  white: '#FFFFFF',
  destructive: '#E57373',
  badgeBrandBorder: 'rgba(126, 176, 232, 0.25)',
  badgeWarmBorder: 'rgba(201, 165, 110, 0.3)',
  disclaimerBorder: 'rgba(201, 165, 110, 0.2)',
};

/** @deprecated Используйте `useTheme().colors`. */
export const colors = lightColors;

export const spacing = {
  screen: 20,
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export const radii = {
  md: 8,
  lg: 12,
  xl: 16,
} as const;

export const fonts = {
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  serif: 'SourceSerif4_600SemiBold',
  serifRegular: 'SourceSerif4_400Regular',
} as const;
