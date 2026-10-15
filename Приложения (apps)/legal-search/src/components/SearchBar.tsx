import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';

import type { AppColors } from '../constants/theme';
import { fonts, radii, spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeProvider';
import { useThemedStyles } from '../hooks/useThemedStyles';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Статья, термин или фраза',
}: SearchBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrapper}>
      <Ionicons name="search" size={17} color={colors.inkFaint} style={styles.searchIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        style={styles.input}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
        accessibilityLabel="Поиск по кодексам"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          style={styles.clearButton}
          accessibilityRole="button"
          accessibilityLabel="Очистить поиск"
        >
          <Ionicons name="close" size={16} color={colors.inkFaint} />
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return {
    wrapper: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      minHeight: 48,
      paddingHorizontal: 14,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
    },
    searchIcon: {
      marginRight: spacing.sm,
      opacity: 0.85,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.ink,
      paddingVertical: 10,
      fontFamily: fonts.sans,
    },
    clearButton: {
      marginLeft: spacing.sm,
      padding: 4,
    },
  };
}
