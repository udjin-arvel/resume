import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArticleDetailActions } from '../components/ArticleDetailActions';
import type { AppColors } from '../constants/theme';
import { fonts, radii, spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeProvider';
import { useArticleDetail } from '../hooks/useArticleDetail';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { RootStackScreenProps } from '../navigation/types';
import { useFavoritesStore } from '../store/favorites';
import { formatArticlePlainText } from '../utils/formatArticlePlainText';
import { splitArticleParagraphs } from '../utils/splitArticleParagraphs';

type Props = RootStackScreenProps<'ArticleDetail'>;

const COPY_FEEDBACK_MS = 1500;

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ArticleDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { article, loading, error, retry } = useArticleDetail(id);
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const hasFavorite = useFavoritesStore((state) => state.has(id));
  const toggleFavorite = useFavoritesStore((state) => state.toggle);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: article ? `ст. ${article.number} — ${article.title}` : 'Статья',
      headerStyle: {
        backgroundColor: colors.canvas,
      },
      headerTintColor: colors.ink,
      headerTitleStyle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.ink,
        fontFamily: fonts.serif,
      },
      headerRight: () =>
        article ? (
          <Pressable
            onPress={() => toggleFavorite(article)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              hasFavorite ? 'Удалить из избранного' : 'Добавить в избранное'
            }
            style={styles.headerFavoriteButton}
          >
            <Ionicons
              name={hasFavorite ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={hasFavorite ? colors.brand : colors.ink}
            />
          </Pressable>
        ) : null,
    });
  }, [article, colors, hasFavorite, navigation, styles.headerFavoriteButton, toggleFavorite]);

  const handleToggleFavorite = useCallback(() => {
    if (!article) {
      return;
    }
    toggleFavorite(article);
  }, [article, toggleFavorite]);

  const handleCopy = useCallback(async () => {
    if (!article) {
      return;
    }
    await Clipboard.setStringAsync(formatArticlePlainText(article));
    setCopied(true);
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false);
      copyTimeoutRef.current = null;
    }, COPY_FEEDBACK_MS);
  }, [article]);

  const handleShare = useCallback(async () => {
    if (!article) {
      return;
    }
    const message = formatArticlePlainText(article);
    try {
      await Share.share({
        title: `Статья ${article.number}. ${article.title}`,
        message,
      });
    } catch {
      // Пользователь отменил диалог — не показываем ошибку.
    }
  }, [article]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (error || !article) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Статья не найдена'}</Text>
        <Pressable
          style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
          onPress={() => void retry()}
          accessibilityRole="button"
        >
          <Text style={styles.retryButtonText}>Повторить</Text>
        </Pressable>
      </View>
    );
  }

  const isKoap = article.code_slug === 'koap';
  const paragraphs = splitArticleParagraphs(article.text);
  const bottomInset = Math.max(insets.bottom, spacing.md) + 72;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset }]}
        showsVerticalScrollIndicator
      >
        <View style={styles.metaRow}>
          <View style={[styles.badge, isKoap ? styles.badgeWarm : styles.badgeBrand]}>
            <Text style={[styles.badgeText, isKoap ? styles.badgeTextWarm : styles.badgeTextBrand]}>
              {article.code_name}
            </Text>
          </View>
          {article.chapter ? (
            <Text style={styles.chapter} numberOfLines={2}>
              {article.chapter}
            </Text>
          ) : null}
        </View>

        <Text style={[styles.articleNumber, { fontFamily: fonts.serif }]}>
          Статья {article.number}
        </Text>
        <Text style={[styles.title, { fontFamily: fonts.serif }]}>{article.title}</Text>

        <View style={styles.divider} />

        <View style={styles.body}>
          {paragraphs.map((paragraph, index) => (
            <Text
              key={`${index}-${paragraph.slice(0, 24)}`}
              style={[styles.paragraph, { fontFamily: fonts.serifRegular }]}
            >
              {paragraph}
            </Text>
          ))}
        </View>

        <Text style={styles.updated}>Редакция от {formatUpdatedAt(article.updated_at)}</Text>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Не является официальным источником. Проверяйте актуальную редакцию на pravo.gov.ru
          </Text>
        </View>
      </ScrollView>

      <ArticleDetailActions
        isFavorite={hasFavorite}
        copied={copied}
        onToggleFavorite={handleToggleFavorite}
        onCopy={() => void handleCopy()}
        onShare={() => void handleShare()}
      />
    </View>
  );
}

function createStyles(colors: AppColors) {
  return {
    root: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    centered: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      padding: spacing.screen,
      backgroundColor: colors.canvas,
    },
    scrollContent: {
      paddingHorizontal: spacing.screen,
      paddingTop: spacing.lg,
    },
    headerFavoriteButton: {
      marginRight: 4,
      padding: 4,
    },
    metaRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
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
    chapter: {
      flex: 1,
      minWidth: 120,
      fontSize: 11,
      color: colors.inkFaint,
      fontFamily: fonts.sans,
    },
    articleNumber: {
      marginTop: spacing.lg,
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.brand,
    },
    title: {
      marginTop: 4,
      fontSize: 30,
      fontWeight: '600' as const,
      lineHeight: 36,
      color: colors.ink,
    },
    divider: {
      height: 1,
      backgroundColor: colors.line,
      marginVertical: spacing.lg,
    },
    body: {
      gap: spacing.lg,
    },
    paragraph: {
      fontSize: 17,
      lineHeight: 29,
      color: colors.inkSoft,
    },
    updated: {
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      fontSize: 11,
      color: colors.inkFaint,
      fontFamily: fonts.sans,
    },
    disclaimer: {
      marginTop: spacing.lg,
      padding: spacing.md,
      borderRadius: radii.md,
      backgroundColor: colors.warmSoft,
      borderWidth: 1,
      borderColor: colors.disclaimerBorder,
    },
    disclaimerText: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.inkSoft,
      fontFamily: fonts.sans,
    },
    errorText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.warm,
      textAlign: 'center' as const,
      fontFamily: fonts.sans,
    },
    retryButton: {
      marginTop: spacing.lg,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: radii.md,
      backgroundColor: colors.brand,
    },
    retryButtonPressed: {
      opacity: 0.9,
    },
    retryButtonText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.white,
      fontFamily: fonts.sansSemiBold,
    },
  };
}
