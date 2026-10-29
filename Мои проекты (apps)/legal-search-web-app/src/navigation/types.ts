import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type MainTabParamList = {
  Search: undefined;
  Favorites: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  ArticleDetail: { id: number };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    // Расширение для типизации useNavigation() без дублирования param list.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- merge with RootStackParamList
    interface RootParamList extends RootStackParamList {}
  }
}
