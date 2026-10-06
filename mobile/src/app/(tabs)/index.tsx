import { Image } from 'expo-image';
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

import { fetchPassengerTrips, PassengerTrip } from '@/lib/auth';
import { API_URL } from '@/lib/api';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN = '#10B981';
const GREEN_DARK = '#087F5B';
const MINT = '#E9F9F3';
const BG = '#F7F9F8';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E5E7EB';

const popularRoutes = [
  { from: 'Johannesburg', to: 'Cape Town', fare: 'From R450', code: 'JHB → CPT' },
  { from: 'Johannesburg', to: 'Durban', fare: 'From R380', code: 'JHB → DBN' },
  { from: 'Pretoria', to: 'Gqeberha', fare: 'From R420', code: 'PTA → GQE' },
  { from: 'Cape Town', to: 'Gqeberha', fare: 'From R460', code: 'CPT → GQE' },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatTripDate(value: string) {
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
  const { loading, session, passenger, user } = usePassengerAuth();
  const [trips, setTrips] = useState<PassengerTrip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(Boolean(session));
  const [now] = useState(() => Date.now());

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

  const displayName = passenger?.name || user?.name || 'Traveller';
  const firstName = displayName.split(/\s+/)[0] || 'Traveller';
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

  const imageSource =
    passenger?.profileImageUrl && session
      ? {
          uri: `${API_URL}${passenger.profileImageUrl}`,
          headers: { 'x-vaya-session': session },
        }
      : null;

  const openRoute = (from: string, to: string) => {
    router.push({
      pathname: '/search',
      params: { from, to },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View>
            <Text style={styles.brand}>Vaya</Text>
            <Text style={styles.tagline}>Ride together. Go further.</Text>
          </View>
          <Pressable onPress={() => router.push('/profile')} style={styles.avatar}>
            {loading ? (
              <ActivityIndicator color={GREEN} size="small" />
            ) : imageSource ? (
              <Image source={imageSource} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Text style={styles.avatarText}>{session ? initials(displayName) || 'V' : 'V'}</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.welcomeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcome}>Where would you like to go?</Text>
            <Text style={styles.welcomeMeta}>
              {session ? `Hi ${firstName}, find your next inter-city ride.` : 'Find safe, verified rides across South Africa.'}
            </Text>
          </View>
          <View style={styles.safeBadge}>
            <Text style={styles.safeBadgeIcon}>✓</Text>
            <Text style={styles.safeBadgeText}>Verified</Text>
          </View>
        </View>

        <View style={styles.searchCard}>
          <Pressable
            onPress={() => router.push('/search')}
            style={({ pressed }) => [styles.searchField, pressed && styles.pressed]}>
            <View style={styles.pinCircle}><Text style={styles.pinText}>●</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>From</Text>
              <Text style={styles.fieldValue}>Current location</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.fieldDivider} />

          <Pressable
            onPress={() => router.push('/search')}
            style={({ pressed }) => [styles.searchField, pressed && styles.pressed]}>
            <View style={[styles.pinCircle, styles.pinCircleDestination]}>
              <Text style={[styles.pinText, styles.pinTextDestination]}>●</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>To</Text>
              <Text style={styles.fieldValue}>Enter destination</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/search')}
            style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
            <Text style={styles.searchButtonText}>Search rides</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular routes</Text>
          <Pressable onPress={() => router.push('/search')}>
            <Text style={styles.sectionAction}>See all</Text>
          </Pressable>
        </View>

        <View style={styles.popularGrid}>
          {popularRoutes.map((route) => (
            <Pressable
              key={route.code}
              onPress={() => openRoute(route.from, route.to)}
              style={({ pressed }) => [styles.popularCard, pressed && styles.pressed]}>
              <View style={styles.routeVisual}>
                <View style={styles.routeVisualDot} />
                <View style={styles.routeVisualLine} />
                <View style={[styles.routeVisualDot, styles.routeVisualDotEnd]} />
              </View>
              <Text style={styles.popularCode}>{route.code}</Text>
              <Text style={styles.popularFare}>{route.fare}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your next trip</Text>
          <Pressable onPress={() => router.push('/trips')}>
            <Text style={styles.sectionAction}>My trips</Text>
          </Pressable>
        </View>

        {session && tripsLoading ? (
          <View style={styles.stateCard}><ActivityIndicator color={GREEN} /></View>
        ) : nextTrip ? (
          <Pressable
            onPress={() => router.push('/trips')}
            style={({ pressed }) => [styles.tripCard, pressed && styles.pressed]}>
            <View style={styles.tripStatusRow}>
              <View style={styles.tripStatusBadge}>
                <Text style={styles.tripStatusText}>UPCOMING</Text>
              </View>
              <Text style={styles.tripFare}>{nextTrip.amount}</Text>
            </View>
            <Text style={styles.tripRoute}>{nextTrip.route}</Text>
            <Text style={styles.tripDate}>{formatTripDate(nextTrip.departureAt)}</Text>
            <View style={styles.tripBottom}>
              <View>
                <Text style={styles.tripLabel}>Driver</Text>
                <Text style={styles.tripValue}>{nextTrip.driver}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.tripLabel}>Payment</Text>
                <Text style={styles.tripValue}>{nextTrip.paymentStatus}</Text>
              </View>
            </View>
          </Pressable>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>↗</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.emptyTitle}>{session ? 'No upcoming trips' : 'Your trips will live here'}</Text>
              <Text style={styles.emptyText}>
                {session ? 'Search a route and book your next inter-city trip.' : 'Sign in to keep bookings and trip history together.'}
              </Text>
            </View>
          </View>
        )}

        <Pressable
          onPress={() => router.push('/explore')}
          style={({ pressed }) => [styles.driverBanner, pressed && styles.pressed]}>
          <View style={styles.driverBannerIcon}><Text style={styles.driverBannerIconText}>↗</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverBannerTitle}>Driving somewhere?</Text>
            <Text style={styles.driverBannerText}>Publish your route and share the trip with verified passengers.</Text>
          </View>
          <Text style={styles.driverBannerArrow}>›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 },
  pressed: { opacity: 0.74 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: TEXT, fontSize: 27, fontWeight: '900', letterSpacing: -1.2 },
  tagline: { color: MUTED, fontSize: 9, marginTop: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#D9E5E0', backgroundColor: MINT, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: GREEN_DARK, fontSize: 11, fontWeight: '900' },
  welcomeRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 24, marginBottom: 12 },
  welcome: { color: TEXT, fontSize: 21, fontWeight: '900', letterSpacing: -0.35 },
  welcomeMeta: { color: MUTED, fontSize: 10, marginTop: 4 },
  safeBadge: { flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: MINT, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6 },
  safeBadgeIcon: { color: GREEN_DARK, fontSize: 9, fontWeight: '900' },
  safeBadgeText: { color: GREEN_DARK, fontSize: 8, fontWeight: '900' },
  searchCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: '#DDE5E2', borderRadius: 17, padding: 12 },
  searchField: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 2 },
  pinCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: MINT, alignItems: 'center', justifyContent: 'center' },
  pinCircleDestination: { backgroundColor: '#FFF2E8' },
  pinText: { color: GREEN, fontSize: 10 },
  pinTextDestination: { color: '#F97316' },
  fieldLabel: { color: MUTED, fontSize: 8, fontWeight: '700' },
  fieldValue: { color: TEXT, fontSize: 12, fontWeight: '800', marginTop: 3 },
  fieldDivider: { height: 1, backgroundColor: LINE, marginLeft: 40 },
  chevron: { color: '#98A2B3', fontSize: 20 },
  searchButton: { marginTop: 10, height: 46, borderRadius: 11, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  searchButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  sectionHeader: { marginTop: 24, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: TEXT, fontSize: 15, fontWeight: '900' },
  sectionAction: { color: GREEN_DARK, fontSize: 9, fontWeight: '900' },
  popularGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  popularCard: { width: '48.5%', minHeight: 96, borderRadius: 14, backgroundColor: SURFACE, borderWidth: 1, borderColor: '#E1E7E4', padding: 11 },
  routeVisual: { height: 30, borderRadius: 9, backgroundColor: '#F0F6F3', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center' },
  routeVisualDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN },
  routeVisualLine: { flex: 1, height: 2, marginHorizontal: 4, backgroundColor: '#A9DCC7' },
  routeVisualDotEnd: { backgroundColor: '#0E7490' },
  popularCode: { color: TEXT, fontSize: 10, fontWeight: '900', marginTop: 9 },
  popularFare: { color: MUTED, fontSize: 8, marginTop: 3 },
  stateCard: { minHeight: 100, borderRadius: 14, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  tripCard: { borderRadius: 15, backgroundColor: SURFACE, borderWidth: 1, borderColor: '#DEE6E2', padding: 14 },
  tripStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripStatusBadge: { backgroundColor: '#ECFDF3', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  tripStatusText: { color: '#027A48', fontSize: 7, fontWeight: '900' },
  tripFare: { color: TEXT, fontSize: 15, fontWeight: '900' },
  tripRoute: { color: TEXT, fontSize: 13, fontWeight: '900', marginTop: 10 },
  tripDate: { color: MUTED, fontSize: 9, marginTop: 4 },
  tripBottom: { marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: LINE, flexDirection: 'row', justifyContent: 'space-between' },
  tripLabel: { color: MUTED, fontSize: 8 },
  tripValue: { color: TEXT, fontSize: 9, fontWeight: '800', marginTop: 3 },
  emptyCard: { minHeight: 84, borderRadius: 14, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, flexDirection: 'row', gap: 10, alignItems: 'center', padding: 13 },
  emptyIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: MINT, alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { color: GREEN_DARK, fontWeight: '900', fontSize: 14 },
  emptyTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  emptyText: { color: MUTED, fontSize: 9, lineHeight: 14, marginTop: 3 },
  driverBanner: { marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 15, backgroundColor: '#063C35', padding: 14 },
  driverBannerIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  driverBannerIconText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  driverBannerTitle: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  driverBannerText: { color: '#B9D7CE', fontSize: 8.5, lineHeight: 13, marginTop: 3 },
  driverBannerArrow: { color: '#B9D7CE', fontSize: 20 },
});
