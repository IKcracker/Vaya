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

import { API_URL, getTrip, PublicTrip } from '@/lib/api';

const BLUE = '#10B981';
const BG = '#F6F8F7';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

function formatDeparture(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat('en-ZA', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export default function TripDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; passengers?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const passengers = Math.max(
    1,
    Number(typeof params.passengers === 'string' ? params.passengers : '1') || 1
  );

  const [trip, setTrip] = useState<PublicTrip | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(
    id ? null : 'Trip reference is missing.'
  );

  useEffect(() => {
    if (!id) return;

    let active = true;

    getTrip(id)
      .then((response) => {
        if (active) setTrip(response.trip);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : 'Unable to load this trip'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const total = useMemo(() => {
    if (!trip) return 'R0';
    return `R${((trip.fareCents * passengers) / 100).toFixed(
      trip.fareCents % 100 === 0 ? 0 : 2
    )}`;
  }, [passengers, trip]);

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
            <Text style={styles.eyebrow}>TRIP DETAILS</Text>
            <Text style={styles.headerTitle}>{id}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={BLUE} />
            <Text style={styles.stateTitle}>Loading trip details</Text>
          </View>
        ) : error || !trip ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Couldn’t load this trip</Text>
            <Text style={styles.errorText}>{error ?? 'Trip not found.'}</Text>
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <View style={styles.heroTop}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{trip.status}</Text>
                </View>
                <Text style={styles.reference}>{trip.id}</Text>
              </View>
              <Text style={styles.route}>{trip.from} → {trip.to}</Text>
              <Text style={styles.departure}>{formatDeparture(trip.departureAt)}</Text>

              <View style={styles.priceStrip}>
                <View>
                  <Text style={styles.metricLabel}>Fare per seat</Text>
                  <Text style={styles.metricValue}>{trip.fare}</Text>
                </View>
                <View>
                  <Text style={styles.metricLabel}>Passengers</Text>
                  <Text style={styles.metricValue}>{passengers}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.metricLabel}>Total</Text>
                  <Text style={styles.metricValue}>{total}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Driver</Text>
              <View style={styles.driverCard}>
                <View style={styles.avatar}>
                  {trip.driver.profileImageUrl ? (
                    <Image
                      source={{ uri: `${API_URL}${trip.driver.profileImageUrl}` }}
                      style={styles.avatarImage}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={styles.avatarText}>
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
                      : 'Verification pending'}
                  </Text>
                </View>
              </View>

              <View style={styles.verificationRow}>
                <View style={styles.verifyItem}><Text style={styles.verifyIcon}>✓</Text><Text style={styles.verifyText}>Identity</Text></View>
                <View style={styles.verifyItem}><Text style={styles.verifyIcon}>✓</Text><Text style={styles.verifyText}>Licence</Text></View>
                <View style={styles.verifyItem}><Text style={styles.verifyIcon}>✓</Text><Text style={styles.verifyText}>Vehicle</Text></View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trip information</Text>
              <View style={styles.infoList}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Departure</Text>
                  <Text style={styles.infoValue}>{formatDeparture(trip.departureAt)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Vehicle</Text>
                  <Text style={styles.infoValue}>{trip.driver.vehicle}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Seats remaining</Text>
                  <Text style={styles.infoValue}>{trip.availableSeats} of {trip.seatCapacity}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Driver area</Text>
                  <Text style={styles.infoValue}>{trip.driver.location || 'Not provided'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.safety}>
              <Text style={styles.safetyTitle}>Before you book</Text>
              <Text style={styles.safetyText}>
                Vaya rechecks seat availability when the booking is created.
                Your booking starts in Awaiting payment until the payment flow
                is completed.
              </Text>
            </View>

            <Pressable
              disabled={trip.availableSeats < passengers}
              onPress={() =>
                router.push({
                  pathname: '/booking/[id]',
                  params: { id: trip.id, seats: String(passengers) },
                })
              }
              style={({ pressed }) => [
                styles.primary,
                trip.availableSeats < passengers && styles.primaryDisabled,
                pressed && trip.availableSeats >= passengers && styles.pressed,
              ]}>
              <Text style={styles.primaryText}>
                {trip.availableSeats < passengers
                  ? 'Not enough seats available'
                  : `Continue · ${total}`}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 40 },
  pressed: { opacity: 0.72 },
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
  headerTitle: { color: TEXT, fontSize: 18, fontWeight: '900', marginTop: 3 },
  stateCard: {
    marginTop: 24,
    minHeight: 220,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: { color: TEXT, fontSize: 14, fontWeight: '900', marginTop: 12 },
  errorCard: {
    marginTop: 24,
    backgroundColor: '#FFF8F7',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 18,
  },
  errorTitle: { color: '#B42318', fontSize: 14, fontWeight: '900' },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16, marginTop: 5 },
  hero: { marginTop: 18, backgroundColor: SURFACE, borderRadius: 15, borderWidth: 1, borderColor: '#DFE6E3', padding: 14 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reference: { color: MUTED, fontSize: 8.5, fontWeight: '700' },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF3',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusText: { color: '#027A48', fontSize: 8, fontWeight: '900' },
  route: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 16,
  },
  departure: { color: MUTED, fontSize: 9.5, marginTop: 5 },
  priceStrip: { marginTop: 13, paddingTop: 11, borderTopWidth: 1, borderTopColor: LINE, flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { color: MUTED, fontSize: 8, fontWeight: '700' },
  metricValue: { color: TEXT, fontSize: 12, fontWeight: '900', marginTop: 3 },
  section: { marginTop: 24 },
  sectionTitle: { color: TEXT, fontSize: 14, fontWeight: '900', marginBottom: 8 },
  driverCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#E9F9F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: BLUE, fontSize: 11, fontWeight: '900' },
  driverNameRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  driverName: { color: TEXT, fontSize: 13, fontWeight: '900' },
  driverMeta: { color: MUTED, fontSize: 9, marginTop: 4 },
  verified: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  verificationRow: { marginTop: 10, flexDirection: 'row', gap: 7 },
  verifyItem: { flex: 1, minHeight: 40, borderRadius: 10, backgroundColor: '#ECFDF3', alignItems: 'center', justifyContent: 'center' },
  verifyIcon: { color: '#027A48', fontSize: 10, fontWeight: '900' },
  verifyText: { color: '#027A48', fontSize: 7.5, fontWeight: '800', marginTop: 2 },
  infoList: { backgroundColor: SURFACE, borderWidth: 1, borderColor: '#DFE6E3', borderRadius: 14, overflow: 'hidden' },
  infoRow: { minHeight: 54, paddingHorizontal: 13, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: LINE },
  infoLabel: { color: MUTED, fontSize: 8, fontWeight: '700' },
  infoValue: { color: TEXT, fontSize: 10, fontWeight: '900', marginTop: 3 },
  safety: {
    marginTop: 18,
    borderRadius: 15,
    backgroundColor: '#E9F9F3',
    padding: 14,
  },
  safetyTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  safetyText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
  primary: {
    marginTop: 16,
    height: 46,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: { backgroundColor: '#B7D5FA' },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
});
