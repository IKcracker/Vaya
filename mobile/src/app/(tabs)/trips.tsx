import { useTravelMode } from "@/providers/travel-mode-provider";
import DriverRides from "../driver-rides";
import { ScreenState } from "@/components/screen-state";
import { RetryButton } from "@/components/retry-button";
import { Design } from "@/constants/design";
import { Image } from "expo-image";
import { useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchPassengerTrips, PassengerTrip } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { isUpcomingBooking } from "@/lib/trip-state";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const GREEN = Design.color.primary;
const GREEN_DARK = "#1765F3";
const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

function formatDate(value: string) {
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

function PassengerTripsScreen() {
  const [retryVersion, setRetryVersion] = useState(0);
  const router = useRouter();
  const { loading: authLoading, session } = usePassengerAuth();
  const [trips, setTrips] = useState<PassengerTrip[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(Boolean(session));
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  useFocusEffect(
    useCallback(
      () => {
        if (!session) return;
        setNow(Date.now());
        setLoading(true);
        setError(null);
        let active = true;
        fetchPassengerTrips(session)
          .then((r) => {
            if (active) setTrips(r.trips);
          })
          .catch((reason: unknown) => {
            if (active)
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Unable to load your trips",
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
  const { upcoming, history } = useMemo(() => {
    const future: PassengerTrip[] = [];
    const past: PassengerTrip[] = [];
    for (const trip of trips) {
      if (isUpcomingBooking(trip, now))
        future.push(trip);
      else past.push(trip);
    }
    return { upcoming: future, history: past };
  }, [now, trips]);
  if (authLoading)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={GREEN} />
        </View>
      </SafeAreaView>
    );
  if (!session) return (
    <SafeAreaView style={styles.safe}>
      <ScreenState icon="ticket" eyebrow="YOUR JOURNEYS" title={"Every journey.\nAll in one place."} description={"Sign in to manage bookings, pick up where you left off and follow your next ride."} action="Sign in" onPress={() => router.push({ pathname: "/auth", params: { next: "/trips" } })} />
    </SafeAreaView>
  );
  const data = tab === "upcoming" ? upcoming : history;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>My Trips</Text>
        <View style={styles.tabs}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setTab("upcoming")}
            style={[styles.tab, tab === "upcoming" && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                tab === "upcoming" && styles.tabTextActive,
              ]}
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
                  tab === "upcoming" && trip.paymentStatus !== "Paid"
                    ? router.push({
                        pathname: "/payment/[id]",
                        params: { id: trip.id },
                      })
                    : trip.bookingStatus !== "Cancelled" && trip.paymentStatus === "Paid" && !["Cancelled", "Completed"].includes(trip.tripStatus)
                      ? router.push({
                          pathname: "/trip-progress/[id]",
                          params: { id: trip.tripId },
                        })
                      : trip.bookingStatus !== "Cancelled" && trip.paymentStatus === "Paid" && trip.tripStatus === "Completed"
                        ? router.push({
                            pathname: "/trip-completed/[id]",
                            params: { id: trip.tripId },
                          })
                        : router.push({ pathname: "/payment/[id]", params: { id: trip.id } })
                }
                style={[
                  styles.card,
                  index < data.length - 1 && styles.cardSpace,
                ]}
              >
                <View style={styles.topRow}>
                  <View style={styles.status}>
                    <Text style={styles.statusText}>
                      {tab === "upcoming" ? "Upcoming" : trip.bookingStatus}
                    </Text>
                  </View>
                  <Text style={styles.date}>
                    {formatDate(trip.departureAt)}
                  </Text>
                </View>
                <Text style={styles.route}>{trip.route}</Text>
                <View style={styles.driverRow}>
                  <View style={styles.avatar}>
                    {trip.driverProfileImageUrl ? (
                      <Image
                        source={{
                          uri: `${API_URL}${trip.driverProfileImageUrl}`,
                        }}
                        style={styles.avatarImage}
                        contentFit="cover"
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {initials(trip.driver)}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.driver}>{trip.driver}</Text>
                    <Text style={styles.meta}>
                      {trip.seats} seat{trip.seats === 1 ? "" : "s"} ·{" "}
                      {trip.tripStatus}
                    </Text>
                  </View>
                  <Text style={styles.amount}>{trip.amount}</Text>
                </View>
                <View style={styles.footer}>
                  <Text style={styles.payment}>{trip.paymentStatus}</Text>
                  <Text style={styles.view}>View trip ›</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {tab === "upcoming" ? "No upcoming trips" : "No past trips"}
            </Text>
            <Text style={styles.emptyText}>
              {tab === "upcoming"
                ? "Find a ride and your booking will appear here."
                : "Completed and cancelled trips will appear here."}
            </Text>
            {tab === "upcoming" ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/search")}
                style={styles.smallButton}
              >
                <Text style={styles.smallButtonText}>Find a Ride</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 105,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: TEXT,
    fontSize: 30,
    fontWeight: "800",
    flexShrink: 1,
    letterSpacing: -0.8
  },
  tabs: {
    marginTop: 24,
    height: 54,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderRadius: 18,
    borderColor: LINE,
    padding: 5
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    minHeight: 42,
    paddingVertical: 10,
    borderRadius: 13
  },
  tabActive: {
    borderBottomColor: GREEN,
    backgroundColor: Design.color.navy
  },
  tabText: { color: MUTED, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  state: { minHeight: 180, alignItems: "center", justifyContent: "center" },
  error: {
    marginTop: 12,
    padding: 16,
    borderRadius: Design.radius.card,
    backgroundColor: "#FFF1F0",
  },
  errorText: { color: "#B42318", fontSize: 14, flexShrink: 1 },
  list: { marginTop: 12 },
  card: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    backgroundColor: SURFACE,
    padding: 20,
    minHeight: 44,
    paddingVertical: 20,
    boxShadow: Design.shadow.card
  },
  cardSpace: { marginBottom: 14, minHeight: 44, paddingVertical: 16 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  status: {
    backgroundColor: Design.color.primarySoft,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  statusText: {
    color: Design.color.primary,
    fontSize: 10,
    fontWeight: "700",
    flexShrink: 1
  },
  date: { color: MUTED, fontSize: 12, flexShrink: 1 },
  route: {
    color: TEXT,
    fontSize: 21,
    fontWeight: "800",
    marginTop: 8,
    flexShrink: 1,
    lineHeight: 26,
    letterSpacing: -0.4
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    flexWrap: "wrap",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: Design.color.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: {
    color: GREEN_DARK,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  driver: { color: TEXT, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  meta: { color: MUTED, fontSize: 12, marginTop: 2, flexShrink: 1 },
  amount: {
    color: Design.color.primary,
    fontSize: 27,
    fontWeight: "800",
    flexShrink: 1
  },
  footer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: LINE,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  payment: { color: MUTED, fontSize: 12, flexShrink: 1 },
  view: { color: GREEN_DARK, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  empty: {
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
    lineHeight: 21,
    marginTop: 4,
    flexShrink: 1,
  },
  smallButton: {
    marginTop: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    boxShadow: Design.shadow.button
  },
  smallButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  primary: {
    marginTop: 14,
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  }
});

export default function TripsScreen() {
  const { mode } = useTravelMode();
  return mode === "driver" ? (
    <DriverRides embedded />
  ) : (
    <PassengerTripsScreen />
  );
}
