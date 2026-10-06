import { Image } from 'expo-image';
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
import { API_URL } from '@/lib/api';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN = '#10B981';
const GREEN_DARK = '#087F5B';
const BG = '#F7F9F8';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E5E7EB';

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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function TripsScreen() {
  const router = useRouter();
  const { loading: authLoading, session } = usePassengerAuth();
  const [trips, setTrips] = useState<PassengerTrip[]>([]);
  const [now] = useState(() => Date.now());
  const [loading, setLoading] = useState(Boolean(session));
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming');

  useEffect(() => {
    if (!session) return;
    let active = true;

    fetchPassengerTrips(session)
      .then((response) => {
        if (active) setTrips(response.trips);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Unable to load your trips');
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
  }, [now, trips]);

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator color={GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>✓</Text></View>
          <Text style={styles.stateTitle}>Sign in to see your trips</Text>
          <Text style={styles.stateText}>Your bookings and travel history stay synced to your Vaya account.</Text>
          <Pressable
            onPress={() => router.push({ pathname: '/auth', params: { next: '/trips' } })}
            style={styles.primary}>
            <Text style={styles.primaryText}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const data = tab === 'upcoming' ? upcoming : history;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Trips</Text>
            <Text style={styles.subtitle}>Your bookings and ride history</Text>
          </View>
          <View style={styles.countPill}>
            <Text style={styles.countText}>{trips.length}</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <Pressable
            onPress={() => setTab('upcoming')}
            style={[styles.tab, tab === 'upcoming' && styles.tabActive]}>
            <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>
              Upcoming ({upcoming.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('history')}
            style={[styles.tab, tab === 'history' && styles.tabActive]}>
            <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
              History ({history.length})
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.stateCard}><ActivityIndicator color={GREEN} /></View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Couldn’t load trips</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : data.length ? (
          <View style={styles.tripList}>
            {data.map((trip) => (
              <Pressable
                key={trip.id}
                onPress={() =>
                  tab === 'upcoming' && trip.paymentStatus !== 'Paid'
                    ? router.push({ pathname: '/payment/[id]', params: { id: trip.id } })
                    : router.push({
                        pathname: '/trip/[id]',
                        params: { id: trip.tripId, passengers: String(trip.seats) },
                      })
                }
                style={({ pressed }) => [styles.tripCard, pressed && styles.pressed]}>
                <View style={styles.cardTop}>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {tab === 'upcoming' ? 'Upcoming' : trip.bookingStatus}
                    </Text>
                  </View>
                  <Text style={styles.date}>{formatDate(trip.departureAt)}</Text>
                </View>

                <Text style={styles.route}>{trip.route}</Text>

                <View style={styles.driverRow}>
                  <View style={styles.avatar}>
                    {trip.driverProfileImageUrl ? (
                      <Image
                        source={{ uri: `${API_URL}${trip.driverProfileImageUrl}` }}
                        style={styles.avatarImage}
                        contentFit="cover"
                      />
                    ) : (
                      <Text style={styles.avatarText}>{initials(trip.driver)}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.driverName}>{trip.driver}</Text>
                    <Text style={styles.vehicleText}>
                      {trip.vehicle || 'Verified Vaya vehicle'}
                    </Text>
                  </View>
                  <Text style={styles.amount}>{trip.amount}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{trip.seats} seat{trip.seats === 1 ? '' : 's'}</Text>
                  <View style={styles.metaDot} />
                  <Text style={styles.metaText}>{trip.paymentStatus}</Text>
                  <View style={styles.metaDot} />
                  <Text style={styles.metaText}>{trip.tripStatus}</Text>
                </View>

                <View style={styles.cardActions}>
                  <View style={styles.secondaryAction}>
                    <Text style={styles.secondaryActionText}>View details</Text>
                  </View>
                  {tab === 'upcoming' ? (
                    <View style={styles.primaryAction}>
                      <Text style={styles.primaryActionText}>
                        {trip.paymentStatus === 'Paid' ? 'Trip ready' : 'Pay now'}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>↗</Text></View>
            <Text style={styles.emptyTitle}>
              {tab === 'upcoming' ? 'No upcoming trips' : 'No trip history yet'}
            </Text>
            <Text style={styles.emptyText}>
              {tab === 'upcoming'
                ? 'Search a route and your next booking will appear here.'
                : 'Completed and cancelled journeys will appear here.'}
            </Text>
            {tab === 'upcoming' ? (
              <Pressable onPress={() => router.push('/search')} style={styles.smallButton}>
                <Text style={styles.smallButtonText}>Find a ride</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 120 },
  pressed: { opacity: 0.72 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  stateTitle: { color: TEXT, fontSize: 17, fontWeight: '900', marginTop: 12 },
  stateText: { color: MUTED, fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 5, maxWidth: 290 },
  primary: { marginTop: 16, height: 44, paddingHorizontal: 18, borderRadius: 11, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: TEXT, fontSize: 24, fontWeight: '900', letterSpacing: -0.45 },
  subtitle: { color: MUTED, fontSize: 9, marginTop: 3 },
  countPill: { minWidth: 30, height: 30, paddingHorizontal: 9, borderRadius: 15, backgroundColor: '#E9F9F3', alignItems: 'center', justifyContent: 'center' },
  countText: { color: GREEN_DARK, fontSize: 9, fontWeight: '900' },
  tabs: { marginTop: 18, flexDirection: 'row', backgroundColor: '#EEF2F0', borderRadius: 11, padding: 3 },
  tab: { flex: 1, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: SURFACE, borderWidth: 1, borderColor: '#DDE5E2' },
  tabText: { color: MUTED, fontSize: 9, fontWeight: '800' },
  tabTextActive: { color: GREEN_DARK },
  stateCard: { minHeight: 160, marginTop: 18, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  errorCard: { marginTop: 18, borderRadius: 14, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFF8F7', padding: 14 },
  errorTitle: { color: '#B42318', fontSize: 11, fontWeight: '900' },
  errorText: { color: '#B42318', fontSize: 9, marginTop: 4 },
  tripList: { marginTop: 14, gap: 10 },
  tripCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: '#DFE6E3', borderRadius: 15, padding: 13 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { backgroundColor: '#ECFDF3', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { color: '#027A48', fontSize: 7.5, fontWeight: '900' },
  date: { color: MUTED, fontSize: 8.5, fontWeight: '700' },
  route: { color: TEXT, fontSize: 13, fontWeight: '900', marginTop: 11 },
  driverRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  avatar: { width: 34, height: 34, borderRadius: 17, overflow: 'hidden', backgroundColor: '#E9F9F3', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: GREEN_DARK, fontSize: 8.5, fontWeight: '900' },
  driverName: { color: TEXT, fontSize: 10, fontWeight: '900' },
  vehicleText: { color: MUTED, fontSize: 8, marginTop: 2 },
  amount: { color: TEXT, fontSize: 13, fontWeight: '900' },
  metaRow: { marginTop: 11, paddingTop: 10, borderTopWidth: 1, borderTopColor: LINE, flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: MUTED, fontSize: 7.5, fontWeight: '700' },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#C4CBC8' },
  cardActions: { marginTop: 11, flexDirection: 'row', gap: 7 },
  secondaryAction: { flex: 1, height: 36, borderRadius: 9, backgroundColor: '#F2F4F3', alignItems: 'center', justifyContent: 'center' },
  secondaryActionText: { color: TEXT, fontSize: 8.5, fontWeight: '900' },
  primaryAction: { flex: 1, height: 36, borderRadius: 9, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  primaryActionText: { color: '#FFFFFF', fontSize: 8.5, fontWeight: '900' },
  emptyCard: { marginTop: 14, minHeight: 180, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 15, padding: 22, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#E9F9F3', alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { color: GREEN_DARK, fontSize: 14, fontWeight: '900' },
  emptyTitle: { color: TEXT, fontSize: 12, fontWeight: '900', marginTop: 11 },
  emptyText: { color: MUTED, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 4 },
  smallButton: { marginTop: 12, height: 36, paddingHorizontal: 12, borderRadius: 9, backgroundColor: '#E9F9F3', alignItems: 'center', justifyContent: 'center' },
  smallButtonText: { color: GREEN_DARK, fontSize: 8.5, fontWeight: '900' },
});
