import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ArticleFull } from '../types';
import { hapticFavoriteAdded } from '../utils/haptics';

/** Лёгкий срез для избранного (без текста статьи). */
export type FavoriteItem = Pick<
  ArticleFull,
  'id' | 'code_slug' | 'code_name' | 'number' | 'title'
>;

type FavoritesState = {
  items: FavoriteItem[];
  has: (id: number) => boolean;
  add: (article: FavoriteItem) => void;
  remove: (id: number) => void;
  toggle: (article: FavoriteItem) => void;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      has: (id) => get().items.some((item) => item.id === id),
      add: (article) =>
        set((state) => {
          if (state.items.some((item) => item.id === article.id)) {
            return state;
          }
          return { items: [...state.items, article] };
        }),
      remove: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      toggle: (article) =>
        set((state) => {
          if (state.items.some((item) => item.id === article.id)) {
            return { items: state.items.filter((item) => item.id !== article.id) };
          }
          void hapticFavoriteAdded();
          return { items: [...state.items, article] };
        }),
    }),
    {
      name: 'legal-search-favorites',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
