import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { API_URL } from '@/lib/api';

export const DRIVER_BACKGROUND_LOCATION_TASK = 'vaya-driver-background-location';

const BACKGROUND_SESSION_KEY = 'vaya.driver.background.session';
const BACKGROUND_TRIP_KEY = 'vaya.driver.background.trip';

async function clearBackgroundTrackingState() {
  await Promise.all([
    SecureStore.deleteItemAsync(BACKGROUND_SESSION_KEY),
    SecureStore.deleteItemAsync(BACKGROUND_TRIP_KEY),
  ]);
}

async function stopBackgroundTaskOnly() {
  if (Platform.OS === 'web') return;
  const started = await Location.hasStartedLocationUpdatesAsync(
    DRIVER_BACKGROUND_LOCATION_TASK
  );
  if (started) {
    await Location.stopLocationUpdatesAsync(DRIVER_BACKGROUND_LOCATION_TASK);
  }
}

async function pushBackgroundLocation(location: Location.LocationObject) {
  const [session, tripId] = await Promise.all([
    SecureStore.getItemAsync(BACKGROUND_SESSION_KEY),
    SecureStore.getItemAsync(BACKGROUND_TRIP_KEY),
  ]);

  if (!session || !tripId) {
    await stopBackgroundTaskOnly();
    return;
  }

  const response = await fetch(
    `${API_URL}/api/mobile/driver/trips/${encodeURIComponent(tripId)}/location`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-vaya-session': session,
      },
      body: JSON.stringify({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracyMeters: location.coords.accuracy ?? null,
        heading:
          location.coords.heading == null || location.coords.heading < 0
            ? null
            : location.coords.heading,
        speedMps:
          location.coords.speed == null || location.coords.speed < 0
            ? null
            : location.coords.speed,
        recordedAt: new Date(location.timestamp).toISOString(),
      }),
    }
  );

  if ([401, 404, 409].includes(response.status)) {
    await Promise.all([
      stopBackgroundTaskOnly(),
      clearBackgroundTrackingState(),
    ]);
  }
}

if (
  Platform.OS !== 'web' &&
  !TaskManager.isTaskDefined(DRIVER_BACKGROUND_LOCATION_TASK)
) {
  TaskManager.defineTask(
    DRIVER_BACKGROUND_LOCATION_TASK,
    async ({ data, error }) => {
      if (error || !data) return;

      const locations =
        (data as { locations?: Location.LocationObject[] }).locations ?? [];
      const latest = locations.at(-1);
      if (!latest) return;

      try {
        await pushBackgroundLocation(latest);
      } catch {
        // Background updates are best-effort. The next native location event retries.
      }
    }
  );
}

export async function getBackgroundDriverTrackingState() {
  if (Platform.OS === 'web') {
    return { active: false, tripId: null as string | null };
  }

  const [tripId, active] = await Promise.all([
    SecureStore.getItemAsync(BACKGROUND_TRIP_KEY),
    Location.hasStartedLocationUpdatesAsync(DRIVER_BACKGROUND_LOCATION_TASK),
  ]);

  if (!active && tripId) {
    await clearBackgroundTrackingState();
  }

  return { active, tripId: active ? tripId : null };
}

export async function startBackgroundDriverTracking(
  session: string,
  tripId: string
) {
  if (Platform.OS === 'web') return false;

  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') return false;

  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== 'granted') return false;

  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(
    DRIVER_BACKGROUND_LOCATION_TASK
  );
  if (alreadyStarted) {
    await Location.stopLocationUpdatesAsync(DRIVER_BACKGROUND_LOCATION_TASK);
  }

  await Promise.all([
    SecureStore.setItemAsync(BACKGROUND_SESSION_KEY, session),
    SecureStore.setItemAsync(BACKGROUND_TRIP_KEY, tripId),
  ]);

  try {
    await Location.startLocationUpdatesAsync(DRIVER_BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      distanceInterval: 35,
      timeInterval: 12_000,
      deferredUpdatesDistance: 35,
      deferredUpdatesInterval: 12_000,
      activityType: Location.ActivityType.AutomotiveNavigation,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Vaya live trip location',
        notificationBody:
          'Sharing your location with passengers booked on this active trip.',
        notificationColor: '#16B364',
        killServiceOnDestroy: false,
      },
    });
    return true;
  } catch (error) {
    await clearBackgroundTrackingState();
    throw error;
  }
}

export async function stopBackgroundDriverTracking() {
  if (Platform.OS !== 'web') {
    await stopBackgroundTaskOnly();
  }
  await clearBackgroundTrackingState();
}
