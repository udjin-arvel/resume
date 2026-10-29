import {
  DarkTheme,
  DefaultTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';

import type { AppColors } from '../constants/theme';

export function buildNavigationTheme(isDark: boolean, colors: AppColors): NavigationTheme {
  const base = isDark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.brand,
      background: colors.canvas,
      card: colors.surface,
      text: colors.ink,
      border: colors.line,
      notification: colors.brand,
    },
  };
}
