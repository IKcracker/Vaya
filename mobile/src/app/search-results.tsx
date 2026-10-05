import { Image } from 'expo-image';
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

import { API_URL, PublicTrip, searchTrips } from '@/lib/api';

const BLUE = '#1877F2';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

function formatDeparture(value: string) {
  const date = new Date(value);

  return {
    date: new Intl.DateTimeFormat('en-ZA', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }).format(date),
    time: new Intl.DateTimeFormat('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date),
  };
}

export default function SearchResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    from?: string;
    to?: string;
    date?: string;
    passengers?: string;
  }>();

  const from = typeof params.from === 'string' ? params.from : '';
  const to = typeof params.to === 'string' ? params.to : '';
  const date = typeof params.date === 'string' ? params.date : '';
  const passengers = Math.max(
    1,
    Number(typeof params.passengers === 'string' ? params.passengers : '1') || 1
  );

  const [trips, setTrips] = useState<PublicTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchSummary = useMemo(() => {
    if (!date) return 'Any upcoming date';

    return new Intl.DateTimeFormat('en-ZA', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }).format(new Date(`${date}T12:00:00`));
  }, [date]);

  useEffect(() => {
    let active = true;

    searchTrips({ from, to, date, passengers })
      .then((response) => {
        if (active) {
          setTrips(response.trips);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : 'Unable to search rides'
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [date, from, passengers, to]);

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
            <Text style={styles.eyebrow}>AVAILABLE RIDES</Text>
            <Text style={styles.title}>
              {from || 'Anywhere'} → {to || 'Anywhere'}
            </Text>
          </View>
        </View>

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryValue}>{searchSummary}</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Passengers</Text>
            <Text style={styles.summaryValue}>{passengers}</Text>
          </View>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/search',
                params: { from, to },
              })
            }
            style={({ pressed }) => [styles.modify, pressed && styles.pressed]}>
            <Text style={styles.modifyText}>Modify</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={BLUE} />
            <Text style={styles.stateTitle}>Finding available rides</Text>
            <Text style={styles.stateText}>
              Checking live routes and seat availability.
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Couldn’t load rides</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={() => router.replace('/search')}
              style={({ pressed }) => [
                styles.errorButton,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.errorButtonText}>Back to search</Text>
            </Pressable>
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>↗</Text>
            </View>
            <Text style={styles.stateTitle}>No rides match this search</Text>
            <Text style={styles.stateText}>
              Try another date, nearby city or a smaller passenger count.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>
                {trips.length} ride{trips.length === 1 ? '' : 's'} found
              </Text>
              <Text style={styles.resultSort}>Soonest first</Text>
            </View>

            {trips.map((trip) => {
              const departure = formatDeparture(trip.departureAt);

              return (
                <Pressable
                  key={trip.id}
                  onPress={() =>
                    router.push({
                      pathname: '/trip/[id]',
                      params: {
                        id: trip.id,
                        passengers: String(passengers),
                      },
                    })
                  }
                  style={({ pressed }) => [
                    styles.rideCard,
                    pressed && styles.cardPressed,
                  ]}>
                  <View style={styles.rideTop}>
                    <View style={styles.driverAvatar}>
                      {trip.driver.profileImageUrl ? (
                        <Image
                          source={{ uri: `${API_URL}${trip.driver.profileImageUrl}` }}
                          style={styles.driverAvatarImage}
                          contentFit="cover"
                        />
                      ) : (
                        <Text style={styles.driverAvatarText}>
                          {trip.driver.name
                            .split(' ')
                            .map((value) => value[0])
                            .join('')
                            .slice(0, 2)}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.driverNameRow}>
                        <Text style={styles.driverName}>{trip.driver.name}</Text>
                        {trip.driver.verified ? (
                          <View style={styles.verified}>
                            <Text style={styles.verifiedText}>✓</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.driverMeta}>
                        {trip.driver.verified
                          ? 'Verified Vaya driver'
                          : 'Driver verification in progress'}
                      </Text>
                    </View>
                    <View style={styles.priceBox}>
                      <Text style={styles.price}>{trip.fare}</Text>
                      <Text style={styles.priceMeta}>per seat</Text>
                    </View>
                  </View>

                  <View style={styles.routeLine}>
                    <View>
                      <Text style={styles.time}>{departure.time}</Text>
                      <Text style={styles.place}>{trip.from}</Text>
                    </View>
                    <View style={styles.routeTrack}>
                      <View style={styles.dot} />
                      <View style={styles.track} />
                      <View style={[styles.dot, { backgroundColor: BLUE }]} />
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.time}>{departure.date}</Text>
                      <Text style={styles.place}>{trip.to}</Text>
                    </View>
                  </View>

                  <View style={styles.tags}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{trip.driver.vehicle}</Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>
                        {trip.availableSeats} seat
                        {trip.availableSeats === 1 ? '' : 's'} left
                      </Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{trip.status}</Text>
                    </View>
                  </View>

                  <View style={styles.pickupRow}>
                    <View>
                      <Text style={styles.pickupLabel}>Trip reference</Text>
                      <Text style={styles.pickupValue}>{trip.id}</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </Pressable>
              );
            })}

            <View style={styles.tip}>
              <Text style={styles.tipTitle}>Availability is live</Text>
              <Text style={styles.tipText}>
                Vaya checks remaining seats again when you confirm a booking, so
                a trip can become unavailable if another passenger books first.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 40 },
  pressed: { opacity: 0.7 },
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
  title: {
    color: TEXT,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 3,
    letterSpacing: -0.3,
  },
  summary: {
    marginTop: 18,
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LINE,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: { color: MUTED, fontSize: 9, fontWeight: '700' },
  summaryValue: { color: TEXT, fontSize: 11, fontWeight: '900', marginTop: 3 },
  modify: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: '#E7F3FF',
  },
  modifyText: { color: BLUE, fontSize: 10, fontWeight: '900' },
  resultHeader: {
    marginTop: 24,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultTitle: { color: TEXT, fontSize: 16, fontWeight: '900' },
  resultSort: { color: MUTED, fontSize: 10, fontWeight: '800' },
  stateCard: {
    marginTop: 24,
    minHeight: 210,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 18,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  stateTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 14,
    textAlign: 'center',
  },
  stateText: {
    color: MUTED,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E7F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconText: { color: BLUE, fontSize: 18, fontWeight: '900' },
  errorCard: {
    marginTop: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF8F7',
    padding: 20,
  },
  errorTitle: { color: '#B42318', fontSize: 15, fontWeight: '900' },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16, marginTop: 5 },
  errorButton: {
    marginTop: 14,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#B42318',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  rideCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
  },
  cardPressed: { opacity: 0.78, transform: [{ scale: 0.995 }] },
  rideTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  driverAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E7F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  driverAvatarImage: { width: '100%', height: '100%' },
  driverAvatarText: { color: BLUE, fontSize: 11, fontWeight: '900' },
  driverNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  driverName: { color: TEXT, fontSize: 13, fontWeight: '900' },
  verified: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  driverMeta: { color: MUTED, fontSize: 9, marginTop: 4 },
  priceBox: { alignItems: 'flex-end' },
  price: { color: TEXT, fontSize: 17, fontWeight: '900' },
  priceMeta: { color: MUTED, fontSize: 8, marginTop: 2 },
  routeLine: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: { color: TEXT, fontSize: 11, fontWeight: '900' },
  place: { color: MUTED, fontSize: 9, marginTop: 3, maxWidth: 95 },
  routeTrack: {
    flex: 1,
    marginHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#98A2B3' },
  track: { height: 1, backgroundColor: '#D0D5DD', flex: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16 },
  tag: {
    backgroundColor: '#F2F4F7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: { color: '#475467', fontSize: 9, fontWeight: '800' },
  pickupRow: {
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: LINE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickupLabel: { color: MUTED, fontSize: 9, fontWeight: '700' },
  pickupValue: { color: TEXT, fontSize: 11, fontWeight: '900', marginTop: 3 },
  chevron: { color: '#98A2B3', fontSize: 23 },
  tip: { marginTop: 10, backgroundColor: '#EEF5FF', borderRadius: 15, padding: 14 },
  tipTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  tipText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
});
