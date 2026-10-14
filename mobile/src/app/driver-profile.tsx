import { ModeSwitch } from "@/components/mode-switch";
import { SymbolView } from "expo-symbols";
import { VehicleCard } from "@/components/vehicle-card";
import { RetryButton } from "@/components/retry-button";
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
const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

export default function DriverProfileScreen({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [retryVersion, setRetryVersion] = useState(0);
  const router = useRouter();
  const { session, passenger } = usePassengerAuth();
  const [driver, setDriver] = useState<MobileDriver | null>(null);
  const [loading, setLoading] = useState(Boolean(session));
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(
      () => {
        if (!session) return;
        setLoading(true);
        setError(null);
        let active = true;
        fetchMobileDriver(session)
          .then((response) => {
            if (active) setDriver(response.driver);
          })
          .catch((reason) => {
            if (active)
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Unable to load your driver profile",
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  if (!driver || !session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>
            {error ? "Unable to load profile" : "Driver profile unavailable"}
          </Text>
          {error ? (
            <>
              <Text style={styles.body}>{error}</Text>
              <RetryButton onPress={() => setRetryVersion((v) => v + 1)} />
            </>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/explore")}
            style={styles.primary}
          >
            <Text style={styles.primaryText}>Open driver mode</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const imageSource = passenger?.profileImageUrl
    ? {
        uri: `${API_URL}${passenger.profileImageUrl}`,
        headers: { "x-vaya-session": session },
      }
    : null;
  const vehicles = driver.vehicles ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.page,
          embedded && { paddingBottom: 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cover}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={embedded ? "Open settings" : "Go back"}
            onPress={() =>
              embedded ? router.push("/settings") : router.back()
            }
            style={styles.back}
          >
            {embedded ? (
              <SymbolView
                name={{
                  ios: "gearshape",
                  android: "settings",
                  web: "settings",
                }}
                tintColor={TEXT}
                size={20}
              />
            ) : (
              <Text style={styles.backText}>‹</Text>
            )}
          </Pressable>
          <View style={styles.avatar}>
            {imageSource ? (
              <Image
                source={imageSource}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {driver.initials ||
                  driver.name
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.identity}>
          <Text style={styles.name}>{driver.name}</Text>
          <View style={styles.verifiedRow}>
            <Text style={styles.verifiedIcon}>
              {driver.status === "Approved" ? "✓" : "•"}
            </Text>
            <Text style={styles.verifiedText}>
              {driver.status === "Approved" ? "Verified Driver" : driver.status}
            </Text>
          </View>
          <Text style={styles.rating}>
            {driver.stats?.ratingAverage
              ? `★ ${driver.stats.ratingAverage.toFixed(1)} (${driver.stats.ratingCount} review${driver.stats.ratingCount === 1 ? "" : "s"})`
              : "No ratings yet"}{" "}
            · {driver.stats?.yearsDriving ?? 0}+ years
          </Text>
        </View>

        <View style={styles.stats}>
          <Stat value={String(driver.stats?.totalTrips ?? 0)} label="Trips" />
          <Stat
            value={String(driver.stats?.completedTrips ?? 0)}
            label="Completed"
          />
          <Stat value={String(driver.stats?.yearsDriving ?? 0)} label="Years" />
        </View>

        <Text style={styles.sectionTitle}>Driver details</Text>
        <View style={styles.card}>
          <Text style={styles.body}>Operating area: {driver.location}</Text>
          <Text style={styles.body}>Verification: {driver.status}</Text>
          <Text style={styles.body}>
            Member since:{" "}
            {driver.stats?.memberSince
              ? new Intl.DateTimeFormat("en-ZA", {
                  month: "short",
                  year: "numeric",
                }).format(new Date(driver.stats.memberSince))
              : "Not available"}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Recent reviews</Text>
        <View style={styles.card}>
          {driver.reviews?.length ? (
            driver.reviews.map((review, index) => (
              <View
                key={`${review.createdAt}-${index}`}
                style={[
                  styles.reviewRow,
                  index < driver.reviews!.length - 1 && styles.reviewBorder,
                ]}
              >
                <Text style={styles.reviewRating}>
                  {"★".repeat(
                    Math.max(1, Math.min(5, Math.round(review.rating))),
                  )}
                </Text>
                <Text style={styles.reviewComment}>
                  {review.comment || "No written comment"}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.body}>No passenger reviews yet.</Text>
          )}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Vehicles ({vehicles.length})</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/driver-vehicle")}
          >
            <Text style={styles.link}>View all</Text>
          </Pressable>
        </View>
        <View style={styles.vehicles}>
          {vehicles.length ? (
            vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onVerify={() =>
                  router.push({
                    pathname: "/driver-verification",
                    params: { vehicleId: vehicle.id },
                  })
                }
                onManage={() => router.push("/driver-vehicle")}
              />
            ))
          ) : (
            <View style={styles.card}>
              <Text style={styles.body}>
                Add a vehicle to begin offering rides.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/add-vehicle")}
                style={styles.primary}
              >
                <Text style={styles.primaryText}>Add vehicle</Text>
              </Pressable>
            </View>
          )}
        </View>

        <ModeSwitch />
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/profile-edit")}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>Edit Profile</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/driver-rides")}
            style={styles.primaryFlex}
          >
            <Text style={styles.primaryText}>My Rides</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: {
    paddingBottom: 40,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: TEXT,
    fontSize: 26,
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },
  cover: {
    height: 190,
    backgroundColor: Design.color.surface,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingTop: 20,
  },
  back: {
    position: "absolute",
    left: 16,
    top: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: TEXT,
    fontSize: 28,
    lineHeight: 41,
    marginTop: -3,
    flexShrink: 1,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    backgroundColor: Design.color.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    transform: [],
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: {
    color: "#1765F3",
    fontSize: 32,
    fontWeight: "600",
    flexShrink: 1,
  },
  identity: { marginTop: 20, alignItems: "center", paddingHorizontal: 0 },
  name: {
    color: TEXT,
    fontSize: 26,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  verifiedIcon: {
    color: GREEN,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  verifiedText: {
    color: "#027A48",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  rating: { color: MUTED, fontSize: 14, marginTop: 8, flexShrink: 1 },
  stats: {
    marginHorizontal: 0,
    marginTop: 24,
    flexDirection: "row",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 15,
  },
  stat: { flex: 1, alignItems: "center", paddingVertical: 13 },
  statValue: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  statLabel: { color: MUTED, fontSize: 12, marginTop: 3, flexShrink: 1 },
  sectionTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 0,
    marginTop: 28,
    marginBottom: 12,
    flexShrink: 1,
  },
  card: {
    marginHorizontal: 0,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    padding: 20,
  },
  body: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 3,
    flexShrink: 1,
  },
  reviewRow: { paddingVertical: 8 },
  reviewBorder: { borderBottomWidth: 1, borderBottomColor: LINE },
  reviewRating: {
    color: GREEN,
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  reviewComment: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 3,
    flexShrink: 1,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  link: {
    color: "#1765F3",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 0,
    marginTop: 16,
    flexShrink: 1,
  },
  vehicles: { paddingHorizontal: 0, gap: 16 },
  actions: {
    margin: 0,
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 24,
  },
  secondary: {
    flex: 1,
    minHeight: 52,
    borderRadius: 11,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  secondaryText: {
    color: "#1765F3",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  primary: {
    marginTop: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  primaryFlex: {
    flex: 1,
    height: 52,
    borderRadius: 11,
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
