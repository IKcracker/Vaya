import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Design } from "@/constants/design";
import { DriverTripPassenger, fetchDriverTripPassengers } from "@/lib/auth";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";
import { RetryButton } from "./retry-button";

export function DriverPassengers({ tripId, version }: { tripId: string; version: number }) {
  const { session } = usePassengerAuth();
  const router = useRouter();
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<DriverTripPassenger[]>([]);
  const [error, setError] = useState<string | null>(null);
  useFocusEffect(useCallback(() => {
    if (!session) return;
    let active = true;
    setLoading(true);
    setError(null);
    fetchDriverTripPassengers(session, tripId).then((response) => {
      if (active) setBookings(response.bookings);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Unable to load passengers");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reload after lifecycle changes and explicit retries.
  }, [session, tripId, version, retry]));
  const passengers = bookings.filter((booking) => booking.status !== "Cancelled");
  const confirmedSeats = passengers.filter((booking) => booking.paymentStatus === "Paid")
    .reduce((sum, booking) => sum + booking.seats, 0);
  return <View style={styles.card}>
    <Text style={styles.title}>Passengers</Text>
    {loading ? <ActivityIndicator color={Design.color.primary} /> : error ? <>
      <Text style={styles.copy}>{error}</Text>
      <RetryButton onPress={() => setRetry((value) => value + 1)} />
    </> : <>
      <Text style={styles.copy}>{confirmedSeats} paid seat{confirmedSeats === 1 ? "" : "s"} ready for boarding</Text>
      {passengers.length ? passengers.map((booking) => <View key={booking.id} style={styles.row}>
        <View style={styles.detail}>
          <Text style={styles.name}>{booking.name}</Text>
          <Text style={styles.copy}>{booking.seats} seat{booking.seats === 1 ? "" : "s"} · {booking.paymentStatus === "Paid" ? booking.status : "Awaiting payment"}</Text>
          <Text style={styles.reference}>{booking.id}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Message ${booking.name}`}
          onPress={() => router.push({ pathname: "/conversation/[email]", params: { email: booking.email, tripId, name: booking.name } })}
          style={styles.button}>
          <Text style={styles.buttonText}>Message</Text>
        </Pressable>
      </View>) : <Text style={styles.copy}>No passengers have reserved seats yet.</Text>}
      <RetryButton onPress={() => setRetry((value) => value + 1)} />
    </>}
  </View>;
}

const styles = StyleSheet.create({
  card: { padding: 18, borderWidth: 1, borderColor: Design.color.border, borderRadius: 14, gap: 12 },
  title: { color: Design.color.text, fontSize: 18, fontWeight: "700" },
  copy: { color: Design.color.muted, fontSize: 13, lineHeight: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Design.color.border },
  detail: { flex: 1, gap: 3 },
  name: { color: Design.color.text, fontSize: 15, fontWeight: "600" },
  reference: { color: Design.color.muted, fontSize: 11 },
  button: { minHeight: 44, paddingHorizontal: 12, justifyContent: "center", borderRadius: 10, backgroundColor: Design.color.primarySoft },
  buttonText: { color: Design.color.primary, fontSize: 13, fontWeight: "600" },
});
