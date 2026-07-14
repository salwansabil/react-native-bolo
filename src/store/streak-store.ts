import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const streakStorageName = "bolo-streak-storage";

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDayNumber(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

type StreakStore = {
  hasHydrated: boolean;
  lastUpdatedDate: string | null;
  streak: number;
  setHasHydrated: (hasHydrated: boolean) => void;
  startStreak: () => void;
  syncStreak: () => void;
};

export const useStreakStore = create<StreakStore>()(
  persist(
    (set) => ({
      hasHydrated: false,
      lastUpdatedDate: null,
      streak: 0,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      startStreak: () =>
        set((state) => {
          if (state.streak > 0) {
            return state;
          }

          return {
            lastUpdatedDate: getLocalDateKey(),
            streak: 1,
          };
        }),
      syncStreak: () =>
        set((state) => {
          const today = getLocalDateKey();

          if (state.streak === 0 || !state.lastUpdatedDate) {
            return { lastUpdatedDate: today, streak: 1 };
          }

          const elapsedDays = getDayNumber(today) - getDayNumber(state.lastUpdatedDate);

          if (elapsedDays <= 0) {
            return state;
          }

          return {
            lastUpdatedDate: today,
            streak: state.streak + elapsedDays,
          };
        }),
    }),
    {
      name: streakStorageName,
      onRehydrateStorage: () => (state) => {
        const storeState = useStreakStore.getState();

        if (state?.setHasHydrated) {
          state.setHasHydrated(true);
        } else {
          storeState.setHasHydrated(true);
        }
      },
      partialize: (state) => ({
        lastUpdatedDate: state.lastUpdatedDate,
        streak: state.streak,
      }),
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
