import { RetryButton } from "@/components/retry-button";
import { Design } from "@/constants/design";
import { useState, useCallback } from "react";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fetchPassengerTripExperience,
  PassengerTripExperience,
  submitDriverReview,
} from "@/lib/auth";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const GREEN = Design.color.primary;
const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

function formatDeparture(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export default function TripCompletedScreen() {
  const [retryVersion, setRetryVersion] = useState(0);
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { session } = usePassengerAuth();
  const tripId = typeof params.id === "string" ? params.id : "";
  const [trip, setTrip] = useState<PassengerTripExperience | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(Boolean(session && tripId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useFocusEffect(
    useCallback(
      () => {
        if (!session || !tripId) return;
        setLoading(true);
        setError(null);
        let active = true;
        fetchPassengerTripExperience(session, tripId)
          .then((r) => {
            if (!active) return;
            setTrip(r.trip);
            if (r.trip.review?.rating) setRating(r.trip.review.rating);
            if (r.trip.review?.comment) setComment(r.trip.review.comment);
          })
          .catch((reason: unknown) => {
            if (active)
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Unable to load trip",
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
      [session, tripId, retryVersion],
    ),
  );

  async function submit() {
    if (!session || !trip || saving || trip.review) return;
    setSaving(true);
    setError(null);
    try {
      const r = await submitDriverReview(session, trip.tripId, {
        rating,
        comment,
      });
      setTrip({ ...trip, review: r.review });
      setSuccess("Thanks — your review has been saved.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to submit review",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={GREEN} />
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.back}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Trip Completed</Text>
          <View style={{ width: 38 }} />
        </View>
        {!trip ? (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>Trip unavailable</Text>
            <Text style={styles.stateText}>
              {error ?? "This trip could not be loaded."}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.confetti}>
              <Text style={styles.confettiText}>🎉</Text>
            </View>
            <Text style={styles.title}>
              Thanks for riding with {trip.driver.name}!
            </Text>
            <Text style={styles.subtitle}>
              {trip.route}
              {"\n"}
              {formatDeparture(trip.departureAt)}
            </Text>

            {trip.tripStatus !== "Completed" ? (
              <View style={styles.notice}>
                <Text style={styles.noticeTitle}>
                  Trip is not completed yet
                </Text>
                <Text style={styles.noticeText}>
                  A review can be submitted once the driver marks the trip as
                  completed.
                </Text>
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.label}>
                {trip.review ? "Your review" : "How was your trip?"}
              </Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Pressable
                    accessibilityRole="button"
                    key={s}
                    disabled={Boolean(trip.review)}
                    onPress={() => setRating(s)}
                  >
                    <Text
                      style={[styles.star, s > rating && styles.starInactive]}
                    >
                      ★
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                accessibilityLabel="Add a comment (optional)"
                editable={!trip.review && trip.tripStatus === "Completed"}
                value={comment}
                onChangeText={setComment}
                multiline
                placeholder="Add a comment (optional)"
                placeholderTextColor="#98A2B3"
                style={[styles.input, trip.review && styles.inputDisabled]}
                maxLength={1200}
              />
            </View>
            {success ? (
              <View style={styles.success}>
                <Text style={styles.successText}>{success}</Text>
              </View>
            ) : null}
            {error ? (
              <View style={styles.error}>
                <>
                  <Text style={styles.errorText}>{error}</Text>
                  <RetryButton onPress={() => setRetryVersion((v) => v + 1)} />
                </>
              </View>
            ) : null}
            {!trip.review && trip.tripStatus === "Completed" ? (
              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={() => void submit()}
                style={[styles.primary, saving && styles.disabled]}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryText}>Submit Review</Text>
                )}
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace("/trips")}
                style={styles.primary}
              >
                <Text style={styles.primaryText}>Back to My Trips</Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: {
    padding: 24,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
    borderRadius: 22,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: TEXT,
    fontSize: 29,
    lineHeight: 43,
    marginTop: -3,
    flexShrink: 1,
  },
  headerTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  confetti: { marginTop: 34, alignItems: "center" },
  confettiText: { fontSize: 52, flexShrink: 1 },
  title: {
    color: TEXT,
    fontSize: 26,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
    flexShrink: 1,
  },
  subtitle: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 7,
    flexShrink: 1,
  },
  notice: {
    marginTop: 18,
    borderRadius: Design.radius.card,
    backgroundColor: "#FFF4E8",
    padding: 16,
  },
  noticeTitle: {
    color: "#B54708",
    fontSize: 18,
    fontWeight: "600",
    flexShrink: 1,
  },
  noticeText: {
    color: "#B54708",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 3,
    flexShrink: 1,
  },
  card: {
    marginTop: 24,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    padding: 16,
  },
  label: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  star: { color: GREEN, fontSize: 28, flexShrink: 1 },
  starInactive: { color: "#D0D5DD" },
  input: {
    marginTop: 14,
    minHeight: 84,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 11,
    backgroundColor: "#F9FAFB",
    padding: 11,
    fontSize: 15,
    color: TEXT,
    textAlignVertical: "top",
    flexShrink: 1,
    paddingVertical: 10,
  },
  inputDisabled: { backgroundColor: "#F2F4F3" },
  primary: {
    marginTop: 18,
    minHeight: 52,
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
  disabled: { opacity: 0.55 },
  success: {
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: "#ECFDF3",
    padding: 10,
  },
  successText: { color: "#027A48", fontSize: 14, flexShrink: 1 },
  error: {
    marginTop: 12,
    borderRadius: Design.radius.card,
    backgroundColor: "#FFF1F0",
    padding: 16,
  },
  errorText: { color: "#B42318", fontSize: 14, flexShrink: 1 },
  state: { minHeight: 180, alignItems: "center", justifyContent: "center" },
  stateTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  stateText: {
    color: MUTED,
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    flexShrink: 1,
  },
});
