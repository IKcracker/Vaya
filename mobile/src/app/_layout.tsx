import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { PassengerAuthProvider } from '@/providers/passenger-auth-provider';

SplashScreen.preventAutoHideAsync();

function StartupRoute() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    let active = true;

    SecureStore.getItemAsync('vaya.onboarding.completed')
      .then((value) => {
        if (!active || value === '1') return;
        const first = String(segments[0] ?? '');
        if (first !== 'onboarding' && first !== 'auth') {
          router.replace('/onboarding');
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [router, segments]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <PassengerAuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
          <Stack.Screen name="driver-publish" />
          <Stack.Screen name="driver-trip/[id]" />
          <Stack.Screen name="driver-trip-edit/[id]" />
          <Stack.Screen name="driver-vehicle" />
          <Stack.Screen name="driver-verification" />
          <Stack.Screen name="earnings" />
          <Stack.Screen name="profile-edit" />
          <Stack.Screen name="profile-payments" />
          <Stack.Screen name="profile-safety" />
          <Stack.Screen name="payment-methods" />
          <Stack.Screen name="privacy-security" />
          <Stack.Screen name="help-support" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="settings" />
        </Stack>
      </ThemeProvider>
    </PassengerAuthProvider>
  );
}
