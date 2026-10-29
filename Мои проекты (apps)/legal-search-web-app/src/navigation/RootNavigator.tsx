import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ArticleDetailScreen } from '../screens/ArticleDetailScreen';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="ArticleDetail"
        component={ArticleDetailScreen}
        options={{ title: 'Статья', headerBackTitle: 'Назад' }}
      />
    </Stack.Navigator>
  );
}
