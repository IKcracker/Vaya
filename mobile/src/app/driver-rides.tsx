import { RetryButton } from "@/components/retry-button";
import { Design } from "@/constants/design";
import { useMemo, useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchMobileDriver, MobileDriverTrip } from "@/lib/auth";
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

export default function DriverRidesScreen({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [retryVersion, setRetryVersion] = useState(0);
  const router = useRouter();
  const { session } = usePassengerAuth();
  const [trips, setTrips] = useState<MobileDriverTrip[]>([]);
  const [loading, setLoading] = useState(Boolean(session));
  const [tab, setTab] = useState<"active" | "history">("active");
  const [error, setError] = useState<string | null>(null);
  useFocusEffect(
    useCallback(
      () => {
        if (!session) return;
        setLoading(true);
        setError(null);
        let active = true;
        fetchMobileDriver(session)
          .then((r) => {
            if (active) setTrips(r.trips);
          })
          .catch((reason: unknown) => {
            if (active)
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Unable to load rides",
              );
          })
          .finally(() => {
            if (active) setLoading(false);
          });
        return () => {
          active = false;
        };
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps -- Retry and refresh counters intentionally reload this request.
      [session, retryVersion],
    ),
  );
  const data = useMemo(
    () =>
      trips.filter((t) =>
        tab === "active"
          ? !["Completed", "Cancelled"].includes(t.status)
          : ["Completed", "Cancelled"].includes(t.status),
      ),
    [tab, trips],
  );
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.page,
          embedded && { paddingBottom: 110 },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => (embedded ? router.replace("/") : router.back())}
            style={styles.back}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>My Rides</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Publish a ride"
            onPress={() => router.push("/driver-publish")}
            style={styles.add}
          >
            <Text style={styles.addText}>＋</Text>
          </Pressable>
        </View>
        <View style={styles.tabs}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setTab("active")}
            style={[styles.tab, tab === "active" && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, tab === "active" && styles.tabTextActive]}
            >
              Upcoming
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setTab("history")}
            style={[styles.tab, tab === "history" && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                tab === "history" && styles.tabTextActive,
              ]}
            >
              Past
            </Text>
          </Pressable>
        </View>
        {loading ? (
          <View style={styles.state}>
            <ActivityIndicator color={GREEN} />
          </View>
        ) : error ? (
          <View style={styles.error}>
            <>
              <Text style={styles.errorText}>{error}</Text>
              <RetryButton onPress={() => setRetryVersion((v) => v + 1)} />
            </>
          </View>
        ) : data.length ? (
          <View style={styles.list}>
            {data.map((trip, index) => (
              <Pressable
                accessibilityRole="button"
                key={trip.id}
                onPress={() =>
                  router.push({
                    pathname: "/driver-trip/[id]",
                    params: { id: trip.id },
                  })
                }
                style={[styles.row, index < data.length - 1 && styles.border]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.route}>{trip.route}</Text>
                  <Text style={styles.meta}>
                    {formatDeparture(trip.departureAt)} · {trip.status}
                  </Text>
                  <Text style={styles.vehicle}>
                    {trip.vehicle || "Vehicle"}
                    {trip.vehicleRegistration
                      ? ` · ${trip.vehicleRegistration}`
                      : ""}
                  </Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.fare}>{trip.fare}</Text>
                  <Text style={styles.seats}>
                    {trip.seatsBooked}/{trip.seatCapacity} booked
                  </Text>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.state}>
            <Text style={styles.emptyTitle}>
              {tab === "active" ? "No upcoming rides" : "No ride history yet"}
            </Text>
            <Text style={styles.emptyText}>
              {tab === "active"
                ? "Publish a verified trip and it will appear here."
                : "Completed and cancelled rides will appear here."}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  add: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", flexShrink: 1 },
  tabs: {
    marginTop: 16,
    flexDirection: "row",
    backgroundColor: "#EEF2F0",
    padding: 3,
    borderRadius: 10,
    height: 52,
  },
  tab: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  tabActive: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE },
  tabText: { color: MUTED, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  tabTextActive: { color: "#1765F3" },
  list: {
    marginTop: 12,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    overflow: "hidden",
  },
  row: {
    minHeight: 64,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  border: { borderBottomWidth: 1, borderBottomColor: LINE },
  route: { color: TEXT, fontSize: 15, fontWeight: "600", flexShrink: 1 },
  meta: { color: MUTED, fontSize: 12, marginTop: 3, flexShrink: 1 },
  vehicle: {
    color: "#1765F3",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    flexShrink: 1,
  },
  right: { alignItems: "flex-end" },
  fare: { color: TEXT, fontSize: 24, fontWeight: "600", flexShrink: 1 },
  seats: { color: MUTED, fontSize: 14, marginTop: 3, flexShrink: 1 },
  chevron: { color: "#98A2B3", fontSize: 20, marginTop: 4, flexShrink: 1 },
  state: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  emptyTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  emptyText: {
    color: MUTED,
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    flexShrink: 1,
  },
  error: {
    marginTop: 14,
    borderRadius: Design.radius.card,
    backgroundColor: "#FFF1F0",
    padding: 16,
  },
  errorText: { color: "#B42318", fontSize: 14, flexShrink: 1 },
});
