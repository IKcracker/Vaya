import { useTravelMode } from "@/providers/travel-mode-provider";
import DriverProfile from "../driver-profile";
import { ScreenState } from "@/components/screen-state";
import { SymbolView } from "expo-symbols";
import { Design } from "@/constants/design";
import { Image } from "expo-image";
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

import { fetchMobileDriver, MobileDriver } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const GREEN = Design.color.primary;
const GREEN_DARK = "#1765F3";
const BG = Design.color.background;
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((v) => v[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function joinedLabel(value?: string) {
  return value
    ? `Member since ${new Intl.DateTimeFormat("en-ZA", { month: "short", year: "numeric" }).format(new Date(value))}`
    : "Vaya member";
}
function driverTone(status?: string) {
  if (status === "Approved") return { bg: "#ECFDF3", text: "#027A48" };
  if (status === "Rejected" || status === "Suspended")
    return { bg: "#FFF1F0", text: "#B42318" };
  return { bg: "#FFFAEB", text: "#B54708" };
}

function PassengerProfileScreen() {
  const router = useRouter();
  const { setMode } = useTravelMode();
  const { loading, session, user, passenger, signOut } = usePassengerAuth();
  const [driver, setDriver] = useState<MobileDriver | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      let active = true;
      fetchMobileDriver(session)
        .then((r) => {
          if (active) setDriver(r.driver);
        })
        .catch(() => {
          if (active) setDriver(null);
        });
      return () => {
        active = false;
      };
    }, [session]),
  );
  if (loading)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={GREEN} />
        </View>
      </SafeAreaView>
    );
  if (!session) return (
    <SafeAreaView style={styles.safe}>
      <ScreenState icon="profile" eyebrow="YOUR VAYA PROFILE" title={"Make it\nyour journey."} description={"Your details, your bookings and your travel story. Keep it all in one place."} action="Sign in" onPress={() => router.push({ pathname: "/auth", params: { next: "/profile" } })} />
    </SafeAreaView>
  );

  const displayName = passenger?.name || user?.name || "Vaya Passenger";
  const email = passenger?.email || user?.email || "";
  const tone = driverTone(driver?.status);
  const imageSource = passenger?.profileImageUrl
    ? {
        uri: `${API_URL}${passenger.profileImageUrl}`,
        headers: { "x-vaya-session": session },
      }
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => router.push("/settings")}
            style={styles.settings}
          >
            <SymbolView
              name={{ ios: "gearshape", android: "settings", web: "settings" }}
              tintColor={TEXT}
              size={20}
            />
          </Pressable>
        </View>

        <View style={styles.identity}>
          <View style={styles.avatar}>
            {imageSource ? (
              <Image
                source={imageSource}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{initials(displayName)}</Text>
            )}
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
          <Text style={styles.member}>{joinedLabel(passenger?.joinedAt)}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/profile-edit")}
            style={styles.edit}
          >
            <Text style={styles.editText}>Edit Profile</Text>
          </Pressable>
        </View>

        <View style={styles.stats}>
          <Stat value={String(passenger?.tripsCount ?? 0)} label="Trips" />
          <Stat value={passenger?.city || "—"} label="Home" />
          <Stat value={passenger?.status || "Active"} label="Status" />
        </View>

        <Text style={styles.section}>Account</Text>
        <View style={styles.menu}>
          <MenuRow
            icon="👤"
            title="Personal Details"
            onPress={() => router.push("/profile-edit")}
          />
          <MenuRow
            icon="💳"
            title="Payment Methods"
            onPress={() => router.push("/payment-methods")}
          />
          <MenuRow
            icon="🔒"
            title="Privacy & Security"
            onPress={() => router.push("/privacy-security")}
          />
          <MenuRow
            icon="🔔"
            title="Notifications"
            onPress={() => router.push("/notifications")}
          />
          <MenuRow
            icon="?"
            title="Help & Support"
            onPress={() => router.push("/help-support")}
            last
          />
        </View>

        <Text style={styles.section}>Driver</Text>
        <View style={styles.driverCard}>
          <View style={styles.driverTop}>
            <View style={styles.driverIcon}>
              <SymbolView
                name={{
                  ios: "car",
                  android: "directions_car",
                  web: "directions_car",
                }}
                tintColor={GREEN_DARK}
                size={22}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverTitle}>
                {driver ? "Driver Profile" : "Become a Driver"}
              </Text>
              <Text style={styles.driverNote}>
                {driver
                  ? driver.vehicle || driver.checks
                  : "Offer rides and earn from trips you already make."}
              </Text>
            </View>
            {driver ? (
              <View style={[styles.driverStatus, { backgroundColor: tone.bg }]}>
                <Text style={[styles.driverStatusText, { color: tone.text }]}>
                  {driver.status}
                </Text>
              </View>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMode("driver");
              router.replace("/");
            }}
            style={styles.driverButton}
          >
            <Text style={styles.driverButtonText}>
              {driver ? "Switch to Driver Mode" : "Start Driver Setup"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => void signOut()}
          style={styles.signOut}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
