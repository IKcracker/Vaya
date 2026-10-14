import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
export type TravelMode = "passenger" | "driver";
const KEY = "vaya.travel-mode";
export async function readTravelMode(email: string): Promise<TravelMode> {
  const raw =
    Platform.OS === "web"
      ? typeof localStorage !== "undefined"
        ? localStorage.getItem(KEY)
        : null
      : await SecureStore.getItemAsync(KEY);
  try {
    const stored = raw ? JSON.parse(raw) : null;
    return stored?.email === email.toLowerCase() && stored.mode === "driver"
      ? "driver"
      : "passenger";
  } catch {
    return "passenger";
  }
}
export async function saveTravelMode(email: string, mode: TravelMode) {
  const value = JSON.stringify({ email: email.toLowerCase(), mode });
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.setItem(KEY, value);
    return;
  }
  await SecureStore.setItemAsync(KEY, value);
}
