import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import type { AppColors } from '../constants/theme';
import { fonts, spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeProvider';
import { useThemedStyles } from '../hooks/useThemedStyles';

type EmptySearchStateProps = {
  title: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function EmptySearchState({
  title,
  description,
  icon = 'search',
}: EmptySearchStateProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={20} color={colors.brand} />
      </View>
      <Text style={[styles.title, { fontFamily: fonts.serif }]}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return {
    container: {
      minHeight: 320,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: spacing.screen,
      paddingVertical: 32,
    },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.brandSoft,
      borderColor: colors.brand,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    title: {
      marginTop: spacing.lg,
      fontSize: 20,
      fontWeight: '600' as const,
      color: colors.ink,
      textAlign: 'center' as const,
    },
    description: {
      marginTop: spacing.sm,
      fontSize: 14,
      lineHeight: 21,
      color: colors.inkSoft,
      textAlign: 'center' as const,
      fontFamily: fonts.sans,
    },
  };
}
