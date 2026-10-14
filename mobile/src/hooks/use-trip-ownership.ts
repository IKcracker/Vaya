import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { fetchMobileDriver } from "@/lib/auth";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";
export function useTripOwnership(tripId: string) {
  const { session } = usePassengerAuth();
  const [result, setResult] = useState<{
    session: string | null;
    tripId: string;
    owned: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useFocusEffect(
    useCallback(() => {
      if (!session || !tripId) return;
      let active = true;
      setError(null);
      setResult(null);
      fetchMobileDriver(session)
        .then((response) => {
          if (active)
            setResult({
              session,
              tripId,
              owned: response.trips.some((trip) => trip.id === tripId),
            });
        })
        .catch((reason) => {
          if (active)
            setError(
              reason instanceof Error
                ? reason.message
                : "Unable to check ride ownership",
            );
        });
      return () => {
        active = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps -- Retry reruns the ownership check.
    }, [session, tripId, retry]),
  );
  const checked =
    !session ||
    Boolean(result?.session === session && result?.tripId === tripId);
  return {
    owned: Boolean(
      session &&
      result?.session === session &&
      result?.tripId === tripId &&
      result?.owned,
    ),
    checked,
    error,
    retry: () => setRetry((value) => value + 1),
  };
}
