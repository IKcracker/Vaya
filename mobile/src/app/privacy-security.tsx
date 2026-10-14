import { stopBackgroundDriverTracking } from "@/lib/background-driver-location";
import { RetryButton } from "@/components/retry-button";
import { Design } from "@/constants/design";
import { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fetchMobilePrivacyPreferences,
  MobilePrivacyPreferences,
  updateMobilePrivacyPreferences,
} from "@/lib/auth";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const GREEN = Design.color.primary;
const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

export default function PrivacySecurityScreen() {
  const [retryVersion, setRetryVersion] = useState(0);
  const router = useRouter();
  const { session } = usePassengerAuth();
  const [prefs, setPrefs] = useState<MobilePrivacyPreferences | null>(null);
  const [loading, setLoading] = useState(Boolean(session));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(
      () => {
        if (!session) return;
        setLoading(true);
        setError(null);
        let active = true;
        fetchMobilePrivacyPreferences(session)
          .then((r) => {
            if (active) setPrefs(r.preferences);
          })
          .catch((reason: unknown) => {
            if (active)
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Unable to load privacy settings",
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

  async function update(key: keyof MobilePrivacyPreferences, value: boolean) {
    if (!session || !prefs || saving) return;
    const previous = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    setError(null);
    try {
      const response = await updateMobilePrivacyPreferences(session, {
        [key]: value,
      });
      setPrefs(response.preferences);
      if (key === "locationSharing" && !value) {
        await stopBackgroundDriverTracking().catch(() => {
          setError(
            "Location sharing is off. Restart the app if this device still shows the location indicator.",
          );
        });
      }
    } catch (reason) {
      setPrefs(previous);
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to save privacy settings",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Header title="Privacy & Security" onBack={() => router.back()} />
        {loading ? (
          <View style={styles.state}>
            <ActivityIndicator color={GREEN} />
          </View>
        ) : prefs ? (
          <>
            <Text style={styles.section}>PRIVACY</Text>
            <View style={styles.card}>
              <ToggleRow
                title="Profile photo visibility"
                note="Display your profile photo to other travellers"
                disabled={saving}
                value={prefs.profileVisible}
                onValueChange={(v) => void update("profileVisible", v)}
              />
              <ToggleRow
                disabled={saving}
                title="Share driver phone number"
                note="Let confirmed passengers call you about their trip"
                value={prefs.sharePhone}
                onValueChange={(v) => void update("sharePhone", v)}
              />
              <ToggleRow
                disabled={saving}
                title="Location Sharing"
                note="Allow trip location sharing during active journeys"
                value={prefs.locationSharing}
                onValueChange={(v) => void update("locationSharing", v)}
                last
              />
            </View>
            <Text style={styles.section}>SECURITY</Text>
            <View style={styles.card}>
              <InfoRow
                title="Authentication"
                note="Secure Vaya session active on this device"
              />
            </View>
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>Security controls</Text>
              <Text style={styles.noticeText}>
                Use Forgot password on the sign-in screen to receive a secure
                password reset link.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/auth")}
              >
                <Text style={styles.saving}>Manage password →</Text>
              </Pressable>
            </View>
          </>
        ) : null}
        {saving ? <Text style={styles.saving}>Saving…</Text> : null}
        {error ? (
          <View style={styles.error}>
            <>
              <Text style={styles.errorText}>{error}</Text>
              <RetryButton onPress={() => setRetryVersion((v) => v + 1)} />
            </>
          </View>
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
function ToggleRow({
  title,
  note,
  value,
  onValueChange,
  last,
  disabled,
}: {
  title: string;
  note: string;
  disabled?: boolean;
  value: boolean;
  onValueChange: (value: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.border]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowNote}>{note}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        disabled={disabled}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#D0D5DD", true: "#A6F4C5" }}
        thumbColor={value ? GREEN : "#FFFFFF"}
      />
    </View>
  );
}
function InfoRow({
  title,
  note,
  last,
}: {
  title: string;
  note: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.border]}>
      <View>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowNote}>{note}</Text>
      </View>
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
  section: {
    color: MUTED,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 7,
    flexShrink: 1,
  },
  card: {
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
  rowTitle: { color: TEXT, fontSize: 15, fontWeight: "600", flexShrink: 1 },
  rowNote: {
    color: MUTED,
    fontSize: 14,
    marginTop: 3,
    maxWidth: 260,
    flexShrink: 1,
  },
  notice: {
    marginTop: 18,
    borderRadius: Design.radius.card,
    backgroundColor: Design.color.primarySoft,
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
  saving: {
    color: MUTED,
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
    flexShrink: 1,
  },
  state: { minHeight: 180, alignItems: "center", justifyContent: "center" },
  error: {
    marginTop: 12,
    borderRadius: Design.radius.card,
    backgroundColor: "#FFF1F0",
    padding: 16,
  },
  errorText: { color: "#B42318", fontSize: 14, flexShrink: 1 },
});
