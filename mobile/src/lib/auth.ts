import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { API_URL, normalizeConnectionError } from '@/lib/api';

const SESSION_KEY = 'vaya.passenger.session';

export type AuthUser = {
  id?: string;
  name?: string;
  email?: string;
};

export type PassengerAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  status: string;
  tripsCount?: number;
  joinedAt?: string;
};

export type PassengerPayment = {
  reference: string;
  bookingId: string;
  amountCents: number;
  amount: string;
  method: string;
  status: string;
  route: string;
  createdAt: string;
};

export type PassengerTrip = {
  id: string;
  route: string;
  tripId: string;
  driver: string;
  departureAt: string;
  seats: number;
  amountCents: number;
  amount: string;
  bookingStatus: string;
  paymentStatus: string;
  tripStatus: string;
  createdAt: string;
};

async function storeSession(value: string | null) {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return;
    if (value) localStorage.setItem(SESSION_KEY, value);
    else localStorage.removeItem(SESSION_KEY);
    return;
  }

  if (value) {
    await SecureStore.setItemAsync(SESSION_KEY, value);
  } else {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }
}

export async function readStoredSession() {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(SESSION_KEY);
  }

  return SecureStore.getItemAsync(SESSION_KEY);
}

async function request<T>(
  path: string,
  init?: RequestInit,
  session?: string | null
): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(session ? { 'x-vaya-session': session } : {}),
        ...init?.headers,
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(
        payload?.error ?? `Request failed (${response.status})`
      );
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    return payload as T;
  } catch (error) {
    throw normalizeConnectionError(error);
  }
}

