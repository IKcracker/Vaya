import { TripMapLayout } from "@/components/trip-map-layout";
import { SymbolView } from "expo-symbols";
import { Design } from "@/constants/design";
import { Image } from "expo-image";
import { useState, useCallback } from "react";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fetchPassengerTripExperience,
  PassengerTripExperience,
} from "@/lib/auth";
import { API_URL, getRoutePreview, RoutePreview } from "@/lib/api";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const GREEN = Design.color.primary;
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
function liveLocationText(trip: PassengerTripExperience) {
  if (!trip.liveLocation)
    return "Waiting for the driver to start live location.";
  const ageSeconds = Math.max(
    0,
    Math.round(
      (Date.now() - new Date(trip.liveLocation.recordedAt).getTime()) / 1000,
    ),
  );
  const age =
    ageSeconds < 60
      ? `${ageSeconds}s ago`
      : `${Math.floor(ageSeconds / 60)}m ago`;
  const speed =
    trip.liveLocation.speedMps != null
      ? Math.round(trip.liveLocation.speedMps * 3.6)
      : null;
  return `${trip.liveLocation.isFresh ? "Live" : "Last known"} · ${age}${speed != null ? ` · ${speed} km/h` : ""}`;
}

export default function TripProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { session } = usePassengerAuth();
  const tripId = typeof params.id === "string" ? params.id : "";
  const [trip, setTrip] = useState<PassengerTripExperience | null>(null);
  const [route, setRoute] = useState<RoutePreview | null>(null);
  const [routeMessage, setRouteMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(session && tripId));
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!session || !tripId) return;
      setLoading(true);
      setError(null);
      let active = true;
      fetchPassengerTripExperience(session, tripId)
        .then(async (r) => {
          if (!active) return;
          setTrip(r.trip);
          const routeResponse = await getRoutePreview(
            r.trip.from,
            r.trip.to,
          ).catch(() => ({ route: null, error: "Map route unavailable" }));
          if (active) {
            setRoute(routeResponse.route);
            setRouteMessage(routeResponse.error ?? null);
          }
        })
        .catch((reason: unknown) => {
          if (active)
            setError(
              reason instanceof Error ? reason.message : "Unable to load trip",
            );
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [session, tripId]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!session || !tripId) return;
      let active = true;
      const refresh = () => {
        fetchPassengerTripExperience(session, tripId)
          .then((r) => {
            if (active) setTrip(r.trip);
          })
          .catch(() => {});
      };
      const timer = setInterval(refresh, 8000);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, [session, tripId]),
  );

  if (loading)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={GREEN} />
        </View>
      </SafeAreaView>
    );

  if (!trip || error)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.state}>
          <Text style={styles.stateTitle}>Trip unavailable</Text>
          <Text style={styles.stateText}>
            {error ?? "This trip could not be loaded."}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/trips")}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>Back to trips</Text>
          </Pressable>
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
      subtitle={trip.driver.name + " · " + liveLocationText(trip)}
      status={trip.tripStatus}
      liveLocation={trip.liveLocation}
      footer={
        <>
          {" "}
          {trip.tripStatus === "Completed" ? (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.replace({
                  pathname: "/trip-completed/[id]",
                  params: { id: trip.tripId },
                })
              }
              style={styles.complete}
            >
              <Text style={styles.completeText}>
                {trip.review ? "View Review" : "Review This Trip"}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/trip/[id]",
                  params: { id: trip.tripId, passengers: String(trip.seats) },
                })
              }
              style={styles.secondary}
            >
              <Text style={styles.secondaryText}>View Trip Details</Text>
            </Pressable>
          )}
        </>
      }
    >
      {" "}
      <View
        style={[
          styles.liveStrip,
          trip.liveLocation?.isFresh && styles.liveStripActive,
        ]}
      >
        <View
          style={[
            styles.liveDot,
            trip.liveLocation?.isFresh && styles.liveDotActive,
          ]}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.liveStripTitle}>
            {trip.liveLocation?.isFresh
              ? "Driver location is live"
              : "Driver location"}
          </Text>
          <Text style={styles.liveStripText}>{liveLocationText(trip)}</Text>
        </View>
      </View>
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
          <Text style={styles.driverName}>{trip.driver.name}</Text>
          <Text style={styles.rating}>
            {trip.driver.verified
              ? "✓ Verified driver"
              : "Driver verification pending"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Message driver"
          onPress={() =>
            trip.driver.email &&
            router.push({
              pathname: "/conversation/[email]",
              params: { email: trip.driver.email },
            })
          }
          disabled={!trip.driver.email}
          style={[styles.call, !trip.driver.email && styles.callDisabled]}
        >
          <SymbolView
            name={{
              ios: "bubble.left",
              android: "chat_bubble_outline",
              web: "chat_bubble_outline",
            }}
            tintColor={GREEN}
            size={20}
          />
        </Pressable>
      </View>
      {trip.driver.phone ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Call driver"
          style={styles.secondary}
          onPress={() => {
            void Linking.openURL(`tel:${trip.driver.phone}`).catch(() =>
              setError(
                "Unable to open the phone app. Please message your driver.",
              ),
            );
          }}
        >
          <Text style={styles.secondaryText}>
            Call driver · {trip.driver.phone}
          </Text>
        </Pressable>
      ) : null}
      <View style={styles.timeline}>
        <View style={styles.timelineRow}>
          <View style={styles.timelineDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.city}>{trip.from}</Text>
            <Text style={styles.time}>{formatDeparture(trip.departureAt)}</Text>
          </View>
        </View>
        <View style={styles.timelineLine} />
        <View style={styles.timelineRow}>
          <View style={[styles.timelineDot, styles.timelineDotEnd]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.city}>{trip.to}</Text>
            <Text style={styles.time}>Destination</Text>
          </View>
        </View>
      </View>
      <View style={styles.vehicle}>
        <SymbolView
          name={{
            ios: "car",
            android: "directions_car",
            web: "directions_car",
          }}
          tintColor={GREEN}
          size={28}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.vehicleText}>{trip.vehicle.label}</Text>
          <Text style={styles.vehicleMeta}>
            {trip.vehicle.registration ||
              trip.vehicle.color ||
              "Verified trip vehicle"}
          </Text>
        </View>
      </View>
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>CURRENT STATUS</Text>
        <Text style={styles.statusValue}>{trip.tripStatus}</Text>
        <Text style={styles.statusText}>
          {trip.tripStatus === "Completed"
            ? "Your trip is complete and ready for review."
            : "The driver controls trip progress. Updates will appear here automatically."}
        </Text>
      </View>
    </TripMapLayout>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: {
    padding: 24,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
    borderRadius: 22,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: TEXT,
    fontSize: 29,
    lineHeight: 43,
    marginTop: -3,
    flexShrink: 1,
  },
  title: { color: TEXT, fontSize: 26, fontWeight: "600", flexShrink: 1 },
  mapWrap: { marginTop: 12 },
  liveStrip: {
    marginTop: 8,
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: SURFACE,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveStripActive: { borderColor: "#B7EAD6", backgroundColor: "#ECFDF3" },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#98A2B3" },
  liveDotActive: { backgroundColor: GREEN },
  liveStripTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "600",
    flexShrink: 1,
  },
  liveStripText: { color: MUTED, fontSize: 14, marginTop: 2, flexShrink: 1 },
  driverCard: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    padding: 16,
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
    color: "#1765F3",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  driverName: { color: TEXT, fontSize: 15, fontWeight: "600", flexShrink: 1 },
  rating: { color: MUTED, fontSize: 12, marginTop: 3, flexShrink: 1 },
  call: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ECFDF3",
    alignItems: "center",
    justifyContent: "center",
  },
  callDisabled: { opacity: 0.45 },
  callText: { color: "#027A48", fontSize: 14, flexShrink: 1 },
  timeline: {
    marginTop: 12,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 14,
    padding: 14,
  },
  timelineRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  timelineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: GREEN },
  timelineDotEnd: { backgroundColor: "#0E7490" },
  timelineLine: {
    width: 2,
    height: 36,
    backgroundColor: "#B7EAD6",
    marginLeft: 3.5,
  },
  city: { color: TEXT, fontSize: 15, fontWeight: "600", flexShrink: 1 },
  time: { color: MUTED, fontSize: 12, marginTop: 2, flexShrink: 1 },
  vehicle: {
    marginTop: 12,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  vehicleIcon: { fontSize: 18, flexShrink: 1 },
  vehicleText: { color: TEXT, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  vehicleMeta: { color: MUTED, fontSize: 12, marginTop: 2, flexShrink: 1 },
  statusCard: {
    marginTop: 12,
    borderRadius: Design.radius.card,
    backgroundColor: Design.color.primarySoft,
    padding: 16,
  },
  statusLabel: {
    color: "#1765F3",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.7,
    flexShrink: 1,
  },
  statusValue: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    flexShrink: 1,
  },
  statusText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
    flexShrink: 1,
  },
  complete: {
    marginTop: 18,
    height: 52,
    borderRadius: 11,
    backgroundColor: GREEN,
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
  secondary: {
    marginTop: 18,
    minHeight: 52,
    borderRadius: 11,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  secondaryText: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  state: {
    marginTop: 18,
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  stateTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  stateText: {
    color: MUTED,
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    flexShrink: 1,
  },
});
