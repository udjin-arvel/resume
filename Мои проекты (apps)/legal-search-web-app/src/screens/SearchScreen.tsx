import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArticleResultCard } from '../components/ArticleResultCard';
import { CodeFilterChips } from '../components/CodeFilterChips';
import { EmptySearchState } from '../components/EmptySearchState';
import { NetworkRetryState } from '../components/NetworkRetryState';
import { ScrollToTopButton } from '../components/ScrollToTopButton';
import { SearchBar } from '../components/SearchBar';
import { SearchHistoryPanel } from '../components/SearchHistoryPanel';
import { SearchResultSkeletonList } from '../components/SearchResultSkeleton';
import { SearchScreenHeader } from '../components/SearchScreenHeader';
import type { AppColors } from '../constants/theme';
import { fonts, spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeProvider';
import { useSearch } from '../hooks/useSearch';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { getCodes } from '../lib/api';
import type { MainTabScreenProps } from '../navigation/types';
import { useSearchHistoryStore } from '../store/searchHistory';
import type { Article, Code } from '../types';

type Props = MainTabScreenProps<'Search'>;

const MIN_QUERY_LENGTH = 2;
const SCROLL_TOP_THRESHOLD = 320;

export function SearchScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [query, setQuery] = useState('');
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [codes, setCodes] = useState<Code[]>([]);
  const [codesLoading, setCodesLoading] = useState(true);
  const [codesError, setCodesError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const listRef = useRef<FlatList<Article>>(null);
  const addHistoryQuery = useSearchHistoryStore((state) => state.addQuery);
  const historyQueries = useSearchHistoryStore((state) => state.queries);
  const clearHistory = useSearchHistoryStore((state) => state.clear);

  const trimmedQuery = query.trim();
  const isQueryTooShort = trimmedQuery.length < MIN_QUERY_LENGTH;

  const { results, loading, error, isEmpty, isFromCache, retry } = useSearch(
    query,
    selectedSlugs,
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setCodesLoading(true);
      setCodesError(null);
      try {
        const list = await getCodes();
        if (!cancelled) {
          setCodes(list);
        }
      } catch {
        if (!cancelled) {
          setCodesError('Не удалось загрузить список кодексов');
        }
      } finally {
        if (!cancelled) {
          setCodesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loading && error === null && !isQueryTooShort && results.length > 0 && !isFromCache) {
      addHistoryQuery(trimmedQuery);
    }
  }, [
    addHistoryQuery,
    error,
    isFromCache,
    isQueryTooShort,
    loading,
    results.length,
    trimmedQuery,
  ]);

  const handleSelectAll = useCallback(() => {
    setSelectedSlugs([]);
  }, []);

  const handleToggleCode = useCallback((slug: string) => {
    setSelectedSlugs((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );
  }, []);

  const handleOpenArticle = useCallback(
    (id: number) => {
      Keyboard.dismiss();
      navigation.navigate('ArticleDetail', { id });
    },
    [navigation],
  );

  const handleToggleHistory = useCallback(() => {
    setHistoryOpen((open) => !open);
  }, []);

  const handleSelectHistoryQuery = useCallback((value: string) => {
    setQuery(value);
    setHistoryOpen(false);
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > SCROLL_TOP_THRESHOLD);
  }, []);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const listHeader = useMemo(() => {
    if (historyOpen) {
      return null;
    }

    const showMeta = !isQueryTooShort && !loading && error === null;

    return (
      <View style={styles.listHeader}>
        {error && results.length > 0 ? (
          <NetworkRetryState
            message={error}
            onRetry={retry}
            variant={isFromCache ? 'warning' : 'error'}
          />
        ) : null}
        {showMeta ? (
          <View style={styles.resultsMeta}>
            <Text style={styles.resultsMetaText}>
              Найдено <Text style={styles.resultsMetaCount}>{results.length}</Text> норм
            </Text>
            {trimmedQuery.length >= MIN_QUERY_LENGTH ? (
              <Text style={styles.relevanceHint}>По релевантности</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }, [
    error,
    historyOpen,
    isFromCache,
    isQueryTooShort,
    loading,
    results.length,
    retry,
    styles,
    trimmedQuery.length,
  ]);

  const renderItem = useCallback(
    ({ item }: { item: Article }) => (
      <ArticleResultCard article={item} onPress={handleOpenArticle} />
    ),
    [handleOpenArticle],
  );

  const keyExtractor = useCallback((item: Article) => String(item.id), []);

  const listEmpty = useMemo(() => {
    if (historyOpen) {
      return (
        <SearchHistoryPanel
          queries={historyQueries}
          onSelectQuery={handleSelectHistoryQuery}
          onClear={clearHistory}
        />
      );
    }
    if (isQueryTooShort) {
      return (
        <EmptySearchState
          title="Начните поиск"
          description="Начните вводить ключевые слова, например «кража»."
        />
      );
    }
    if (loading) {
      return <SearchResultSkeletonList />;
    }
    if (error) {
      return (
        <NetworkRetryState
          message={error}
          onRetry={retry}
          variant={isFromCache ? 'warning' : 'error'}
        />
      );
    }
    if (isEmpty) {
      return (
        <EmptySearchState
          title="Ничего не найдено"
          description="Попробуйте изменить запрос или выбрать другой кодекс."
          icon="document-text-outline"
        />
      );
    }
    return null;
  }, [
    clearHistory,
    error,
    handleSelectHistoryQuery,
    historyOpen,
    historyQueries,
    isEmpty,
    isFromCache,
    isQueryTooShort,
    loading,
    retry,
  ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.headerBlock}>
        <SearchScreenHeader historyOpen={historyOpen} onToggleHistory={handleToggleHistory} />
        {!historyOpen ? (
          <>
            <SearchBar value={query} onChangeText={setQuery} />
            {codesError ? <Text style={styles.codesError}>{codesError}</Text> : null}
            {codesLoading ? (
              <View style={styles.codesLoadingRow}>
                <ActivityIndicator size="small" color={colors.brand} />
              </View>
            ) : (
              <CodeFilterChips
                codes={codes}
                selectedSlugs={selectedSlugs}
                onSelectAll={handleSelectAll}
                onToggleCode={handleToggleCode}
              />
            )}
          </>
        ) : null}
      </View>

      <View style={styles.listWrap}>
        <FlatList
          ref={listRef}
          data={historyOpen || isQueryTooShort ? [] : results}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
        <ScrollToTopButton visible={showScrollTop && !historyOpen} onPress={scrollToTop} />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return {
    safe: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    headerBlock: {
      paddingHorizontal: spacing.screen,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      backgroundColor: colors.canvas,
    },
    codesLoadingRow: {
      paddingVertical: spacing.md,
      alignItems: 'flex-start' as const,
    },
    codesError: {
      marginTop: spacing.sm,
      fontSize: 12,
      color: colors.warm,
      fontFamily: fonts.sans,
    },
    listWrap: {
      flex: 1,
    },
    listContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.screen,
      paddingBottom: 24,
    },
    listHeader: {
      paddingTop: spacing.md,
    },
    resultsMeta: {
      marginBottom: spacing.sm,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    resultsMetaText: {
      fontSize: 13,
      color: colors.inkSoft,
      fontFamily: fonts.sans,
    },
    resultsMetaCount: {
      fontWeight: '700' as const,
      color: colors.ink,
      fontFamily: fonts.sansSemiBold,
    },
    relevanceHint: {
      fontSize: 10,
      textTransform: 'uppercase' as const,
      color: colors.inkFaint,
      fontFamily: fonts.sansMedium,
    },
  };
}
