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

import { RouteMapThumbnail } from '@/components/route-map';
import { fetchPassengerTrips, PassengerTrip } from '@/lib/auth';
import {
  API_URL,
  getRoutePreview,
  PublicTrip,
  RoutePreview,
  searchTrips,
} from '@/lib/api';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN = '#16B364';
const GREEN_DARK = '#087F5B';
const BG = '#FFFFFF';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';
const SOFT = '#F7F9F8';
const MINT = '#ECFDF3';

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
  const [available, setAvailable] = useState<PublicTrip[]>([]);
  const [routePreviews, setRoutePreviews] = useState<Record<string, RoutePreview>>({});
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
      .slice(0, 4);
  }, [available, passenger?.city]);

  const suggestedSignature = suggestedRoutes
    .map((trip) => `${trip.id}:${trip.from}:${trip.to}`)
    .join('|');

  useEffect(() => {
    if (!suggestedRoutes.length) return;

    let active = true;

    void Promise.all(
      suggestedRoutes.map(async (trip) => {
        const response = await getRoutePreview(trip.from, trip.to).catch(() => ({
          route: null,
        }));

        return [trip.id, response.route] as const;
      })
    ).then((entries) => {
      if (!active) return;

      setRoutePreviews(
        Object.fromEntries(
          entries.filter(
            (entry): entry is readonly [string, RoutePreview] => Boolean(entry[1])
          )
        )
      );
    });

    return () => {
      active = false;
    };
  }, [suggestedSignature]);

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
        <View style={styles.topbar}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <View style={styles.logoCut} />
            </View>
            <Text style={styles.brand}>Vaya</Text>
          </View>

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

        <Text style={styles.heading}>Where would you like to go?</Text>
        <Text style={styles.subheading}>
          Find a verified ride heading your way.
        </Text>

        <View style={styles.searchCard}>
          <Pressable onPress={() => openSearch()} style={styles.searchRow}>
            <View style={styles.startDot} />
            <View style={styles.searchCopy}>
              <Text style={styles.searchLabel}>From</Text>
              <Text style={styles.searchValue} numberOfLines={1}>
                {defaultFrom || 'Choose your starting point'}
              </Text>
            </View>
          </Pressable>

          <View style={styles.connector}>
            <View style={styles.connectorLine} />
          </View>

          <Pressable onPress={() => openSearch()} style={styles.searchRow}>
            <View style={styles.endDot} />
            <View style={styles.searchCopy}>
              <Text style={styles.searchLabel}>To</Text>
              <Text style={styles.searchPlaceholder}>Enter destination</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable onPress={() => openSearch()} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Search rides</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available routes</Text>
          <Pressable onPress={() => openSearch()}>
            <Text style={styles.sectionAction}>See all</Text>
          </Pressable>
        </View>

        {routesLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={GREEN} />
          </View>
        ) : suggestedRoutes.length ? (
          <View style={styles.routeGrid}>
            {suggestedRoutes.map((trip) => {
              const preview = routePreviews[trip.id];

              return (
                <Pressable
                  key={trip.id}
                  onPress={() => openSearch(trip.to, trip.from)}
                  style={styles.routeCard}>
                  {preview ? (
                    <RouteMapThumbnail route={preview} height={90} />
                  ) : (
                    <View style={styles.routePlaceholder}>
                      <View style={styles.routePlaceholderLine} />
                      <View style={styles.routePlaceholderStart} />
                      <View style={styles.routePlaceholderEnd} />
                    </View>
                  )}

                  <View style={styles.routeBody}>
                    <Text style={styles.routeFrom} numberOfLines={1}>
                      {trip.from}
                    </Text>
                    <Text style={styles.routeTo} numberOfLines={1}>
                      {trip.to}
                    </Text>

                    <View style={styles.routeMetaRow}>
                      <Text style={styles.routeMeta}>
                        {trip.availableSeats} seat
                        {trip.availableSeats === 1 ? '' : 's'} left
                      </Text>
                      <Text style={styles.routeFare}>{trip.fare}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No routes available yet</Text>
            <Text style={styles.emptyText}>
              New driver trips will appear here automatically.
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Next trip</Text>
          {session ? (
            <Pressable onPress={() => router.push('/trips')}>
              <Text style={styles.sectionAction}>My trips</Text>
            </Pressable>
          ) : null}
        </View>

        {!session ? (
          <Pressable onPress={() => router.push('/auth')} style={styles.signInCard}>
            <View style={styles.signInIcon}>
              <Text style={styles.signInIconText}>V</Text>
            </View>
            <View style={styles.signInCopy}>
              <Text style={styles.signInTitle}>Sign in to see your trips</Text>
              <Text style={styles.signInText}>
                Bookings and live trip updates will appear here.
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ) : tripsLoading ? (
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
            <View style={styles.tripTop}>
              <View>
                <Text style={styles.tripRoute}>{nextTrip.route}</Text>
                <Text style={styles.tripDate}>
                  {formatTripDate(nextTrip.departureAt)}
                </Text>
              </View>
              <Text style={styles.tripAmount}>{nextTrip.amount}</Text>
            </View>

            <View style={styles.tripDivider} />

            <View style={styles.tripBottom}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverAvatarText}>
                  {initials(nextTrip.driver)}
                </Text>
              </View>
              <View style={styles.tripDriverCopy}>
                <Text style={styles.driverName}>{nextTrip.driver}</Text>
                <Text style={styles.tripMeta}>
                  {nextTrip.tripStatus} · {nextTrip.paymentStatus}
                </Text>
              </View>
              <View style={styles.tripArrow}>
                <Text style={styles.tripArrowText}>›</Text>
              </View>
            </View>
          </Pressable>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No upcoming trip</Text>
            <Text style={styles.emptyText}>
              Search for a ride and reserve your next seat.
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => router.push('/explore')}
          style={styles.driverBanner}>
          <View style={styles.driverIcon}>
            <Text style={styles.driverIconText}>🚘</Text>
          </View>
          <View style={styles.driverCopy}>
            <Text style={styles.driverEyebrow}>DRIVING SOMEWHERE?</Text>
            <Text style={styles.driverTitle}>Publish your trip</Text>
            <Text style={styles.driverText}>
              Share your route with passengers going your way.
            </Text>
          </View>
          <Text style={styles.driverArrow}>›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 110 },

  topbar: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoMark: {
    width: 18,
    height: 23,
    borderRadius: 9,
    backgroundColor: GREEN,
    transform: [{ rotate: '18deg' }],
    overflow: 'hidden',
  },
  logoCut: {
    position: 'absolute',
    left: 5.5,
    top: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#063C35',
  },
  brand: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: MINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: GREEN_DARK, fontSize: 8.5, fontWeight: '900' },

  heading: {
    color: TEXT,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginTop: 14,
  },
  subheading: {
    color: MUTED,
    fontSize: 8,
    marginTop: 3,
  },

  searchCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    backgroundColor: SURFACE,
    padding: 10,
  },
  searchRow: {
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  searchCopy: { flex: 1 },
  searchLabel: { color: MUTED, fontSize: 6.8 },
  searchValue: {
    color: TEXT,
    fontSize: 9.5,
    fontWeight: '900',
    marginTop: 2,
  },
  searchPlaceholder: {
    color: '#98A2B3',
    fontSize: 9.5,
    fontWeight: '800',
    marginTop: 2,
  },
  startDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GREEN,
  },
  endDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#667085',
  },
  connector: { height: 8, marginLeft: 3.5 },
  connectorLine: {
    width: 1,
    height: 10,
    backgroundColor: '#D0D5DD',
  },
  chevron: { color: '#98A2B3', fontSize: 18 },
  searchButton: {
    height: 39,
    borderRadius: 8,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },

  sectionHeader: {
    marginTop: 18,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 11.5,
    fontWeight: '900',
  },
  sectionAction: {
    color: GREEN_DARK,
    fontSize: 7.5,
    fontWeight: '900',
  },
  loadingBlock: {
    minHeight: 95,
    alignItems: 'center',
    justifyContent: 'center',
  },

  routeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  routeCard: {
    width: '48.7%',
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 11,
    backgroundColor: SURFACE,
    overflow: 'hidden',
  },
  routePlaceholder: {
    height: 90,
    backgroundColor: '#EAF2ED',
    position: 'relative',
    overflow: 'hidden',
  },
  routePlaceholderLine: {
    position: 'absolute',
    left: -10,
    right: -10,
    top: 43,
    height: 3,
    backgroundColor: '#B9D7CA',
    transform: [{ rotate: '-8deg' }],
  },
  routePlaceholderStart: {
    position: 'absolute',
    left: 20,
    top: 30,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  routePlaceholderEnd: {
    position: 'absolute',
    right: 22,
    bottom: 24,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#063C35',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  routeBody: { padding: 9 },
  routeFrom: { color: MUTED, fontSize: 6.8 },
  routeTo: {
    color: TEXT,
    fontSize: 9.2,
    fontWeight: '900',
    marginTop: 2,
  },
  routeMetaRow: {
    marginTop: 8,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: LINE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  routeMeta: { color: MUTED, fontSize: 6.2, flex: 1 },
  routeFare: { color: TEXT, fontSize: 8.5, fontWeight: '900' },

  tripCard: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 11,
    backgroundColor: SURFACE,
    padding: 10,
  },
  tripTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  tripRoute: { color: TEXT, fontSize: 10, fontWeight: '900' },
  tripDate: { color: MUTED, fontSize: 7.2, marginTop: 3 },
  tripAmount: { color: TEXT, fontSize: 9.5, fontWeight: '900' },
  tripDivider: { height: 1, backgroundColor: LINE, marginTop: 10 },
  tripBottom: {
    paddingTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: MINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarText: {
    color: GREEN_DARK,
    fontSize: 7,
    fontWeight: '900',
  },
  tripDriverCopy: { flex: 1, marginLeft: 8 },
  driverName: { color: TEXT, fontSize: 8.5, fontWeight: '900' },
  tripMeta: { color: MUTED, fontSize: 6.8, marginTop: 2 },
  tripArrow: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripArrowText: { color: '#667085', fontSize: 17 },

  emptyCard: {
    minHeight: 82,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 11,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  emptyTitle: { color: TEXT, fontSize: 9.2, fontWeight: '900' },
  emptyText: {
    color: MUTED,
    fontSize: 7,
    textAlign: 'center',
    marginTop: 3,
  },

  signInCard: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 11,
    backgroundColor: SURFACE,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  signInIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: MINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInIconText: { color: GREEN_DARK, fontSize: 10, fontWeight: '900' },
  signInCopy: { flex: 1, marginLeft: 8 },
  signInTitle: { color: TEXT, fontSize: 8.5, fontWeight: '900' },
  signInText: { color: MUTED, fontSize: 6.8, marginTop: 2 },

  driverBanner: {
    marginTop: 18,
    borderRadius: 11,
    backgroundColor: '#F2FAF6',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverIconText: { fontSize: 17 },
  driverCopy: { flex: 1, marginLeft: 9 },
  driverEyebrow: {
    color: GREEN_DARK,
    fontSize: 5.8,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  driverTitle: {
    color: TEXT,
    fontSize: 9.2,
    fontWeight: '900',
    marginTop: 2,
  },
  driverText: {
    color: MUTED,
    fontSize: 6.8,
    marginTop: 2,
  },
  driverArrow: {
    color: GREEN_DARK,
    fontSize: 19,
    marginLeft: 6,
  },
});
