import { RetryButton } from "@/components/retry-button";
import { SymbolView } from "expo-symbols";
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

import { fetchMobileNotifications, MobileNotification } from "@/lib/auth";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const GREEN = Design.color.primary;
const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

function iconFor(kind: string) {
  if (kind === "payment")
    return { ios: "creditcard", android: "payments", web: "payments" } as const;
  if (kind === "verification")
    return {
      ios: "checkmark.shield",
      android: "verified_user",
      web: "verified_user",
    } as const;
  return {
    ios: "car",
    android: "directions_car",
    web: "directions_car",
  } as const;
}
function toneFor(kind: string) {
  if (kind === "payment" || kind === "verification") return "#ECFDF3";
  return "#FFF4E8";
}
function relative(value: string) {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "now" : `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function NotificationsScreen() {
  const [retryVersion, setRetryVersion] = useState(0);
  const router = useRouter();
  const { session } = usePassengerAuth();
  const [items, setItems] = useState<MobileNotification[]>([]);
  const [loading, setLoading] = useState(Boolean(session));
  const [tab, setTab] = useState<"all" | "recent">("all");
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  useFocusEffect(
    useCallback(
      () => {
        if (!session) return;
        setLoading(true);
        setError(null);
        let active = true;
        fetchMobileNotifications(session)
          .then((r) => {
            if (active) setItems(r.notifications);
          })
          .catch((reason: unknown) => {
            if (active)
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Unable to load notifications",
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
  const visible = useMemo(
    () =>
      tab === "all"
        ? items
        : items.filter(
            (item) =>
              now - new Date(item.createdAt).getTime() < 24 * 60 * 60 * 1000,
          ),
    [items, now, tab],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Header title="Notifications" onBack={() => router.back()} />
        <View style={styles.tabs}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setTab("all")}
            style={[styles.tab, tab === "all" && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, tab === "all" && styles.tabTextActive]}
            >
              All
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setTab("recent")}
            style={[styles.tab, tab === "recent" && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, tab === "recent" && styles.tabTextActive]}
            >
              Last 24h
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
        ) : visible.length ? (
          <View style={styles.list}>
            {visible.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.row,
                  index < visible.length - 1 && styles.border,
                ]}
              >
                <View
                  style={[styles.icon, { backgroundColor: toneFor(item.kind) }]}
                >
                  <SymbolView
                    name={iconFor(item.kind)}
                    size={20}
                    tintColor={GREEN}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowText}>{item.text}</Text>
                </View>
                <Text style={styles.time}>{relative(item.createdAt)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.state}>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              Trip, payment and verification updates will appear here.
            </Text>
          </View>
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
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 10,
  },
  tabActive: { backgroundColor: GREEN },
  tabText: { color: MUTED, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  tabTextActive: { color: "#FFFFFF" },
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
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 11,
  },
  border: { borderBottomWidth: 1, borderBottomColor: LINE },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 16, fontWeight: "600", flexShrink: 1 },
  rowTitle: { color: TEXT, fontSize: 15, fontWeight: "600", flexShrink: 1 },
  rowText: { color: MUTED, fontSize: 14, marginTop: 3, flexShrink: 1 },
  time: { color: "#98A2B3", fontSize: 12, flexShrink: 1 },
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
    marginTop: 12,
    borderRadius: Design.radius.card,
    backgroundColor: "#FFF1F0",
    padding: 16,
  },
  errorText: { color: "#B42318", fontSize: 14, flexShrink: 1 },
});
