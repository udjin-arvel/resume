import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const MAX_HISTORY = 20;

type SearchHistoryState = {
  queries: string[];
  addQuery: (query: string) => void;
  clear: () => void;
};

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set) => ({
      queries: [],
      addQuery: (query) => {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
          return;
        }
        set((state) => {
          const without = state.queries.filter(
            (item) => item.toLowerCase() !== trimmed.toLowerCase(),
          );
          return { queries: [trimmed, ...without].slice(0, MAX_HISTORY) };
        });
      },
      clear: () => set({ queries: [] }),
    }),
    {
      name: 'legal-search-history',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ queries: state.queries }),
    },
  ),
);
