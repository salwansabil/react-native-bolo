import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StateStorage } from "zustand/middleware";

const serverStorage: StateStorage = {
  getItem: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
};

export function getPersistStorage(): StateStorage {
  if (process.env.EXPO_OS === "web" && typeof window === "undefined") {
    return serverStorage;
  }

  return AsyncStorage;
}
