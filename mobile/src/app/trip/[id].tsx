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

import { getTrip, PublicTrip } from '@/lib/api';

const BLUE = '#1877F2';
const NAVY = '#0B1730';
const BG = '#F5F7FA';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Trip reference is missing.');
      setLoading(false);
      return;
    }

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
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{trip.status}</Text>
              </View>
              <Text style={styles.route}>
                {trip.from} → {trip.to}
              </Text>
              <Text style={styles.departure}>
                {formatDeparture(trip.departureAt)}
              </Text>

              <View style={styles.heroDivider} />

              <View style={styles.heroMetrics}>
                <View>
                  <Text style={styles.metricLabel}>Per seat</Text>
                  <Text style={styles.metricValue}>{trip.fare}</Text>
                </View>
                <View>
                  <Text style={styles.metricLabel}>Passengers</Text>
                  <Text style={styles.metricValue}>{passengers}</Text>
                </View>
                <View>
                  <Text style={styles.metricLabel}>Trip total</Text>
                  <Text style={styles.metricValue}>{total}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Driver & vehicle</Text>
              <View style={styles.driverCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {trip.driver.name
                      .split(' ')
                      .map((value) => value[0])
                      .join('')
                      .slice(0, 2)}
                  </Text>
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

              <View style={styles.infoGrid}>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Vehicle</Text>
                  <Text style={styles.infoValue}>{trip.driver.vehicle}</Text>
                </View>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Driver area</Text>
                  <Text style={styles.infoValue}>
                    {trip.driver.location || 'Not provided'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Availability</Text>
              <View style={styles.availabilityCard}>
                <View>
                  <Text style={styles.infoLabel}>Seats remaining</Text>
                  <Text style={styles.availabilityValue}>
                    {trip.availableSeats}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.infoLabel}>Capacity</Text>
                  <Text style={styles.availabilitySub}>
                    {trip.seatsBooked}/{trip.seatCapacity} booked
                  </Text>
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
  hero: { marginTop: 22, backgroundColor: NAVY, borderRadius: 20, padding: 18 },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1C2D49',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusText: { color: '#A9CFFF', fontSize: 9, fontWeight: '900' },
  route: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 16,
  },
  departure: { color: '#A9B6CA', fontSize: 11, marginTop: 6 },
  heroDivider: { height: 1, backgroundColor: '#263955', marginVertical: 17 },
  heroMetrics: { flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { color: '#8FA0B8', fontSize: 9, fontWeight: '700' },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 4,
  },
  section: { marginTop: 24 },
  sectionTitle: { color: TEXT, fontSize: 17, fontWeight: '900', marginBottom: 10 },
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
    backgroundColor: '#E7F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  infoGrid: { flexDirection: 'row', gap: 10, marginTop: 10 },
  infoCard: {
    flex: 1,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 14,
    padding: 13,
  },
  infoLabel: { color: MUTED, fontSize: 9, fontWeight: '700' },
  infoValue: { color: TEXT, fontSize: 11, fontWeight: '900', marginTop: 5 },
  availabilityCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  availabilityValue: { color: BLUE, fontSize: 24, fontWeight: '900', marginTop: 4 },
  availabilitySub: { color: TEXT, fontSize: 11, fontWeight: '900', marginTop: 6 },
  safety: {
    marginTop: 24,
    borderRadius: 15,
    backgroundColor: '#EEF5FF',
    padding: 14,
  },
  safetyTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  safetyText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
  primary: {
    marginTop: 18,
    height: 50,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: { backgroundColor: '#B7D5FA' },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
});
