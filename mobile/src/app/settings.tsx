import { SymbolView } from "expo-symbols";
import { Design } from "@/constants/design";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { useRouter, useFocusEffect } from "expo-router";
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

import { fetchMobileDriver, MobileDriver } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const GREEN = Design.color.primary;
const GREEN_DARK = "#1765F3";
const BG = Design.color.background;
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

export default function SettingsScreen() {
  const router = useRouter();
  const { loading, session, user, passenger, signOut } = usePassengerAuth();
  const [driver, setDriver] = useState<MobileDriver | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      fetchMobileDriver(session)
        .then((r) => setDriver(r.driver))
        .catch(() => setDriver(null));
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
  if (!session)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.centerText}>
            Sign in to manage your Vaya settings.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.replace({
                pathname: "/auth",
                params: { next: "/settings" },
              })
            }
            style={styles.primary}
          >
            <Text style={styles.primaryText}>Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );

  const name = passenger?.name || user?.name || "Vaya member";
  const email = passenger?.email || user?.email || "";
  const imageSource = passenger?.profileImageUrl
    ? {
        uri: `${API_URL}${passenger.profileImageUrl}`,
        headers: { "x-vaya-session": session },
      }
    : null;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const version = Constants.expoConfig?.version ?? "1.0.0";

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
            style={styles.back}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.account}>
          <View style={styles.avatar}>
            {imageSource ? (
              <Image
                source={imageSource}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.email}>{email}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/profile-edit")}
          >
            <Text style={styles.edit}>Edit</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>ACCOUNT</Text>
        <View style={styles.group}>
          <Row
            icon="👤"
            title="Account"
            onPress={() => router.push("/profile-edit")}
          />
          <Row
            icon="💳"
            title="Payment Methods"
            onPress={() => router.push("/payment-methods")}
          />
          <Row
            icon="🔒"
            title="Privacy & Security"
            onPress={() => router.push("/privacy-security")}
          />
          <Row
            icon="🔔"
            title="Notifications"
            onPress={() => router.push("/notifications")}
            last
          />
        </View>

        {driver ? (
          <>
            <Text style={styles.section}>DRIVER</Text>
            <View style={styles.group}>
              <Row
                icon="✓"
                title="Verification"
                value={driver.status}
                onPress={() => router.push("/driver-verification")}
              />
              <Row
                icon="🚙"
                title="Vehicles"
                value={String(driver.vehicles?.length ?? 0)}
                onPress={() => router.push("/driver-vehicle")}
                last
              />
            </View>
          </>
        ) : null}

        <Text style={styles.section}>SUPPORT</Text>
        <View style={styles.group}>
          <Row
            icon="🛡"
            title="Safety"
            onPress={() => router.push("/profile-safety")}
          />
          <Row
            icon="?"
            title="Help & Support"
            onPress={() => router.push("/help-support")}
          />
          <InfoRow icon="文" title="Language" value="English" />
          <InfoRow icon="i" title="Version" value={version} last />
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

const menuIcons = {
  "👤": ["person", "person"],
  "💳": ["creditcard", "credit_card"],
  "🔒": ["lock", "lock"],
  "🔔": ["bell", "notifications"],
  "✓": ["checkmark.shield", "verified_user"],
  "🚙": ["car", "directions_car"],
  "🛡": ["shield", "shield"],
  "?": ["questionmark.circle", "help"],
  文: ["globe", "language"],
  i: ["info.circle", "info"],
} as const;
function Row({
  icon,
  title,
  value,
  onPress,
  last,
}: {
  icon: keyof typeof menuIcons;
  title: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.row, !last && styles.border]}
    >
      <View style={styles.icon}>
        <SymbolView
          name={{
            ios: menuIcons[icon][0],
            android: menuIcons[icon][1],
            web: menuIcons[icon][1],
          }}
          size={20}
          tintColor={Design.color.primary}
        />
      </View>
      <Text style={styles.rowTitle}>{title}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}
function InfoRow({
  icon,
  title,
  value,
  last,
}: {
  icon: keyof typeof menuIcons;
  title: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.border]}>
      <View style={styles.icon}>
        <SymbolView
          name={{
            ios: menuIcons[icon][0],
            android: menuIcons[icon][1],
            web: menuIcons[icon][1],
          }}
          size={20}
          tintColor={Design.color.primary}
        />
      </View>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
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
  centerText: {
    color: MUTED,
    fontSize: 14,
    textAlign: "center",
    marginTop: 5,
    flexShrink: 1,
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
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: TEXT,
    fontSize: 25,
    lineHeight: 37,
    marginTop: -2,
    flexShrink: 1,
  },
  title: { color: TEXT, fontSize: 26, fontWeight: "600", flexShrink: 1 },
  account: {
    marginTop: 12,
    height: 90,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Design.color.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: {
    color: GREEN_DARK,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  name: { color: TEXT, fontSize: 15, fontWeight: "600", flexShrink: 1 },
  email: { color: MUTED, fontSize: 14, marginTop: 2, flexShrink: 1 },
  edit: { color: GREEN_DARK, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  section: {
    color: MUTED,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.7,
    marginTop: 28,
    marginBottom: 12,
    flexShrink: 1,
  },
  group: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 9,
    overflow: "hidden",
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
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F6FC",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    flex: 1,
    color: TEXT,
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  rowValue: { color: MUTED, fontSize: 14, flexShrink: 1 },
  chevron: { color: "#98A2B3", fontSize: 17, flexShrink: 1 },
  signOut: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FFF8F7",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    paddingVertical: 10,
  },
  signOutText: {
    color: "#B42318",
    fontSize: 14,
    fontWeight: "600",
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
  },
});
