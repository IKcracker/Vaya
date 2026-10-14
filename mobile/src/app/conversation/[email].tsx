import { RetryButton } from "@/components/retry-button";
import { Design } from "@/constants/design";
import { useState, useCallback, useRef } from "react";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fetchMobileConversation,
  MobileMessage,
  sendMobileMessage,
} from "@/lib/auth";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const GREEN = Design.color.primary;
const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export default function ConversationScreen() {
  const [retryVersion, setRetryVersion] = useState(0);
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { session, user } = usePassengerAuth();
  const recipientEmail = typeof params.email === "string" ? params.email : "";
  const [name, setName] = useState(recipientEmail);
  const [route, setRoute] = useState("");
  const list = useRef<ScrollView>(null);
  const nearBottom = useRef(true);
  const [messages, setMessages] = useState<MobileMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(Boolean(session && recipientEmail));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myEmail = (user?.email ?? "").toLowerCase();
  const canSend =
    Boolean(session && recipientEmail) &&
    body.trim().length > 0 &&
    body.trim().length <= 2000 &&
    !sending &&
    !loading;

  useFocusEffect(
    useCallback(
      () => {
        if (!session || !recipientEmail) return;
        setLoading(true);
        setError(null);
        let active = true;
        let inFlight = false;
        const load = () => {
          if (inFlight) return;
          inFlight = true;
          fetchMobileConversation(session, recipientEmail)
            .then((response) => {
              if (!active) return;
              setName(response.conversation.participant.name);
              setRoute(response.conversation.participant.route);
              setError(null);
              setMessages((current) =>
                Array.from(
                  new Map(
                    [...current, ...response.conversation.messages].map(
                      (message) => [message.id, message],
                    ),
                  ).values(),
                ).sort(
                  (a, b) =>
                    new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
                ),
              );
            })
            .catch((reason: unknown) => {
              if (active)
                setError(
                  reason instanceof Error
                    ? reason.message
                    : "Unable to load conversation",
                );
            })
            .finally(() => {
              inFlight = false;
              if (active) setLoading(false);
            });
        };
        load();
        const timer = setInterval(load, 8000);
        return () => {
          clearInterval(timer);
          active = false;
        };
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps -- Retry and refresh counters intentionally reload this request.
      [recipientEmail, session, retryVersion],
    ),
  );

  const ordered = messages;

  async function submit() {
    if (!session || !canSend) return;
    setSending(true);
    setError(null);
    try {
      const response = await sendMobileMessage(session, {
        recipientEmail,
        body: body.trim(),
      });
      setMessages((current) =>
        current.some((message) => message.id === response.message.id)
          ? current
          : [...current, response.message],
      );
      nearBottom.current = true;
      setBody("");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to send message",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.back}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{name}</Text>
            <Text style={styles.route}>{route}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={GREEN} />
          </View>
        ) : (
          <ScrollView
            ref={list}
            keyboardShouldPersistTaps="handled"
            onScroll={({ nativeEvent }) => {
              nearBottom.current =
                nativeEvent.contentSize.height -
                  nativeEvent.layoutMeasurement.height -
                  nativeEvent.contentOffset.y <
                100;
            }}
            scrollEventThrottle={100}
            onContentSizeChange={() => {
              if (nearBottom.current)
                list.current?.scrollToEnd({ animated: true });
            }}
            style={{ flex: 1 }}
            contentContainerStyle={styles.messages}
            showsVerticalScrollIndicator={false}
          >
            {ordered.length ? (
              ordered.map((message) => {
                const mine = message.senderEmail.toLowerCase() === myEmail;
                return (
                  <View
                    key={message.id}
                    style={[styles.bubbleRow, mine && styles.bubbleRowMine]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        mine ? styles.bubbleMine : styles.bubbleOther,
                      ]}
                    >
                      <Text style={[styles.body, mine && styles.bodyMine]}>
                        {message.body}
                      </Text>
                      <Text style={[styles.time, mine && styles.timeMine]}>
                        {timeLabel(message.sentAt)}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Start the conversation</Text>
                <Text style={styles.emptyText}>
                  You are connected because of a shared Vaya trip.
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {error ? (
          <View style={styles.error}>
            <>
              <Text style={styles.errorText}>{error}</Text>
              <RetryButton onPress={() => setRetryVersion((v) => v + 1)} />
            </>
          </View>
        ) : null}

        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Write a message..."
            value={body}
            onChangeText={setBody}
            placeholder="Write a message..."
            placeholderTextColor="#98A2B3"
            style={styles.input}
            multiline
            maxLength={2000}
            editable={!sending}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={!canSend}
            onPress={() => void submit()}
            style={[styles.send, !canSend && styles.disabled]}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.sendText}>↑</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
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
  route: {
    color: "#1765F3",
    fontSize: 15,
    marginTop: 2,
    fontWeight: "600",
    flexShrink: 1,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  messages: { paddingVertical: 14, gap: 8 },
  bubbleRow: { alignItems: "flex-start" },
  bubbleRowMine: { alignItems: "flex-end" },
  bubble: {
    maxWidth: "80%",
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  bubbleMine: { backgroundColor: GREEN, borderBottomRightRadius: 4 },
  bubbleOther: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderBottomLeftRadius: 4,
  },
  body: { color: TEXT, fontSize: 14, lineHeight: 21, flexShrink: 1 },
  bodyMine: { color: "#FFFFFF" },
  time: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
    alignSelf: "flex-end",
    flexShrink: 1,
  },
  timeMine: { color: "#D7F5E8" },
  empty: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  emptyText: {
    color: MUTED,
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
    flexShrink: 1,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: LINE,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 52,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 14,
    backgroundColor: SURFACE,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TEXT,
    fontSize: 15,
    flexShrink: 1,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    flexShrink: 1,
  },
  disabled: { opacity: 0.45 },
  error: {
    marginBottom: 7,
    borderRadius: Design.radius.card,
    backgroundColor: "#FFF1F0",
    padding: 16,
  },
  errorText: { color: "#B42318", fontSize: 14, flexShrink: 1 },
});
