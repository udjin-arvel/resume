import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import type { AppColors } from '../constants/theme';
import { fonts, radii, spacing } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { FavoriteItem } from '../store/favorites';
import { FavoriteArticleCard } from './FavoriteArticleCard';

type FavoriteSwipeableRowProps = {
  item: FavoriteItem;
  onPress: (id: number) => void;
  onRemove: (id: number) => void;
};

export function FavoriteSwipeableRow({ item, onPress, onRemove }: FavoriteSwipeableRowProps) {
  const styles = useThemedStyles(createStyles);
  const swipeRef = useRef<Swipeable>(null);

  const handleRemove = useCallback(() => {
    swipeRef.current?.close();
    onRemove(item.id);
  }, [item.id, onRemove]);

  const renderRightActions = useCallback(
    () => (
      <Pressable
        style={({ pressed }) => [styles.deleteAction, pressed && styles.deleteActionPressed]}
        onPress={handleRemove}
        accessibilityRole="button"
        accessibilityLabel="Удалить из избранного"
      >
        <Ionicons name="trash-outline" size={22} color={styles.deleteLabel.color} />
        <Text style={styles.deleteLabel}>Удалить</Text>
      </Pressable>
    ),
    [handleRemove, styles],
  );

  return (
    <View style={styles.wrapper}>
      <Swipeable
        ref={swipeRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={2}
      >
        <FavoriteArticleCard item={item} onPress={onPress} />
      </Swipeable>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return {
    wrapper: {
      marginBottom: spacing.md,
    },
    deleteAction: {
      alignSelf: 'stretch' as const,
      width: 88,
      marginLeft: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: colors.destructive,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 4,
    },
    deleteActionPressed: {
      opacity: 0.9,
    },
    deleteLabel: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: colors.white,
      fontFamily: fonts.sansSemiBold,
    },
  };
}
