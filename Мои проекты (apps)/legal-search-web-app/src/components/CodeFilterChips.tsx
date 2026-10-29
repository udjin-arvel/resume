import { Pressable, ScrollView, Text } from 'react-native';

import type { AppColors } from '../constants/theme';
import { fonts, spacing } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { Code } from '../types';

type CodeFilterChipsProps = {
  codes: Code[];
  selectedSlugs: string[];
  onSelectAll: () => void;
  onToggleCode: (slug: string) => void;
};

export function CodeFilterChips({
  codes,
  selectedSlugs,
  onSelectAll,
  onToggleCode,
}: CodeFilterChipsProps) {
  const styles = useThemedStyles(createStyles);
  const isAllSelected = selectedSlugs.length === 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <Chip label="Все" active={isAllSelected} onPress={onSelectAll} styles={styles} />
      {codes.map((code) => (
        <Chip
          key={code.slug}
          label={code.name}
          active={selectedSlugs.includes(code.slug)}
          onPress={() => onToggleCode(code.slug)}
          styles={styles}
        />
      ))}
    </ScrollView>
  );
}

type ChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
};

function Chip({ label, active, onPress, styles }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return {
    scrollContent: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
    },
    chipActive: {
      backgroundColor: colors.ink,
      borderColor: colors.ink,
    },
    chipInactive: {
      backgroundColor: colors.surface,
      borderColor: colors.line,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600' as const,
      fontFamily: fonts.sansSemiBold,
    },
    chipTextActive: {
      color: colors.canvas,
    },
    chipTextInactive: {
      color: colors.inkSoft,
    },
  };
}
