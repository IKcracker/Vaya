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

import { DriverEarnings, fetchDriverEarnings } from "@/lib/auth";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const GREEN = Design.color.primary;
const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function EarningsScreen() {
  const [retryVersion, setRetryVersion] = useState(0);
  const router = useRouter();
  const { session } = usePassengerAuth();
  const [data, setData] = useState<DriverEarnings | null>(null);
  const [loading, setLoading] = useState(Boolean(session));
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(
      () => {
        if (!session) return;
        setLoading(true);
        setError(null);
        let active = true;
        fetchDriverEarnings(session)
          .then((r) => {
            if (active) setData(r.earnings);
          })
          .catch((reason: unknown) => {
            if (active)
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Unable to load earnings",
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

  const max = useMemo(
    () => Math.max(1, ...(data?.chart.map((item) => item.amountCents) ?? [1])),
    [data],
  );
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Header title="Earnings" onBack={() => router.back()} />
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
        ) : data ? (
          <>
            <Text style={styles.label}>Total Earnings</Text>
            <Text style={styles.total}>{data.total}</Text>
            <Text style={styles.meta}>{data.thisMonth} this month</Text>
            <View style={styles.chartCard}>
              <View style={styles.chart}>
                {data.chart.map((item) => (
                  <View key={item.label} style={styles.barWrap}>
                    <View
                      style={[
                        styles.bar,
                        { height: Math.max(4, (100 * item.amountCents) / max) },
                      ]}
                    />
                  </View>
                ))}
              </View>
              <View style={styles.months}>
                {data.chart.map((item) => (
                  <Text key={item.label} style={styles.month}>
                    {item.label}
                  </Text>
                ))}
              </View>
            </View>
            <Text style={styles.sectionTitle}>Recent Payouts</Text>
            {data.payouts.length ? (
              <View style={styles.list}>
                {data.payouts.map((p, index) => (
                  <View
                    key={p.reference}
                    style={[
                      styles.row,
                      index < data.payouts.length - 1 && styles.border,
                    ]}
                  >
                    <View>
                      <Text style={styles.date}>{dateLabel(p.createdAt)}</Text>
                      <Text style={styles.route}>{p.route}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.amount}>{p.amount}</Text>
                      <Text style={styles.completed}>{p.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.state}>
                <Text style={styles.emptyTitle}>No settled earnings yet</Text>
                <Text style={styles.emptyText}>
                  Completed paid bookings from your trips will appear here.
                </Text>
              </View>
            )}
          </>
        ) : null}
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
  label: { color: MUTED, fontSize: 12, marginTop: 22, flexShrink: 1 },
  total: {
    color: TEXT,
    fontSize: 27,
    fontWeight: "600",
    letterSpacing: -0.5,
    marginTop: 3,
    flexShrink: 1,
  },
  meta: { color: MUTED, fontSize: 12, marginTop: 2, flexShrink: 1 },
  chartCard: {
    marginTop: 14,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    padding: 16,
  },
  chart: {
    height: 120,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  barWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: 110,
  },
  bar: { width: 18, borderRadius: 6, backgroundColor: GREEN },
  months: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  month: {
    flex: 1,
    textAlign: "center",
    color: MUTED,
    fontSize: 14,
    flexShrink: 1,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 22,
    marginBottom: 8,
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
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  border: { borderBottomWidth: 1, borderBottomColor: LINE },
  date: { color: TEXT, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  route: { color: MUTED, fontSize: 15, marginTop: 3, flexShrink: 1 },
  amount: { color: TEXT, fontSize: 24, fontWeight: "600", flexShrink: 1 },
  completed: {
    color: "#027A48",
    fontSize: 14,
    marginTop: 3,
    fontWeight: "600",
    flexShrink: 1,
  },
  state: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
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
    marginTop: 16,
    borderRadius: Design.radius.card,
    backgroundColor: "#FFF1F0",
    padding: 16,
  },
  errorText: { color: "#B42318", fontSize: 14, flexShrink: 1 },
});
