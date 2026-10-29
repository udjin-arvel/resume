import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, radii, spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeProvider';
import { useThemedStyles } from '../hooks/useThemedStyles';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.line,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const iconName =
            route.name === 'Search'
              ? 'search'
              : isFocused
                ? 'bookmark'
                : 'bookmark-outline';

          const tint = isFocused ? colors.brand : colors.inkFaint;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={typeof label === 'string' ? label : route.name}
            >
              <Ionicons name={iconName} size={18} color={tint} />
              <Text style={[styles.tabLabel, { color: tint }]}>
                {typeof label === 'string' ? label : route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles() {
  return {
    wrapper: {
      paddingHorizontal: spacing.screen,
      paddingTop: spacing.sm,
      backgroundColor: 'transparent' as const,
    },
    bar: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      borderRadius: radii.xl,
      borderWidth: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    tab: {
      flex: 1,
      minHeight: 48,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 4,
    },
    tabPressed: {
      opacity: 0.88,
    },
    tabLabel: {
      fontSize: 11,
      fontWeight: '500' as const,
      fontFamily: fonts.sansMedium,
    },
  };
}
