import { DriverDashboard } from "@/components/driver-dashboard";
import { ModeSwitch } from "@/components/mode-switch";
import { ScreenState } from "@/components/screen-state";
import { Design } from "@/constants/design";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchMobileDriver, MobileDriver, MobileDriverTrip } from "@/lib/auth";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const GREEN = Design.color.primary;
const GREEN_DARK = "#1765F3";
const BG = Design.color.background;
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;
function statusTone(status: string) {
  if (status === "Approved") return { bg: "#ECFDF3", text: "#027A48" };
  if (status === "Rejected" || status === "Suspended")
    return { bg: "#FFF1F0", text: "#B42318" };
  return { bg: "#FFFAEB", text: "#B54708" };
}

export default function DriverScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ refresh?: string }>();
  const { loading: authLoading, session, passenger, user } = usePassengerAuth();
  const [driver, setDriver] = useState<MobileDriver | null>(null);
  const [trips, setTrips] = useState<MobileDriverTrip[]>([]);
  const [loading, setLoading] = useState(Boolean(session));
  const [error, setError] = useState<string | null>(null);
  const refreshKey = typeof params.refresh === "string" ? params.refresh : "";
  useFocusEffect(
    useCallback(
      () => {
        if (!session) return;
        setLoading(true);
        setError(null);
        let active = true;
        fetchMobileDriver(session)
          .then((r) => {
            if (!active) return;
            setDriver(r.driver);
            setTrips(r.trips);
          })
          .catch((reason: unknown) => {
            if (active)
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Unable to load driver mode",
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
      [refreshKey, session],
    ),
  );

  if (authLoading || loading)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={GREEN} />
        </View>
      </SafeAreaView>
    );
  if (!session) return (
    <SafeAreaView style={styles.safe}>
      <ScreenState icon="car" eyebrow="DRIVE WITH VAYA" title={"More seats.\nMore possibilities."} description={"Offer a seat on journeys you already make. One account for travelling and driving."} action="Sign in" onPress={() => router.push({ pathname: "/auth", params: { next: "/explore" } })} />
    </SafeAreaView>
  );
  if (error)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Driver mode unavailable</Text>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      </SafeAreaView>
    );

  if (!driver) {
    const name = passenger?.name || user?.name || "Vaya passenger";
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.page}>
          <ModeSwitch />
          <Text style={styles.title}>Become a Driver</Text>
          <Text style={styles.subtitle}>
            {name}, complete these steps before publishing rides.
          </Text>
          <View style={styles.steps}>
            <Step number="1" title="Driver details" />
            <Step number="2" title="Vehicle verification" />
            <Step number="3" title="Start publishing" last />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/driver-application")}
            style={styles.primary}
          >
            <Text style={styles.primaryText}>Start Driver Setup</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const tone = statusTone(driver.status);
  const approved = driver.status === "Approved";

  if (!approved)
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.page}>
          <ModeSwitch />

          <View style={styles.header}>
            <Text style={styles.title}>Driver Verification</Text>
            <View style={[styles.status, { backgroundColor: tone.bg }]}>
              <Text style={[styles.statusText, { color: tone.text }]}>
                {driver.status}
              </Text>
            </View>
          </View>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewName}>{driver.name}</Text>
            <Text style={styles.reviewMeta}>{driver.vehicle}</Text>
            <Text style={styles.reviewMeta}>{driver.location}</Text>
            <View style={styles.divider} />
            <Text style={styles.checks}>{driver.checks}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/driver-verification")}
            style={styles.rowLink}
          >
            <View>
              <Text style={styles.rowLinkTitle}>Verification documents</Text>
              <Text style={styles.rowLinkMeta}>
                {driver.verification
                  ? `${driver.verification.uploadedRequiredCount}/${driver.verification.requiredCount} uploaded`
                  : driver.checks}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safe}>
      <DriverDashboard
        driver={driver}
        trips={trips}
        modeSwitch={<ModeSwitch />}
        onNavigate={(destination) => router.push(destination)}
        onManageRide={(id) => router.push({ pathname: "/driver-trip/[id]", params: { id } })}
      />
    </SafeAreaView>
  );
}

function Step({
  number,
  title,
  last,
}: {
  number: string;
  title: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.step, !last && styles.border]}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
    </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 20,
    minHeight: 48,
  },
  title: {
    color: TEXT,
    fontSize: 30,
    fontWeight: "800",
    flexShrink: 1,
    letterSpacing: -0.8
  },
  subtitle: {
    color: MUTED,
    fontSize: 14,
    marginTop: 3,
    flexShrink: 1,
    lineHeight: 21,
  },
  status: {
    backgroundColor: "#ECFDF3",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  statusText: {
    color: "#027A48",
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  primary: {
    minHeight: 56,
    borderRadius: 17,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    boxShadow: Design.shadow.button
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  border: { borderBottomWidth: 1, borderBottomColor: LINE },
  chevron: { color: "#98A2B3", fontSize: 17, flexShrink: 1 },
  emptyText: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 3,
    flexShrink: 1,
  },
  errorTitle: {
    color: "#B42318",
    fontSize: 18,
    fontWeight: "600",
    flexShrink: 1,
  },
  steps: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 9,
    overflow: "hidden",
  },
  step: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 16,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Design.color.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: GREEN_DARK,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  stepTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  reviewCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 23,
    padding: 16,
    backgroundColor: "#FFFFFF",
    boxShadow: Design.shadow.card
  },
  reviewName: { color: TEXT, fontSize: 15, fontWeight: "600", flexShrink: 1 },
  reviewMeta: { color: MUTED, fontSize: 12, marginTop: 3, flexShrink: 1 },
  divider: { height: 1, backgroundColor: LINE, marginVertical: 9 },
  checks: { color: TEXT, fontSize: 16, lineHeight: 24, flexShrink: 1 },
  rowLink: {
    marginTop: 10,
    minHeight: 52,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 9,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  rowLinkTitle: { color: TEXT, fontSize: 15, fontWeight: "600", flexShrink: 1 },
  rowLinkMeta: { color: MUTED, fontSize: 12, marginTop: 2, flexShrink: 1 }
});
