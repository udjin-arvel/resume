import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppColors } from '../constants/theme';
import { fonts, radii, spacing } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';

type ArticleDetailActionsProps = {
  isFavorite: boolean;
  copied: boolean;
  onToggleFavorite: () => void;
  onCopy: () => void;
  onShare: () => void;
};

export function ArticleDetailActions({
  isFavorite,
  copied,
  onToggleFavorite,
  onCopy,
  onShare,
}: ArticleDetailActionsProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={styles.row}>
        <ActionButton
          icon={isFavorite ? 'bookmark' : 'bookmark-outline'}
          label={isFavorite ? 'Сохранено' : 'Сохранить'}
          active={isFavorite}
          onPress={onToggleFavorite}
          accessibilityLabel={
            isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'
          }
          styles={styles}
        />
        <ActionButton
          icon={copied ? 'checkmark' : 'copy-outline'}
          label={copied ? 'Готово' : 'Копировать'}
          onPress={onCopy}
          accessibilityLabel="Копировать текст статьи"
          styles={styles}
        />
        <ActionButton
          icon="share-outline"
          label="Поделиться"
          onPress={onShare}
          accessibilityLabel="Поделиться статьёй"
          styles={styles}
        />
      </View>
    </View>
  );
}

type ActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
  active?: boolean;
  styles: ReturnType<typeof createStyles>;
};

function ActionButton({
  icon,
  label,
  onPress,
  accessibilityLabel,
  active = false,
  styles,
}: ActionButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons
        name={icon}
        size={16}
        color={active ? styles.buttonLabelActive.color : styles.buttonLabel.color}
        style={styles.icon}
      />
      <Text style={[styles.buttonLabel, active && styles.buttonLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return {
    bar: {
      borderTopWidth: 1,
      borderTopColor: colors.line,
      backgroundColor: colors.canvas,
      paddingHorizontal: spacing.screen,
      paddingTop: spacing.md,
    },
    row: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    button: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
    },
    buttonPressed: {
      opacity: 0.88,
    },
    icon: {
      flexShrink: 0,
    },
    buttonLabel: {
      flexShrink: 1,
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.ink,
      fontFamily: fonts.sansSemiBold,
    },
    buttonLabelActive: {
      color: colors.brand,
    },
  };
}
