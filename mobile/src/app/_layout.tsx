import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { PassengerAuthProvider } from '@/providers/passenger-auth-provider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <PassengerAuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="search" />
          <Stack.Screen name="search-results" />
          <Stack.Screen name="trip/[id]" />
          <Stack.Screen name="booking/[id]" />
          <Stack.Screen name="payment/[id]" />
          <Stack.Screen name="driver-application" />
          <Stack.Screen name="driver-publish" />
          <Stack.Screen name="driver-trip/[id]" />
          <Stack.Screen name="driver-trip-edit/[id]" />
          <Stack.Screen name="driver-vehicle" />
          <Stack.Screen name="profile-edit" />
          <Stack.Screen name="profile-payments" />
          <Stack.Screen name="profile-safety" />
        </Stack>
      </ThemeProvider>
    </PassengerAuthProvider>
  );
}
