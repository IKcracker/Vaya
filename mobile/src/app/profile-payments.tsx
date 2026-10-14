import { RetryButton } from "@/components/retry-button";
import { Design } from "@/constants/design";
import { useState, useCallback } from "react";
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

import { fetchPassengerPayments, PassengerPayment } from "@/lib/auth";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const BLUE = Design.color.primary;
const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export default function ProfilePaymentsScreen() {
  const [retryVersion, setRetryVersion] = useState(0);
  const router = useRouter();
  const { session } = usePassengerAuth();
  const [payments, setPayments] = useState<PassengerPayment[]>([]);
  const [loading, setLoading] = useState(Boolean(session));
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(
      () => {
        if (!session) return;

        setLoading(true);
        setError(null);
        let active = true;

        fetchPassengerPayments(session)
          .then((response) => {
            if (active) setPayments(response.payments);
          })
          .catch((reason: unknown) => {
            if (active)
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Unable to load payments",
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
          <View>
            <Text style={styles.eyebrow}>ACCOUNT</Text>
            <Text style={styles.title}>Payments</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Payment attempts and settled transactions linked to your bookings.
        </Text>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={BLUE} />
            <Text style={styles.stateTitle}>Loading payments</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Couldn’t load payments</Text>
            <>
              <Text style={styles.errorText}>{error}</Text>
              <RetryButton onPress={() => setRetryVersion((v) => v + 1)} />
            </>
          </View>
        ) : payments.length ? (
          <View style={styles.list}>
            {payments.map((payment, index) => (
              <Pressable
                accessibilityRole="button"
                key={payment.reference}
                onPress={() =>
                  router.push({
                    pathname: "/payment/[id]",
                    params: { id: payment.bookingId },
                  })
                }
                style={[
                  styles.row,
                  index < payments.length - 1 && styles.border,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.route}>{payment.route}</Text>
                  <Text style={styles.meta}>
                    {payment.reference} · {formatDate(payment.createdAt)}
                  </Text>
                  <Text style={styles.method}>{payment.method}</Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.amount}>{payment.amount}</Text>
                  <Text
                    style={[
                      styles.status,
                      payment.status === "Settled"
                        ? styles.settled
                        : styles.pending,
                    ]}
                  >
                    {payment.status}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>No payment history yet</Text>
            <Text style={styles.stateText}>
              Payments will appear here after you start a booking checkout.
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
  subtitle: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 18,
    marginBottom: 16,
    flexShrink: 1,
  },
  stateCard: {
    minHeight: 170,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  stateTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
    flexShrink: 1,
  },
  stateText: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 4,
    flexShrink: 1,
  },
  errorCard: {
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FFF8F7",
    borderRadius: Design.radius.card,
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
  list: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    backgroundColor: SURFACE,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    padding: 15,
    minHeight: 64,
    paddingVertical: 10,
  },
  border: { borderBottomWidth: 1, borderBottomColor: LINE },
  route: { color: TEXT, fontSize: 15, fontWeight: "600", flexShrink: 1 },
  meta: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    flexShrink: 1,
  },
  method: {
    color: BLUE,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 5,
    flexShrink: 1,
  },
  right: { alignItems: "flex-end" },
  amount: { color: TEXT, fontSize: 24, fontWeight: "600", flexShrink: 1 },
  status: { marginTop: 6, fontSize: 12, fontWeight: "600", flexShrink: 1 },
  settled: { color: "#027A48" },
  pending: { color: "#B54708" },
});
