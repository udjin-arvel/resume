import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  SourceSerif4_400Regular,
  SourceSerif4_600SemiBold,
} from '@expo-google-fonts/source-serif-4';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { fonts } from './src/constants/theme';
import { ThemeProvider, useTheme } from './src/context/ThemeProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { buildNavigationTheme } from './src/navigation/navigationTheme';

function AppNavigation() {
  const { colors, isDark } = useTheme();
  const navigationTheme = useMemo(
    () => buildNavigationTheme(isDark, colors),
    [colors, isDark],
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    [fonts.sans]: Inter_400Regular,
    [fonts.sansMedium]: Inter_500Medium,
    [fonts.sansSemiBold]: Inter_600SemiBold,
    [fonts.serifRegular]: SourceSerif4_400Regular,
    [fonts.serif]: SourceSerif4_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppNavigation />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
