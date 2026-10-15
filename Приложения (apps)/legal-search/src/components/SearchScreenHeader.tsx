import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { fonts, spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeProvider';
import { useThemedStyles } from '../hooks/useThemedStyles';

type SearchScreenHeaderProps = {
  historyOpen: boolean;
  onToggleHistory: () => void;
};

export function SearchScreenHeader({ historyOpen, onToggleHistory }: SearchScreenHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      <View style={styles.brandRow}>
        <View style={[styles.logo, { backgroundColor: colors.ink }]}>
          <Text style={[styles.logoLetter, { color: colors.canvas }]}>Л</Text>
        </View>
        <View>
          <Text style={[styles.appName, { color: colors.ink, fontFamily: fonts.serif }]}>
            LegalSearch
          </Text>
          <Text style={[styles.tagline, { color: colors.inkFaint }]}>База права</Text>
        </View>
      </View>
      <Pressable
        onPress={onToggleHistory}
        style={({ pressed }) => [
          styles.historyButton,
          {
            backgroundColor: historyOpen ? colors.brandSoft : colors.surface,
            borderColor: historyOpen ? colors.brand : colors.line,
          },
          pressed && styles.historyPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={historyOpen ? 'Закрыть историю' : 'История поиска'}
      >
        <Ionicons
          name={historyOpen ? 'close' : 'time-outline'}
          size={18}
          color={historyOpen ? colors.brand : colors.inkSoft}
        />
      </Pressable>
    </View>
  );
}

function createStyles() {
  return {
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: spacing.md,
    },
    brandRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
    },
    logo: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    logoLetter: {
      fontSize: 14,
      fontFamily: fonts.serif,
      fontWeight: '600' as const,
    },
    appName: {
      fontSize: 15,
      fontWeight: '600' as const,
      lineHeight: 18,
    },
    tagline: {
      fontSize: 10,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.4,
      lineHeight: 14,
      fontFamily: fonts.sans,
    },
    historyButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    historyPressed: {
      opacity: 0.88,
    },
  };
}
