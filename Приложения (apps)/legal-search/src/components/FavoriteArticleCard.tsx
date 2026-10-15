import { Pressable, Text, View } from 'react-native';

import type { AppColors } from '../constants/theme';
import { fonts, radii, spacing } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { FavoriteItem } from '../store/favorites';

type FavoriteArticleCardProps = {
  item: FavoriteItem;
  onPress: (id: number) => void;
};

export function FavoriteArticleCard({ item, onPress }: FavoriteArticleCardProps) {
  const styles = useThemedStyles(createStyles);
  const isKoap = item.code_slug === 'koap';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(item.id)}
      accessibilityRole="button"
    >
      <View style={styles.metaRow}>
        <View style={[styles.badge, isKoap ? styles.badgeWarm : styles.badgeBrand]}>
          <Text style={[styles.badgeText, isKoap ? styles.badgeTextWarm : styles.badgeTextBrand]}>
            {item.code_name}
          </Text>
        </View>
        <Text style={[styles.articleNumber, { fontFamily: fonts.serif }]}>
          ст. {item.number}
        </Text>
      </View>
      <Text style={[styles.title, { fontFamily: fonts.serif }]} numberOfLines={2}>
        {item.title}
      </Text>
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return {
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.lg,
    },
    cardPressed: {
      opacity: 0.92,
    },
    metaRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      marginBottom: 10,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
    },
    badgeBrand: {
      backgroundColor: colors.brandSoft,
      borderColor: colors.badgeBrandBorder,
    },
    badgeWarm: {
      backgroundColor: colors.warmSoft,
      borderColor: colors.badgeWarmBorder,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700' as const,
      fontFamily: fonts.sansSemiBold,
    },
    badgeTextBrand: {
      color: colors.brand,
    },
    badgeTextWarm: {
      color: colors.warm,
    },
    articleNumber: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.ink,
    },
    title: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
      color: colors.ink,
    },
  };
}
