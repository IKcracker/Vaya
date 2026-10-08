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
import { API_URL, PublicTrip, searchTrips } from '@/lib/api';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN = '#16B364';
const GREEN_DARK = '#087F5B';
const FOREST = '#073C36';
const BG = '#F7F9F8';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';
const MINT = '#E9F9F3';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'Traveller';
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

function shortDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

export default function HomeScreen() {
  const { loading, session, passenger, user } = usePassengerAuth();
  const [trips, setTrips] = useState<PassengerTrip[]>([]);
  const [available, setAvailable] = useState<PublicTrip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(Boolean(session));
  const [routesLoading, setRoutesLoading] = useState(true);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let active = true;

    searchTrips({ from: '', to: '', passengers: 1 })
      .then((response) => {
        if (active) setAvailable(response.trips);
      })
      .catch(() => {
        if (active) setAvailable([]);
      })
      .finally(() => {
        if (active) setRoutesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

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
  const defaultFrom = passenger?.city ?? '';

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

  const suggestedRoutes = useMemo(() => {
    const seen = new Set<string>();
    const preferredCity = passenger?.city.trim().toLowerCase();

    return [...available]
      .sort((a, b) => {
        const aLocal =
          preferredCity && a.from.trim().toLowerCase() === preferredCity ? 0 : 1;
        const bLocal =
          preferredCity && b.from.trim().toLowerCase() === preferredCity ? 0 : 1;

        if (aLocal !== bLocal) return Number(aLocal) - Number(bLocal);

        return (
          new Date(a.departureAt).getTime() -
          new Date(b.departureAt).getTime()
        );
      })
      .filter((trip) => {
        const key = `${trip.from.toLowerCase()}|${trip.to.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }, [available, passenger?.city]);

  const imageSource =
    passenger?.profileImageUrl && session
      ? {
          uri: `${API_URL}${passenger.profileImageUrl}`,
          headers: { 'x-vaya-session': session },
        }
      : null;

  function openSearch(to?: string, from?: string) {
    router.push({
      pathname: '/search',
      params: {
        from: from ?? defaultFrom,
        ...(to ? { to } : {}),
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>GOOD TO SEE YOU</Text>
            <Text style={styles.greeting}>Hi, {firstName(displayName)}</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push('/notifications')}
              style={styles.iconButton}>
              <Text style={styles.iconButtonText}>•</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/profile')} style={styles.avatar}>
              {loading ? (
                <ActivityIndicator color={GREEN} size="small" />
              ) : imageSource ? (
                <Image
                  source={imageSource}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarText}>
                  {session ? initials(displayName) : 'V'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroBrandRow}>
            <View style={styles.logoMark}>
              <View style={styles.logoCut} />
            </View>
            <Text style={styles.heroBrand}>Vaya</Text>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>GO FURTHER</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Where are you going?</Text>
          <Text style={styles.heroText}>
            Find a verified driver already heading your way.
          </Text>

          <Pressable onPress={() => openSearch()} style={styles.searchCard}>
            <View style={styles.searchRow}>
              <View style={styles.startDot} />
              <View style={styles.searchCopy}>
                <Text style={styles.searchLabel}>FROM</Text>
                <Text style={styles.searchValue} numberOfLines={1}>
                  {defaultFrom || 'Choose your departure'}
                </Text>
              </View>
            </View>

            <View style={styles.connector} />

            <View style={styles.searchRow}>
              <View style={styles.endDot} />
              <View style={styles.searchCopy}>
                <Text style={styles.searchLabel}>TO</Text>
                <Text style={styles.searchPlaceholder}>Where to?</Text>
              </View>
              <View style={styles.searchArrow}>
                <Text style={styles.searchArrowText}>→</Text>
              </View>
            </View>
          </Pressable>
        </View>

        {session ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your next ride</Text>
              <Pressable onPress={() => router.push('/trips')}>
                <Text style={styles.sectionAction}>My trips</Text>
              </Pressable>
            </View>

            {tripsLoading ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator color={GREEN} />
              </View>
            ) : nextTrip ? (
              <Pressable
                onPress={() =>
                  ['Boarding', 'On schedule'].includes(nextTrip.tripStatus)
                    ? router.push({
                        pathname: '/trip-progress/[id]',
                        params: { id: nextTrip.tripId },
                      })
                    : router.push('/trips')
                }
                style={styles.tripCard}>
                <View style={styles.tripAccent} />
                <View style={styles.tripTop}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateBadgeText}>
                      {shortDate(nextTrip.departureAt)}
                    </Text>
                  </View>
                  <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>{nextTrip.tripStatus}</Text>
                  </View>
                </View>

                <Text style={styles.tripRoute}>{nextTrip.route}</Text>
                <Text style={styles.tripDate}>
                  {formatTripDate(nextTrip.departureAt)}
                </Text>

                <View style={styles.tripDivider} />

                <View style={styles.tripBottom}>
                  <View style={styles.driverAvatar}>
                    <Text style={styles.driverAvatarText}>
                      {initials(nextTrip.driver)}
                    </Text>
                  </View>
                  <View style={styles.driverCopy}>
                    <Text style={styles.driverName}>{nextTrip.driver}</Text>
                    <Text style={styles.tripMeta}>
                      {nextTrip.seats} seat{nextTrip.seats === 1 ? '' : 's'} ·{' '}
                      {nextTrip.paymentStatus}
                    </Text>
                  </View>
                  <Text style={styles.tripAmount}>{nextTrip.amount}</Text>
                </View>
              </Pressable>
            ) : (
              <Pressable onPress={() => openSearch()} style={styles.emptyTrip}>
                <View style={styles.emptyTripIcon}>
                  <Text style={styles.emptyTripIconText}>↗</Text>
                </View>
                <View style={styles.emptyTripCopy}>
                  <Text style={styles.emptyTripTitle}>No trip booked yet</Text>
                  <Text style={styles.emptyTripText}>
                    Search live routes and reserve your seat.
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            )}
          </>
        ) : (
          <Pressable onPress={() => router.push('/auth')} style={styles.signInCard}>
            <View>
              <Text style={styles.signInTitle}>Your trips, in one place</Text>
              <Text style={styles.signInText}>
                Sign in to see bookings, payments and live trip tracking.
              </Text>
            </View>
            <Text style={styles.signInAction}>Sign in</Text>
          </Pressable>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Rides you can join</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          </View>
          <Pressable onPress={() => openSearch()}>
            <Text style={styles.sectionAction}>See all</Text>
          </Pressable>
        </View>

        {routesLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={GREEN} />
          </View>
        ) : suggestedRoutes.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.routeRail}>
            {suggestedRoutes.map((trip) => (
              <Pressable
                key={trip.id}
                onPress={() => openSearch(trip.to, trip.from)}
                style={styles.routeCard}>
                <View style={styles.routeVisual}>
                  <View style={styles.road} />
                  <View style={styles.routeStart} />
                  <View style={styles.routeEnd} />
                  <Text style={styles.routeDate}>
                    {shortDate(trip.departureAt)}
                  </Text>
                </View>

                <View style={styles.routeBody}>
                  <Text style={styles.routeFrom} numberOfLines={1}>
                    {trip.from}
                  </Text>
                  <View style={styles.routeDestinationRow}>
                    <Text style={styles.routeArrow}>→</Text>
                    <Text style={styles.routeTo} numberOfLines={1}>
                      {trip.to}
                    </Text>
                  </View>

                  <View style={styles.routeFooter}>
                    <View>
                      <Text style={styles.routeFare}>{trip.fare}</Text>
                      <Text style={styles.routeFareMeta}>per seat</Text>
                    </View>
                    <View style={styles.seatBadge}>
                      <Text style={styles.seatBadgeText}>
                        {trip.availableSeats} left
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noRoutes}>
            <Text style={styles.noRoutesTitle}>No live rides right now</Text>
            <Text style={styles.noRoutesText}>
              Published driver routes will appear here automatically.
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
        </View>

        <View style={styles.quickGrid}>
          <Pressable onPress={() => openSearch()} style={styles.quickCard}>
            <View style={[styles.quickIcon, styles.quickIconGreen]}>
              <Text style={styles.quickIconText}>⌕</Text>
            </View>
            <Text style={styles.quickTitle}>Find a ride</Text>
            <Text style={styles.quickText}>Search live routes</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/trips')} style={styles.quickCard}>
            <View style={[styles.quickIcon, styles.quickIconBlue]}>
              <Text style={styles.quickIconText}>◫</Text>
            </View>
            <Text style={styles.quickTitle}>My trips</Text>
            <Text style={styles.quickText}>Bookings and history</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => router.push('/explore')} style={styles.driverBanner}>
          <View style={styles.driverBannerIcon}>
            <Text style={styles.driverBannerIconText}>🚘</Text>
          </View>
          <View style={styles.driverBannerCopy}>
            <Text style={styles.driverBannerEyebrow}>DRIVING SOMEWHERE?</Text>
            <Text style={styles.driverBannerTitle}>Share your trip</Text>
            <Text style={styles.driverBannerText}>
              Publish your route and let verified passengers join you.
            </Text>
          </View>
          <View style={styles.driverBannerArrow}>
            <Text style={styles.driverBannerArrowText}>→</Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 118 },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: MUTED, fontSize: 7, fontWeight: '800', letterSpacing: 1.1 },
  greeting: { color: TEXT, fontSize: 20, fontWeight: '900', letterSpacing: -0.6, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  iconButton: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: LINE, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  iconButtonText: { color: GREEN, fontSize: 24, lineHeight: 19, marginTop: -9 },
  avatar: { width: 38, height: 38, borderRadius: 19, overflow: 'hidden', backgroundColor: MINT, borderWidth: 1, borderColor: '#D3EEE3', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: GREEN_DARK, fontSize: 10, fontWeight: '900' },

  hero: { marginTop: 10, borderRadius: 18, backgroundColor: FOREST, padding: 16 },
  heroBrandRow: { flexDirection: 'row', alignItems: 'center' },
  logoMark: { width: 20, height: 25, borderRadius: 10, backgroundColor: GREEN, transform: [{ rotate: '18deg' }], overflow: 'hidden' },
  logoCut: { position: 'absolute', left: 6, top: 5, width: 9, height: 9, borderRadius: 5, backgroundColor: FOREST },
  heroBrand: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: -0.4, marginLeft: 7 },
  heroBadge: { marginLeft: 'auto', borderRadius: 999, backgroundColor: '#0B4D44', paddingHorizontal: 8, paddingVertical: 5 },
  heroBadgeText: { color: '#B7EAD6', fontSize: 6, fontWeight: '900', letterSpacing: 0.8 },
  heroTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: -0.7, marginTop: 18 },
  heroText: { color: '#A9CCC1', fontSize: 8.5, marginTop: 4 },
  searchCard: { marginTop: 14, borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 11, paddingVertical: 8 },
  searchRow: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 9 },
  searchCopy: { flex: 1 },
  connector: { width: 1, height: 15, backgroundColor: '#CFE6DC', marginLeft: 3.5 },
  startDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  endDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: FOREST, backgroundColor: '#FFFFFF' },
  searchLabel: { color: '#98A2B3', fontSize: 6.2, fontWeight: '900', letterSpacing: 0.8 },
  searchValue: { color: TEXT, fontSize: 9.5, fontWeight: '900', marginTop: 2 },
  searchPlaceholder: { color: MUTED, fontSize: 9.5, fontWeight: '800', marginTop: 2 },
  searchArrow: { width: 29, height: 29, borderRadius: 9, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  searchArrowText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },

  sectionHeader: { minHeight: 38, marginTop: 13, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle: { color: TEXT, fontSize: 12, fontWeight: '900', letterSpacing: -0.2 },
  sectionAction: { color: GREEN_DARK, fontSize: 7.5, fontWeight: '900' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, backgroundColor: '#ECFDF3', paddingHorizontal: 7, paddingVertical: 4 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: GREEN },
  liveBadgeText: { color: GREEN_DARK, fontSize: 5.8, fontWeight: '900', letterSpacing: 0.6 },
  loadingBlock: { minHeight: 92, alignItems: 'center', justifyContent: 'center' },

  tripCard: { position: 'relative', overflow: 'hidden', borderRadius: 14, borderWidth: 1, borderColor: LINE, backgroundColor: SURFACE, padding: 12 },
  tripAccent: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, backgroundColor: GREEN },
  tripTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 3 },
  dateBadge: { borderRadius: 999, backgroundColor: '#F2F4F7', paddingHorizontal: 8, paddingVertical: 5 },
  dateBadgeText: { color: TEXT, fontSize: 6.8, fontWeight: '900' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: GREEN },
  statusText: { color: MUTED, fontSize: 6.8, fontWeight: '800' },
  tripRoute: { color: TEXT, fontSize: 11, fontWeight: '900', marginTop: 13, paddingLeft: 3 },
  tripDate: { color: MUTED, fontSize: 7.2, marginTop: 3, paddingLeft: 3 },
  tripDivider: { height: 1, backgroundColor: LINE, marginTop: 12 },
  tripBottom: { paddingTop: 10, paddingLeft: 3, flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: MINT, alignItems: 'center', justifyContent: 'center' },
  driverAvatarText: { color: GREEN_DARK, fontSize: 7.5, fontWeight: '900' },
  driverCopy: { flex: 1, marginLeft: 8 },
  driverName: { color: TEXT, fontSize: 8.5, fontWeight: '900' },
  tripMeta: { color: MUTED, fontSize: 6.8, marginTop: 2 },
  tripAmount: { color: TEXT, fontSize: 10, fontWeight: '900' },

  emptyTrip: { minHeight: 72, borderRadius: 13, borderWidth: 1, borderColor: LINE, backgroundColor: SURFACE, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center' },
  emptyTripIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: MINT, alignItems: 'center', justifyContent: 'center' },
  emptyTripIconText: { color: GREEN_DARK, fontSize: 16, fontWeight: '900' },
  emptyTripCopy: { flex: 1, marginLeft: 9 },
  emptyTripTitle: { color: TEXT, fontSize: 9, fontWeight: '900' },
  emptyTripText: { color: MUTED, fontSize: 7, marginTop: 2 },
  chevron: { color: '#98A2B3', fontSize: 20 },

  signInCard: { marginTop: 15, borderRadius: 13, borderWidth: 1, borderColor: '#D3EEE3', backgroundColor: MINT, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  signInTitle: { color: TEXT, fontSize: 9.5, fontWeight: '900' },
  signInText: { color: MUTED, fontSize: 7, lineHeight: 11, marginTop: 3, maxWidth: 235 },
  signInAction: { marginLeft: 'auto', color: GREEN_DARK, fontSize: 7.5, fontWeight: '900' },

  routeRail: { gap: 10, paddingRight: 16 },
  routeCard: { width: 196, borderRadius: 14, borderWidth: 1, borderColor: LINE, backgroundColor: SURFACE, overflow: 'hidden' },
  routeVisual: { height: 82, backgroundColor: '#EAF2ED', position: 'relative', overflow: 'hidden' },
  road: { position: 'absolute', left: -12, right: -12, top: 41, height: 16, borderRadius: 10, backgroundColor: '#D5E4DC', transform: [{ rotate: '-7deg' }] },
  routeStart: { position: 'absolute', left: 24, top: 27, width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN, borderWidth: 2, borderColor: '#FFFFFF' },
  routeEnd: { position: 'absolute', right: 28, bottom: 18, width: 10, height: 10, borderRadius: 5, backgroundColor: FOREST, borderWidth: 2, borderColor: '#FFFFFF' },
  routeDate: { position: 'absolute', right: 8, top: 8, color: TEXT, fontSize: 6.5, fontWeight: '900', backgroundColor: 'rgba(255,255,255,.92)', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4 },
  routeBody: { padding: 10 },
  routeFrom: { color: MUTED, fontSize: 7, fontWeight: '700' },
  routeDestinationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  routeArrow: { color: GREEN, fontSize: 10, fontWeight: '900' },
  routeTo: { flex: 1, color: TEXT, fontSize: 10, fontWeight: '900' },
  routeFooter: { marginTop: 10, paddingTop: 9, borderTopWidth: 1, borderTopColor: LINE, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  routeFare: { color: TEXT, fontSize: 10, fontWeight: '900' },
  routeFareMeta: { color: MUTED, fontSize: 6.2, marginTop: 1 },
  seatBadge: { borderRadius: 999, backgroundColor: '#ECFDF3', paddingHorizontal: 7, paddingVertical: 4 },
  seatBadgeText: { color: GREEN_DARK, fontSize: 6.2, fontWeight: '900' },

  noRoutes: { minHeight: 88, borderRadius: 13, borderWidth: 1, borderColor: LINE, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  noRoutesTitle: { color: TEXT, fontSize: 9.5, fontWeight: '900' },
  noRoutesText: { color: MUTED, fontSize: 7, textAlign: 'center', marginTop: 3 },

  quickGrid: { flexDirection: 'row', gap: 9 },
  quickCard: { flex: 1, minHeight: 100, borderRadius: 13, borderWidth: 1, borderColor: LINE, backgroundColor: SURFACE, padding: 11 },
  quickIcon: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickIconGreen: { backgroundColor: MINT },
  quickIconBlue: { backgroundColor: '#EEF4FF' },
  quickIconText: { color: TEXT, fontSize: 14, fontWeight: '900' },
  quickTitle: { color: TEXT, fontSize: 8.8, fontWeight: '900', marginTop: 9 },
  quickText: { color: MUTED, fontSize: 6.8, marginTop: 2 },

  driverBanner: { marginTop: 16, borderRadius: 14, backgroundColor: '#F0F8F4', borderWidth: 1, borderColor: '#D9EEE5', padding: 12, flexDirection: 'row', alignItems: 'center' },
  driverBannerIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  driverBannerIconText: { fontSize: 19 },
  driverBannerCopy: { flex: 1, marginLeft: 10 },
  driverBannerEyebrow: { color: GREEN_DARK, fontSize: 6, fontWeight: '900', letterSpacing: 0.8 },
  driverBannerTitle: { color: TEXT, fontSize: 10, fontWeight: '900', marginTop: 2 },
  driverBannerText: { color: MUTED, fontSize: 7, lineHeight: 11, marginTop: 2 },
  driverBannerArrow: { width: 30, height: 30, borderRadius: 10, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  driverBannerArrowText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});
