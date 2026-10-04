import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createAuthenticatedBooking } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#1877F2';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

type CreatedBooking = {
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

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; seats?: string }>();
  const tripId = typeof params.id === 'string' ? params.id : '';
  const seats = Math.max(
    1,
    Number(typeof params.seats === 'string' ? params.seats : '1') || 1
  );

  const { loading, session, passenger, refresh } = usePassengerAuth();
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<CreatedBooking | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirmBooking() {
    if (!session || !passenger || !tripId || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await createAuthenticatedBooking(session, {
        tripId,
        seats,
      });

      setBooking(response.booking);
      await refresh();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to create booking'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator color={BLUE} />
          <Text style={styles.stateTitle}>Checking your account</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <View style={styles.authIcon}>
            <Text style={styles.authIconText}>✓</Text>
          </View>
          <Text style={styles.stateTitle}>Sign in to book this ride</Text>
          <Text style={styles.stateText}>
            Your passenger account is used for the booking and future trip history.
          </Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/auth',
                params: {
                  next: `/booking/${encodeURIComponent(tripId)}?seats=${seats}`,
                },
              })
            }
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>Sign in or create account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!passenger) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Passenger profile required</Text>
          <Text style={styles.stateText}>
            Your Neon Auth account is signed in, but no passenger profile is linked to this email yet.
          </Text>
          <Pressable
            onPress={() => router.replace('/profile')}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>Open profile</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (booking) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successPage}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Booking created</Text>
          <Text style={styles.successCopy}>
            Your seat reservation is saved in Vaya and is awaiting payment.
          </Text>

          <View style={styles.successCard}>
            <Row label="Booking" value={booking.id} />
            <Row label="Trip" value={booking.trip.route} />
            <Row label="Seats" value={String(booking.seats)} />
            <Row label="Amount" value={booking.amount} />
            <Row label="Status" value={booking.status} />
            <Row label="Payment" value={booking.paymentStatus} />
          </View>

          <Pressable
            onPress={() =>
              router.replace({
                pathname: '/payment/[id]',
                params: { id: booking.id },
              })
            }
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>Pay now · {booking.amount}</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/trips')}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Pay later</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>BOOK YOUR SEAT</Text>
            <Text style={styles.title}>{tripId}</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>Seats</Text>
            <Text style={styles.summaryValue}>{seats}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.summaryLabel}>Booking status</Text>
            <Text style={styles.summaryValue}>Awaiting payment</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Passenger account</Text>
        <View style={styles.accountCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {passenger.name
                .split(' ')
                .filter(Boolean)
                .map((value) => value[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountName}>{passenger.name}</Text>
            <Text style={styles.accountEmail}>{passenger.email}</Text>
            <Text style={styles.accountCity}>{passenger.city}</Text>
          </View>
          <View style={styles.secureBadge}>
            <Text style={styles.secureText}>Signed in</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Booking couldn’t be completed</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.note}>
          <Text style={styles.noteTitle}>Seat availability is checked again</Text>
          <Text style={styles.noteText}>
            Vaya confirms the booking only if the requested seats are still available. Fare and passenger identity are controlled by the server.
          </Text>
        </View>

        <Pressable
          disabled={submitting || !tripId}
          onPress={() => void confirmBooking()}
          style={({ pressed }) => [
            styles.primary,
            (submitting || !tripId) && styles.primaryDisabled,
            pressed && !submitting && tripId && styles.pressed,
          ]}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>Confirm booking</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 40 },
  pressed: { opacity: 0.72 },
  centerState: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E7F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authIconText: { color: BLUE, fontSize: 20, fontWeight: '900' },
  stateTitle: { color: TEXT, fontSize: 18, fontWeight: '900', marginTop: 14 },
  stateText: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 310,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: TEXT, fontSize: 30, lineHeight: 30, marginTop: -3 },
  eyebrow: { color: BLUE, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: TEXT, fontSize: 18, fontWeight: '900', marginTop: 3 },
  summaryCard: {
    marginTop: 22,
    backgroundColor: '#0B1730',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: { color: '#8FA0B8', fontSize: 9, fontWeight: '700' },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 24,
    marginBottom: 10,
  },
  accountCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E7F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: BLUE, fontSize: 11, fontWeight: '900' },
  accountName: { color: TEXT, fontSize: 13, fontWeight: '900' },
  accountEmail: { color: MUTED, fontSize: 9, marginTop: 3 },
  accountCity: { color: MUTED, fontSize: 9, marginTop: 2 },
  secureBadge: {
    backgroundColor: '#ECFDF3',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  secureText: { color: '#027A48', fontSize: 8, fontWeight: '900' },
  errorCard: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF8F7',
    padding: 14,
  },
  errorTitle: { color: '#B42318', fontSize: 11, fontWeight: '900' },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16, marginTop: 4 },
  note: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: '#EEF5FF',
    padding: 14,
  },
  noteTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  noteText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
  primary: {
    marginTop: 18,
    height: 50,
    minWidth: 210,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: { backgroundColor: '#B7D5FA' },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  secondary: {
    marginTop: 10,
    height: 48,
    minWidth: 210,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: TEXT, fontSize: 12, fontWeight: '900' },
  successPage: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ECFDF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconText: { color: '#12B76A', fontSize: 28, fontWeight: '900' },
  successTitle: {
    color: TEXT,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 18,
    letterSpacing: -0.4,
  },
  successCopy: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 320,
  },
  successCard: {
    width: '100%',
    marginTop: 24,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 16,
    paddingHorizontal: 15,
  },
  row: {
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  rowLabel: { color: MUTED, fontSize: 10, fontWeight: '700' },
  rowValue: { color: TEXT, fontSize: 11, fontWeight: '900' },
});
