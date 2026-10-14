import { RetryButton } from "@/components/retry-button";
import { Design } from "@/constants/design";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useMemo, useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fetchPassengerBooking,
  cancelPassengerBooking,
  initializePassengerPayment,
  PassengerBookingDetail,
  verifyPassengerPayment,
} from "@/lib/auth";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";
import { canReleaseReservation } from "@/lib/trip-state";

const BLUE = Design.color.primary;
const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

export default function PaymentScreen() {
  const [retryVersion, setRetryVersion] = useState(0);
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const bookingId = typeof params.id === "string" ? params.id : "";

  const { loading: authLoading, session, refresh } = usePassengerAuth();
  const [booking, setBooking] = useState<PassengerBookingDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(session && bookingId));
  const [initializing, setInitializing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const checkoutLock = useRef(false);
  const verifyLock = useRef(false);

  useFocusEffect(
    useCallback(
      () => {
        if (!session || !bookingId) return;

        setLoading(true);
        setNow(Date.now());
        setError(null);
        setBooking(null);
        let active = true;

        fetchPassengerBooking(session, bookingId)
          .then((response) => {
            if (active) setBooking(response.booking);
          })
          .catch((reason: unknown) => {
            if (active) {
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Unable to load payment details",
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
      [bookingId, session, retryVersion],
    ),
  );

  const latestPendingReference = useMemo(
    () =>
      booking?.payments.find((payment) => payment.status === "Pending")
        ?.reference ?? null,
    [booking],
  );

  async function reloadBooking() {
    if (!session || !bookingId) return;

    const response = await fetchPassengerBooking(session, bookingId);
    setBooking(response.booking);
  }

  async function checkPayment(paymentReference?: string | null) {
    if (!session || verifyLock.current || releasing) return;

    const ref = paymentReference || reference || latestPendingReference;

    if (!ref) {
      setError(
        "Start checkout first so Vaya has a payment reference to verify.",
      );
      return;
    }

    verifyLock.current = true;
    setVerifying(true);
    setError(null);
    setMessage(null);

    try {
      const response = await verifyPassengerPayment(session, ref);
      setReference(ref);

      if (response.payment.status === "Settled") {
        await reloadBooking();
        void refresh().catch(() => {});
        setMessage("Payment confirmed. Your booking is now confirmed.");
      } else {
        await reloadBooking();
        setMessage(
          `Paystack reports this payment as ${response.payment.status}. You can check again after completing checkout.`,
        );
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to verify payment status",
      );
    } finally {
      verifyLock.current = false;
      setVerifying(false);
    }
  }

  async function startCheckout() {
    if (!session || !bookingId || checkoutLock.current || verifyLock.current || releasing ||
        !booking || ["Cancelled", "Completed"].includes(booking.status)) return;

    checkoutLock.current = true;
    setInitializing(true);
    setConfirmRelease(false);
    setError(null);
    setMessage(null);

    try {
      const response = await initializePassengerPayment(session, bookingId);
      const payment = response.payment;
      setReference(payment.reference);
      setBooking((current) => current ? { ...current, payments: [{
        reference: payment.reference, amountCents: payment.amountCents,
        amount: payment.amount, method: "Paystack", status: "Pending", createdAt: new Date().toISOString(),
      }, ...current.payments] } : current);

      await WebBrowser.openBrowserAsync(payment.authorizationUrl);
      await checkPayment(payment.reference);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to start checkout",
      );
    } finally {
      checkoutLock.current = false;
      setInitializing(false);
    }
  }

  async function releaseReservation() {
    if (!session || !booking || !canReleaseReservation(booking, Date.now()) || checkoutLock.current || verifyLock.current) return;
    checkoutLock.current = true;
    setReleasing(true);
    setError(null);
    try {
      await cancelPassengerBooking(session, bookingId);
      setBooking((current) => current ? { ...current, status: "Cancelled" } : current);
      setConfirmRelease(false);
      void refresh().catch(() => {});
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to release reservation");
      setConfirmRelease(false);
    } finally {
      checkoutLock.current = false;
      setReleasing(false);
    }
  }

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator color={BLUE} />
          <Text style={styles.stateTitle}>Loading payment</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Sign in to pay</Text>
          <Text style={styles.stateText}>
            Vaya needs your passenger session to verify that this booking
            belongs to you.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/auth",
                params: { next: `/payment/${encodeURIComponent(bookingId)}` },
              })
            }
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          >
            <Text style={styles.primaryText}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Payment unavailable</Text>
          <Text style={styles.stateText}>
            {error || "This booking could not be loaded."}
          </Text>
          <RetryButton onPress={() => setRetryVersion((value) => value + 1)} />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/trips")}
            style={({ pressed }) => [
              styles.secondary,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryText}>Back to trips</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const paid = booking.paymentStatus === "Paid";

  if (booking.status === "Cancelled" || (booking.status === "Completed" && !paid)) {
    return <SafeAreaView style={styles.safe}><View style={styles.centerState}>
      <Text style={styles.stateTitle}>{booking.status === "Cancelled" ? "Booking cancelled" : "This ride has ended"}</Text>
      <Text style={styles.stateText}>{paid
        ? "This ride was cancelled after payment. Contact Vaya support for refund assistance."
        : "This reservation is closed and cannot accept payment."}</Text>
      <Pressable accessibilityRole="button" onPress={() => router.replace("/trips")} style={styles.primary}>
        <Text style={styles.primaryText}>Back to my trips</Text>
      </Pressable>
      {paid ? <Pressable accessibilityRole="button" onPress={() => router.push("/help-support")} style={styles.secondary}>
        <Text style={styles.secondaryText}>Contact support</Text>
      </Pressable> : null}
    </View></SafeAreaView>;
  }

  if (paid) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successPage}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Payment confirmed</Text>
          <Text style={styles.successCopy}>
            Your booking is paid and confirmed in Vaya.
          </Text>

          <View style={styles.summary}>
            <Row label="Booking" value={booking.id} />
            <Row label="Trip" value={booking.trip.route} />
            <Row label="Amount" value={booking.amount} />
            <Row label="Payment" value={booking.paymentStatus} />
            <Row label="Status" value={booking.status} />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/trips")}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          >
            <Text style={styles.primaryText}>View my trips</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>SECURE PAYMENT</Text>
            <Text style={styles.title}>{booking.id}</Text>
          </View>
        </View>

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount due</Text>
          <Text style={styles.amount}>{booking.amount}</Text>
          <Text style={styles.amountMeta}>{booking.trip.route}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Pay securely with Paystack</Text>
          <Text style={styles.infoText}>
            Checkout opens in Paystack’s hosted payment page. Card and supported
            South African payment methods are processed there; Vaya never
            receives your card details.
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Row label="Booking status" value={booking.status} />
          <Row label="Payment status" value={booking.paymentStatus} />
          <Row label="Seats" value={String(booking.seats)} />
          <Row
            label="Latest attempt"
            value={
              reference ||
              latestPendingReference ||
              booking.payments[0]?.status ||
              "Not started"
            }
          />
        </View>

        {message ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Payment issue</Text>
            <>
              <Text style={styles.errorText}>{error}</Text>
              <RetryButton onPress={() => setRetryVersion((v) => v + 1)} />
            </>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={initializing || verifying || releasing}
          onPress={() => void startCheckout()}
          style={({ pressed }) => [
            styles.primary,
            (initializing || verifying || releasing) && styles.primaryDisabled,
            pressed && !initializing && styles.pressed,
          ]}
        >
          {initializing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>Pay {booking.amount}</Text>
          )}
        </Pressable>

        {reference || latestPendingReference ? (
          <Pressable
            accessibilityRole="button"
            disabled={verifying || initializing || releasing}
            onPress={() => void checkPayment()}
            style={({ pressed }) => [
              styles.secondary,
              verifying && styles.secondaryDisabled,
              pressed && !verifying && styles.pressed,
            ]}
          >
            {verifying ? (
              <ActivityIndicator color={BLUE} />
            ) : (
              <Text style={styles.secondaryText}>Check payment status</Text>
            )}
          </Pressable>
        ) : null}
        {canReleaseReservation(booking, now) ? <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{confirmRelease ? "Release your reserved seats?" : "Plans changed?"}</Text>
          <Text style={styles.infoText}>You can release this unpaid reservation before starting checkout. Your seats will become available to other passengers.</Text>
          <Pressable accessibilityRole="button" disabled={initializing || verifying || releasing}
            onPress={() => confirmRelease ? void releaseReservation() : setConfirmRelease(true)} style={styles.secondary}>
            {releasing ? <ActivityIndicator color={BLUE} /> : <Text style={styles.secondaryText}>{confirmRelease ? "Confirm release" : "Release reservation"}</Text>}
          </Pressable>
          {confirmRelease ? <Pressable accessibilityRole="button" disabled={releasing} onPress={() => setConfirmRelease(false)} style={styles.secondary}>
            <Text style={styles.secondaryText}>Keep reservation</Text>
          </Pressable> : null}
        </View> : <Pressable accessibilityRole="button" onPress={() => router.push("/help-support")} style={styles.secondary}>
          <Text style={styles.secondaryText}>Get help with this booking</Text>
        </Pressable>}

        <Text style={styles.footerNote}>
          Vaya marks a booking paid only after the server verifies the Paystack
          transaction reference and amount.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
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
    paddingBottom: 40,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  pressed: { opacity: 0.72 },
  centerState: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
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
    maxWidth: 310,
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
  amountCard: {
    marginTop: 22,
    borderRadius: Design.radius.card,
    backgroundColor: "#102C60",
    padding: 18,
  },
  amountLabel: {
    color: "#8FA0B8",
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  amount: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "600",
    letterSpacing: -0.8,
    marginTop: 5,
    flexShrink: 1,
  },
  amountMeta: { color: "#A9B6CA", fontSize: 12, marginTop: 5, flexShrink: 1 },
  infoCard: {
    marginTop: 16,
    backgroundColor: Design.color.primarySoft,
    borderRadius: Design.radius.card,
    padding: 16,
  },
  infoTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  infoText: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
    flexShrink: 1,
  },
  statusCard: {
    marginTop: 16,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    paddingHorizontal: 15,
  },
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    gap: 12,
  },
  rowLabel: { color: MUTED, fontSize: 12, fontWeight: "700", flexShrink: 1 },
  rowValue: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "600",
    maxWidth: "62%",
    textAlign: "right",
    flexShrink: 1,
  },
  messageCard: {
    marginTop: 14,
    borderRadius: Design.radius.card,
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#ABEFC6",
    padding: 16,
  },
  messageText: {
    color: "#027A48",
    fontSize: 14,
    lineHeight: 21,
    flexShrink: 1,
  },
  errorCard: {
    marginTop: 14,
    borderRadius: Design.radius.card,
    backgroundColor: "#FFF8F7",
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 16,
  },
  errorTitle: {
    color: "#B42318",
    fontSize: 18,
    fontWeight: "600",
    flexShrink: 1,
  },
  errorText: {
    color: "#B42318",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
    flexShrink: 1,
  },
  primary: {
    marginTop: 18,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  primaryDisabled: { backgroundColor: "#B7D5FA" },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  secondary: {
    marginTop: 10,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  secondaryDisabled: { opacity: 0.5 },
  secondaryText: {
    color: BLUE,
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  footerNote: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 14,
    paddingHorizontal: 12,
    flexShrink: 1,
  },
  successPage: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  successIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#ECFDF3",
    alignItems: "center",
    justifyContent: "center",
  },
  successIconText: {
    color: "#12B76A",
    fontSize: 28,
    fontWeight: "600",
    flexShrink: 1,
  },
  successTitle: {
    color: TEXT,
    fontSize: 25,
    fontWeight: "600",
    marginTop: 18,
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  successCopy: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 7,
    maxWidth: 320,
    flexShrink: 1,
  },
  summary: {
    width: "100%",
    marginTop: 24,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 16,
    paddingHorizontal: 15,
  },
});
