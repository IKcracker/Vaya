import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  fetchMobileDriver,
  MobileDriver,
  MobileDriverTrip,
} from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#1877F2';
const NAVY = '#0B1730';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

function formatDeparture(value: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function statusTone(status: string) {
  if (status === 'Approved') return { bg: '#ECFDF3', text: '#027A48' };
  if (status === 'Rejected' || status === 'Suspended') {
    return { bg: '#FFF1F0', text: '#B42318' };
  }
  return { bg: '#FFFAEB', text: '#B54708' };
}

export default function DriverScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ refresh?: string }>();
  const { loading: authLoading, session, passenger, user } = usePassengerAuth();
  const [driver, setDriver] = useState<MobileDriver | null>(null);
  const [trips, setTrips] = useState<MobileDriverTrip[]>([]);
  const [loading, setLoading] = useState(Boolean(session));
  const [error, setError] = useState<string | null>(null);

  const refreshKey = typeof params.refresh === 'string' ? params.refresh : '';

  useEffect(() => {
    if (!session) return;

    let active = true;

    fetchMobileDriver(session)
      .then((response) => {
        if (!active) return;
        setDriver(response.driver);
        setTrips(response.trips);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : 'Unable to load driver mode'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey, session]);

  const nextTrip = useMemo(
    () =>
      trips.find(
        (trip) =>
          trip.status !== 'Completed' &&
          trip.status !== 'Cancelled'
      ) ?? null,
    [trips]
  );

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={BLUE} />
          <Text style={styles.stateTitle}>Loading driver mode</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <View style={styles.modeIcon}><Text style={styles.modeIconText}>↗</Text></View>
          <Text style={styles.stateTitle}>Drive with Vaya</Text>
          <Text style={styles.stateText}>
            Sign in first. Passenger and driver modes use the same Vaya account.
          </Text>
          <Pressable
            onPress={() =>
              router.push({ pathname: '/auth', params: { next: '/explore' } })
            }
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>Sign in or create account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Driver mode unavailable</Text>
          <Text style={styles.stateText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!driver) {
    const name = passenger?.name || user?.name || 'Vaya passenger';

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.eyebrow}>DRIVER MODE</Text>
          <Text style={styles.title}>Turn a trip you’re already making into shared travel.</Text>
          <Text style={styles.muted}>
            {name}, submit your driver and vehicle details once. Vaya Operations reviews the account before publishing is enabled.
          </Text>

          <View style={styles.onboardingCard}>
            <Step number="1" title="Submit details" text="Driver contact, operating area and vehicle." />
            <Step number="2" title="Vaya review" text="Operations checks and approves the driver profile." />
            <Step number="3" title="Publish trips" text="Set route, departure, seats and fare." last />
          </View>

          <Pressable
            onPress={() => router.push('/driver-application')}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>Apply to drive with Vaya</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const tone = statusTone(driver.status);
  const approved = driver.status === 'Approved';

  if (!approved) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>DRIVER APPLICATION</Text>
              <Text style={styles.title}>Review status</Text>
            </View>
            <View style={[styles.status, { backgroundColor: tone.bg }]}>
              <Text style={[styles.statusText, { color: tone.text }]}>
                {driver.status}
              </Text>
            </View>
          </View>

          <View style={styles.reviewCard}>
            <Text style={styles.reviewName}>{driver.name}</Text>
            <Text style={styles.reviewVehicle}>{driver.vehicle}</Text>
            <Text style={styles.reviewLocation}>{driver.location}</Text>
            <View style={styles.divider} />
            <Text style={styles.reviewLabel}>Checks</Text>
            <Text style={styles.reviewChecks}>{driver.checks}</Text>
          </View>

          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>
              {driver.status === 'Rejected'
                ? 'Application needs attention'
                : driver.status === 'Suspended'
                  ? 'Driver access suspended'
                  : 'Publishing is locked during review'}
            </Text>
            <Text style={styles.noticeText}>
              Only an Approved driver can publish trips. Status changes are controlled by Vaya Operations in the Admin CRM.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>DRIVER</Text>
            <Text style={styles.title}>Your trips</Text>
            <Text style={styles.muted}>Publish, manage and complete your journeys.</Text>
          </View>
          <View style={[styles.status, { backgroundColor: tone.bg }]}>
            <View style={styles.dot} />
            <Text style={[styles.statusText, { color: tone.text }]}>Approved</Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/driver-publish')}
          style={({ pressed }) => [styles.publish, pressed && styles.publishPressed]}>
          <Text style={styles.plus}>＋</Text>
          <Text style={styles.publishText}>Publish a trip</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Next departure</Text>
        {nextTrip ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/driver-trip/[id]',
                params: { id: nextTrip.id },
              })
            }
            style={({ pressed }) => [styles.tripCard, pressed && styles.pressed]}>
            <View style={styles.tripTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tripTime}>{formatDeparture(nextTrip.departureAt)}</Text>
                <Text style={styles.tripRoute}>{nextTrip.route}</Text>
              </View>
              <View style={styles.seatBadge}>
                <Text style={styles.seatText}>
                  {nextTrip.seatsBooked}/{nextTrip.seatCapacity} booked
                </Text>
              </View>
            </View>

            <View style={styles.divider} />
            <View style={styles.tripMetrics}>
              <Metric label="Fare" value={nextTrip.fare} />
              <Metric
                label="Expected"
                value={`R${((nextTrip.fareCents * nextTrip.seatsBooked) / 100).toFixed(0)}`}
              />
              <Metric label="Seats left" value={String(nextTrip.availableSeats)} />
            </View>

            <View style={styles.openStrip}>
              <Text style={styles.openText}>Manage trip</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No active trips</Text>
            <Text style={styles.emptyText}>
              Publish a route and it will immediately become available to passenger search.
            </Text>
          </View>
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>All driver trips</Text>
          <Text style={styles.countText}>{trips.length}</Text>
        </View>

        <View style={styles.tripList}>
          {trips.length ? (
            trips.map((trip, index) => (
              <Pressable
                key={trip.id}
                onPress={() =>
                  router.push({
                    pathname: '/driver-trip/[id]',
                    params: { id: trip.id },
                  })
                }
                style={({ pressed }) => [
                  styles.tripRow,
                  index < trips.length - 1 && styles.tripRowBorder,
                  pressed && styles.pressed,
                ]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tripRowRoute}>{trip.route}</Text>
                  <Text style={styles.tripRowMeta}>
                    {formatDeparture(trip.departureAt)} · {trip.status}
                  </Text>
                </View>
                <View style={styles.tripRowRight}>
                  <Text style={styles.tripRowFare}>{trip.fare}</Text>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyList}>
              <Text style={styles.emptyText}>No published trips yet.</Text>
            </View>
          )}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Driver account</Text>
        <View style={styles.accountStrip}>
          <View style={styles.accountDot}><Text style={styles.accountDotText}>✓</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountTitle}>{driver.vehicle}</Text>
            <Text style={styles.accountNote}>{driver.location} · {driver.checks}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Step({
  number,
  title,
  text,
  last,
}: {
  number: string;
  title: string;
  text: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.step, !last && styles.stepBorder]}>
      <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepText}>{text}</Text>
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { padding: 18, paddingBottom: 120 },
  pressed: { opacity: 0.72 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  modeIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#E7F3FF', alignItems: 'center', justifyContent: 'center' },
  modeIconText: { color: BLUE, fontSize: 22, fontWeight: '900' },
  stateTitle: { color: TEXT, fontSize: 20, fontWeight: '900', marginTop: 15, textAlign: 'center' },
  stateText: { color: MUTED, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 6, maxWidth: 310 },
  errorTitle: { color: '#B42318', fontSize: 18, fontWeight: '900' },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 18 },
  eyebrow: { color: BLUE, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: TEXT, fontSize: 26, fontWeight: '900', marginTop: 4, letterSpacing: -0.5 },
  muted: { color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 5 },
  status: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#12B76A', marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: '900' },
  onboardingCard: { marginTop: 24, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 18, paddingHorizontal: 15 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 15 },
  stepBorder: { borderBottomWidth: 1, borderBottomColor: LINE },
  stepNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E7F3FF', alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: BLUE, fontSize: 10, fontWeight: '900' },
  stepTitle: { color: TEXT, fontSize: 12, fontWeight: '900' },
  stepText: { color: MUTED, fontSize: 10, lineHeight: 15, marginTop: 3 },
  primary: { marginTop: 18, height: 50, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  reviewCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 18, padding: 16 },
  reviewName: { color: TEXT, fontSize: 18, fontWeight: '900' },
  reviewVehicle: { color: TEXT, fontSize: 12, fontWeight: '800', marginTop: 8 },
  reviewLocation: { color: MUTED, fontSize: 10, marginTop: 4 },
  divider: { height: 1, backgroundColor: LINE, marginVertical: 15 },
  reviewLabel: { color: MUTED, fontSize: 9, fontWeight: '800' },
  reviewChecks: { color: TEXT, fontSize: 11, fontWeight: '800', marginTop: 5, lineHeight: 17 },
  notice: { marginTop: 14, backgroundColor: '#FFFAEB', borderRadius: 14, padding: 14 },
  noticeTitle: { color: '#B54708', fontSize: 11, fontWeight: '900' },
  noticeText: { color: '#7A2E0E', fontSize: 10, lineHeight: 16, marginTop: 4 },
  publish: { height: 54, borderRadius: 14, backgroundColor: NAVY, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24 },
  publishPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  plus: { color: '#FFFFFF', fontSize: 21, fontWeight: '700' },
  publishText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  sectionTitle: { color: TEXT, fontSize: 18, fontWeight: '900', letterSpacing: -0.25, marginBottom: 10 },
  sectionRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countText: { color: MUTED, fontSize: 10, fontWeight: '800' },
  tripCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 18, padding: 16, marginBottom: 24 },
  tripTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  tripTime: { color: BLUE, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  tripRoute: { color: TEXT, fontSize: 18, fontWeight: '900', marginTop: 5 },
  seatBadge: { backgroundColor: '#E7F3FF', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 999 },
  seatText: { color: BLUE, fontSize: 10, fontWeight: '900' },
  tripMetrics: { flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { color: MUTED, fontSize: 9, fontWeight: '700' },
  metricValue: { color: TEXT, fontSize: 14, fontWeight: '900', marginTop: 4 },
  openStrip: { marginTop: 16, paddingTop: 13, borderTopWidth: 1, borderTopColor: LINE, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  openText: { color: BLUE, fontSize: 11, fontWeight: '900' },
  chevron: { color: '#98A2B3', fontSize: 22 },
  emptyCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 16, padding: 17, marginBottom: 24 },
  emptyTitle: { color: TEXT, fontSize: 13, fontWeight: '900' },
  emptyText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
  tripList: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 16, overflow: 'hidden' },
  tripRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  tripRowBorder: { borderBottomWidth: 1, borderBottomColor: LINE },
  tripRowRoute: { color: TEXT, fontSize: 12, fontWeight: '900' },
  tripRowMeta: { color: MUTED, fontSize: 9, marginTop: 4 },
  tripRowRight: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  tripRowFare: { color: TEXT, fontSize: 11, fontWeight: '900' },
  emptyList: { padding: 16 },
  accountStrip: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#EDF7F2', borderRadius: 15, padding: 14 },
  accountDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#12B76A', alignItems: 'center', justifyContent: 'center' },
  accountDotText: { color: '#FFFFFF', fontWeight: '900' },
  accountTitle: { color: TEXT, fontSize: 12, fontWeight: '900' },
  accountNote: { color: MUTED, fontSize: 10, lineHeight: 15, marginTop: 3 },
});
