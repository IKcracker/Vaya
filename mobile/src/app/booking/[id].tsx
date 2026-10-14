import { useTripOwnership } from "@/hooks/use-trip-ownership";
import { useTravelMode } from "@/providers/travel-mode-provider";
import { RetryButton } from "@/components/retry-button";
import { Design } from "@/constants/design";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createAuthenticatedBooking } from "@/lib/auth";
import { getTrip, PublicTrip } from "@/lib/api";
import { parseSeatCount } from "@/lib/trip-state";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const GREEN = Design.color.primary;
const BG = Design.color.background;
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

type CreatedBooking = {
  id: string;
  status: string;
  paymentStatus: string;
  seats: number;
  amount: string;
  trip: { id: string; route: string; departureAt: string };
};

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; seats?: string }>();
  const tripId = typeof params.id === "string" ? params.id : "";
  const seats = parseSeatCount(params.seats);
  const ownership = useTripOwnership(tripId);
  const { mode, setMode, loading: modeLoading } = useTravelMode();
  const { loading, session, passenger, refresh } = usePassengerAuth();
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<CreatedBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trip, setTrip] = useState<PublicTrip | null>(null);
  const [tripLoading, setTripLoading] = useState(true);
  const [tripError, setTripError] = useState<string | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const submission = useRef(false);
  useFocusEffect(useCallback(() => {
    if (!tripId || booking) { setTripLoading(false); return; }
    let active = true;
    setTripLoading(true);
    setNow(Date.now());
    setTripError(null);
    getTrip(tripId).then((response) => {
      if (active) setTrip(response.trip);
    }).catch((reason: unknown) => {
      if (active) setTripError(reason instanceof Error ? reason.message : "Unable to load ride details");
    }).finally(() => { if (active) setTripLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Explicit retry reloads the quote.
  }, [tripId, booking, retryVersion]));
  const available = Boolean(trip && seats !== null && trip.availableSeats >= seats &&
    ["Scheduled", "On schedule", "Boarding", "Full"].includes(trip.status) &&
    new Date(trip.departureAt).getTime() > now);
  const total = trip && seats !== null ? new Intl.NumberFormat("en-ZA", {
    style: "currency", currency: "ZAR",
  }).format(trip.fareCents * seats / 100) : "—";

  async function confirmBooking() {
    if (
      !session ||
      !passenger ||
      !tripId ||
      submission.current ||
      !trip || seats === null || !available || tripLoading || tripError ||
      modeLoading || booking ||
      !ownership.checked ||
      ownership.owned ||
      mode !== "passenger"
    )
      return;
    submission.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const r = await createAuthenticatedBooking(session, { tripId, seats, expectedFareCents: trip.fareCents });
      setBooking(r.booking);
      void refresh().catch(() => {});
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to create booking",
      );
    } finally {
      submission.current = false;
      setSubmitting(false);
    }
  }

  if (loading || modeLoading)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={GREEN} />
        </View>
      </SafeAreaView>
    );
  if (!session)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>Sign in to book</Text>
          <Text style={styles.centerText}>
            Use your Vaya account to reserve seats and keep your trips together.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/auth",
                params: {
                  next: `/booking/${encodeURIComponent(tripId)}?seats=${seats}`,
                },
              })
            }
            style={styles.primary}
          >
            <Text style={styles.primaryText}>Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  if (ownership.owned || mode === "driver")
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>
            {ownership.owned ? "This is your ride" : "You’re in driver mode"}
          </Text>
          <Text style={styles.centerText}>
            {ownership.owned
              ? "Drivers manage their own rides. You cannot reserve a passenger seat on this trip."
              : "Switch to passenger mode to book a ride with another driver."}
          </Text>
          <Pressable
            accessibilityRole="button"
            style={styles.primary}
            onPress={() => {
              if (ownership.owned) {
                setMode("driver");
                router.replace({
                  pathname: "/driver-trip/[id]",
                  params: { id: tripId },
                });
              } else {
                setMode("passenger");
              }
            }}
          >
            <Text style={styles.primaryText}>
              {ownership.owned ? "Manage your ride" : "Switch to passenger"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  if (!passenger)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>Complete your profile</Text>
          <Text style={styles.centerText}>
            A passenger profile is required before booking.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/profile")}
            style={styles.primary}
          >
            <Text style={styles.primaryText}>Open Profile</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );

  if (booking)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.success}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Seats reserved</Text>
          <Text style={styles.successText}>
            Your seat is reserved and waiting for payment.
          </Text>
          <View style={styles.summaryList}>
            <Row label="Route" value={booking.trip.route} />
            <Row label="Seats" value={String(booking.seats)} />
            <Row label="Amount" value={booking.amount} />
            <Row label="Payment" value={booking.paymentStatus} last />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.replace({
                pathname: "/payment/[id]",
                params: { id: booking.id },
              })
            }
            style={styles.primary}
          >
            <Text style={styles.primaryText}>Pay Now · {booking.amount}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/trips")}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>View My Trips</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.back}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Booking</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>Seats</Text>
            <Text style={styles.summaryValue}>{seats}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.summaryLabel}>Status</Text>
            <Text style={styles.summaryValue}>Awaiting payment</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Passenger</Text>
        <View style={styles.accountCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {passenger.name
                .split(" ")
                .filter(Boolean)
                .map((v) => v[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{passenger.name}</Text>
            <Text style={styles.meta}>{passenger.email}</Text>
            <Text style={styles.meta}>{passenger.city}</Text>
          </View>
          <Text style={styles.verified}>✓</Text>
        </View>

        <Text style={styles.sectionTitle}>Booking summary</Text>
        <View style={styles.summaryList}>
          {trip ? <>
            <Row label="Route" value={`${trip.from} → ${trip.to}`} />
            <Row label="Departure" value={new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(trip.departureAt))} />
            <Row label="Driver" value={trip.driver.name} />
            <Row label="Fare per seat" value={trip.fare} />
          </> : null}
          <Row label="Seats" value={String(seats)} />
          <Row label="Total due" value={total} last />
        </View>

        {tripLoading ? <ActivityIndicator color={GREEN} /> : tripError ? <View style={styles.error}>
          <Text style={styles.errorText}>{tripError}</Text>
          <RetryButton onPress={() => setRetryVersion((value) => value + 1)} />
        </View> : !available ? <View style={styles.error}>
          <Text style={styles.errorText}>{seats === null ? "Choose between 1 and 8 seats." : "This ride is no longer available for the requested seats."}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace("/search")} style={styles.secondary}>
            <Text style={styles.secondaryText}>Find another ride</Text>
          </Pressable>
        </View> : null}

        {ownership.error ? (
          <View style={styles.error}>
            <Text style={styles.errorText}>{ownership.error}</Text>
            <RetryButton onPress={ownership.retry} />
          </View>
        ) : null}
        {error ? (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorText}>If your connection was interrupted, check My Trips before reserving again.</Text>
            <Pressable accessibilityRole="button" onPress={() => router.replace("/trips")} style={styles.secondary}>
              <Text style={styles.secondaryText}>Check My Trips</Text>
            </Pressable>
            <RetryButton onPress={() => { setError(null); setRetryVersion((value) => value + 1); }} />
          </View>
        ) : null}
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Seat availability is rechecked</Text>
          <Text style={styles.noticeText}>
            Vaya confirms the booking only if your requested seats are still
            available.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={submitting || !tripId || !ownership.checked || tripLoading || Boolean(tripError) || !available}
          onPress={() => void confirmBooking()}
          style={[
            styles.primary,
            (submitting || !tripId || !ownership.checked || tripLoading || Boolean(tripError) || !available) && styles.disabled,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>
              {ownership.checked ? "Confirm Booking" : "Checking ride…"}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
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
  title: { color: TEXT, fontSize: 26, fontWeight: "600", flexShrink: 1 },
  centerText: {
    color: MUTED,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 5,
    maxWidth: 260,
    flexShrink: 1,
  },
  summaryCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: { color: MUTED, fontSize: 12, flexShrink: 1 },
  summaryValue: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
    flexShrink: 1,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 26,
    marginBottom: 12,
    flexShrink: 1,
  },
  accountCard: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Design.color.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#1765F3",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  name: { color: TEXT, fontSize: 15, fontWeight: "600", flexShrink: 1 },
  meta: { color: MUTED, fontSize: 12, marginTop: 1, flexShrink: 1 },
  verified: { color: GREEN, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  summaryList: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 9,
    overflow: "hidden",
  },
  row: {
    minHeight: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: LINE },
  rowLabel: { color: MUTED, fontSize: 12, flexShrink: 1 },
  rowValue: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "600",
    maxWidth: "65%",
    textAlign: "right",
    flexShrink: 1,
  },
  notice: {
    marginTop: 12,
    borderRadius: Design.radius.card,
    backgroundColor: "#ECFDF3",
    padding: 16,
  },
  noticeTitle: {
    color: "#1765F3",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  noticeText: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 2,
    flexShrink: 1,
  },
  error: {
    marginTop: 12,
    borderRadius: Design.radius.card,
    backgroundColor: "#FFF1F0",
    padding: 16,
  },
  errorText: { color: "#B42318", fontSize: 14, flexShrink: 1 },
  primary: {
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  secondary: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingVertical: 10,
  },
  secondaryText: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  disabled: { opacity: 0.45 },
  success: {
    flex: 1,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "stretch",
  },
  successIcon: {
    alignSelf: "center",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ECFDF3",
    alignItems: "center",
    justifyContent: "center",
  },
  successIconText: {
    color: GREEN,
    fontSize: 22,
    fontWeight: "600",
    flexShrink: 1,
  },
  successTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
    flexShrink: 1,
  },
  successText: {
    color: MUTED,
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 18,
    flexShrink: 1,
  },
});
