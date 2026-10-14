import type { ReactNode } from "react";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { RouteMap, RouteMapFallback } from "@/components/route-map";
import type { RoutePreview } from "@/lib/api";
import { Design } from "@/constants/design";
type Props = {
  route: RoutePreview | null;
  from: string;
  to: string;
  message?: string | null;
  title: string;
  subtitle: string;
  status?: string;
  driver?: boolean;
  liveLocation?: {
    latitude: number;
    longitude: number;
    heading?: number | null;
    isFresh?: boolean;
  } | null;
  footer: ReactNode;
  children: ReactNode;
};
export function TripMapLayout({
  route,
  from,
  to,
  message,
  title,
  subtitle,
  status,
  driver = false,
  liveLocation,
  footer,
  children,
}: Props) {
  const router = useRouter();
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const [available, setAvailable] = useState(0);
  const height = available || window.height - insets.top - insets.bottom;
  const sheetHeight = Math.min(
    height - 100,
    expanded ? height * 0.72 : Math.max(250, Math.min(300, height * 0.34)),
  );
  const mapHeight = Math.max(100, height - sheetHeight + 22);
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View
        style={styles.canvas}
        onLayout={(event) => setAvailable(event.nativeEvent.layout.height)}
      >
        <View style={{ height: mapHeight }}>
          {route ? (
            <RouteMap
              route={route}
              from={from}
              to={to}
              height={mapHeight}
              edgeToEdge
              liveLocation={liveLocation}
            />
          ) : (
            <RouteMapFallback
              from={from}
              to={to}
              message={message ?? "Loading road route…"}
              height={mapHeight}
              edgeToEdge
            />
          )}
        </View>
        <View style={styles.header} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
            style={styles.back}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={[styles.role, driver && styles.driverRole]}>
            <Text style={[styles.roleText, driver && styles.driverRoleText]}>
              {driver ? "DRIVER · MANAGE RIDE" : "PASSENGER · YOUR RIDE"}
            </Text>
          </View>
        </View>
        <View style={[styles.sheet, { height: sheetHeight }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              expanded ? "Show more map" : "Show trip details"
            }
            accessibilityState={{ expanded }}
            onPress={() => setExpanded((value) => !value)}
            style={styles.handleButton}
          >
            <View style={styles.handle} />
            <Text style={styles.expand}>
              {expanded ? "More map ↓" : "Trip details ↑"}
            </Text>
          </Pressable>
          <View style={styles.summary}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              {status ? (
                <View style={[styles.badge, driver && styles.driverBadge]}>
                  <Text
                    style={[styles.badgeText, driver && styles.driverBadgeText]}
                  >
                    {status}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
          {expanded ? (
            <ScrollView
              style={styles.details}
              contentContainerStyle={styles.detailContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <View style={styles.footer}>{footer}</View>
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Design.color.background },
  canvas: { flex: 1, overflow: "hidden" },
  header: {
    position: "absolute",
    top: 16,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  back: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    boxShadow: "0 2px 12px #00000015"
  },
  backText: { fontSize: 30, lineHeight: 36, color: Design.color.text },
  role: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    elevation: 3,
    boxShadow: "0 2px 12px #00000015"
  },
  driverRole: { backgroundColor: Design.color.text },
  roleText: {
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: "700",
    color: Design.color.text,
  },
  driverRoleText: { color: "#FFFFFF" },
  sheet: {
    marginTop: -22,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    elevation: 8,
    boxShadow: "0px -8px 36px rgba(13,33,72,0.12)"
  },
  handleButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: Design.color.border,
  },
  expand: { fontSize: 11, fontWeight: "600", color: Design.color.muted },
  summary: { paddingVertical: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: {
    flex: 1,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    color: Design.color.text,
    letterSpacing: -0.6
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: Design.color.muted,
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Design.color.primarySoft
  },
  driverBadge: { backgroundColor: Design.color.text },
  badgeText: { fontSize: 11, fontWeight: "600", color: Design.color.primary },
  driverBadgeText: { color: "#FFFFFF" },
  details: { flex: 1 },
  detailContent: { paddingBottom: 16 },
  footer: { paddingBottom: 14 }
});
