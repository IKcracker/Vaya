import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchPassengerTrips, PassengerTrip } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#1877F2';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function statusTone(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes('confirmed') || normalized.includes('completed')) {
    return { bg: '#ECFDF3', text: '#027A48' };
  }
  if (normalized.includes('cancel')) {
    return { bg: '#FFF1F0', text: '#B42318' };
  }
  return { bg: '#FFFAEB', text: '#B54708' };
}

export default function TripsScreen() {
  const router = useRouter();
  const { loading: authLoading, session } = usePassengerAuth();
  const [trips, setTrips] = useState<PassengerTrip[]>([]);
  const [loading, setLoading] = useState(Boolean(session));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    let active = true;

    fetchPassengerTrips(session)
      .then((response) => {
        if (active) setTrips(response.trips);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : 'Unable to load your trips'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session]);

  const { upcoming, history } = useMemo(() => {
    const now = Date.now();
    const future: PassengerTrip[] = [];
    const past: PassengerTrip[] = [];

    for (const trip of trips) {
      const departure = new Date(trip.departureAt).getTime();
      if (
        departure >= now &&
        trip.bookingStatus !== 'Cancelled' &&
        trip.tripStatus !== 'Cancelled'
      ) {
        future.push(trip);
      } else {
        past.push(trip);
      }
    }

    return { upcoming: future, history: past };
  }, [trips]);

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator color={BLUE} />
          <Text style={styles.stateTitle}>Loading your account</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <View style={styles.lockIcon}><Text style={styles.lockText}>✓</Text></View>
          <Text style={styles.stateTitle}>Sign in to see your trips</Text>
          <Text style={styles.stateText}>
            Your bookings and trip history will stay synced across Vaya.
          </Text>
          <Pressable
            onPress={() => router.push({ pathname: '/auth', params: { next: '/trips' } })}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>Sign in or create account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>YOUR TRAVEL</Text>
        <Text style={styles.title}>Trips</Text>
        <Text style={styles.subtitle}>
          Live bookings and journeys linked to your passenger account.
        </Text>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={BLUE} />
            <Text style={styles.stateTitle}>Loading your trips</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Couldn’t load trips</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming</Text>
              <Text style={styles.sectionMeta}>
                {upcoming.length} booking{upcoming.length === 1 ? '' : 's'}
              </Text>
            </View>

            {upcoming.length ? (
              upcoming.map((trip) => {
                const tone = statusTone(trip.bookingStatus);
                return (
                  <Pressable
                    key={trip.id}
                    onPress={() =>
                      router.push({
                        pathname: '/trip/[id]',
                        params: { id: trip.tripId, passengers: String(trip.seats) },
                      })
                    }
                    style={({ pressed }) => [styles.upcomingCard, pressed && styles.pressed]}>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
                        <Text style={[styles.statusText, { color: tone.text }]}>
                          {trip.bookingStatus}
                        </Text>
                      </View>
                      <Text style={styles.bookingId}>{trip.id}</Text>
                    </View>
                    <Text style={styles.route}>{trip.route}</Text>
                    <Text style={styles.date}>{formatDate(trip.departureAt)}</Text>

                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                      <View>
                        <Text style={styles.detailLabel}>Driver</Text>
                        <Text style={styles.detailValue}>{trip.driver}</Text>
                      </View>
                      <View>
                        <Text style={styles.detailLabel}>Seats</Text>
                        <Text style={styles.detailValue}>{trip.seats}</Text>
                      </View>
                      <View>
                        <Text style={styles.detailLabel}>Amount</Text>
                        <Text style={styles.detailValue}>{trip.amount}</Text>
                      </View>
                    </View>

                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Payment</Text>
                      <Text style={styles.paymentValue}>{trip.paymentStatus}</Text>
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No upcoming trips</Text>
                <Text style={styles.emptyText}>
                  Search a route and your next booking will appear here automatically.
                </Text>
                <Pressable
                  onPress={() => router.push('/search')}
                  style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}>
                  <Text style={styles.smallButtonText}>Find a ride</Text>
                </Pressable>
              </View>
            )}

            <View style={[styles.sectionHeader, { marginTop: 28 }]}>
              <Text style={styles.sectionTitle}>Past trips</Text>
              <Text style={styles.sectionMeta}>{history.length} records</Text>
            </View>

            <View style={styles.historyList}>
              {history.length ? (
                history.map((trip, index) => (
                  <Pressable
                    key={trip.id}
                    onPress={() =>
                      router.push({
                        pathname: '/trip/[id]',
                        params: { id: trip.tripId, passengers: String(trip.seats) },
                      })
                    }
                    style={({ pressed }) => [
                      styles.historyRow,
                      index < history.length - 1 && styles.historyBorder,
                      pressed && styles.pressed,
                    ]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyRoute}>{trip.route}</Text>
                      <Text style={styles.historyMeta}>
                        {formatDate(trip.departureAt)} · {trip.driver}
                      </Text>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyAmount}>{trip.amount}</Text>
                      <Text style={styles.chevron}>›</Text>
                    </View>
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyHistory}>
                  <Text style={styles.emptyText}>No past trips yet.</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 120 },
  pressed: { opacity: 0.72 },
  centerState: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E7F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: { color: BLUE, fontSize: 20, fontWeight: '900' },
  stateTitle: { color: TEXT, fontSize: 17, fontWeight: '900', marginTop: 14 },
  stateText: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 300,
  },
  primary: {
    marginTop: 18,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  eyebrow: { color: BLUE, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: TEXT, fontSize: 30, fontWeight: '900', letterSpacing: -0.7, marginTop: 4 },
  subtitle: { color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 5, maxWidth: 330 },
  loadingCard: {
    minHeight: 180,
    marginTop: 24,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 18,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    backgroundColor: '#FFF8F7',
    padding: 16,
  },
  errorTitle: { color: '#B42318', fontSize: 13, fontWeight: '900' },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16, marginTop: 4 },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: TEXT, fontSize: 18, fontWeight: '900' },
  sectionMeta: { color: MUTED, fontSize: 11, fontWeight: '700' },
  upcomingCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: '900' },
  bookingId: { color: MUTED, fontSize: 10, fontWeight: '800' },
  route: { color: TEXT, fontSize: 20, fontWeight: '900', marginTop: 16, letterSpacing: -0.3 },
  date: { color: BLUE, fontSize: 12, fontWeight: '800', marginTop: 5 },
  divider: { height: 1, backgroundColor: LINE, marginVertical: 15 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  detailLabel: { color: MUTED, fontSize: 9, fontWeight: '700' },
  detailValue: { color: TEXT, fontSize: 11, fontWeight: '900', marginTop: 4 },
  paymentRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: LINE,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentLabel: { color: MUTED, fontSize: 9, fontWeight: '700' },
  paymentValue: { color: TEXT, fontSize: 10, fontWeight: '900' },
  emptyCard: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 16,
    backgroundColor: SURFACE,
    padding: 18,
  },
  emptyTitle: { color: TEXT, fontSize: 13, fontWeight: '900' },
  emptyText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
  smallButton: {
    marginTop: 13,
    alignSelf: 'flex-start',
    backgroundColor: '#E7F3FF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
  },
  smallButtonText: { color: BLUE, fontSize: 10, fontWeight: '900' },
  historyList: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LINE,
    overflow: 'hidden',
  },
  historyRow: { padding: 15, flexDirection: 'row', alignItems: 'center' },
  historyBorder: { borderBottomWidth: 1, borderBottomColor: LINE },
  historyRoute: { color: TEXT, fontSize: 13, fontWeight: '900' },
  historyMeta: { color: MUTED, fontSize: 10, marginTop: 4 },
  historyRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyAmount: { color: TEXT, fontSize: 12, fontWeight: '900' },
  chevron: { color: '#98A2B3', fontSize: 22 },
  emptyHistory: { padding: 18 },
});
