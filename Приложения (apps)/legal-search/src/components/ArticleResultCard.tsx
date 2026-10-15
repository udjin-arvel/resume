import { Pressable, Text, View } from 'react-native';

import type { AppColors } from '../constants/theme';
import { fonts, radii, spacing } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { Article } from '../types';
import { HighlightedSnippet } from './HighlightedSnippet';

type ArticleResultCardProps = {
  article: Article;
  onPress: (id: number) => void;
};

export function ArticleResultCard({ article, onPress }: ArticleResultCardProps) {
  const styles = useThemedStyles(createStyles);
  const isKoap = article.code_slug === 'koap';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(article.id)}
      accessibilityRole="button"
    >
      <View style={styles.metaRow}>
        <View style={[styles.badge, isKoap ? styles.badgeWarm : styles.badgeBrand]}>
          <Text style={[styles.badgeText, isKoap ? styles.badgeTextWarm : styles.badgeTextBrand]}>
            {article.code_name}
          </Text>
        </View>
        <Text style={[styles.articleNumber, { fontFamily: fonts.serif }]}>
          ст. {article.number}
        </Text>
      </View>
      <Text style={[styles.title, { fontFamily: fonts.serif }]} numberOfLines={2}>
        {article.title}
      </Text>
      <HighlightedSnippet snippet={article.snippet} />
      <View style={styles.footer}>
        <Pressable
          onPress={() => onPress(article.id)}
          hitSlop={8}
          accessibilityRole="link"
          accessibilityLabel="Открыть полный текст"
        >
          {({ hovered }: any) => (
            <Text style={[styles.openLink, hovered && styles.openLinkHovered]}>
              Открыть полный текст
            </Text>
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return {
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.lg,
      marginBottom: spacing.md,
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
      marginBottom: 6,
    },
    footer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'flex-end' as const,
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    openLink: {
      fontSize: 13,
      color: colors.brand,
      fontFamily: fonts.sansMedium,
    },
    openLinkHovered: {
      textDecorationLine: 'underline' as const,
    },
  };
}
