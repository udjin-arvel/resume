import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useTheme } from '../context/ThemeProvider';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { CustomTabBar } from './CustomTabBar';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Поиск',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: 'Избранное',
          headerStyle: {
            backgroundColor: colors.canvas,
            borderBottomColor: colors.line,
          },
          headerTitleStyle: {
            color: colors.ink,
          },
        }}
      />
    </Tab.Navigator>
  );
}
