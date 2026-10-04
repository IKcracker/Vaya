import { router } from 'expo-router';
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

import { ScreenReveal } from '@/components/screen-reveal';
import { fetchPassengerTrips, PassengerTrip } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#1877F2';
const NAVY = '#0B1730';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

const corridors = [
  ['Johannesburg', 'Durban', 'Gauteng → KwaZulu-Natal'],
  ['Cape Town', 'Gqeberha', 'Western Cape → Eastern Cape'],
  ['Polokwane', 'Pretoria', 'Limpopo → Gauteng'],
  ['Mbombela', 'Pretoria', 'Mpumalanga → Gauteng'],
];

function openSearch(from: string, to: string) {
  router.push({
    pathname: '/search',
    params: { from, to },
  });
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((value) => value[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

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

export default function HomeScreen() {
  const { loading: authLoading, session, passenger, user } = usePassengerAuth();
  const [trips, setTrips] = useState<PassengerTrip[]>([]);
  const [now] = useState(() => Date.now());
  const [tripsLoading, setTripsLoading] = useState(Boolean(session));

  useEffect(() => {
    if (!session) return;

    let active = true;

    fetchPassengerTrips(session)
      .then((response) => {
        if (active) setTrips(response.trips);
      })
      .finally(() => {
        if (active) setTripsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session]);

  const nextTrip = useMemo(
    () =>
      trips.find(
        (trip) =>
          new Date(trip.departureAt).getTime() > now &&
          trip.bookingStatus !== 'Cancelled' &&
          trip.tripStatus !== 'Cancelled'
      ) ?? null,
    [now, trips]
  );

  const displayName = passenger?.name || user?.name || '';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <ScreenReveal>
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>vaya<Text style={styles.brandDot}>.</Text></Text>
              <Text style={styles.subtitle}>Shared trips across South Africa</Text>
            </View>
            <Pressable
              onPress={() => router.push('/profile')}
              style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
              {authLoading ? (
                <ActivityIndicator size="small" color={BLUE} />
              ) : (
                <Text style={styles.avatarText}>
                  {session ? initials(displayName) || 'VP' : 'V'}
                </Text>
              )}
            </Pressable>
          </View>
        </ScreenReveal>

        <ScreenReveal delay={70}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>FIND YOUR WAY</Text>
            <Text style={styles.heroTitle}>Where are you going next?</Text>
            <Text style={styles.heroBody}>
              Find verified drivers already travelling between cities, towns and provinces.
            </Text>
          </View>
        </ScreenReveal>

        <ScreenReveal delay={120}>
          <View style={styles.searchCard}>
            <View style={styles.routeBlock}>
              <View style={styles.routeRail}>
                <View style={styles.routeDotMuted} />
                <View style={styles.routeLine} />
                <View style={styles.routeDotBlue} />
              </View>

              <View style={styles.routeFields}>
                <View style={styles.routeField}>
                  <Text style={styles.fieldLabel}>Leaving from</Text>
                  <Text style={styles.fieldValue}>Johannesburg</Text>
                </View>
                <View style={styles.routeField}>
                  <Text style={styles.fieldLabel}>Going to</Text>
                  <Text style={styles.fieldValue}>Durban</Text>
                </View>
              </View>
            </View>

            <View style={styles.optionsRow}>
              <View style={styles.option}>
                <Text style={styles.optionLabel}>Date</Text>
                <Text style={styles.optionValue}>Choose in search</Text>
              </View>
              <View style={styles.option}>
                <Text style={styles.optionLabel}>Passengers</Text>
                <Text style={styles.optionValue}>Choose seats</Text>
              </View>
            </View>

            <Pressable
              onPress={() => openSearch('Johannesburg', 'Durban')}
              style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}>
              <Text style={styles.primaryText}>Search available rides</Text>
            </Pressable>
          </View>
        </ScreenReveal>

        <ScreenReveal delay={190}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Your next trip</Text>
              <Text style={styles.sectionSubtitle}>
                {session ? 'Synced from your passenger account' : 'Sign in to sync bookings'}
              </Text>
            </View>
            <Pressable onPress={() => router.push('/trips')}>
              <Text style={styles.sectionAction}>View trips</Text>
            </Pressable>
          </View>

          {session && tripsLoading ? (
            <View style={styles.tripState}>
              <ActivityIndicator color={BLUE} />
            </View>
          ) : nextTrip ? (
            <Pressable
              onPress={() => router.push('/trips')}
              style={({ pressed }) => [styles.nextTrip, pressed && styles.routePressed]}>
              <View style={styles.nextTripTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nextTripStatus}>{nextTrip.bookingStatus.toUpperCase()}</Text>
                  <Text style={styles.nextTripRoute}>{nextTrip.route}</Text>
                  <Text style={styles.nextTripDate}>{formatDeparture(nextTrip.departureAt)}</Text>
                </View>
                <Text style={styles.nextTripFare}>{nextTrip.amount}</Text>
              </View>
              <View style={styles.nextTripDivider} />
              <View style={styles.nextTripBottom}>
                <View>
                  <Text style={styles.nextTripLabel}>Driver</Text>
                  <Text style={styles.nextTripValue}>{nextTrip.driver}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.nextTripLabel}>Payment</Text>
                  <Text style={styles.nextTripValue}>{nextTrip.paymentStatus}</Text>
                </View>
              </View>
            </Pressable>
          ) : (
            <View style={styles.emptyTrip}>
              <Text style={styles.emptyTripTitle}>
                {session ? 'No upcoming booking yet' : 'Keep your trips in one place'}
              </Text>
              <Text style={styles.emptyTripText}>
                {session
                  ? 'Search for a route and your next confirmed reservation will appear here.'
                  : 'Create a passenger account to sync bookings and travel history.'}
              </Text>
              <Pressable
                onPress={() =>
                  session
                    ? router.push('/search')
                    : router.push({ pathname: '/auth', params: { next: '/' } })
                }
                style={({ pressed }) => [styles.emptyTripButton, pressed && styles.pressed]}>
                <Text style={styles.emptyTripButtonText}>
                  {session ? 'Find a ride' : 'Sign in or create account'}
                </Text>
              </Pressable>
            </View>
          )}
        </ScreenReveal>

        <ScreenReveal delay={260}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Popular routes</Text>
              <Text style={styles.sectionSubtitle}>Long-distance corridors across South Africa</Text>
            </View>
          </View>

          <View style={styles.routeList}>
            {corridors.map(([from, to, province], index) => (
              <Pressable
                key={from + to}
                onPress={() => openSearch(from, to)}
                style={({ pressed }) => [
                  styles.routeCard,
                  index < corridors.length - 1 && styles.routeBorder,
                  pressed && styles.routePressed,
                ]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeTitle}>{from} → {to}</Text>
                  <Text style={styles.routeMeta}>{province}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </ScreenReveal>

        <ScreenReveal delay={340}>
          <Pressable
            onPress={() => router.push('/explore')}
            style={({ pressed }) => [styles.driverStrip, pressed && styles.routePressed]}>
            <View style={styles.driverBadge}><Text style={styles.driverBadgeText}>↗</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverTitle}>Already making the trip?</Text>
              <Text style={styles.driverCopy}>Publish your route and put empty seats to work.</Text>
            </View>
            <Text style={styles.driverArrow}>›</Text>
          </Pressable>

          <View style={styles.safetyStrip}>
            <View style={styles.safetyBadge}><Text style={styles.safetyBadgeText}>✓</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.safetyTitle}>Travel with more clarity</Text>
              <Text style={styles.safetyCopy}>Verified drivers, trip records and vehicle information stay linked to every journey.</Text>
            </View>
          </View>
        </ScreenReveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 120 },
  pressed: { opacity: 0.72 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  brand: { color: TEXT, fontSize: 31, fontWeight: '900', letterSpacing: -1.6 },
  brandDot: { color: BLUE },
  subtitle: { color: MUTED, fontSize: 11, marginTop: 2 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E7F3FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BLUE, fontWeight: '900', fontSize: 11 },
  heroCopy: { marginBottom: 16 },
  eyebrow: { color: BLUE, fontSize: 9, fontWeight: '900', letterSpacing: 1.15 },
  heroTitle: { color: TEXT, fontSize: 29, fontWeight: '900', letterSpacing: -0.7, lineHeight: 34, marginTop: 5, maxWidth: 320 },
  heroBody: { color: MUTED, fontSize: 11, lineHeight: 18, marginTop: 7, maxWidth: 330 },
  searchCard: { backgroundColor: NAVY, borderRadius: 20, padding: 17, marginBottom: 27 },
  routeBlock: { flexDirection: 'row' },
  routeRail: { width: 25, alignItems: 'center', paddingTop: 21, paddingBottom: 21 },
  routeDotMuted: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#98A2B3' },
  routeDotBlue: { width: 8, height: 8, borderRadius: 4, backgroundColor: BLUE },
  routeLine: { flex: 1, width: 1, backgroundColor: '#34445E', marginVertical: 3 },
  routeFields: { flex: 1, gap: 9 },
  routeField: { borderRadius: 12, backgroundColor: '#13233F', paddingHorizontal: 13, paddingVertical: 12, borderWidth: 1, borderColor: '#243552' },
  fieldLabel: { color: '#8FA0B8', fontSize: 9, fontWeight: '700' },
  fieldValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', marginTop: 4 },
  optionsRow: { flexDirection: 'row', gap: 9, marginTop: 11 },
  option: { flex: 1, borderRadius: 11, backgroundColor: '#13233F', paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: '#243552' },
  optionLabel: { color: '#8FA0B8', fontSize: 9, fontWeight: '700' },
  optionValue: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', marginTop: 4 },
  primary: { height: 49, backgroundColor: BLUE, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  primaryPressed: { opacity: 0.86, transform: [{ scale: 0.995 }] },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  sectionHeader: { marginBottom: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionTitle: { color: TEXT, fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  sectionSubtitle: { color: MUTED, fontSize: 10, marginTop: 3 },
  sectionAction: { color: BLUE, fontSize: 10, fontWeight: '900' },
  tripState: { minHeight: 110, borderWidth: 1, borderColor: LINE, borderRadius: 16, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', marginBottom: 25 },
  nextTrip: { backgroundColor: SURFACE, borderRadius: 17, borderWidth: 1, borderColor: LINE, padding: 15, marginBottom: 25 },
  nextTripTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  nextTripStatus: { color: '#027A48', fontSize: 9, fontWeight: '900', letterSpacing: .5 },
  nextTripRoute: { color: TEXT, fontSize: 16, fontWeight: '900', marginTop: 6 },
  nextTripDate: { color: MUTED, fontSize: 10, marginTop: 4 },
  nextTripFare: { color: TEXT, fontSize: 18, fontWeight: '900' },
  nextTripDivider: { height: 1, backgroundColor: LINE, marginVertical: 14 },
  nextTripBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  nextTripLabel: { color: MUTED, fontSize: 9, fontWeight: '700' },
  nextTripValue: { color: TEXT, fontSize: 10, fontWeight: '900', marginTop: 3 },
  emptyTrip: { borderWidth: 1, borderColor: LINE, borderRadius: 16, backgroundColor: SURFACE, padding: 16, marginBottom: 25 },
  emptyTripTitle: { color: TEXT, fontSize: 13, fontWeight: '900' },
  emptyTripText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
  emptyTripButton: { alignSelf: 'flex-start', marginTop: 12, borderRadius: 9, backgroundColor: '#E7F3FF', paddingHorizontal: 11, paddingVertical: 8 },
  emptyTripButtonText: { color: BLUE, fontSize: 10, fontWeight: '900' },
  routeList: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 16, overflow: 'hidden' },
  routeCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 14 },
  routeBorder: { borderBottomWidth: 1, borderBottomColor: LINE },
  routePressed: { opacity: 0.72 },
  routeTitle: { color: TEXT, fontSize: 12, fontWeight: '900' },
  routeMeta: { color: MUTED, fontSize: 9, marginTop: 4 },
  chevron: { color: '#98A2B3', fontSize: 22 },
  driverStrip: { flexDirection: 'row', gap: 11, alignItems: 'center', marginTop: 26, backgroundColor: '#0B1730', borderRadius: 16, padding: 14 },
  driverBadge: { width: 34, height: 34, borderRadius: 11, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  driverBadgeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  driverTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  driverCopy: { color: '#A9B6CA', fontSize: 9, marginTop: 3 },
  driverArrow: { color: '#98A2B3', fontSize: 22 },
  safetyStrip: { flexDirection: 'row', gap: 11, alignItems: 'center', marginTop: 12, backgroundColor: '#EDF5FF', borderRadius: 16, padding: 14 },
  safetyBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  safetyBadgeText: { color: '#FFFFFF', fontWeight: '900' },
  safetyTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  safetyCopy: { color: MUTED, fontSize: 9, lineHeight: 15, marginTop: 3 },
});
