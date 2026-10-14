import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
const KEY = "vaya.onboarding.completed";
export async function readOnboardingCompleted() {
  if (Platform.OS === "web")
    return (
      typeof localStorage !== "undefined" && localStorage.getItem(KEY) === "1"
    );
  return (await SecureStore.getItemAsync(KEY)) === "1";
}
export async function completeOnboarding() {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.setItem(KEY, "1");
    return;
  }
  await SecureStore.setItemAsync(KEY, "1");
}
