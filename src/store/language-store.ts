import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { LanguageCode } from "@/types/learning";

const languageStorageName = "bolo-language-storage";

type LanguageStore = {
  hasHydrated: boolean;
  selectedLanguageId: LanguageCode | null;
  clearLanguageStorage: () => Promise<void>;
  setHasHydrated: (hasHydrated: boolean) => void;
  setSelectedLanguageId: (languageId: LanguageCode) => void;
};

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      hasHydrated: false,
      selectedLanguageId: null,
      clearLanguageStorage: async () => {
        await AsyncStorage.clear();
        set({ selectedLanguageId: null });
      },
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setSelectedLanguageId: (languageId) =>
        set({ selectedLanguageId: languageId }),
    }),
    {
      name: languageStorageName,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        selectedLanguageId: state.selectedLanguageId,
      }),
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
