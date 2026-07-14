import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const lessonProgressStorageName = "bolo-lesson-progress-storage";
const defaultLessonXp = 10;

type LessonProgressStore = {
  completedLessonIds: string[];
  totalXp: number;
  clearLessonProgress: () => Promise<void>;
  completeLesson: (lessonId: string, xpReward?: number) => void;
};

export const useLessonProgressStore = create<LessonProgressStore>()(
  persist(
    (set) => ({
      completedLessonIds: [],
      totalXp: 0,
      clearLessonProgress: async () => {
        await AsyncStorage.removeItem(lessonProgressStorageName);
        set({ completedLessonIds: [], totalXp: 0 });
      },
      completeLesson: (lessonId, xpReward = defaultLessonXp) =>
        set((state) => {
          if (state.completedLessonIds.includes(lessonId)) {
            return state;
          }

          return {
            completedLessonIds: [...state.completedLessonIds, lessonId],
            totalXp: state.totalXp + xpReward,
          };
        }),
    }),
    {
      name: lessonProgressStorageName,
      partialize: (state) => ({
        completedLessonIds: state.completedLessonIds,
        totalXp: state.totalXp,
      }),
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
