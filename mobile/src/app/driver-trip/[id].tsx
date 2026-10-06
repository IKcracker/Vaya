import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RouteMap, RouteMapFallback } from '@/components/route-map';
import {
  fetchMobileDriver,
  MobileDriverTrip,
  stopDriverLiveLocation,
  updateDriverLiveLocation,
  updateDriverTripStatus,
} from '@/lib/auth';
import { getRoutePreview, RoutePreview } from '@/lib/api';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#10B981';
const BG = '#F6F8F7';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

function formatDeparture(value: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export default function DriverTripScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const { loading: authLoading, session } = usePassengerAuth();

  const [trip, setTrip] = useState<MobileDriverTrip | null>(null);
  const [route, setRoute] = useState<RoutePreview | null>(null);
  const [routeMessage, setRouteMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(session && id));
  const [saving, setSaving] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [trackingMessage, setTrackingMessage] = useState<string | null>(null);
  const [liveLocation, setLiveLocation] = useState<{
    latitude: number;
    longitude: number;
    heading: number | null;
    isFresh: boolean;
  } | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const [error, setError] = useState<string | null>(
    id ? null : 'Trip reference is missing.'
  );

  async function reload() {
    if (!session || !id) return;

    const response = await fetchMobileDriver(session);
    const found = response.trips.find((item) => item.id === id) ?? null;
    setTrip(found);

    if (!found) {
      setError('This trip was not found in your driver account.');
    }
  }

  useEffect(() => {
    if (!session || !id) return;

    let active = true;

    fetchMobileDriver(session)
      .then((response) => {
        if (!active) return;
        const found = response.trips.find((item) => item.id === id) ?? null;
        setTrip(found);
        if (!found) {
          setError('This trip was not found in your driver account.');
          return;
        }
        getRoutePreview(found.from, found.to)
          .then((routeResponse) => {
            if (!active) return;
            setRoute(routeResponse.route);
            setRouteMessage(routeResponse.error ?? null);
          })
          .catch(() => {
            if (active) setRouteMessage('Map route unavailable');
          });
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : 'Unable to load driver trip'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, session]);

  useEffect(() => {
    return () => {
      locationSubscription.current?.remove();
      locationSubscription.current = null;
    };
  }, []);

  async function startLiveTracking() {
    if (!session || !trip || tracking) return;

    if (trip.status !== 'On schedule' && trip.status !== 'Boarding') {
      setTrackingMessage('Set the trip to On schedule or Boarding before sharing live location.');
      return;
    }

    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      setTrackingMessage('Location permission is required to share your live position.');
      return;
    }

    setTrackingMessage('Starting live location…');

    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 8000,
          distanceInterval: 30,
        },
        (position) => {
          const nextLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading:
              position.coords.heading == null || position.coords.heading < 0
                ? null
                : position.coords.heading,
            isFresh: true,
          };
          setLiveLocation(nextLocation);
          void updateDriverLiveLocation(session, trip.id, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: position.coords.accuracy ?? null,
            heading:
              position.coords.heading == null || position.coords.heading < 0
                ? null
                : position.coords.heading,
            speedMps:
              position.coords.speed == null || position.coords.speed < 0
                ? null
                : position.coords.speed,
            recordedAt: new Date(position.timestamp).toISOString(),
          }).catch((reason: unknown) => {
            setTrackingMessage(
              reason instanceof Error ? reason.message : 'Unable to share live location'
            );
          });
        }
      );

      locationSubscription.current?.remove();
      locationSubscription.current = subscription;
      setTracking(true);
      setTrackingMessage('Live location is being shared with booked passengers.');
    } catch (reason) {
      setTrackingMessage(
        reason instanceof Error ? reason.message : 'Unable to start live location'
      );
    }
  }

  async function stopLiveTracking() {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    setTracking(false);
    setLiveLocation(null);

    if (!session || !trip) return;

    try {
      await stopDriverLiveLocation(session, trip.id);
      setTrackingMessage('Live location sharing stopped.');
    } catch (reason) {
      setTrackingMessage(
        reason instanceof Error ? reason.message : 'Unable to stop live location'
      );
    }
  }

  async function setStatus(
    status: 'Scheduled' | 'On schedule' | 'Boarding' | 'Completed' | 'Cancelled'
  ) {
    if (!session || !trip || saving) return;

    setSaving(true);
    setError(null);

    try {
      await updateDriverTripStatus(session, trip.id, status);
      if (status === 'Completed' || status === 'Cancelled') {
        await stopLiveTracking();
      }
      await reload();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to update trip'
      );
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={BLUE} />
          <Text style={styles.stateTitle}>Loading driver trip</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.stateTitle}>Sign in to manage this trip</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Trip unavailable</Text>
          <Text style={styles.stateText}>{error || 'Trip not found.'}</Text>
          <Pressable
            onPress={() => router.replace('/explore')}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Back to Driver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const active = trip.status !== 'Completed' && trip.status !== 'Cancelled';
  const editable =
    trip.status !== 'Boarding' &&
    trip.status !== 'Completed' &&
    trip.status !== 'Cancelled';
  const expected = 'R' + ((trip.fareCents * trip.seatsBooked) / 100).toFixed(0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>DRIVER TRIP</Text>
            <Text style={styles.title}>{trip.id}</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{trip.status}</Text>
          </View>
          <Text style={styles.route}>{trip.route}</Text>
          <Text style={styles.departure}>{formatDeparture(trip.departureAt)}</Text>

          <View style={styles.dividerDark} />

          <View style={styles.metrics}>
            <Metric label="Fare" value={trip.fare} dark />
            <Metric label="Booked" value={String(trip.seatsBooked) + '/' + String(trip.seatCapacity)} dark />
            <Metric label="Expected" value={expected} dark />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Route map</Text>
        {route ? (
          <RouteMap route={route} from={trip.from} to={trip.to} height={190} liveLocation={liveLocation} />
        ) : (
          <RouteMapFallback
            from={trip.from}
            to={trip.to}
            message={routeMessage ?? 'Loading road route...'}
            height={190}
          />
        )}

        <View style={styles.liveCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.liveTitle}>
              {tracking ? 'Live location on' : 'Share live location'}
            </Text>
            <Text style={styles.liveText}>
              {trackingMessage ??
                (trip.status === 'On schedule' || trip.status === 'Boarding'
                  ? 'Passengers on this trip can see your position while this screen is open.'
                  : 'Change the trip to On schedule or Boarding to start tracking.')}
            </Text>
          </View>
          <Pressable
            disabled={saving}
            onPress={() => void (tracking ? stopLiveTracking() : startLiveTracking())}
            style={[styles.liveButton, tracking && styles.liveButtonStop]}>
            <Text style={[styles.liveButtonText, tracking && styles.liveButtonStopText]}>
              {tracking ? 'Stop' : 'Start'}
            </Text>
          </Pressable>
        </View>

        {editable ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/driver-trip-edit/[id]',
                params: { id: trip.id },
              })
            }
            style={({ pressed }) => [
              styles.editTripButton,
              pressed && styles.pressed,
            ]}>
            <View>
              <Text style={styles.editTripTitle}>Edit trip</Text>
              <Text style={styles.editTripText}>
                Route, departure, seat capacity and fare
              </Text>
            </View>
            <Text style={styles.editTripArrow}>›</Text>
          </Pressable>
        ) : null}

        <Text style={styles.sectionTitle}>Capacity</Text>
        <View style={styles.capacityCard}>
          <View>
            <Text style={styles.capacityNumber}>{trip.availableSeats}</Text>
            <Text style={styles.capacityLabel}>seats remaining</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.capacitySecondary}>{trip.seatsBooked}</Text>
            <Text style={styles.capacityLabel}>passenger seats booked</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Trip lifecycle</Text>
        {active ? (
          <View style={styles.actions}>
            <Pressable
              disabled={saving}
              onPress={() => void setStatus('On schedule')}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <Text style={styles.actionText}>On schedule</Text>
            </Pressable>
            <Pressable
              disabled={saving}
              onPress={() => void setStatus('Boarding')}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <Text style={styles.actionText}>Boarding</Text>
            </Pressable>
            <Pressable
              disabled={saving}
              onPress={() => void setStatus('Completed')}
              style={({ pressed }) => [styles.complete, pressed && styles.pressed]}>
              <Text style={styles.completeText}>Complete trip</Text>
            </Pressable>
            <Pressable
              disabled={saving}
              onPress={() => void setStatus('Cancelled')}
              style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
              <Text style={styles.cancelText}>Cancel trip</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.closedCard}>
            <Text style={styles.closedTitle}>Trip is {trip.status.toLowerCase()}</Text>
            <Text style={styles.closedText}>
              This journey is no longer accepting operational status changes from Driver mode.
            </Text>
          </View>
        )}

        <View style={styles.note}>
          <Text style={styles.noteTitle}>Passenger lifecycle stays linked</Text>
          <Text style={styles.noteText}>
            Completing or cancelling this trip updates the linked passenger bookings in the Vaya CRM.
          </Text>
        </View>

        {saving ? (
          <View style={styles.saving}>
            <ActivityIndicator color={BLUE} />
            <Text style={styles.savingText}>Updating trip…</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({
  label,
  value,
  dark,
}: {
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <View>
      <Text style={[styles.metricLabel, dark && styles.metricLabelDark]}>{label}</Text>
      <Text style={[styles.metricValue, dark && styles.metricValueDark]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 40 },
  pressed: { opacity: 0.72 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  stateTitle: { color: TEXT, fontSize: 18, fontWeight: '900', marginTop: 12 },
  stateText: { color: MUTED, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 6 },
  errorTitle: { color: '#B42318', fontSize: 18, fontWeight: '900' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 40, height: 40, borderRadius: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  backText: { color: TEXT, fontSize: 30, lineHeight: 30, marginTop: -3 },
  eyebrow: { color: BLUE, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: TEXT, fontSize: 18, fontWeight: '900', marginTop: 3 },
  hero: { marginTop: 22, backgroundColor: '#063C35', borderRadius: 20, padding: 18 },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: '#1C2D49', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  statusText: { color: '#A9CFFF', fontSize: 9, fontWeight: '900' },
  route: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginTop: 15 },
  departure: { color: '#A9B6CA', fontSize: 11, marginTop: 6 },
  dividerDark: { height: 1, backgroundColor: '#263955', marginVertical: 17 },
  metrics: { flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { color: MUTED, fontSize: 9, fontWeight: '700' },
  metricLabelDark: { color: '#8FA0B8' },
  metricValue: { color: TEXT, fontSize: 14, fontWeight: '900', marginTop: 4 },
  metricValueDark: { color: '#FFFFFF' },
  liveCard: {
    marginTop: 12,
    minHeight: 66,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B7EAD6',
    backgroundColor: '#ECFDF3',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveTitle: { color: TEXT, fontSize: 10, fontWeight: '900' },
  liveText: { color: MUTED, fontSize: 8, lineHeight: 13, marginTop: 3 },
  liveButton: {
    minWidth: 58,
    height: 34,
    borderRadius: 8,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  liveButtonStop: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  liveButtonText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  liveButtonStopText: { color: '#B42318' },
  editTripButton: {
    marginTop: 14,
    minHeight: 62,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#9DC5FA',
    backgroundColor: '#E9F9F3',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  editTripTitle: { color: TEXT, fontSize: 12, fontWeight: '900' },
  editTripText: { color: MUTED, fontSize: 9, marginTop: 3 },
  editTripArrow: { color: BLUE, fontSize: 24, fontWeight: '700' },
  sectionTitle: { color: TEXT, fontSize: 17, fontWeight: '900', marginTop: 24, marginBottom: 10 },
  capacityCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between' },
  capacityNumber: { color: BLUE, fontSize: 28, fontWeight: '900' },
  capacitySecondary: { color: TEXT, fontSize: 20, fontWeight: '900' },
  capacityLabel: { color: MUTED, fontSize: 9, marginTop: 3 },
  errorCard: { marginTop: 14, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFF8F7', borderRadius: 12, padding: 12 },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16 },
  actions: { gap: 9 },
  action: { height: 46, borderRadius: 11, borderWidth: 1, borderColor: LINE, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: TEXT, fontSize: 11, fontWeight: '900' },
  complete: { height: 48, borderRadius: 11, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  completeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  cancel: { height: 46, borderRadius: 11, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFF8F7', alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#B42318', fontSize: 11, fontWeight: '900' },
  closedCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 15, padding: 15 },
  closedTitle: { color: TEXT, fontSize: 12, fontWeight: '900' },
  closedText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
  note: { marginTop: 20, borderRadius: 14, backgroundColor: '#E9F9F3', padding: 14 },
  noteTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  noteText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
  saving: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  savingText: { color: MUTED, fontSize: 10, fontWeight: '800' },
  secondary: { marginTop: 18, height: 46, borderRadius: 11, borderWidth: 1, borderColor: LINE, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: BLUE, fontSize: 11, fontWeight: '900' },
});
