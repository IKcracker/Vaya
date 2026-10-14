import { TravelModeProvider } from "@/providers/travel-mode-provider";
import { RetryButton } from "@/components/retry-button";
import { Design } from "@/constants/design";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
  usePathname,
  useGlobalSearchParams,
} from "expo-router";
import { readOnboardingCompleted } from "@/lib/onboarding-storage";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
  useColorScheme,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import "@/lib/background-driver-location";
import {
  PassengerAuthProvider,
  usePassengerAuth,
} from "@/providers/passenger-auth-provider";

SplashScreen.preventAutoHideAsync();

function StartupRoute() {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (segments.some((segment) => String(segment) === `[${key}]`)) continue;
    for (const item of Array.isArray(value) ? value : [value])
      if (typeof item === "string") search.append(key, item);
  }
  const destination = pathname + (search.size ? `?${search.toString()}` : "");
  const { loading, session, restorationError, retryRestore } =
    usePassengerAuth();

  const first = String(segments[0] ?? "");
  const requiresAuth = ![
    "",
    "(tabs)",
    "onboarding",
    "auth",
    "search",
    "search-results",
    "trip",
  ].includes(first);

  useEffect(() => {
    if (!loading && !restorationError && !session && requiresAuth) {
      router.replace({ pathname: "/auth", params: { next: destination } });
    }
  }, [loading, restorationError, session, requiresAuth, destination, router]);

  useEffect(() => {
    let active = true;

    if (loading || session || restorationError) return;
    readOnboardingCompleted()
      .then((value) => {
        if (!active || value) return;
        const first = String(segments[0] ?? "");
        if (first === "(tabs)" || first === "") {
          router.replace("/onboarding");
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [router, segments, loading, session, restorationError]);

  if (loading || restorationError || (!session && requiresAuth))
    return (
      <View style={startupStyles.overlay}>
        {loading || (!restorationError && !session && requiresAuth) ? (
          <ActivityIndicator color={Design.color.primary} />
        ) : (
          <>
            <Text style={startupStyles.title}>
              Unable to restore your account
            </Text>
            <Text style={startupStyles.copy}>{restorationError}</Text>
            <RetryButton onPress={retryRestore} />
          </>
        )}
      </View>
    );
  return null;
}
const startupStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    elevation: 100,
    backgroundColor: Design.color.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: Design.color.text,
    textAlign: "center",
  },
  copy: {
    fontSize: 14,
    lineHeight: 22,
    color: Design.color.muted,
    textAlign: "center",
    marginTop: 12,
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <PassengerAuthProvider>
      <TravelModeProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <AnimatedSplashOverlay />
          <StartupRoute />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="choose-role" />
            <Stack.Screen name="search" />
            <Stack.Screen name="search-results" />
            <Stack.Screen name="trip/[id]" />
            <Stack.Screen name="trip-progress/[id]" />
            <Stack.Screen name="trip-completed/[id]" />
            <Stack.Screen name="booking/[id]" />
            <Stack.Screen name="payment/[id]" />
            <Stack.Screen name="driver-application" />
            <Stack.Screen name="driver-profile" />
            <Stack.Screen name="driver-rides" />
            <Stack.Screen name="driver-publish" />
            <Stack.Screen name="driver-trip/[id]" />
            <Stack.Screen name="driver-trip-edit/[id]" />
            <Stack.Screen name="driver-vehicle" />
            <Stack.Screen name="add-vehicle" />
            <Stack.Screen name="driver-verification" />
            <Stack.Screen name="earnings" />
            <Stack.Screen name="profile-edit" />
            <Stack.Screen name="profile-payments" />
            <Stack.Screen name="profile-safety" />
            <Stack.Screen name="payment-methods" />
            <Stack.Screen name="privacy-security" />
            <Stack.Screen name="help-support" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="conversation/[email]" />
            <Stack.Screen name="settings" />
          </Stack>
        </ThemeProvider>
      </TravelModeProvider>
    </PassengerAuthProvider>
  );
}