export async function passengerSignIn(email: string, password: string) {
  const response = await request<{
    user: AuthUser;
    session: string;
  }>('/api/mobile/auth/sign-in', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  await storeSession(response.session);
  return response;
}

export async function passengerSignUp(input: {
  name: string;
  email: string;
  password: string;
  city: string;
}) {
  const response = await request<{
    user: AuthUser;
    passenger: PassengerAccount;
    session: string;
  }>('/api/mobile/auth/sign-up', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  await storeSession(response.session);
  return response;
}

export async function fetchPassengerSession(session: string) {
  return request<{
    authenticated: true;
    user: AuthUser;
    passenger: PassengerAccount | null;
  }>('/api/mobile/auth/session', undefined, session);
}

export async function fetchPassengerProfile(session: string) {
  return request<{
    user: AuthUser;
    passenger: PassengerAccount | null;
  }>('/api/mobile/me', undefined, session);
}

export async function updatePassengerProfile(
  session: string,
  input: { name: string; phone: string; city: string }
) {
  return request<{
    user: AuthUser;
    passenger: PassengerAccount;
  }>(
    '/api/mobile/me',
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
    session
  );
}

export async function fetchPassengerPayments(session: string) {
  return request<{ payments: PassengerPayment[] }>(
    '/api/mobile/me/payments',
    undefined,
    session
  );
}

export async function submitPassengerSafetyReport(
  session: string,
  input: { subject: string; note: string; tripId?: string | null }
) {
  return request<{
    safetyCase: {
      id: string;
      subject: string;
      status: string;
      priority: string;
      trip: string;
      createdAt: string;
    };
  }>(
    '/api/mobile/me/safety',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    session
  );
}

export async function fetchPassengerTrips(session: string) {
  return request<{ trips: PassengerTrip[] }>(
    '/api/mobile/me/trips',
    undefined,
    session
  );
}

export async function createAuthenticatedBooking(
  session: string,
  input: { tripId: string; seats: number }
) {
  return request<{
    booking: {
      id: string;
      status: string;
      paymentStatus: string;
      seats: number;
      amount: string;
      trip: {
        id: string;
        route: string;
        departureAt: string;
      };
    };
  }>(
    '/api/mobile/bookings',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    session
  );
}

export async function passengerSignOut(session: string | null) {
  if (session) {
    try {
      await request(
        '/api/mobile/auth/sign-out',
        { method: 'POST' },
        session
      );
    } catch {
      // Local session removal still signs the device out.
    }
  }

  await storeSession(null);
}


export type PassengerBookingDetail = {
  id: string;
  databaseId: string;
  status: string;
  paymentStatus: string;
  amountCents: number;
  amount: string;
  passenger: PassengerAccount;
  trip: {
    id: string;
    route: string;
    departureAt: string;
  };
  payments: {
    reference: string;
    amountCents: number;
    amount: string;
    method: string;
    status: string;
    createdAt: string;
  }[];
};

export async function fetchPassengerBooking(
  session: string,
  bookingId: string
) {
  return request<{ booking: PassengerBookingDetail }>(
    `/api/mobile/bookings/${encodeURIComponent(bookingId)}`,
    undefined,
    session
  );
}

export async function initializePassengerPayment(
  session: string,
  bookingId: string
) {
  return request<{
    payment: {
      reference: string;
      amount: string;
      amountCents: number;
      authorizationUrl: string;
      accessCode: string;
      status: string;
    };
  }>(
    '/api/mobile/payments/initialize',
    {
      method: 'POST',
      body: JSON.stringify({ bookingId }),
    },
    session
  );
}

export async function verifyPassengerPayment(
  session: string,
  reference: string
) {
  const params = new URLSearchParams({ reference });

  return request<{
    payment: {
      reference: string;
      status: string;
      bookingId: string;
    };
  }>(
    `/api/mobile/payments/verify?${params.toString()}`,
    undefined,
    session
  );
}


export type DriverDocumentKind =
  | 'identity'
  | 'drivers_license'
  | 'vehicle_registration'
  | 'roadworthy'
  | 'insurance';

export type DriverVerificationDocument = {
  id: string;
  kind: DriverDocumentKind;
  label: string;
  required: boolean;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  status: string;
  reviewNote: string;
  uploadedAt: string;
  reviewedAt: string | null;
  updatedAt: string;
};

export type DriverVerification = {
  documents: DriverVerificationDocument[];
  requiredCount: number;
  uploadedRequiredCount: number;
  approvedRequiredCount: number;
  missingKinds: DriverDocumentKind[];
  needsAttentionKinds: DriverDocumentKind[];
  readyToApprove: boolean;
};

export type MobileDriver = {
  id: string;
  initials?: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  vehicle?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  checks: string;
  status: string;
  submittedAt?: string;
  verification?: DriverVerification;
};

export type MobileDriverTrip = {
  id: string;
  route: string;
  from: string;
  to: string;
  departureAt: string;
  seatCapacity: number;
  seatsBooked: number;
  availableSeats: number;
  fareCents: number;
  fare: string;
  status: string;
};

export async function fetchMobileDriver(session: string) {
  return request<{
    driver: MobileDriver | null;
    trips: MobileDriverTrip[];
  }>('/api/mobile/driver', undefined, session);
}

export async function submitDriverApplication(
  session: string,
  input: {
    name: string;
    phone?: string;
    location: string;
    vehicleMake: string;
    vehicleModel: string;
    vehicleYear: number;
  }
) {
  return request<{ driver: MobileDriver }>(
    '/api/mobile/driver',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    session
  );
}

export async function uploadDriverDocument(
  session: string,
  input: {
    kind: DriverDocumentKind;
    fileName: string;
    contentType: string;
    fileData: string;
  }
) {
  return request<{
    document: DriverVerificationDocument;
    verification: DriverVerification & { checks: string; status: string };
  }>(
    '/api/mobile/driver/documents',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    session
  );
}

export async function publishDriverTrip(
  session: string,
  input: {
    from: string;
    to: string;
    departureAt: string;
    seats: number;
    fare: number;
  }
) {
  return request<{ trip: MobileDriverTrip }>(
    '/api/mobile/driver/trips',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    session
  );
}

export async function updateDriverTripStatus(
  session: string,
  tripId: string,
  status: 'Scheduled' | 'On schedule' | 'Boarding' | 'Completed' | 'Cancelled'
) {
  return request<{ trip: { id: string; status: string } }>(
    `/api/mobile/driver/trips/${encodeURIComponent(tripId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
    session
  );
}


export async function updateDriverTripDetails(
  session: string,
  tripId: string,
  input: {
    from: string;
    to: string;
    departureAt: string;
    seats: number;
    fare: number;
  }
) {
  return request<{ trip: MobileDriverTrip }>(
    `/api/mobile/driver/trips/${encodeURIComponent(tripId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        action: 'update_details',
        ...input,
      }),
    },
    session
  );
}
