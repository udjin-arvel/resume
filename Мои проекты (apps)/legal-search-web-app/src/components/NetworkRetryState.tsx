import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { fonts, radii, spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeProvider';
import { useThemedStyles } from '../hooks/useThemedStyles';

type NetworkRetryStateProps = {
  message: string;
  onRetry: () => void;
  /** Мягкое предупреждение (кэш), а не фатальная ошибка. */
  variant?: 'error' | 'warning';
};

export function NetworkRetryState({
  message,
  onRetry,
  variant = 'error',
}: NetworkRetryStateProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isWarning = variant === 'warning';

  return (
    <View
      style={[
        styles.box,
        isWarning ? styles.boxWarning : styles.boxError,
        {
          backgroundColor: isWarning ? colors.warmSoft : colors.brandSoft,
          borderColor: isWarning ? colors.disclaimerBorder : colors.badgeBrandBorder,
        },
      ]}
    >
      <Ionicons
        name={isWarning ? 'cloud-offline-outline' : 'alert-circle-outline'}
        size={22}
        color={isWarning ? colors.warm : colors.brand}
        style={styles.icon}
      />
      <Text style={[styles.message, { color: colors.inkSoft }]}>{message}</Text>
      <Pressable
        style={({ pressed }) => [
          styles.retryButton,
          { backgroundColor: colors.brand },
          pressed && styles.retryPressed,
        ]}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Повторить запрос"
      >
        <Text style={styles.retryText}>Повторить</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: typeof import('../constants/theme').lightColors) {
  return {
    box: {
      marginVertical: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.md,
      borderWidth: 1,
      alignItems: 'center' as const,
    },
    boxError: {},
    boxWarning: {},
    icon: {
      marginBottom: spacing.sm,
    },
    message: {
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center' as const,
      fontFamily: fonts.sans,
    },
    retryButton: {
      marginTop: spacing.md,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: radii.md,
    },
    retryPressed: {
      opacity: 0.9,
    },
    retryText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.white,
      fontFamily: fonts.sansSemiBold,
    },
  };
}
