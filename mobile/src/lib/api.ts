import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export type PublicTrip = {
  id: string;
  databaseId: string;
  from: string;
  to: string;
  driver: {
    name: string;
    verified: boolean;
    location: string;
    profileImageUrl: string;
    vehicle: string;
  };
  departureAt: string;
  seatCapacity: number;
  seatsBooked: number;
  availableSeats: number;
  fareCents: number;
  fare: string;
  status: string;
};


export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type RoutePreview = {
  origin: RouteCoordinate;
  destination: RouteCoordinate;
  path: RouteCoordinate[];
  distanceKm: number;
  durationMinutes: number;
  routing: 'osrm' | 'estimate';
};

export type PublicBooking = {
  id: string;
  status: string;
  paymentStatus: string;
  seats: number;
  amountCents: number;
  amount: string;
  trip: {
    id: string;
    route: string;
    departureAt: string;
  };
  passenger: {
    id: string;
    name: string;
    email: string;
  };
};

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function extractHost(value?: string | null) {
  if (!value) return null;

  try {
    const parsed = new URL(
      value.includes('://') ? value : `http://${value}`
    );
    return parsed.hostname || null;
  } catch {
    return null;
  }
}

function expoDevelopmentHost() {
  return (
    extractHost(Constants.expoConfig?.hostUri) ||
    extractHost(Constants.linkingUri)
  );
}

function configuredApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  const developmentHost = expoDevelopmentHost();

  if (configured) {
    try {
      const url = new URL(configured);

      if (
        Platform.OS !== 'web' &&
        Device.isDevice &&
        developmentHost &&
        LOOPBACK_HOSTS.has(url.hostname)
      ) {
        url.hostname = developmentHost;
        return url.toString();
      }
    } catch {
      return configured;
    }

    return configured;
  }

  if (Platform.OS !== 'web' && Device.isDevice && developmentHost) {
    return `http://${developmentHost}:3000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
}

export const API_URL = configuredApiUrl().replace(/\/$/, '');

export function normalizeConnectionError(error: unknown) {
  if (
    error instanceof Error &&
    (error.name === 'AbortError' ||
      /could not connect|network request failed|fetch failed|network error/i.test(
        error.message
      ))
  ) {
    return new Error(
      'Vaya can’t reach the server. Make sure the backend is running and your phone is on the same Wi-Fi/network as your computer, then try again.'
    );
  }

  return error instanceof Error ? error : new Error('Something went wrong.');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.error ?? (response.status === 404
        ? 'This server is missing a required Vaya API. Deploy the latest backend or check EXPO_PUBLIC_API_URL in mobile/.env.'
        : `Request failed (${response.status})`));
    }

    if (!payload || typeof payload !== 'object') {
      throw new Error('The server returned an invalid response. Please try again.');
    }

    return payload as T;
  } catch (error) {
    throw normalizeConnectionError(error);
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchTrips(input: {
  from: string;
  to: string;
  date?: string;
  passengers: number;
}) {
  const params = new URLSearchParams({
    from: input.from,
    to: input.to,
    passengers: String(input.passengers),
  });

  if (input.date) {
    params.set('date', input.date);
  }

  return request<{ trips: PublicTrip[] }>(
    `/api/public/trips?${params.toString()}`
  );
}


export async function getRoutePreview(from: string, to: string) {
  const params = new URLSearchParams({ from, to });
  return request<{ route: RoutePreview | null; error?: string }>(
    `/api/public/route-preview?${params.toString()}`
  );
}

export async function getTrip(id: string) {
  return request<{ trip: PublicTrip }>(
    `/api/public/trips/${encodeURIComponent(id)}`
  );
}

export async function createBooking(input: {
  tripId: string;
  seats: number;
  passenger: {
    name: string;
    email: string;
    city: string;
  };
}) {
  return request<{ booking: PublicBooking }>('/api/public/bookings', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
