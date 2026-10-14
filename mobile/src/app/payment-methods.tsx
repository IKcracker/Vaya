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

import { fetchPassengerPayments, PassengerPayment } from "@/lib/auth";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const GREEN = Design.color.primary;
const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

export default function PaymentMethodsScreen() {
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
          .then((r) => {
            if (active) setPayments(r.payments);
          })
          .catch((reason: unknown) => {
            if (active)
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Unable to load payment activity",
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
  const methods = useMemo(
    () => Array.from(new Set(payments.map((p) => p.method).filter(Boolean))),
    [payments],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Header title="Payment Methods" onBack={() => router.back()} />
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Secure checkout</Text>
          <Text style={styles.noticeText}>
            Vaya uses Paystack for payment processing. Saved card numbers are
            not stored in the Vaya database.
          </Text>
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
        ) : (
          <>
            <Text style={styles.section}>AVAILABLE CHECKOUT</Text>
            <View style={styles.list}>
              <View style={styles.row}>
                <View style={styles.brand}>
                  <Text style={styles.brandText}>P</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.number}>Paystack</Text>
                  <Text style={styles.meta}>
                    Secure card and supported payment checkout
                  </Text>
                </View>
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Active</Text>
                </View>
              </View>
            </View>
            <Text style={styles.section}>PAYMENT ACTIVITY</Text>
            {payments.length ? (
              <View style={styles.list}>
                {payments.slice(0, 8).map((p, index) => (
                  <Pressable
                    accessibilityRole="button"
                    key={p.reference}
                    onPress={() =>
                      router.push({
                        pathname: "/payment/[id]",
                        params: { id: p.bookingId },
                      })
                    }
                    style={[
                      styles.row,
                      index < Math.min(payments.length, 8) - 1 && styles.border,
                    ]}
                  >
                    <View style={styles.brand}>
                      <Text style={styles.brandText}>
                        {p.method.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.number}>
                        {p.amount} · {p.route}
                      </Text>
                      <Text style={styles.meta}>
                        {p.method} · {p.status}
                      </Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.state}>
                <Text style={styles.emptyTitle}>No payments yet</Text>
                <Text style={styles.emptyText}>
                  Your real checkout history will appear here after your first
                  booking.
                </Text>
              </View>
            )}
            {methods.length > 1 ? (
              <Text style={styles.methods}>
                Previously used: {methods.join(", ")}
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack}
        style={styles.back}
      >
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: 38 }} />
    </View>
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
  notice: {
    marginTop: 18,
    backgroundColor: Design.color.primarySoft,
    borderRadius: Design.radius.card,
    padding: 16,
  },
  noticeTitle: {
    color: "#1765F3",
    fontSize: 18,
    fontWeight: "600",
    flexShrink: 1,
  },
  noticeText: {
    color: "#1765F3",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 3,
    flexShrink: 1,
  },
  section: {
    color: MUTED,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 7,
    flexShrink: 1,
  },
  list: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    overflow: "hidden",
  },
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 12,
    paddingVertical: 10,
  },
  border: { borderBottomWidth: 1, borderBottomColor: LINE },
  brand: {
    width: 38,
    height: 28,
    borderRadius: 7,
    backgroundColor: "#0B1730",
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  number: { color: TEXT, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  meta: { color: MUTED, fontSize: 12, marginTop: 3, flexShrink: 1 },
  defaultBadge: {
    backgroundColor: "#ECFDF3",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  defaultText: {
    color: "#027A48",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  chevron: { color: "#98A2B3", fontSize: 21, flexShrink: 1 },
  state: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  emptyText: {
    color: MUTED,
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    flexShrink: 1,
  },
  methods: {
    color: MUTED,
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
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
