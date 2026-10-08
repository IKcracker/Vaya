import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchPassengerTrips, PassengerTrip } from "@/lib/auth";
import {
  API_URL,
  getRoutePreview,
  PublicTrip,
  RoutePreview,
  searchTrips,
} from "@/lib/api";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";
const GREEN_DARK = "#087F5B";
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function formatTripDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
export default function HomeScreen() {
  const { loading, session, passenger, user } = usePassengerAuth();
  const [trips, setTrips] = useState<PassengerTrip[]>([]);
  const [available, setAvailable] = useState<PublicTrip[]>([]);
  const [routePreviews, setRoutePreviews] = useState<
    Record<string, RoutePreview>
  >({});
  const [tripsLoading, setTripsLoading] = useState(Boolean(session));
  const [routesLoading, setRoutesLoading] = useState(true);
  const [now] = useState(() => Date.now());
  const [routesError, setRoutesError] = useState(false);
  const [tripsError, setTripsError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [loadedSession, setLoadedSession] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    searchTrips({ from: "", to: "", passengers: 1 })
      .then((response) => {
        if (active) setAvailable(response.trips);
      })
      .catch(() => {
        if (active) {
          setAvailable([]);
          setRoutesError(true);
        }
      })
      .finally(() => {
        if (active) setRoutesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  useEffect(() => {
    if (!session) return;
    let active = true;
    fetchPassengerTrips(session)
      .then((response) => {
        if (active) {
          setTrips(response.trips);
          setTripsError(false);
        }
      })
      .catch(() => {
        if (active) {
          setTrips([]);
          setTripsError(true);
        }
      })
      .finally(() => {
        if (active) {
          setTripsLoading(false);
          setLoadedSession(session);
        }
      });
    return () => {
      active = false;
    };
  }, [session]);
  const displayName = passenger?.name || user?.name || "Traveller";
  const defaultFrom = passenger?.city ?? "";
  const nextTrip = useMemo(
    () =>
      trips.find(
        (trip) =>
          new Date(trip.departureAt).getTime() > now &&
          trip.bookingStatus !== "Cancelled" &&
          trip.tripStatus !== "Cancelled",
      ) ?? null,
    [now, trips],
  );
  const suggestedRoutes = useMemo(() => {
    const seen = new Set<string>();
    const preferredCity = passenger?.city.trim().toLowerCase();
    return [...available]
      .sort((a, b) => {
        const aLocal =
          preferredCity && a.from.trim().toLowerCase() === preferredCity
            ? 0
            : 1;
        const bLocal =
          preferredCity && b.from.trim().toLowerCase() === preferredCity
            ? 0
            : 1;
        if (aLocal !== bLocal) return Number(aLocal) - Number(bLocal);
        return (
          new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime()
        );
      })
      .filter((trip) => {
        const key = `${trip.from.toLowerCase()}|${trip.to.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 4);
  }, [available, passenger?.city]);
  useEffect(() => {
    if (!suggestedRoutes.length) return;
    let active = true;
    void Promise.all(
      suggestedRoutes.map(async (trip) => {
        const response = await getRoutePreview(trip.from, trip.to).catch(
          () => ({
            route: null,
          }),
        );
        return [trip.id, response.route] as const;
      }),
    ).then((entries) => {
      if (!active) return;
      setRoutePreviews(
        Object.fromEntries(
          entries.filter((entry): entry is readonly [string, RoutePreview] =>
            Boolean(entry[1]),
          ),
        ),
      );
    });
    return () => {
      active = false;
    };
  }, [suggestedRoutes]);
  const imageSource =
    passenger?.profileImageUrl && session
      ? {
          uri: `${API_URL}${passenger.profileImageUrl}`,
          headers: { "x-vaya-session": session },
        }
      : null;
  function retryRoutes() {
    setRoutesLoading(true);
    setRoutesError(false);
    setRetry((value) => value + 1);
  }
  function openSearch(to?: string, from?: string) {
    router.push({
      pathname: "/search",
      params: {
        from: from ?? defaultFrom,
        ...(to ? { to } : {}),
      },
    });
  }
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>
              Vaya<Text style={styles.brandDot}>.</Text>
            </Text>
            <Text style={styles.brandCaption}>Go together.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open your profile"
            onPress={() => router.push("/profile")}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            {loading ? (
              <ActivityIndicator color={GREEN_DARK} size="small" />
            ) : imageSource ? (
              <Image
                source={imageSource}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {session ? initials(displayName) : "V"}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.intro}>
          <Text style={styles.greeting}>
            {session
              ? "Hello, " + displayName.split(" ")[0]
              : "Your next journey"}
          </Text>
          <Text style={styles.heading}>Where are you going?</Text>
          <Text style={styles.description}>
            Find a shared ride to your next destination.
          </Text>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.routeFields}>
            <View pointerEvents="none" style={styles.fieldRail}>
              <View style={styles.originDot} />
              <View style={styles.fieldConnector} />
              <View style={styles.destinationDot} />
            </View>
            <View style={styles.fieldContent}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose departure city"
                onPress={() => openSearch()}
                style={({ pressed }) => [
                  styles.field,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.fieldLabel}>From</Text>
                <Text
                  style={[
                    styles.fieldValue,
                    !defaultFrom && styles.placeholder,
                  ]}
                  numberOfLines={1}
                >
                  {defaultFrom || "Departure city"}
                </Text>
              </Pressable>
              <View style={styles.fieldDivider} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose destination"
                onPress={() => openSearch()}
                style={({ pressed }) => [
                  styles.field,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.fieldLabel}>To</Text>
                <Text style={[styles.fieldValue, styles.placeholder]}>
                  Destination city
                </Text>
              </Pressable>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => openSearch()}
            style={({ pressed }) => [
              styles.searchButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.searchButtonText}>Find a ride</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Available rides</Text>
            <Text style={styles.sectionDescription}>
              {defaultFrom
                ? "Departures from " + defaultFrom + " and beyond"
                : "Upcoming departures you can book"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => openSearch()}
            style={styles.sectionLink}
          >
            <Text style={styles.linkText}>See all</Text>
          </Pressable>
        </View>
        {routesLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={GREEN_DARK} />
            <Text style={styles.stateText}>Loading available rides…</Text>
          </View>
        ) : suggestedRoutes.length ? (
          <View style={styles.rideList}>
            {suggestedRoutes.slice(0, 3).map((trip) => (
              <Pressable
                key={trip.id}
                accessibilityRole="button"
                accessibilityLabel={
                  trip.from + " to " + trip.to + ", " + trip.fare + " per seat"
                }
                onPress={() => openSearch(trip.to, trip.from)}
                style={({ pressed }) => [
                  styles.rideCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.rideTop}>
                  <Text style={styles.departure}>
                    {formatTripDate(trip.departureAt)}
                  </Text>
                  <Text style={styles.seatBadge}>
                    {trip.availableSeats} seat
                    {trip.availableSeats === 1 ? "" : "s"} left
                  </Text>
                </View>
                <View style={styles.rideMain}>
                  <View style={styles.cityRail}>
                    <View style={styles.smallOrigin} />
                    <View style={styles.cityConnector} />
                    <View style={styles.smallDestination} />
                  </View>
                  <View style={styles.cities}>
                    <Text style={styles.city} numberOfLines={1}>
                      {trip.from}
                    </Text>
                    <Text style={styles.city} numberOfLines={1}>
                      {trip.to}
                    </Text>
                  </View>
                  <View style={styles.fareBlock}>
                    <Text style={styles.fare}>{trip.fare}</Text>
                    <Text style={styles.perSeat}>per seat</Text>
                  </View>
                </View>
                <View style={styles.rideBottom}>
                  <Text style={styles.rideDetail}>
                    {trip.driver?.name || "View driver details"}
                    {routePreviews[trip.id]
                      ? " · " +
                        Math.round(routePreviews[trip.id].distanceKm) +
                        " km"
                      : ""}
                  </Text>
                  <Text style={styles.rideArrow}>→</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {routesError ? "Unable to load rides" : "No rides available yet"}
            </Text>
            <Text style={styles.emptyText}>
              {routesError
                ? "Check your connection and try again."
                : "Search another destination or check back for new departures."}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => (routesError ? retryRoutes() : openSearch())}
              style={styles.emptyAction}
            >
              <Text style={styles.linkText}>
                {routesError ? "Try again" : "Search rides"}
              </Text>
              <Text style={styles.linkArrow}>→</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your trips</Text>
          {session ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/trips")}
              style={styles.sectionLink}
            >
              <Text style={styles.linkText}>View all</Text>
            </Pressable>
          ) : null}
        </View>
        {!session ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/auth")}
            style={({ pressed }) => [
              styles.accountCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.accountCopy}>
              <Text style={styles.accountTitle}>
                Keep your journeys in one place
              </Text>
              <Text style={styles.accountText}>
                Sign in to manage bookings and trip updates.
              </Text>
              <Text style={styles.accountLink}>Sign in</Text>
            </View>
            <Text style={styles.accountArrow}>→</Text>
          </Pressable>
        ) : tripsLoading || loadedSession !== session ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={GREEN_DARK} />
            <Text style={styles.stateText}>Loading your trips…</Text>
          </View>
        ) : nextTrip ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={"View trip " + nextTrip.route}
            onPress={() =>
              ["Boarding", "On schedule"].includes(nextTrip.tripStatus)
                ? router.push({
                    pathname: "/trip-progress/[id]",
                    params: { id: nextTrip.tripId },
                  })
                : router.push("/trips")
            }
            style={({ pressed }) => [
              styles.bookingCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.rideTop}>
              <Text style={styles.bookingLabel}>UPCOMING TRIP</Text>
              <Text style={styles.seatBadge}>{nextTrip.tripStatus}</Text>
            </View>
            <Text style={styles.bookingRoute}>{nextTrip.route}</Text>
            <Text style={styles.bookingDate}>
              {formatTripDate(nextTrip.departureAt)}
            </Text>
            <View style={styles.bookingBottom}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverInitials}>
                  {initials(nextTrip.driver)}
                </Text>
              </View>
              <View style={styles.accountCopy}>
                <Text style={styles.driverName}>{nextTrip.driver}</Text>
                <Text style={styles.bookingMeta}>
                  {nextTrip.seats} seat{nextTrip.seats === 1 ? "" : "s"} ·{" "}
                  {nextTrip.paymentStatus}
                </Text>
              </View>
              <Text style={styles.rideArrow}>→</Text>
            </View>
          </Pressable>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {tripsError ? "Unable to load your trips" : "No upcoming trips"}
            </Text>
            <Text style={styles.emptyText}>
              {tripsError
                ? "Open your trips to try again."
                : "Your next booking will appear here."}
            </Text>
            {tripsError ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/trips")}
                style={styles.emptyAction}
              >
                <Text style={styles.linkText}>My trips</Text>
                <Text style={styles.linkArrow}>→</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/explore")}
          style={({ pressed }) => [styles.offerCard, pressed && styles.pressed]}
        >
          <View style={styles.offerMark}>
            <Text style={styles.offerMarkText}>+</Text>
          </View>
          <View style={styles.accountCopy}>
            <Text style={styles.offerTitle}>Driving somewhere?</Text>
            <Text style={styles.offerDescription}>
              Offer a ride and share your travel costs.
            </Text>
          </View>
          <Text style={styles.offerArrow}>↗</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  page: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 110,
  },
  pressed: { opacity: 0.65 },
  header: {
    minHeight: 54,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    color: "#172A24",
    fontSize: 29,
    fontWeight: "800",
    letterSpacing: -1,
  },
  brandDot: { color: GREEN_DARK },
  brandCaption: { color: "#7A8580", fontSize: 11, marginTop: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F4F1",
    borderWidth: 1,
    borderColor: "#E4EAE6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: { color: GREEN_DARK, fontSize: 14, fontWeight: "600" },
  intro: { marginTop: 32, marginBottom: 24 },
  greeting: { color: "#66736D", fontSize: 13, marginBottom: 8 },
  heading: {
    color: "#172A24",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 35,
    letterSpacing: -0.9,
  },
  description: { color: "#758078", fontSize: 13, lineHeight: 20, marginTop: 8 },
  searchCard: {
    borderWidth: 1,
    borderColor: "#DFE6E1",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    boxShadow: "0px 4px 16px rgba(16,40,28,0.04)",
  },
  routeFields: { flexDirection: "row", gap: 16 },
  fieldRail: { width: 12, paddingTop: 28, alignItems: "center" },
  originDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: GREEN_DARK,
  },
  fieldConnector: {
    width: 1,
    height: 52,
    backgroundColor: "#D7E0DA",
    marginVertical: 4,
  },
  destinationDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: GREEN_DARK,
  },
  fieldContent: { flex: 1 },
  field: { minHeight: 69, justifyContent: "center", paddingVertical: 12 },
  fieldLabel: { fontSize: 11, color: "#7A8580", marginBottom: 5 },
  fieldValue: { fontSize: 16, color: "#263A30", fontWeight: "500" },
  placeholder: { color: "#89938E", fontWeight: "400" },
  fieldDivider: { height: 1, backgroundColor: "#EDF0ED" },
  searchButton: {
    minHeight: 52,
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#087F5B",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  searchButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  buttonArrow: { color: "#FFFFFF", fontSize: 22 },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    color: "#172A24",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  sectionDescription: {
    color: "#7A8580",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  sectionLink: { minHeight: 44, justifyContent: "center", paddingLeft: 8 },
  linkText: { color: GREEN_DARK, fontSize: 12, fontWeight: "600" },
  linkArrow: { color: GREEN_DARK, fontSize: 18 },
  rideList: { gap: 12 },
  rideCard: {
    borderWidth: 1,
    borderColor: "#E3E8E4",
    borderRadius: 14,
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  rideTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  departure: { fontSize: 11, color: "#6C7971", flexShrink: 1 },
  seatBadge: {
    backgroundColor: "#EFF6F0",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5,
    color: "#3E7359",
    fontSize: 10,
    fontWeight: "500",
    flexShrink: 1,
  },
  rideMain: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    gap: 12,
  },
  cityRail: { width: 10, alignItems: "center" },
  smallOrigin: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#698B77",
  },
  cityConnector: {
    width: 1,
    height: 20,
    backgroundColor: "#D7E0DA",
    marginVertical: 4,
  },
  smallDestination: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#698B77",
  },
  cities: { flex: 1, gap: 13 },
  city: { color: "#263A30", fontSize: 16, fontWeight: "600", lineHeight: 21 },
  fareBlock: { alignItems: "flex-end", marginLeft: 8 },
  fare: {
    color: "#172A24",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
  perSeat: { color: "#8A958E", fontSize: 10, marginTop: 4 },
  rideBottom: {
    marginTop: 17,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F3F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  rideDetail: { color: "#7A8580", fontSize: 11, flex: 1 },
  rideArrow: { color: "#527760", fontSize: 19 },
  stateCard: {
    minHeight: 130,
    backgroundColor: "#FAFBFA",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stateText: { color: "#7A8580", fontSize: 12 },
  emptyCard: { padding: 20, borderRadius: 12, backgroundColor: "#F7F9F7" },
  emptyTitle: { color: "#45584A", fontSize: 14, fontWeight: "600" },
  emptyText: { color: "#7A8580", fontSize: 12, lineHeight: 19, marginTop: 6 },
  emptyAction: {
    minHeight: 44,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 8,
  },
  accountCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#F7F9F7",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  accountCopy: { flex: 1 },
  accountTitle: {
    color: "#45584A",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  accountText: { color: "#7A8580", fontSize: 12, lineHeight: 19, marginTop: 6 },
  accountLink: {
    color: GREEN_DARK,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 14,
  },
  accountArrow: { color: GREEN_DARK, fontSize: 21 },
  bookingCard: {
    borderWidth: 1,
    borderColor: "#E3E8E4",
    borderRadius: 14,
    padding: 18,
  },
  bookingLabel: {
    color: "#7A8580",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
  },
  bookingRoute: {
    color: "#263A30",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 25,
    marginTop: 15,
  },
  bookingDate: { color: "#7A8580", fontSize: 12, marginTop: 6 },
  bookingBottom: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#EDF0ED",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  driverAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EEF3EF",
    alignItems: "center",
    justifyContent: "center",
  },
  driverInitials: { color: "#50765B", fontSize: 11, fontWeight: "600" },
  driverName: { color: "#45584A", fontSize: 12, fontWeight: "600" },
  bookingMeta: { color: "#7A8580", fontSize: 10, marginTop: 4 },
  offerCard: {
    marginTop: 28,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E8EDE9",
    paddingTop: 24,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  offerMark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EEF5EF",
    alignItems: "center",
    justifyContent: "center",
  },
  offerMarkText: { color: GREEN_DARK, fontSize: 24, fontWeight: "400" },
  offerTitle: { color: "#263A30", fontSize: 14, fontWeight: "600" },
  offerDescription: {
    color: "#7A8580",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  offerArrow: { color: GREEN_DARK, fontSize: 22 },
});
