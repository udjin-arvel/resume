import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { fonts, spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeProvider';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { EmptySearchState } from './EmptySearchState';

type SearchHistoryPanelProps = {
  queries: string[];
  onSelectQuery: (query: string) => void;
  onClear: () => void;
};

export function SearchHistoryPanel({
  queries,
  onSelectQuery,
  onClear,
}: SearchHistoryPanelProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  if (queries.length === 0) {
    return (
      <EmptySearchState
        title="История пуста"
        description="Здесь появятся ваши последние поисковые запросы."
        icon="time-outline"
      />
    );
  }

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.kicker, { color: colors.inkFaint }]}>Поиск</Text>
          <Text style={[styles.title, { color: colors.ink, fontFamily: fonts.serif }]}>
            История запросов
          </Text>
        </View>
        <Pressable
          onPress={onClear}
          style={({ pressed }) => [
            styles.clearButton,
            { borderColor: colors.line, backgroundColor: colors.surface },
            pressed && styles.clearPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Очистить историю"
        >
          <Ionicons name="trash-outline" size={18} color={colors.inkSoft} />
        </Pressable>
      </View>
      <View style={[styles.list, { borderColor: colors.line }]}>
        {queries.map((item) => (
          <Pressable
            key={item}
            onPress={() => onSelectQuery(item)}
            style={({ pressed }) => [
              styles.row,
              { borderBottomColor: colors.line },
              pressed && { backgroundColor: colors.surface },
            ]}
            accessibilityRole="button"
          >
            <Ionicons name="time-outline" size={16} color={colors.inkFaint} />
            <Text style={[styles.query, { color: colors.ink }]} numberOfLines={1}>
              {item}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function createStyles() {
  return {
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: spacing.lg,
      gap: spacing.md,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    kicker: {
      fontSize: 11,
      fontWeight: '500' as const,
      textTransform: 'uppercase' as const,
      fontFamily: fonts.sansMedium,
    },
    title: {
      marginTop: 4,
      fontSize: 26,
      fontWeight: '600' as const,
      lineHeight: 30,
    },
    clearButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    clearPressed: {
      opacity: 0.88,
    },
    list: {
      borderTopWidth: 1,
      borderBottomWidth: 1,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
      paddingVertical: spacing.lg,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
    },
    query: {
      flex: 1,
      fontSize: 14,
      fontFamily: fonts.sans,
    },
  };
}
