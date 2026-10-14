import { TripMapLayout } from "@/components/trip-map-layout";
import { RetryButton } from "@/components/retry-button";
import { DriverPassengers } from "@/components/driver-passengers";
import { Design } from "@/constants/design";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getBackgroundDriverTrackingState,
  startBackgroundDriverTracking,
  stopBackgroundDriverTracking,
} from "@/lib/background-driver-location";
import {
  fetchMobileDriver,
  fetchMobilePrivacyPreferences,
  MobileDriverTrip,
  stopDriverLiveLocation,
  updateDriverLiveLocation,
  updateDriverTripStatus,
} from "@/lib/auth";
import { getRoutePreview, RoutePreview } from "@/lib/api";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const BLUE = Design.color.primary;
const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

function formatDeparture(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export default function DriverTripScreen() {
  const [retryVersion, setRetryVersion] = useState(0);
  const [passengerVersion, setPassengerVersion] = useState(0);
  const [pendingStatus, setPendingStatus] = useState<"Completed" | "Cancelled" | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
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
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );
  const [error, setError] = useState<string | null>(
    id ? null : "Trip reference is missing.",
  );

  async function reload() {
    if (!session || !id) return;

    const response = await fetchMobileDriver(session);
    const found = response.trips.find((item) => item.id === id) ?? null;
    setTrip(found);

    if (!found) {
      setError("This trip was not found in your driver account.");
    }
  }

  useFocusEffect(
    useCallback(
      () => {
        if (!session || !id) return;

        setLoading(true);
        setError(null);
        let active = true;

        fetchMobileDriver(session)
          .then((response) => {
            if (!active) return;
            const found = response.trips.find((item) => item.id === id) ?? null;
            setTrip(found);
            if (!found) {
              setError("This trip was not found in your driver account.");
              return;
            }
            getRoutePreview(found.from, found.to)
              .then((routeResponse) => {
                if (!active) return;
                setRoute(routeResponse.route);
                setRouteMessage(routeResponse.error ?? null);
              })
              .catch(() => {
                if (active) setRouteMessage("Map route unavailable");
              });
          })
          .catch((reason: unknown) => {
            if (active) {
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Unable to load driver trip",
              );
            }
          })
          .finally(() => {
            if (active) setLoading(false);
          });

        return () => {
          active = false;
        };
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps -- Retry and refresh counters intentionally reload this request.
      [id, session, retryVersion],
    ),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getBackgroundDriverTrackingState()
        .then((state) => {
          if (!active) return;
          const sharing = state.active && state.tripId === id;
          setTracking(sharing);
          if (!sharing) {
            locationSubscription.current?.remove();
            locationSubscription.current = null;
            setLiveLocation(null);
          }
          if (sharing)
            setTrackingMessage(
              "Background live location is active for this trip.",
            );
        })
        .catch(() => {});

      return () => {
        active = false;
        locationSubscription.current?.remove();
        locationSubscription.current = null;
      };
    }, [id]),
  );

  async function startLiveTracking() {
    if (!session || !trip || tracking) return;

    if (trip.status !== "On schedule" && trip.status !== "Boarding") {
      setTrackingMessage(
        "Set the trip to On schedule or Boarding before sharing live location.",
      );
      return;
    }

    try {
      const { preferences } = await fetchMobilePrivacyPreferences(session);
      if (!preferences.locationSharing) {
        setTrackingMessage(
          "Turn on Location sharing in Privacy & Security before starting live tracking.",
        );
        return;
      }
    } catch (reason) {
      setTrackingMessage(
        reason instanceof Error
          ? reason.message
          : "Unable to check location preferences",
      );
      return;
    }

    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      setTrackingMessage(
        "Location permission is required to share your live position.",
      );
      return;
    }

    setTrackingMessage("Starting live location…");

    try {
      const backgroundStarted = await startBackgroundDriverTracking(
        session,
        trip.id,
      );
      if (!backgroundStarted) {
        setTrackingMessage(
          "Background location permission is required so passengers can keep seeing your position when Vaya is not open.",
        );
        return;
      }

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
            if (
              [401, 409].includes((reason as { status?: number })?.status ?? 0)
            ) {
              locationSubscription.current?.remove();
              locationSubscription.current = null;
              setTracking(false);
              setLiveLocation(null);
              void stopBackgroundDriverTracking().catch(() => {});
            }
            setTrackingMessage(
              reason instanceof Error
                ? reason.message
                : "Unable to share live location",
            );
          });
        },
      );

      locationSubscription.current?.remove();
      locationSubscription.current = subscription;
      setTracking(true);
      setTrackingMessage(
        "Live location is being shared in the foreground and background.",
      );
    } catch (reason) {
      setTrackingMessage(
        reason instanceof Error
          ? reason.message
          : "Unable to start live location",
      );
    }
  }

  async function stopLiveTracking() {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    setTracking(false);
    setLiveLocation(null);

    await stopBackgroundDriverTracking().catch(() => {});

    if (!session || !trip) return;

    try {
      await stopDriverLiveLocation(session, trip.id);
      setTrackingMessage("Live location sharing stopped.");
    } catch (reason) {
      setTrackingMessage(
        reason instanceof Error
          ? reason.message
          : "Unable to stop live location",
      );
    }
  }

  async function setStatus(
    status:
      "Scheduled" | "On schedule" | "Boarding" | "Completed" | "Cancelled",
  ) {
    if (!session || !trip || saving) return;

    setSaving(true);
    setError(null);

    try {
      await updateDriverTripStatus(session, trip.id, status);
      setPendingStatus(null);
      setPassengerVersion((value) => value + 1);
      if (status === "Completed" || status === "Cancelled") {
        await stopLiveTracking();
      }
      await reload();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to update trip",
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
          <Text style={styles.stateText}>{error || "Trip not found."}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/explore")}
            style={({ pressed }) => [
              styles.secondary,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryText}>Back to Driver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const active = trip.status !== "Completed" && trip.status !== "Cancelled";
  const editable =
    trip.status !== "Boarding" &&
    trip.status !== "Completed" &&
    trip.status !== "Cancelled";
  const expected = "R" + ((trip.fareCents * trip.seatsBooked) / 100).toFixed(0);

  return (
    <TripMapLayout
      driver
      route={route}
      from={trip.from}
      to={trip.to}
      message={routeMessage}
      title={trip.route}
      subtitle={
        formatDeparture(trip.departureAt) +
        " · " +
        trip.seatsBooked +
        "/" +
        trip.seatCapacity +
        " seats booked · " +
        expected +
        " expected"
      }
      status={trip.status}
      liveLocation={liveLocation}
      footer={
        <Pressable
          accessibilityRole="button"
          disabled={saving || !active}
          onPress={() =>
            void (tracking ? stopLiveTracking() : startLiveTracking())
          }
          style={[styles.primary, (!active || saving) && { opacity: 0.45 }]}
        >
          <Text style={styles.primaryText}>
            {tracking
              ? "Stop sharing live location"
              : active
                ? "Share live location"
                : "Ride " + trip.status.toLowerCase()}
          </Text>
        </Pressable>
      }
    >
      {" "}
      <View style={styles.hero}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{trip.status}</Text>
        </View>
        <Text style={styles.route}>{trip.route}</Text>
        <Text style={styles.departure}>
          {formatDeparture(trip.departureAt)}
        </Text>

        <View style={styles.dividerDark} />

        <View style={styles.metrics}>
          <Metric label="Fare" value={trip.fare} dark />
          <Metric
            label="Booked"
            value={String(trip.seatsBooked) + "/" + String(trip.seatCapacity)}
            dark
          />
          <Metric label="Expected" value={expected} dark />
        </View>
      </View>
      <View style={styles.liveCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.liveTitle}>
            {tracking ? "Live location on" : "Share live location"}
          </Text>
          <Text style={styles.liveText}>
            {trackingMessage ??
              (trip.status === "On schedule" || trip.status === "Boarding"
                ? "Passengers on this trip can keep seeing your position even when Vaya is in the background."
                : "Change the trip to On schedule or Boarding to start tracking.")}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={() =>
            void (tracking ? stopLiveTracking() : startLiveTracking())
          }
          style={[styles.liveButton, tracking && styles.liveButtonStop]}
        >
          <Text
            style={[
              styles.liveButtonText,
              tracking && styles.liveButtonStopText,
            ]}
          >
            {tracking ? "Stop" : "Start"}
          </Text>
        </Pressable>
      </View>
      {editable ? (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/driver-trip-edit/[id]",
              params: { id: trip.id },
            })
          }
          style={({ pressed }) => [
            styles.editTripButton,
            pressed && styles.pressed,
          ]}
        >
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
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.capacitySecondary}>{trip.seatsBooked}</Text>
          <Text style={styles.capacityLabel}>passenger seats booked</Text>
        </View>
      </View>
      {error ? (
        <View style={styles.errorCard}>
          <>
            <Text style={styles.errorText}>{error}</Text>
            <RetryButton onPress={() => setRetryVersion((v) => v + 1)} />
          </>
        </View>
      ) : null}
      <DriverPassengers tripId={trip.id} version={passengerVersion} />
      <Text style={styles.sectionTitle}>Trip lifecycle</Text>
      {active ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={saving || trip.status === "Boarding"}
            onPress={() => void setStatus("On schedule")}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Text style={styles.actionText}>On schedule</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => void setStatus("Boarding")}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Text style={styles.actionText}>Boarding</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => setPendingStatus("Completed")}
            style={({ pressed }) => [
              styles.complete,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.completeText}>Complete trip</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => setPendingStatus("Cancelled")}
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
          >
            <Text style={styles.cancelText}>Cancel trip</Text>
          </Pressable>
          {pendingStatus ? <View style={styles.closedCard}>
            <Text style={styles.closedTitle}>{pendingStatus === "Completed" ? "Complete this ride?" : "Cancel this ride?"}</Text>
            <Text style={styles.closedText}>{pendingStatus === "Completed"
              ? "Confirm that the journey has ended. This closes the ride and its passenger bookings."
              : "All passenger bookings will be cancelled. Paid passengers should contact support for refund assistance."}</Text>
            <Pressable accessibilityRole="button" disabled={saving} onPress={() => void setStatus(pendingStatus)} style={styles.cancel}>
              <Text style={styles.cancelText}>Confirm {pendingStatus === "Completed" ? "completion" : "cancellation"}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={saving} onPress={() => setPendingStatus(null)} style={styles.action}>
              <Text style={styles.actionText}>Keep ride open</Text>
            </Pressable>
          </View> : null}
        </View>
      ) : (
        <View style={styles.closedCard}>
          <Text style={styles.closedTitle}>
            Trip is {trip.status.toLowerCase()}
          </Text>
          <Text style={styles.closedText}>
            This journey is no longer accepting operational status changes from
            Driver mode.
          </Text>
        </View>
      )}
      <View style={styles.note}>
        <Text style={styles.noteTitle}>Passenger lifecycle stays linked</Text>
        <Text style={styles.noteText}>
          Completing or cancelling this trip updates the linked passenger
          bookings in the Vaya CRM.
        </Text>
      </View>
      {saving ? (
        <View style={styles.saving}>
          <ActivityIndicator color={BLUE} />
          <Text style={styles.savingText}>Updating trip…</Text>
        </View>
      ) : null}
    </TripMapLayout>
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
      <Text style={[styles.metricLabel, dark && styles.metricLabelDark]}>
        {label}
      </Text>
      <Text style={[styles.metricValue, dark && styles.metricValueDark]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  primary: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: TEXT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  primaryText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  safe: { flex: 1, backgroundColor: BG },
  page: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  pressed: { opacity: 0.72 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  stateTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
    flexShrink: 1,
  },
  stateText: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 6,
    flexShrink: 1,
  },
  errorTitle: {
    color: "#B42318",
    fontSize: 18,
    fontWeight: "600",
    flexShrink: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    minHeight: 48,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: TEXT,
    fontSize: 30,
    lineHeight: 44,
    marginTop: -3,
    flexShrink: 1,
  },
  eyebrow: {
    color: BLUE,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.1,
    flexShrink: 1,
  },
  title: {
    color: TEXT,
    fontSize: 26,
    fontWeight: "600",
    marginTop: 3,
    flexShrink: 1,
  },
  hero: {
    marginTop: 22,
    backgroundColor: "#102C60",
    borderRadius: 20,
    padding: 18,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#1C2D49",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusText: {
    color: "#A9CFFF",
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  route: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.5,
    marginTop: 15,
    flexShrink: 1,
  },
  departure: { color: "#A9B6CA", fontSize: 14, marginTop: 6, flexShrink: 1 },
  dividerDark: { height: 1, backgroundColor: "#263955", marginVertical: 17 },
  metrics: { flexDirection: "row", justifyContent: "space-between" },
  metricLabel: { color: MUTED, fontSize: 12, fontWeight: "700", flexShrink: 1 },
  metricLabelDark: { color: "#8FA0B8" },
  metricValue: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    flexShrink: 1,
  },
  metricValueDark: { color: "#FFFFFF" },
  liveCard: {
    marginTop: 12,
    minHeight: 66,
    borderRadius: Design.radius.card,
    borderWidth: 1,
    borderColor: "#B7EAD6",
    backgroundColor: "#ECFDF3",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  liveTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  liveText: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 3,
    flexShrink: 1,
  },
  liveButton: {
    minWidth: 58,
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  liveButtonStop: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FECACA",
    minHeight: 44,
    paddingVertical: 10,
  },
  liveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  liveButtonStopText: { color: "#B42318" },
  editTripButton: {
    marginTop: 14,
    minHeight: 62,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#9DC5FA",
    backgroundColor: Design.color.primarySoft,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
  },
  editTripTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "600",
    flexShrink: 1,
  },
  editTripText: { color: MUTED, fontSize: 14, marginTop: 3, flexShrink: 1 },
  editTripArrow: {
    color: BLUE,
    fontSize: 24,
    fontWeight: "700",
    flexShrink: 1,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 10,
    flexShrink: 1,
  },
  capacityCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  capacityNumber: {
    color: BLUE,
    fontSize: 28,
    fontWeight: "600",
    flexShrink: 1,
  },
  capacitySecondary: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "600",
    flexShrink: 1,
  },
  capacityLabel: { color: MUTED, fontSize: 12, marginTop: 3, flexShrink: 1 },
  errorCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FFF8F7",
    borderRadius: Design.radius.card,
    padding: 16,
  },
  errorText: { color: "#B42318", fontSize: 14, lineHeight: 21, flexShrink: 1 },
  actions: { gap: 9, flexWrap: "wrap" },
  action: {
    height: 52,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  actionText: { color: TEXT, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  complete: {
    height: 52,
    borderRadius: 11,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  completeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  cancel: {
    height: 52,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FFF8F7",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  cancelText: {
    color: "#B42318",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  closedCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    padding: 16,
  },
  closedTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  closedText: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
    flexShrink: 1,
  },
  note: {
    marginTop: 20,
    borderRadius: 14,
    backgroundColor: Design.color.primarySoft,
    padding: 14,
  },
  noteTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  noteText: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
    flexShrink: 1,
  },
  saving: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  savingText: { color: MUTED, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  secondary: {
    marginTop: 18,
    minHeight: 52,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: LINE,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  secondaryText: {
    color: BLUE,
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
});
