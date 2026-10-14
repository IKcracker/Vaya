import { RetryButton } from "@/components/retry-button";
import { ScreenState } from "@/components/screen-state";
import { Design } from "@/constants/design";
import { useState, useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchMobileMessageThreads, MobileMessageThread } from "@/lib/auth";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const GREEN = Design.color.primary;
const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function relativeTime(value: string) {
  if (!value) return "";
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return minutes <= 1 ? "now" : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function MessagesScreen() {
  const [retryVersion, setRetryVersion] = useState(0);
  const router = useRouter();
  const { session, loading: authLoading } = usePassengerAuth();
  const [threads, setThreads] = useState<MobileMessageThread[]>([]);
  const [loading, setLoading] = useState(Boolean(session));
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(
      () => {
        if (!session) return;
        setLoading(true);
        setError(null);
        let active = true;
        fetchMobileMessageThreads(session)
          .then((response) => {
            if (active) setThreads(response.threads);
          })
          .catch((reason: unknown) => {
            if (active)
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Unable to load messages",
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

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) return (
    <SafeAreaView style={styles.safe}>
      <ScreenState icon="messages" eyebrow="GOOD COMPANY" title={"Good journeys\nstart with hello."} description={"Coordinate your pickup and stay in touch with your driver, right here in Vaya."} action="Sign in" onPress={() => router.push({ pathname: "/auth", params: { next: "/messages" } })} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/help-support")}
            style={styles.helpButton}
          >
            <Text style={styles.helpText}>?</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.error}>
            <>
              <Text style={styles.errorText}>{error}</Text>
              <RetryButton onPress={() => setRetryVersion((v) => v + 1)} />
            </>
          </View>
        ) : null}

        {threads.length ? (
          <View style={styles.list}>
            {threads.map((thread, index) => (
              <Pressable
                accessibilityRole="button"
                key={thread.id}
                onPress={() =>
                  router.push({
                    pathname: "/conversation/[email]",
                    params: { email: thread.participant.email },
                  })
                }
                style={({ pressed }) => [
                  styles.row,
                  index < threads.length - 1 && styles.border,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {initials(thread.participant.name)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{thread.participant.name}</Text>
                    <Text style={styles.time}>
                      {relativeTime(thread.lastAt)}
                    </Text>
                  </View>
                  <Text style={styles.route}>{thread.route}</Text>
                  <Text
                    style={[
                      styles.preview,
                      thread.unread && styles.previewUnread,
                    ]}
                    numberOfLines={1}
                  >
                    {thread.lastMessage}
                  </Text>
                </View>
                {thread.unread ? <View style={styles.unreadDot} /> : null}
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyText}>
              After you book or drive a trip, the people connected to that trip
              will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  primary: {
    minHeight: 52,
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingHorizontal: 24,
    justifyContent: "center",
    marginTop: 20,
  },
  primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  safe: { flex: 1, backgroundColor: BG },
  page: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 120,
    minHeight: "100%",
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  pressed: { opacity: 0.72 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    minHeight: 48,
  },
  title: {
    color: TEXT,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
    flexShrink: 1
  },
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Design.color.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  helpText: {
    color: "#1765F3",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  list: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 23,
    overflow: "hidden",
    boxShadow: Design.shadow.card
  },
  row: {
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    paddingVertical: 19
  },
  border: { borderBottomWidth: 1, borderBottomColor: LINE },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 17,
    backgroundColor: Design.color.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    color: "#1765F3",
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  name: { color: TEXT, fontSize: 16, fontWeight: "600", flexShrink: 1 },
  time: { color: "#98A2B3", fontSize: 12, fontWeight: "700", flexShrink: 1 },
  route: {
    color: "#1765F3",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
    flexShrink: 1,
  },
  preview: { color: MUTED, fontSize: 14, marginTop: 6, flexShrink: 1 },
  previewUnread: { color: TEXT, fontWeight: "600" },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN },
  empty: {
    minHeight: 220,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    marginTop: 8,
  },
  emptyTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  emptyText: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
    flexShrink: 1,
  },
  error: {
    marginBottom: 10,
    borderRadius: Design.radius.card,
    backgroundColor: "#FFF1F0",
    padding: 16,
  },
  errorText: { color: "#B42318", fontSize: 14, flexShrink: 1 }
});
