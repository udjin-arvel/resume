import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { radii } from '../constants/theme';
import { useTheme } from '../context/ThemeProvider';

type ScrollToTopButtonProps = {
  visible: boolean;
  onPress: () => void;
  bottomOffset?: number;
};

export function ScrollToTopButton({
  visible,
  onPress,
  bottomOffset = 24,
}: ScrollToTopButtonProps) {
  const { colors } = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.surface,
          borderColor: colors.line,
          bottom: bottomOffset,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Наверх"
    >
      <Ionicons name="chevron-up" size={22} color={colors.brand} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
});
