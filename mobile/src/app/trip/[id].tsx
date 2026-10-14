import { TripMapLayout } from "@/components/trip-map-layout";
import { RetryButton } from "@/components/retry-button";
import { useTripOwnership } from "@/hooks/use-trip-ownership";
import { useTravelMode } from "@/providers/travel-mode-provider";
import { Design } from "@/constants/design";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  API_URL,
  getRoutePreview,
  getTrip,
  PublicTrip,
  RoutePreview,
} from "@/lib/api";

const GREEN = Design.color.primary;
const GREEN_DARK = "#1765F3";
const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

function formatDeparture(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function TripDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; passengers?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const passengers = Math.max(
    1,
    Number(typeof params.passengers === "string" ? params.passengers : "1") ||
      1,
  );
  const ownership = useTripOwnership(id);
  const { mode, setMode } = useTravelMode();
  const [trip, setTrip] = useState<PublicTrip | null>(null);
  const [route, setRoute] = useState<RoutePreview | null>(null);
  const [routeMessage, setRouteMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(
    id ? null : "Trip reference is missing.",
  );
  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      setError(null);
      let active = true;
      getTrip(id)
        .then((r) => {
          if (!active) return;
          setTrip(r.trip);
          void getRoutePreview(r.trip.from, r.trip.to)
            .then((response) => {
              if (active) {
                setRoute(response.route);
                setRouteMessage(response.error ?? null);
              }
            })
            .catch((reason: unknown) => {
              if (active)
                setRouteMessage(
                  reason instanceof Error
                    ? reason.message
                    : "Map route unavailable",
                );
            });
        })
        .catch((reason: unknown) => {
          if (active)
            setError(
              reason instanceof Error
                ? reason.message
                : "Unable to load this trip",
            );
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [id]),
  );
  const total = useMemo(
    () =>
      trip
        ? `R${((trip.fareCents * passengers) / 100).toFixed(trip.fareCents % 100 === 0 ? 0 : 2)}`
        : "R0",
    [passengers, trip],
  );

  if (loading || !trip || error)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.state}>
          {loading ? (
            <ActivityIndicator color={GREEN} />
          ) : (
            <>
              <Text style={styles.errorTitle}>Couldn’t load this ride</Text>
              <Text style={styles.errorText}>{error ?? "Trip not found."}</Text>
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                style={styles.primary}
              >
                <Text style={styles.primaryText}>Go back</Text>
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  return (
    <TripMapLayout
      route={route}
      from={trip.from}
      to={trip.to}
      message={routeMessage}
      title={trip.from + " → " + trip.to}
      subtitle={
        formatDeparture(trip.departureAt) +
        " · " +
        passengers +
        " seat" +
        (passengers === 1 ? "" : "s") +
        " · " +
        total
      }
      status={ownership.owned ? "Your ride" : trip.status}
      driver={ownership.owned}
      footer={
        ownership.error ? (
          <>
            <Text style={styles.errorText}>{ownership.error}</Text>
            <RetryButton onPress={ownership.retry} />
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={
              !ownership.checked ||
              (!ownership.owned && trip.availableSeats < passengers)
            }
            onPress={() => {
              if (ownership.owned) {
                setMode("driver");
                router.replace({
                  pathname: "/driver-trip/[id]",
                  params: { id: trip.id },
                });
              } else {
                if (mode === "driver") setMode("passenger");
                router.push({
                  pathname: "/booking/[id]",
                  params: { id: trip.id, seats: String(passengers) },
                });
              }
            }}
            style={[
              styles.primary,
              (!ownership.checked ||
                (!ownership.owned && trip.availableSeats < passengers)) &&
                styles.disabled,
            ]}
          >
            <Text style={styles.primaryText}>
              {!ownership.checked
                ? "Checking ride…"
                : ownership.owned
                  ? "Manage your ride"
                  : trip.availableSeats < passengers
                    ? "Not enough seats"
                    : mode === "driver"
                      ? "Switch to passenger to book"
                      : "Continue · " + total}
            </Text>
          </Pressable>
        )
      }
    >
      {" "}
      <View style={styles.routeCard}>
        <View style={styles.routeTop}>
          <View>
            <Text style={styles.route}>
              {trip.from} → {trip.to}
            </Text>
            <Text style={styles.departure}>
              {formatDeparture(trip.departureAt)}
            </Text>
          </View>
          <View style={styles.status}>
            <Text style={styles.statusText}>{trip.status}</Text>
          </View>
        </View>
        <View style={styles.timeline}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineLine} />
          <View style={[styles.timelineDot, { backgroundColor: GREEN }]} />
        </View>
        <View style={styles.fareRow}>
          <View>
            <Text style={styles.label}>Fare</Text>
            <Text style={styles.value}>{trip.fare}</Text>
          </View>
          <View>
            <Text style={styles.label}>Seats</Text>
            <Text style={styles.value}>{passengers}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.label}>Total</Text>
            <Text style={styles.total}>{total}</Text>
          </View>
        </View>
      </View>
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
            <Text style={styles.avatarText}>{initials(trip.driver.name)}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.driverName}>{trip.driver.name}</Text>
            {trip.driver.verified ? (
              <Text style={styles.verified}>✓</Text>
            ) : null}
          </View>
          <Text style={styles.driverMeta}>
            {trip.driver.verified ? "Verified driver" : "Verification pending"}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
      <Text style={styles.sectionTitle}>Trip details</Text>
      <View style={styles.list}>
        <DetailRow
          label="Departure"
          value={formatDeparture(trip.departureAt)}
        />
        <DetailRow label="Vehicle" value={trip.driver.vehicle} />
        <DetailRow
          label="Available seats"
          value={`${trip.availableSeats} of ${trip.seatCapacity}`}
        />
        <DetailRow
          label="Driver area"
          value={trip.driver.location || "Not provided"}
          last
        />
      </View>
      <View style={styles.safety}>
        <Text style={styles.safetyIcon}>✓</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.safetyTitle}>Safe ride</Text>
          <Text style={styles.safetyText}>
            Driver and vehicle verification are checked before booking.
          </Text>
        </View>
      </View>
    </TripMapLayout>
  );
}

function DetailRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.border]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 30,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    minHeight: 48,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: TEXT,
    fontSize: 25,
    lineHeight: 37,
    marginTop: -2,
    flexShrink: 1,
  },
  headerTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  state: { minHeight: 220, alignItems: "center", justifyContent: "center" },
  error: {
    marginTop: 16,
    padding: 16,
    borderRadius: Design.radius.card,
    backgroundColor: "#FFF1F0",
  },
  errorTitle: {
    color: "#B42318",
    fontSize: 18,
    fontWeight: "600",
    flexShrink: 1,
  },
  errorText: { color: "#B42318", fontSize: 14, marginTop: 3, flexShrink: 1 },
  routeCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    padding: 16,
    backgroundColor: SURFACE,
  },
  routeTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  route: { color: TEXT, fontSize: 15, fontWeight: "600", flexShrink: 1 },
  departure: { color: MUTED, fontSize: 14, marginTop: 3, flexShrink: 1 },
  status: {
    alignSelf: "flex-start",
    backgroundColor: "#ECFDF3",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  statusText: {
    color: "#027A48",
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  timeline: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#98A2B3",
  },
  timelineLine: { flex: 1, height: 1, backgroundColor: "#D0D5DD" },
  fareRow: {
    marginTop: 11,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: LINE,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: { color: MUTED, fontSize: 12, flexShrink: 1 },
  value: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
    flexShrink: 1,
  },
  total: {
    color: GREEN_DARK,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
    flexShrink: 1,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 17,
    marginBottom: 7,
    flexShrink: 1,
  },
  driverCard: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    backgroundColor: SURFACE,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Design.color.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: {
    color: GREEN_DARK,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  driverName: { color: TEXT, fontSize: 15, fontWeight: "600", flexShrink: 1 },
  verified: { color: GREEN, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  driverMeta: { color: MUTED, fontSize: 12, marginTop: 2, flexShrink: 1 },
  chevron: { color: "#98A2B3", fontSize: 18, flexShrink: 1 },
  list: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    overflow: "hidden",
    backgroundColor: SURFACE,
  },
  detailRow: {
    minHeight: 45,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "center",
  },
  border: { borderBottomWidth: 1, borderBottomColor: LINE },
  detailLabel: { color: MUTED, fontSize: 12, flexShrink: 1 },
  detailValue: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
    flexShrink: 1,
  },
  safety: {
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: "#ECFDF3",
    padding: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  safetyIcon: {
    color: GREEN_DARK,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  safetyTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  safetyText: { color: MUTED, fontSize: 14, marginTop: 2, flexShrink: 1 },
  primary: {
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    paddingVertical: 10,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  disabled: { opacity: 0.4 },
});
