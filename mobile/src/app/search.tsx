import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const GREEN = "#087F5B";
const GREEN_SOFT = "#EFF6F0";
const TEXT = "#172A24";
const BODY = "#45584A";
const MUTED = "#7A8580";
const PLACEHOLDER = "#98A29D";
const LINE = "#DFE6E1";
const SOFT = "#F7F9F7";
const WHITE = "#FFFFFF";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);
}

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string; to?: string }>();
  const { passenger } = usePassengerAuth();

  const [from, setFrom] = useState(
    typeof params.from === "string" ? params.from : passenger?.city ?? "",
  );
  const [to, setTo] = useState(
    typeof params.to === "string" ? params.to : "",
  );
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(1);

  const dateOptions = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const weekend = new Date(today);
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
    weekend.setDate(today.getDate() + daysUntilSaturday);

    return [
      { label: "Any date", value: "", eyebrow: "FLEXIBLE" },
      {
        label: dateLabel(tomorrow),
        value: isoDate(tomorrow),
        eyebrow: "TOMORROW",
      },
      {
        label: dateLabel(weekend),
        value: isoDate(weekend),
        eyebrow: "WEEKEND",
      },
    ];
  }, []);

  const canSearch =
    from.trim().length > 1 &&
    to.trim().length > 1 &&
    from.trim().toLowerCase() !== to.trim().toLowerCase();

  function swapRoute() {
    setFrom(to);
    setTo(from);
  }

  function submit() {
    if (!canSearch) return;

    router.push({
      pathname: "/search-results",
      params: {
        from: from.trim(),
        to: to.trim(),
        date,
        passengers: String(passengers),
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>Find a ride</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.intro}>
          <Text style={styles.heading}>Where are you heading?</Text>
          <Text style={styles.description}>
            Choose your route, travel date and number of seats.
          </Text>
        </View>

        <View style={styles.routeCard}>
          <View style={styles.routeFields}>
            <View style={styles.fieldRail}>
              <View style={styles.originDot} />
              <View style={styles.fieldConnector} />
              <View style={styles.destinationDot} />
            </View>

            <View style={styles.fieldContent}>
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <Text style={styles.fieldLabel}>Leaving from</Text>
                  {passenger?.city &&
                  from.trim().toLowerCase() !==
                    passenger.city.trim().toLowerCase() ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setFrom(passenger.city)}>
                      <Text style={styles.homeCity}>Use {passenger.city}</Text>
                    </Pressable>
                  ) : null}
                </View>

                <TextInput
                  value={from}
                  onChangeText={setFrom}
                  placeholder="City or town"
                  placeholderTextColor={PLACEHOLDER}
                  autoCapitalize="words"
                  returnKeyType="next"
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldDivider} />

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Going to</Text>
                <TextInput
                  value={to}
                  onChangeText={setTo}
                  placeholder="Enter destination"
                  placeholderTextColor={PLACEHOLDER}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={submit}
                  style={styles.input}
                />
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Swap departure and destination"
              onPress={swapRoute}
              style={({ pressed }) => [
                styles.swapButton,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.swapText}>⇅</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>When are you travelling?</Text>
            <Text style={styles.sectionDescription}>
              Pick a quick date or stay flexible.
            </Text>
          </View>
        </View>

        <View style={styles.dateGrid}>
          {dateOptions.map((option) => {
            const active = date === option.value;

            return (
              <Pressable
                key={option.value || "any"}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setDate(option.value)}
                style={({ pressed }) => [
                  styles.dateCard,
                  active && styles.dateCardActive,
                  pressed && styles.pressed,
                ]}>
                <Text
                  style={[
                    styles.dateEyebrow,
                    active && styles.dateEyebrowActive,
                  ]}>
                  {option.eyebrow}
                </Text>
                <Text
                  style={[
                    styles.dateLabel,
                    active && styles.dateLabelActive,
                  ]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Passengers</Text>
            <Text style={styles.sectionDescription}>
              How many seats do you need?
            </Text>
          </View>
        </View>

        <View style={styles.passengerCard}>
          <View style={styles.passengerIcon}>
            <Text style={styles.passengerIconText}>●</Text>
          </View>

          <View style={styles.passengerCopy}>
            <Text style={styles.passengerTitle}>
              {passengers} passenger{passengers === 1 ? "" : "s"}
            </Text>
            <Text style={styles.passengerNote}>Maximum 8 seats per search</Text>
          </View>

          <View style={styles.stepper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove passenger"
              disabled={passengers <= 1}
              onPress={() => setPassengers((value) => Math.max(1, value - 1))}
              style={[
                styles.stepButton,
                passengers <= 1 && styles.stepButtonDisabled,
              ]}>
              <Text style={styles.stepText}>−</Text>
            </Pressable>

            <Text style={styles.passengerCount}>{passengers}</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add passenger"
              disabled={passengers >= 8}
              onPress={() => setPassengers((value) => Math.min(8, value + 1))}
              style={[
                styles.stepButton,
                passengers >= 8 && styles.stepButtonDisabled,
              ]}>
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>
        </View>

        {from.trim().length > 1 &&
        to.trim().length > 1 &&
        from.trim().toLowerCase() === to.trim().toLowerCase() ? (
          <View style={styles.validationCard}>
            <Text style={styles.validationText}>
              Departure and destination need to be different.
            </Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSearch }}
          disabled={!canSearch}
          onPress={submit}
          style={({ pressed }) => [
            styles.searchButton,
            !canSearch && styles.searchButtonDisabled,
            pressed && canSearch && styles.searchButtonPressed,
          ]}>
          <Text style={styles.searchButtonText}>Search available rides</Text>
          <Text style={styles.searchButtonArrow}>→</Text>
        </Pressable>

        <View style={styles.infoRow}>
          <View style={styles.infoDot} />
          <Text style={styles.infoText}>
            Results come directly from rides published by Vaya drivers.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: WHITE,
  },
  page: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  pressed: {
    opacity: 0.65,
  },

  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E4EAE6",
    backgroundColor: "#FAFBFA",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: TEXT,
    fontSize: 28,
    lineHeight: 30,
    marginTop: -3,
  },
  headerTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 40,
  },

  intro: {
    marginTop: 28,
    marginBottom: 22,
  },
  heading: {
    color: TEXT,
    fontSize: 28,
    lineHeight: 35,
    fontWeight: "700",
    letterSpacing: -0.9,
  },
  description: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },

  routeCard: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 16,
    backgroundColor: WHITE,
    padding: 16,
    shadowColor: "#10281C",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  routeFields: {
    flexDirection: "row",
    alignItems: "center",
  },
  fieldRail: {
    width: 14,
    alignSelf: "stretch",
    paddingTop: 29,
    paddingBottom: 29,
    alignItems: "center",
  },
  originDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: GREEN,
    backgroundColor: WHITE,
  },
  fieldConnector: {
    flex: 1,
    width: 1,
    backgroundColor: "#D7E0DA",
    marginVertical: 4,
  },
  destinationDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: GREEN,
  },
  fieldContent: {
    flex: 1,
    marginLeft: 12,
  },
  field: {
    minHeight: 74,
    justifyContent: "center",
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  fieldLabel: {
    color: MUTED,
    fontSize: 11,
    marginBottom: 4,
  },
  homeCity: {
    color: GREEN,
    fontSize: 10,
    fontWeight: "600",
  },
  input: {
    minHeight: 34,
    color: BODY,
    fontSize: 16,
    fontWeight: "500",
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: "#EDF0ED",
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D8E6DE",
    backgroundColor: GREEN_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  swapText: {
    color: GREEN,
    fontSize: 17,
    fontWeight: "700",
  },

  sectionHeader: {
    marginTop: 30,
    marginBottom: 13,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  sectionDescription: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  dateGrid: {
    flexDirection: "row",
    gap: 8,
  },
  dateCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: WHITE,
    paddingHorizontal: 10,
    paddingVertical: 12,
    justifyContent: "center",
  },
  dateCardActive: {
    borderColor: "#B7D9C8",
    backgroundColor: GREEN_SOFT,
  },
  dateEyebrow: {
    color: "#8A958E",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  dateEyebrowActive: {
    color: GREEN,
  },
  dateLabel: {
    color: BODY,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    marginTop: 5,
  },
  dateLabelActive: {
    color: TEXT,
  },

  passengerCard: {
    minHeight: 82,
    borderRadius: 12,
    backgroundColor: SOFT,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  passengerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EAF2ED",
    alignItems: "center",
    justifyContent: "center",
  },
  passengerIconText: {
    color: GREEN,
    fontSize: 17,
    lineHeight: 17,
  },
  passengerCopy: {
    flex: 1,
    marginLeft: 10,
  },
  passengerTitle: {
    color: BODY,
    fontSize: 13,
    fontWeight: "600",
  },
  passengerNote: {
    color: MUTED,
    fontSize: 10,
    marginTop: 4,
  },
  stepper: {
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: WHITE,
    overflow: "hidden",
  },
  stepButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  stepButtonDisabled: {
    opacity: 0.3,
  },
  stepText: {
    color: TEXT,
    fontSize: 19,
    lineHeight: 21,
  },
  passengerCount: {
    width: 30,
    textAlign: "center",
    color: TEXT,
    fontSize: 13,
    fontWeight: "700",
  },

  validationCard: {
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: "#FFF6F5",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  validationText: {
    color: "#B42318",
    fontSize: 11,
    lineHeight: 17,
  },

  searchButton: {
    minHeight: 54,
    marginTop: 28,
    borderRadius: 10,
    backgroundColor: GREEN,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchButtonPressed: {
    backgroundColor: "#066A4C",
  },
  searchButtonDisabled: {
    backgroundColor: "#B8C9C0",
  },
  searchButtonText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: "600",
  },
  searchButtonArrow: {
    color: WHITE,
    fontSize: 21,
  },

  infoRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 7,
  },
  infoDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#8BAA99",
    marginTop: 5,
  },
  infoText: {
    color: MUTED,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },
});
