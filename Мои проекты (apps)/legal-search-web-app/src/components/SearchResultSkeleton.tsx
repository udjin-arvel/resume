import { View } from 'react-native';

import type { AppColors } from '../constants/theme';
import { radii, spacing } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';

const SKELETON_COUNT = 4;

export function SearchResultSkeletonList() {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.list}>
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.block, styles.badge]} />
            <View style={[styles.block, styles.number]} />
          </View>
          <View style={[styles.block, styles.title]} />
          <View style={[styles.block, styles.line]} />
          <View style={[styles.block, styles.lineShort]} />
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return {
    list: {
      paddingTop: spacing.sm,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    row: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
      marginBottom: 12,
    },
    block: {
      backgroundColor: colors.line,
      borderRadius: 6,
      opacity: 0.55,
    },
    badge: {
      width: 56,
      height: 22,
    },
    number: {
      width: 88,
      height: 22,
    },
    title: {
      width: '75%' as const,
      height: 20,
      marginBottom: 10,
    },
    line: {
      width: '100%' as const,
      height: 14,
      marginBottom: 6,
    },
    lineShort: {
      width: '85%' as const,
      height: 14,
    },
  };
}
