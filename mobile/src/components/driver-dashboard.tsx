import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Design } from "@/constants/design";
import type { MobileDriver, MobileDriverTrip } from "@/lib/auth";
import { AppIcon, type AppIconName } from "./app-icon";
import { BrandMark } from "./brand-mark";

type Destination = "/notifications" | "/driver-profile" | "/driver-publish" | "/driver-rides" | "/driver-vehicle" | "/earnings";

export function DriverDashboard({ driver, trips, modeSwitch, onNavigate, onManageRide }: {
  driver: MobileDriver;
  trips: MobileDriverTrip[];
  modeSwitch: ReactNode;
  onNavigate: (destination: Destination) => void;
  onManageRide: (id: string) => void;
}) {
  const activeRides = trips
    .filter((trip) => trip.status !== "Completed" && trip.status !== "Cancelled")
    .sort((a, b) => new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime());
  const nextRide = activeRides[0];
  const reservedSeats = activeRides.reduce((sum, trip) => sum + trip.seatsBooked, 0);
  const approvedVehicles = driver.vehicles?.filter((vehicle) => vehicle.status === "Approved").length ?? 0;
  const firstName = driver.name.trim().split(/\s+/)[0] || "Driver";
  const initials = driver.name.trim().split(/\s+/).map((name) => name[0]).join("").slice(0, 2).toUpperCase();

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.brand}><BrandMark /><Text style={styles.driverLabel}>DRIVER</Text></View>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Open notifications" onPress={() => onNavigate("/notifications")} style={styles.headerButton}>
            <AppIcon name="bell" color={C.navy} size={21} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Open driver profile" onPress={() => onNavigate("/driver-profile")} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || "V"}</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.greeting}>Good to see you, {firstName}.</Text>
      <Text style={styles.title}>Your road ahead.</Text>
      <View style={styles.modeRow}><Text style={styles.subtitle}>Every seat is a new possibility.</Text>{modeSwitch}</View>

      <View style={styles.nextRide}>
        <View style={styles.rideHeader}>
          <View style={styles.eyebrowRow}><View style={styles.signal} /><Text style={styles.eyebrow}>{nextRide ? "YOUR NEXT RIDE" : "READY FOR THE ROAD"}</Text></View>
          {nextRide ? <Text style={styles.rideStatus}>{nextRide.status}</Text> : <AppIcon name="road" color="#AFCBFA" size={22} />}
        </View>
        {nextRide ? (
          <>
            <View style={styles.route}>
              <View style={styles.routeRail}><View style={styles.origin} /><View style={styles.connector} /><View style={styles.destination} /></View>
              <View style={styles.routeCities}><Text style={styles.city}>{nextRide.from}</Text><Text style={styles.city}>{nextRide.to}</Text></View>
            </View>
            <View style={styles.departureRow}><AppIcon name="clock" color="#AFCBFA" size={16} /><Text style={styles.departure}>{formatDeparture(nextRide.departureAt)}</Text></View>
            <View style={styles.rideDetails}>
              <View style={styles.seatDetails}>
                <Text style={styles.seatCount}>{nextRide.seatsBooked}<Text style={styles.seatCapacity}> / {nextRide.seatCapacity}</Text></Text>
                <Text style={styles.detailLabel}>Seats reserved</Text>
              </View>
              <View style={styles.fareDetails}><Text style={styles.fare}>{nextRide.fare}</Text><Text style={styles.detailLabel}>Per seat</Text></View>
            </View>
            <View style={styles.capacityTrack}><View style={[styles.capacityFill, { width: `${Math.min(100, Math.max(0, nextRide.seatCapacity > 0 ? nextRide.seatsBooked / nextRide.seatCapacity * 100 : 0))}%` }]} /></View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Manage ride from ${nextRide.from} to ${nextRide.to}`} onPress={() => onManageRide(nextRide.id)} style={({ pressed }) => [styles.manageButton, pressed && styles.pressed]}>
              <View><Text style={styles.manageTitle}>Manage ride</Text><Text style={styles.manageDescription}>Passengers, messages & trip updates</Text></View>
              <AppIcon name="arrow" color="#FFFFFF" size={22} />
            </Pressable>
          </>
        ) : (
          <View style={styles.emptyRide}>
            <View style={styles.emptyArt}><AppIcon name="car" color="#FFFFFF" size={38} /></View>
            <Text style={styles.emptyTitle}>Where are we headed?</Text>
            <Text style={styles.emptyCopy}>Publish your next journey. Your ride and seat reservations will appear here.</Text>
          </View>
        )}
      </View>

      <View style={styles.metrics}>
        <ActivityMetric icon="road" value={activeRides.length} label="Active rides" />
        <ActivityMetric icon="ticket" value={reservedSeats} label="Seats reserved" />
      </View>

      <Pressable accessibilityRole="button" onPress={() => onNavigate("/driver-publish")} style={({ pressed }) => [styles.publish, pressed && styles.pressed]}>
        <View style={styles.publishIcon}><AppIcon name="plus" color="#FFFFFF" size={25} /></View>
        <View style={styles.flex}><Text style={styles.publishTitle}>Publish a ride</Text><Text style={styles.publishCopy}>Going somewhere? Take someone along.</Text></View>
        <AppIcon name="onward" color="#FFFFFF" size={21} />
      </Pressable>

      {activeRides.length > 1 ? (
        <>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Coming up</Text><Pressable accessibilityRole="button" onPress={() => onNavigate("/driver-rides")} style={styles.viewAll}><Text style={styles.viewAllText}>View all</Text></Pressable></View>
          <View style={styles.upcomingList}>
            {activeRides.slice(1, 3).map((trip) => (
              <Pressable key={trip.id} accessibilityRole="button" accessibilityLabel={`Manage ride from ${trip.from} to ${trip.to}`} onPress={() => onManageRide(trip.id)} style={({ pressed }) => [styles.upcomingRide, pressed && styles.pressed]}>
                <View style={styles.upcomingIcon}><AppIcon name="car" size={22} /></View>
                <View style={styles.flex}><Text style={styles.upcomingRoute}>{trip.from} → {trip.to}</Text><Text style={styles.upcomingDate}>{formatDeparture(trip.departureAt)}</Text><Text style={styles.upcomingSeats}>{trip.seatsBooked}/{trip.seatCapacity} seats reserved · {trip.status}</Text></View>
                <AppIcon name="onward" size={18} />
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>At your fingertips</Text></View>
      <View style={styles.shortcuts}>
        <Shortcut icon="road" title="My rides" onPress={() => onNavigate("/driver-rides")} />
        <Shortcut icon="car" title="Vehicles" onPress={() => onNavigate("/driver-vehicle")} />
        <Shortcut icon="wallet" title="Earnings" onPress={() => onNavigate("/earnings")} />
      </View>
      {approvedVehicles === 0 ? (
        <Pressable accessibilityRole="button" onPress={() => onNavigate("/driver-vehicle")} style={styles.vehicleNotice}>
          <AppIcon name="shield" color="#A26408" size={20} /><Text style={styles.vehicleNoticeText}>Get a vehicle approved before publishing your first ride.</Text><AppIcon name="onward" color="#A26408" size={18} />
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function formatDeparture(value: string) {
  return new Intl.DateTimeFormat("en-ZA", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

function ActivityMetric({ icon, value, label }: { icon: AppIconName; value: number; label: string }) {
  return <View style={styles.metric}><View style={styles.metricTop}><AppIcon name={icon} size={18} /><Text style={styles.metricValue}>{value}</Text></View><Text style={styles.metricLabel}>{label}</Text></View>;
}

function Shortcut({ icon, title, onPress }: { icon: AppIconName; title: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}><View style={styles.shortcutIcon}><AppIcon name={icon} size={23} /></View><Text style={styles.shortcutTitle}>{title}</Text></Pressable>;
}

const C = Design.color;
const styles = StyleSheet.create({
  page: { ...Design.page, paddingTop: 16, paddingBottom: 130 },
  flex: { flex: 1 },
  pressed: { opacity: 0.8 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  brand: { flexDirection: "row", alignItems: "center", gap: 9, flexShrink: 1, flexWrap: "wrap" },
  driverLabel: { color: C.primary, fontSize: 8, fontWeight: "800", letterSpacing: 1.1, paddingHorizontal: 7, paddingVertical: 5, backgroundColor: C.primarySoft, borderRadius: 6 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border },
  avatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  greeting: { color: C.muted, fontSize: 13, marginTop: 25, marginBottom: 8 },
  title: { color: C.navy, fontSize: 31, fontWeight: "800", letterSpacing: -1, lineHeight: 37 },
  modeRow: { marginTop: 3, marginBottom: 12 },
  subtitle: { color: C.muted, fontSize: 12, lineHeight: 19 },
  nextRide: { backgroundColor: C.navy, borderRadius: 27, padding: 22, boxShadow: "0px 12px 30px rgba(13,33,72,0.15)" },
  rideHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  signal: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  eyebrow: { color: "#B8D1FA", fontSize: 9, fontWeight: "800", letterSpacing: 1.4 },
  rideStatus: { color: "#E1EDFF", fontSize: 10, fontWeight: "600", paddingHorizontal: 9, paddingVertical: 6, backgroundColor: "#253D64", borderRadius: 8 },
  route: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 24 },
  routeRail: { width: 10, alignItems: "center" },
  origin: { width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: "#8CB8FF" },
  connector: { height: 23, width: 1, backgroundColor: "#46618A", marginVertical: 5 },
  destination: { width: 9, height: 9, borderRadius: 3, backgroundColor: "#8CB8FF" },
  routeCities: { flex: 1, gap: 14 },
  city: { color: "#FFFFFF", fontSize: 22, lineHeight: 27, fontWeight: "800", letterSpacing: -0.5 },
  departureRow: { marginTop: 17, flexDirection: "row", gap: 7, alignItems: "center" },
  departure: { color: "#B8CBE8", fontSize: 12, flexShrink: 1, lineHeight: 18 },
  rideDetails: { marginTop: 21, paddingTop: 18, borderTopWidth: 1, borderTopColor: "#2B4268", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  seatDetails: { flex: 1 },
  seatCount: { color: "#FFFFFF", fontSize: 26, fontWeight: "800" },
  seatCapacity: { color: "#8DA8D0", fontSize: 17, fontWeight: "500" },
  detailLabel: { color: "#9EB7DC", fontSize: 10, marginTop: 4 },
  fareDetails: { alignItems: "flex-end", flexShrink: 1 },
  fare: { color: "#FFFFFF", fontSize: 22, fontWeight: "800" },
  capacityTrack: { marginTop: 14, height: 4, backgroundColor: "#29426D", borderRadius: 2, overflow: "hidden" },
  capacityFill: { height: 4, borderRadius: 2, backgroundColor: "#6C9FFF" },
  manageButton: { marginTop: 21, minHeight: 62, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.primary, gap: 10 },
  manageTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  manageDescription: { color: "#D2E3FF", fontSize: 9, lineHeight: 15, marginTop: 3 },
  emptyRide: { paddingTop: 24, paddingBottom: 10 },
  emptyArt: { width: 68, height: 68, borderRadius: 23, backgroundColor: "#244578", alignItems: "center", justifyContent: "center", marginBottom: 21 },
  emptyTitle: { color: "#FFFFFF", fontSize: 25, fontWeight: "800", letterSpacing: -0.6 },
  emptyCopy: { color: "#B8CBE8", fontSize: 13, lineHeight: 21, marginTop: 9 },
  metrics: { flexDirection: "row", gap: 12, marginTop: 16 },
  metric: { flex: 1, backgroundColor: C.surface, borderRadius: 19, padding: 17, borderWidth: 1, borderColor: C.border },
  metricTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  metricValue: { color: C.navy, fontSize: 24, fontWeight: "800" },
  metricLabel: { color: C.muted, fontSize: 11, marginTop: 9 },
  publish: { marginTop: 18, padding: 18, minHeight: 84, borderRadius: 21, backgroundColor: C.primary, flexDirection: "row", alignItems: "center", gap: 13, boxShadow: Design.shadow.button },
  publishIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: "#3B7DF4", alignItems: "center", justifyContent: "center" },
  publishTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  publishCopy: { color: "#D5E6FF", fontSize: 11, lineHeight: 17, marginTop: 5 },
  sectionHeader: { marginTop: 27, marginBottom: 12, minHeight: 32, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  sectionTitle: { color: C.navy, fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  viewAll: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  viewAllText: { color: C.primary, fontSize: 12, fontWeight: "700" },
  upcomingList: { gap: 10 },
  upcomingRide: { padding: 16, backgroundColor: C.surface, borderRadius: 21, borderWidth: 1, borderColor: C.border, flexDirection: "row", gap: 13, alignItems: "center" },
  upcomingIcon: { width: 43, height: 43, borderRadius: 15, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" },
  upcomingRoute: { color: C.text, fontSize: 14, fontWeight: "700", lineHeight: 21 },
  upcomingDate: { color: C.muted, fontSize: 11, lineHeight: 18, marginTop: 4 },
  upcomingSeats: { color: C.primary, fontSize: 10, lineHeight: 16, marginTop: 5 },
  shortcuts: { flexDirection: "row", gap: 10 },
  shortcut: { flex: 1, minHeight: 109, paddingHorizontal: 8, paddingVertical: 17, borderRadius: 19, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", gap: 10 },
  shortcutIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" },
  shortcutTitle: { color: C.text, fontSize: 12, fontWeight: "700" },
  vehicleNotice: { marginTop: 20, padding: 16, borderRadius: 18, backgroundColor: "#FFF4D9", flexDirection: "row", alignItems: "center", gap: 10 },
  vehicleNoticeText: { flex: 1, color: "#86540A", fontSize: 12, lineHeight: 19 },
});