const accountIcons = {
  "👤": ["person", "person"],
  "💳": ["creditcard", "credit_card"],
  "🔒": ["lock", "lock"],
  "🔔": ["bell", "notifications"],
  "?": ["questionmark.circle", "help"],
} as const;

function MenuRow({
  icon,
  title,
  onPress,
  last,
}: {
  icon: keyof typeof accountIcons;
  title: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.row, !last && styles.border]}
    >
      <View style={styles.rowIcon}>
        <SymbolView
          name={{
            ios: accountIcons[icon][0],
            android: accountIcons[icon][1],
            web: accountIcons[icon][1],
          }}
          tintColor={GREEN_DARK}
          size={20}
        />
      </View>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
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
  settings: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF"
  },
  identity: {
    alignItems: "center",
    marginTop: 4,
    backgroundColor: Design.color.navy,
    borderRadius: 26,
    padding: 28,
    boxShadow: Design.shadow.card
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 56,
    overflow: "hidden",
    backgroundColor: "#254A83",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#416391"
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    flexShrink: 1
  },
  name: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 14,
    flexShrink: 1,
    textAlign: "center"
  },
  email: {
    color: "#BDCEEA",
    fontSize: 13,
    marginTop: 3,
    flexShrink: 1,
    textAlign: "center"
  },
  member: {
    color: "#91ABD1",
    fontSize: 11,
    marginTop: 6,
    flexShrink: 1
  },
  edit: {
    marginTop: 18,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#416391",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#203D6C"
  },
  editText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 1
  },
  stats: {
    marginTop: 18,
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: LINE,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderRadius: 22,
    boxShadow: Design.shadow.card
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: {
    color: Design.color.primary,
    fontSize: 17,
    fontWeight: "800",
    maxWidth: "90%",
    flexShrink: 1
  },
  statLabel: { color: MUTED, fontSize: 12, marginTop: 2, flexShrink: 1 },
  section: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 28,
    marginBottom: 12,
    flexShrink: 1,
    letterSpacing: -0.3
  },
  menu: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    boxShadow: Design.shadow.card
  },
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  border: { borderBottomWidth: 1, borderBottomColor: LINE },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Design.color.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  rowTitle: {
    flex: 1,
    color: TEXT,
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  chevron: { color: "#98A2B3", fontSize: 18, flexShrink: 1 },
  driverCard: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    padding: 16,
  },
  driverTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  driverIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Design.color.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  driverTitle: { color: TEXT, fontSize: 16, fontWeight: "600", flexShrink: 1 },
  driverNote: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 2,
    flexShrink: 1,
  },
  driverStatus: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  driverStatusText: { fontSize: 12, fontWeight: "600", flexShrink: 1 },
  driverButton: {
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 9,
    paddingVertical: 10,
  },
  driverButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  signOut: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Design.color.border,
    backgroundColor: Design.color.background,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    paddingVertical: 10,
  },
  signOutText: {
    color: "#B42318",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  emptyTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  emptyText: {
    color: MUTED,
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    flexShrink: 1,
  },
  primary: {
    marginTop: 14,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  }
});

export default function ProfileScreen() {
  const { mode } = useTravelMode();
  return mode === "driver" ? (
    <DriverProfile embedded />
  ) : (
    <PassengerProfileScreen />
  );
}
