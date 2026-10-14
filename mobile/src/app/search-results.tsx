import { RetryButton } from "@/components/retry-button";
import { Design } from "@/constants/design";
import { SymbolView } from "expo-symbols";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RouteMap, RouteMapFallback } from "@/components/route-map";
import {
  API_URL,
  getRoutePreview,
  PublicTrip,
  RoutePreview,
  searchTrips,
} from "@/lib/api";

const GREEN = Design.color.primary;
const GREEN_DARK = "#1765F3";
const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

function formatDeparture(value: string) {
  const d = new Date(value);
  return {
    day: new Intl.DateTimeFormat("en-ZA", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }).format(d),
    time: new Intl.DateTimeFormat("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d),
  };
}
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function SearchResultsScreen() {
  const [retryVersion, setRetryVersion] = useState(0);
  const router = useRouter();
  const params = useLocalSearchParams<{
    from?: string;
    to?: string;
    date?: string;
    passengers?: string;
  }>();
  const from = typeof params.from === "string" ? params.from : "";
  const to = typeof params.to === "string" ? params.to : "";
  const date = typeof params.date === "string" ? params.date : "";
  const passengers = Math.min(
    8,
    Math.max(
      1,
      Number(typeof params.passengers === "string" ? params.passengers : "1") ||
        1,
    ),
  );
  const [trips, setTrips] = useState<PublicTrip[]>([]);
  const [route, setRoute] = useState<RoutePreview | null>(null);
  const [routeMessage, setRouteMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [sortBy, setSortBy] = useState<"time" | "price" | "seats">("time");

  const searchSummary = useMemo(
    () =>
      date
        ? new Intl.DateTimeFormat("en-ZA", {
            weekday: "short",
            day: "2-digit",
            month: "short",
          }).format(new Date(`${date}T12:00:00`))
        : "Any date",
    [date],
  );

  useFocusEffect(
    useCallback(
      () => {
        setLoading(true);
        setError(null);
        setRoute(null);
        setRouteMessage(null);
        let active = true;

        searchTrips({ from, to, date, passengers })
          .then((tripResponse) => {
            if (!active) return;
            setTrips(tripResponse.trips);
          })
          .catch((reason: unknown) => {
            if (active)
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Unable to search rides",
              );
          })
          .finally(() => {
            if (active) setLoading(false);
          });

        getRoutePreview(from, to)
          .then((response) => {
            if (!active) return;
            setRoute(response.route);
            setRouteMessage(response.error ?? null);
          })
          .catch((reason: unknown) => {
            if (active)
              setRouteMessage(
                reason instanceof Error
                  ? reason.message
                  : "Map route unavailable",
              );
          });

        return () => {
          active = false;
        };
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps -- Retry and refresh counters intentionally reload this request.
      [date, from, passengers, to, retryVersion],
    ),
  );

  const sortedTrips = useMemo(() => {
    const copy = [...trips];
    if (sortBy === "price")
      return copy.sort((a, b) => a.fareCents - b.fareCents);
    if (sortBy === "seats")
      return copy.sort((a, b) => b.availableSeats - a.availableSeats);
    return copy.sort(
      (a, b) =>
        new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime(),
    );
  }, [sortBy, trips]);

  function editSearch() {
    router.push({
      pathname: "/search",
      params: { from, to, date, passengers: String(passengers) },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.iconButton}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/search")
          }
        >
          <SymbolView
            name={{
              ios: "arrow.left",
              android: "arrow_back",
              web: "arrow_back",
            }}
            tintColor={TEXT}
            size={22}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Available rides</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit search"
          style={styles.iconButton}
          onPress={editSearch}
        >
          <SymbolView
            name={{ ios: "slider.horizontal.3", android: "tune", web: "tune" }}
            tintColor={TEXT}
            size={22}
          />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              setLoading(true);
              setRetryVersion((value) => value + 1);
            }}
            tintColor={GREEN}
            colors={[GREEN]}
          />
        }
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit route, date and seats"
          style={styles.searchSummary}
          onPress={editSearch}
        >
          <View style={styles.summaryRail}>
            <View style={styles.pickupDot} />
            <View style={styles.summaryLine} />
            <View style={styles.destinationDot} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.summaryCity}>{from || "Departure city"}</Text>
            <Text style={styles.summaryCity}>{to || "Destination city"}</Text>
            <Text style={styles.headerMeta}>
              {searchSummary} · {passengers}{" "}
              {passengers === 1 ? "seat" : "seats"}
            </Text>
          </View>
          <Text style={styles.editText}>Edit</Text>
        </Pressable>

        <View style={styles.resultsHeading}>
          <View style={styles.flex}>
            <Text style={styles.heading}>
              {loading
                ? "Finding your ride"
                : error
                  ? "Available rides"
                  : sortedTrips.length +
                    (sortedTrips.length === 1
                      ? " ride available"
                      : " rides available")}
            </Text>
            <Text style={styles.subtitle}>
              Choose the journey that suits you.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showMap ? "Hide route map" : "Show route map"}
            accessibilityState={{ expanded: showMap }}
            style={styles.mapToggle}
            onPress={() => setShowMap((value) => !value)}
          >
            <SymbolView
              name={{ ios: "map", android: "map", web: "map" }}
              tintColor={GREEN}
              size={20}
            />
            <Text style={styles.editText}>{showMap ? "Hide" : "Map"}</Text>
          </Pressable>
        </View>
        {showMap ? (
          <View style={styles.mapWrap}>
            {route ? (
              <RouteMap route={route} from={from} to={to} height={320} />
            ) : (
              <RouteMapFallback
                from={from || "Start"}
                to={to || "Destination"}
                message={routeMessage ?? "Loading road route…"}
                height={320}
              />
            )}
          </View>
        ) : null}
        <View style={styles.filters}>
          {(
            [
              { value: "time", label: "Earliest" },
              { value: "price", label: "Lowest price" },
              { value: "seats", label: "Most seats" },
            ] as const
          ).map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: sortBy === option.value }}
              onPress={() => setSortBy(option.value)}
              style={[
                styles.filter,
                sortBy === option.value && styles.filterActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  sortBy === option.value && styles.filterActiveText,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={styles.state}>
            <ActivityIndicator color={GREEN} size="large" />
            <Text style={styles.stateTitle}>Searching for rides</Text>
            <Text style={styles.stateText}>
              Checking departures for your route.
            </Text>
          </View>
        ) : error ? (
          <View style={styles.state}>
            <SymbolView
              name={{
                ios: "wifi.exclamationmark",
                android: "wifi_off",
                web: "wifi_off",
              }}
              tintColor={MUTED}
              size={36}
            />
            <Text style={styles.stateTitle}>We couldn’t load rides</Text>
            <Text style={styles.stateText}>{error}</Text>
            <RetryButton
              onPress={() => setRetryVersion((value) => value + 1)}
            />
          </View>
        ) : sortedTrips.length === 0 ? (
          <View style={styles.state}>
            <View style={styles.emptyIcon}>
              <SymbolView
                name={{
                  ios: "car",
                  android: "directions_car",
                  web: "directions_car",
                }}
                tintColor={GREEN}
                size={32}
              />
            </View>
            <Text style={styles.stateTitle}>No rides just yet</Text>
            <Text style={styles.stateText}>
              Try another date or a nearby departure city. New rides appear as
              drivers publish them.
            </Text>
            <Pressable
              accessibilityRole="button"
              style={styles.emptyAction}
              onPress={editSearch}
            >
              <Text style={styles.emptyActionText}>Edit search</Text>
            </Pressable>
          </View>
        ) : (
          sortedTrips.map((trip) => {
            const departure = formatDeparture(trip.departureAt);
            const image = trip.driver.profileImageUrl;
            const imageUrl = image
              ? /^https?:\/\//i.test(image)
                ? image
                : API_URL + image
              : null;
            return (
              <Pressable
                key={trip.id}
                accessibilityRole="button"
                accessibilityLabel={
                  departure.time +
                  ", " +
                  trip.from +
                  " to " +
                  trip.to +
                  ", " +
                  trip.fare +
                  " per seat, with " +
                  trip.driver.name
                }
                onPress={() =>
                  router.push({
                    pathname: "/trip/[id]",
                    params: { id: trip.id, passengers: String(passengers) },
                  })
                }
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.flex}>
                    <Text style={styles.time}>{departure.time}</Text>
                    <Text style={styles.departureDay}>{departure.day}</Text>
                  </View>
                  <View style={styles.priceWrap}>
                    <Text style={styles.price}>{trip.fare}</Text>
                    <Text style={styles.priceMeta}>per seat</Text>
                  </View>
                </View>
                <View style={styles.route}>
                  <View style={styles.routeRail}>
                    <View style={styles.pickupDot} />
                    <View style={styles.routeLine} />
                    <View style={styles.destinationDot} />
                  </View>
                  <View style={styles.flex}>
                    <View style={styles.stop}>
                      <Text style={styles.stopLabel}>DEPARTURE</Text>
                      <Text style={styles.city}>{trip.from}</Text>
                    </View>
                    <View style={styles.stop}>
                      <Text style={styles.stopLabel}>DESTINATION</Text>
                      <Text style={styles.city}>{trip.to}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.driverRow}>
                  <View style={styles.avatar}>
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.avatarImage}
                        contentFit="cover"
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {initials(trip.driver.name)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.flex}>
                    <Text numberOfLines={1} style={styles.name}>
                      {trip.driver.name}
                    </Text>
                    <View style={styles.verification}>
                      {trip.driver.verified ? (
                        <SymbolView
                          name={{
                            ios: "checkmark.seal.fill",
                            android: "verified",
                            web: "verified",
                          }}
                          tintColor={GREEN}
                          size={14}
                        />
                      ) : null}
                      <Text style={styles.driverMeta}>
                        {trip.driver.verified
                          ? "Verified driver"
                          : "Verification pending"}
                      </Text>
                    </View>
                  </View>
                  <SymbolView
                    name={{
                      ios: "chevron.right",
                      android: "chevron_right",
                      web: "chevron_right",
                    }}
                    tintColor={MUTED}
                    size={20}
                  />
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.vehicle}>
                    {trip.driver.vehicle || "Vehicle details on ride"}
                  </Text>
                  <View style={styles.seatBadge}>
                    <Text style={styles.seatText}>
                      {trip.availableSeats}{" "}
                      {trip.availableSeats === 1 ? "seat" : "seats"} left
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "white",
  },
  headerTitle: { color: TEXT, fontSize: 16, fontWeight: "600" },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  page: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  searchSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 21,
    borderRadius: 24,
    backgroundColor: Design.color.navy,
    boxShadow: Design.shadow.card
  },
  summaryRail: {
    width: 12,
    height: 46,
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 6,
  },
  summaryLine: {
    flex: 1,
    width: 1,
    backgroundColor: "#49648E",
    marginVertical: 4
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: GREEN,
    backgroundColor: "white",
  },
  destinationDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: "#8CB8FF"
  },
  summaryCity: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 28
  },
  headerMeta: {
    color: "#AFC5E9",
    fontSize: 11,
    marginTop: 8,
    lineHeight: 18
  },
  editText: {
    color: "#A3C8FF",
    fontSize: 12,
    fontWeight: "700"
  },
  resultsHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 28,
  },
  heading: {
    color: TEXT,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: -0.6
  },
  subtitle: { color: MUTED, fontSize: 13, lineHeight: 20, marginTop: 4 },
  mapToggle: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
  },
  mapWrap: { borderRadius: 20, overflow: "hidden", marginTop: 16 },
  filters: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
    marginBottom: 22,
    flexWrap: "wrap",
  },
  filter: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE
  },
  filterActive: {
    backgroundColor: Design.color.primary,
    borderColor: Design.color.primary
  },
  filterText: { color: MUTED, fontSize: 13, fontWeight: "600" },
  filterActiveText: { color: "white" },
  card: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 24,
    backgroundColor: SURFACE,
    padding: 20,
    marginBottom: 16,
    boxShadow: Design.shadow.card
  },
  pressed: { opacity: 0.72 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  time: {
    color: TEXT,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8
  },
  departureDay: { color: MUTED, fontSize: 12, marginTop: 4 },
  priceWrap: { alignItems: "flex-end", maxWidth: "50%" },
  price: {
    color: Design.color.primary,
    fontSize: 29,
    fontWeight: "800",
    letterSpacing: -0.6
  },
  priceMeta: { color: MUTED, fontSize: 12, marginTop: 4 },
  route: { marginVertical: 22, flexDirection: "row", gap: 14 },
  routeRail: {
    width: 12,
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 22,
  },
  routeLine: {
    flex: 1,
    width: 1,
    backgroundColor: "#CCD9D0",
    marginVertical: 5,
  },
  stop: { paddingBottom: 14 },
  stopLabel: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 4,
  },
  city: { color: TEXT, fontSize: 17, fontWeight: "600", lineHeight: 24 },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#EDF1EE",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 17,
    overflow: "hidden",
    backgroundColor: Design.color.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: { color: GREEN_DARK, fontSize: 20, fontWeight: "600" },
  name: { color: TEXT, fontSize: 15, fontWeight: "600" },
  verification: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },
  driverMeta: { color: MUTED, fontSize: 12 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  vehicle: { flex: 1, color: MUTED, fontSize: 12, lineHeight: 18 },
  seatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: Design.color.primarySoft
  },
  seatText: { color: GREEN, fontSize: 12, fontWeight: "600" },
  state: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  stateTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  stateText: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Design.color.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyAction: {
    minHeight: 48,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: GREEN,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyActionText: { color: "white", fontSize: 14, fontWeight: "700" }
});
