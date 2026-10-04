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

function defaultApiUrl() {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
}

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL?.trim() || defaultApiUrl()
).replace(/\/$/, '');

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
      throw new Error(payload?.error ?? `Request failed (${response.status})`);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The Vaya service took too long to respond.');
    }

    throw error;
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
