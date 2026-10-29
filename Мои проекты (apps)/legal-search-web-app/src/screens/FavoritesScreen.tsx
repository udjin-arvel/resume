import { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  View,
} from 'react-native';

import { EmptySearchState } from '../components/EmptySearchState';
import { FavoriteSwipeableRow } from '../components/FavoriteSwipeableRow';
import { ScrollToTopButton } from '../components/ScrollToTopButton';
import type { AppColors } from '../constants/theme';
import { fonts, spacing } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { MainTabScreenProps } from '../navigation/types';
import { useFavoritesStore, type FavoriteItem } from '../store/favorites';

type Props = MainTabScreenProps<'Favorites'>;

const SCROLL_TOP_THRESHOLD = 320;

export function FavoritesScreen({ navigation }: Props) {
  const styles = useThemedStyles(createStyles);
  const items = useFavoritesStore((state) => state.items);
  const remove = useFavoritesStore((state) => state.remove);
  const listRef = useRef<FlatList<FavoriteItem>>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleOpenArticle = useCallback(
    (id: number) => {
      navigation.navigate('ArticleDetail', { id });
    },
    [navigation],
  );

  const handleRemove = useCallback(
    (id: number) => {
      remove(id);
    },
    [remove],
  );

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > SCROLL_TOP_THRESHOLD);
  }, []);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: FavoriteItem }) => (
      <FavoriteSwipeableRow item={item} onPress={handleOpenArticle} onRemove={handleRemove} />
    ),
    [handleOpenArticle, handleRemove],
  );

  const keyExtractor = useCallback((item: FavoriteItem) => String(item.id), []);

  const listHeader = useMemo(() => {
    if (items.length === 0) {
      return null;
    }
    return (
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          Сохранено <Text style={styles.metaCount}>{items.length}</Text> статей
        </Text>
      </View>
    );
  }, [items.length, styles]);

  const listEmpty = useMemo(
    () => (
      <EmptySearchState
        title="Пока пусто"
        description="Сохраняйте важные статьи, чтобы вернуться к ним позже."
        icon="bookmark-outline"
      />
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />
    </View>
  );
}

function createStyles(colors: AppColors) {
  return {
    container: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    listContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.screen,
      paddingTop: spacing.md,
      paddingBottom: 24,
    },
    meta: {
      marginBottom: spacing.sm,
    },
    metaText: {
      fontSize: 13,
      color: colors.inkSoft,
      fontFamily: fonts.sans,
    },
    metaCount: {
      fontWeight: '700' as const,
      color: colors.ink,
      fontFamily: fonts.sansSemiBold,
    },
  };
}
