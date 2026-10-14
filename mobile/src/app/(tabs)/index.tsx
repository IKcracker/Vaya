import { PassengerHome } from "@/components/passenger-home";
import { useTravelMode } from "@/providers/travel-mode-provider";
import { isUpcomingBooking } from "@/lib/trip-state";
import DriverDashboard from "./explore";
import { homeStyles as styles } from "@/constants/home-styles";
import { router, useFocusEffect } from "expo-router";
import { useEffect, useMemo, useState, useCallback } from "react";
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
function PassengerHomeScreen() {
  const { loading, session, passenger, user } = usePassengerAuth();
  const [trips, setTrips] = useState<PassengerTrip[]>([]);
  const [available, setAvailable] = useState<PublicTrip[]>([]);
  const [routePreviews, setRoutePreviews] = useState<
    Record<string, RoutePreview>
  >({});
  const [tripsLoading, setTripsLoading] = useState(Boolean(session));
  const [routesLoading, setRoutesLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [routesError, setRoutesError] = useState(false);
  const [tripsError, setTripsError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [loadedSession, setLoadedSession] = useState<string | null>(null);
  useFocusEffect(
    useCallback(
      () => {
        let active = true;
        setRoutesLoading(true);
        setRoutesError(false);
        searchTrips({ from: "", to: "", passengers: 1 })
          .then((response) => {
            if (active) { setAvailable(response.trips); setRoutesError(false); }
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
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps -- Retry and refresh counters intentionally reload this request.
      [retry],
    ),
  );
  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      setNow(Date.now());
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
    }, [session]),
  );
  const displayName = passenger?.name || user?.name || "Traveller";
  const defaultFrom = passenger?.city ?? "";
  const nextTrip = useMemo(
    () =>
      trips.filter((trip) => isUpcomingBooking(trip, now))
        .sort((a, b) => new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime())[0] ?? null,
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
      <PassengerHome
        signedIn={Boolean(session)}
        authLoading={loading}
        name={displayName}
        departureCity={defaultFrom}
        avatarSource={imageSource}
        nextTrip={nextTrip}
        tripState={tripsLoading || loadedSession !== session ? "loading" : tripsError ? "error" : nextTrip ? "ready" : "empty"}
        rides={suggestedRoutes}
        rideState={routesLoading ? "loading" : routesError ? "error" : suggestedRoutes.length ? "ready" : "empty"}
        routePreviews={routePreviews}
        onSearch={openSearch}
        onRetryRides={retryRoutes}
        onNavigate={(destination) => router.push(destination)}
        onOpenRide={(id) => router.push({ pathname: "/trip/[id]", params: { id, passengers: "1" } })}
        onOpenBooking={(booking) => booking.paymentStatus === "Paid"
          ? router.push({ pathname: "/trip-progress/[id]", params: { id: booking.tripId } })
          : router.push({ pathname: "/payment/[id]", params: { id: booking.id } })}
      />
    </SafeAreaView>
  );
}



export default function HomeScreen() {
  const { mode } = useTravelMode();
  return mode === "driver" ? <DriverDashboard /> : <PassengerHomeScreen />;
}
