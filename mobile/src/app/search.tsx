import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useRef, useState, type ComponentProps } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Design } from "@/constants/design";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const C = Design.color;
function isoDate(value: Date) {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
}
function label(value: string) {
  if (!value) return "Any date";
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(value + "T12:00:00"));
}
type IconNames = Exclude<
  NonNullable<ComponentProps<typeof SymbolView>["name"]>,
  string
>;
function Icon({
  ios,
  android,
  color = C.text,
}: {
  ios: IconNames["ios"];
  android: IconNames["android"];
  color?: string;
}) {
  return (
    <SymbolView
      name={{ ios, android, web: android }}
      tintColor={color}
      size={22}
    />
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    from?: string;
    to?: string;
    date?: string;
    passengers?: string;
  }>();
  const { passenger } = usePassengerAuth();
  const destination = useRef<TextInput>(null);
  const [from, setFrom] = useState(
    typeof params.from === "string" ? params.from : (passenger?.city ?? ""),
  );
  const [to, setTo] = useState(typeof params.to === "string" ? params.to : "");
  const [date, setDate] = useState(
    typeof params.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(params.date) &&
      params.date >= isoDate(new Date())
      ? params.date
      : "",
  );
  const [seats, setSeats] = useState(
    Math.max(1, Math.min(8, Math.floor(Number(params.passengers)) || 1)),
  );
  const [focused, setFocused] = useState<"from" | "to" | null>(null);
  const [calendar, setCalendar] = useState(false);
  const today = new Date();
  const todayISO = isoDate(today);
  const tomorrow = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1,
  );
  const [month, setMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const sameCity =
    from.trim().length > 1 &&
    to.trim().length > 1 &&
    from.trim().toLowerCase() === to.trim().toLowerCase();
  const canSearch = from.trim().length > 1 && to.trim().length > 1 && !sameCity;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;
  const previousDisabled =
    month.getFullYear() === today.getFullYear() &&
    month.getMonth() === today.getMonth();

  function submit() {
    if (!canSearch) return;
    Keyboard.dismiss();
    router.push({
      pathname: "/search-results",
      params: {
        from: from.trim(),
        to: to.trim(),
        date,
        passengers: String(seats),
      },
    });
  }
  function openCalendar() {
    Keyboard.dismiss();
    const selected = date ? new Date(date + "T12:00:00") : today;
    setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    setCalendar(true);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.iconButton}
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
          >
            <Icon ios="arrow.left" android="arrow_back" />
          </Pressable>
          <Text style={styles.headerTitle}>Find a ride</Text>
          <View style={styles.iconButton} />
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.eyebrow}>YOUR NEXT JOURNEY</Text>
          <Text style={styles.heading}>Where to?</Text>
          <Text style={styles.description}>
            Find a seat. Share the journey.
          </Text>

          <View style={styles.routeCard}>
            <View style={styles.rail}>
              <View style={styles.origin} />
              <View style={styles.connector} />
              <View style={styles.destination} />
            </View>
            <View style={styles.flex}>
              <View
                style={[styles.field, focused === "from" && styles.focused]}
              >
                <Text style={styles.fieldLabel}>From</Text>
                <TextInput
                  accessibilityLabel="Departure city or town"
                  value={from}
                  onChangeText={setFrom}
                  placeholder="Departure city"
                  placeholderTextColor="#7786A0"
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => destination.current?.focus()}
                  onFocus={() => setFocused("from")}
                  onBlur={() => setFocused(null)}
                  style={styles.input}
                />
              </View>
              <View style={styles.divider} />
              <View style={[styles.field, focused === "to" && styles.focused]}>
                <Text style={styles.fieldLabel}>To</Text>
                <TextInput
                  ref={destination}
                  accessibilityLabel="Destination city or town"
                  value={to}
                  onChangeText={setTo}
                  placeholder="Destination city"
                  placeholderTextColor="#7786A0"
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={submit}
                  onFocus={() => setFocused("to")}
                  onBlur={() => setFocused(null)}
                  style={styles.input}
                />
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Swap departure and destination"
              style={styles.swap}
              onPress={() => {
                setFrom(to);
                setTo(from);
              }}
            >
              <Icon
                ios="arrow.up.arrow.down"
                android="swap_vert"
                color={C.primary}
              />
            </Pressable>
          </View>
          {passenger?.city &&
          from.trim().toLowerCase() !== passenger.city.trim().toLowerCase() ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={"Use " + passenger.city + " as departure"}
              style={styles.homeCity}
              onPress={() => setFrom(passenger.city)}
            >
              <Icon ios="house" android="home" color={C.primary} />
              <Text style={styles.link}>Use {passenger.city}</Text>
            </Pressable>
          ) : null}
          {sameCity ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              Choose a destination different from your departure.
            </Text>
          ) : null}

          <Text style={styles.sectionTitle}>Travel date</Text>
          <View style={styles.chips}>
            {[
              { title: "Any date", value: "" },
              { title: "Today", value: todayISO },
              { title: "Tomorrow", value: isoDate(tomorrow) },
            ].map((option) => (
              <Pressable
                key={option.title}
                accessibilityRole="button"
                accessibilityState={{ selected: date === option.value }}
                style={[
                  styles.chip,
                  date === option.value && styles.chipActive,
                ]}
                onPress={() => setDate(option.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    date === option.value && styles.chipTextActive,
                  ]}
                >
                  {option.title}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={"Choose travel date, " + label(date)}
            style={styles.dateRow}
            onPress={openCalendar}
          >
            <View style={styles.smallIcon}>
              <Icon ios="calendar" android="calendar_month" />
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>
                {date ? label(date) : "Choose a date"}
              </Text>
              <Text style={styles.rowNote}>
                {date
                  ? "Tap to change your travel date"
                  : "Or keep your plans flexible"}
              </Text>
            </View>
            <Icon ios="chevron.right" android="chevron_right" color={C.muted} />
          </Pressable>

          <View style={styles.seatRow}>
            <View style={styles.smallIcon}>
              <Icon ios="person.2" android="group" />
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>Seats</Text>
              <Text style={styles.rowNote}>
                For you and your travel companions
              </Text>
            </View>
          </View>
          <View style={styles.seatPicker}>
            <Text style={styles.seatValue}>
              {seats}
              <Text style={styles.seatUnit}>
                {" "}
                {seats === 1 ? "seat" : "seats"}
              </Text>
            </Text>
            <View style={styles.stepper}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove seat"
                accessibilityState={{ disabled: seats === 1 }}
                disabled={seats === 1}
                style={[styles.step, seats === 1 && styles.disabled]}
                onPress={() => setSeats((value) => Math.max(1, value - 1))}
              >
                <Icon ios="minus" android="remove" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add seat"
                accessibilityState={{ disabled: seats === 8 }}
                disabled={seats === 8}
                style={[styles.step, seats === 8 && styles.disabled]}
                onPress={() => setSeats((value) => Math.min(8, value + 1))}
              >
                <Icon ios="plus" android="add" />
              </Pressable>
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSearch }}
            disabled={!canSearch}
            onPress={submit}
            style={({ pressed }) => [
              styles.search,
              !canSearch && styles.searchDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Icon ios="magnifyingglass" android="search" color="#FFFFFF" />
            <Text style={styles.searchText}>Find rides</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={calendar}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendar(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            accessibilityRole="button"
            accessibilityLabel="Close calendar"
            onPress={() => setCalendar(false)}
          />
          <SafeAreaView style={styles.calendarSafe} edges={["bottom"]}>
            <ScrollView
              contentContainerStyle={styles.calendar}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.calendarHeading}>
                <Text style={styles.sectionTitle}>Choose your travel date</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close calendar"
                  style={styles.iconButton}
                  onPress={() => setCalendar(false)}
                >
                  <Icon ios="xmark" android="close" />
                </Pressable>
              </View>
              <View style={styles.monthRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                  accessibilityState={{ disabled: previousDisabled }}
                  disabled={previousDisabled}
                  style={[
                    styles.iconButton,
                    previousDisabled && styles.disabled,
                  ]}
                  onPress={() =>
                    setMonth(
                      (value) =>
                        new Date(value.getFullYear(), value.getMonth() - 1, 1),
                    )
                  }
                >
                  <Icon ios="chevron.left" android="chevron_left" />
                </Pressable>
                <Text style={styles.rowTitle}>
                  {new Intl.DateTimeFormat("en-ZA", {
                    month: "long",
                    year: "numeric",
                  }).format(month)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                  style={styles.iconButton}
                  onPress={() =>
                    setMonth(
                      (value) =>
                        new Date(value.getFullYear(), value.getMonth() + 1, 1),
                    )
                  }
                >
                  <Icon ios="chevron.right" android="chevron_right" />
                </Pressable>
              </View>
              <View style={styles.days}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day) => (
                    <View key={day} style={styles.dayCell}>
                      <Text style={styles.weekday}>{day}</Text>
                    </View>
                  ),
                )}
                {Array.from({ length: offset }, (_, index) => (
                  <View key={"blank-" + index} style={styles.dayCell} />
                ))}
                {Array.from({ length: days }, (_, index) => {
                  const value = isoDate(
                    new Date(month.getFullYear(), month.getMonth(), index + 1),
                  );
                  const disabled = value < todayISO;
                  const selected = date === value;
                  return (
                    <View key={value} style={styles.dayCell}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={label(value)}
                        accessibilityState={{ disabled, selected }}
                        disabled={disabled}
                        style={[
                          styles.day,
                          selected && styles.daySelected,
                          disabled && styles.disabled,
                        ]}
                        onPress={() => {
                          setDate(value);
                          setCalendar(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            selected && styles.dayTextSelected,
                          ]}
                        >
                          {index + 1}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
              <Pressable
                accessibilityRole="button"
                style={styles.flexible}
                onPress={() => {
                  setDate("");
                  setCalendar(false);
                }}
              >
                <Text style={styles.link}>
                  I&apos;m flexible · search any date
                </Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  headerTitle: { color: C.text, fontSize: 16, fontWeight: "600" },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 28
  },
  eyebrow: {
    color: C.primary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.8,
  },
  heading: {
    color: Design.color.navy,
    fontSize: 38,
    lineHeight: 48,
    fontWeight: "800",
    letterSpacing: -1.5,
    marginTop: 8
  },
  description: {
    color: C.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
    marginBottom: 28,
  },
  routeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E3EAF5",
    paddingLeft: 18,
    paddingRight: 12,
    boxShadow: Design.shadow.card
  },
  rail: { width: 12, height: 94, alignItems: "center", marginRight: 12 },
  origin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: C.primary,
    backgroundColor: "white",
  },
  connector: {
    width: 1,
    flex: 1,
    backgroundColor: "#D5E3FA",
    marginVertical: 6
  },
  destination: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: C.text,
  },
  field: { paddingHorizontal: 8, paddingVertical: 14, borderRadius: 10 },
  focused: {
    backgroundColor: "#EAF2FF"
  },
  fieldLabel: { color: C.muted, fontSize: 12, marginBottom: 3 },
  input: {
    color: C.text,
    fontSize: 18,
    fontWeight: "600",
    minHeight: 36,
    padding: 0,
  },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 8 },
  swap: {
    width: 44,
    height: 44,
    marginLeft: 4,
    borderRadius: 22,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  homeCity: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    minHeight: 44,
    marginTop: 4,
  },
  link: { color: C.primary, fontSize: 14, fontWeight: "600" },
  error: { color: "#B42318", fontSize: 13, lineHeight: 20, marginTop: 12 },
  sectionTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 26,
    marginBottom: 14,
  },
  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF"
  },
  chipActive: {
    backgroundColor: Design.color.primary,
    borderColor: Design.color.primary
  },
  chipText: { color: C.muted, fontSize: 14, fontWeight: "600" },
  chipTextActive: { color: "white" },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 14
  },
  smallIcon: { width: 28, alignItems: "center" },
  rowTitle: { color: C.text, fontSize: 16, fontWeight: "600" },
  rowNote: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  seatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 22,
  },
  seatPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingLeft: 40,
  },
  seatValue: { color: C.text, fontSize: 28, fontWeight: "700" },
  seatUnit: { color: C.muted, fontSize: 14, fontWeight: "400" },
  stepper: { flexDirection: "row", gap: 10 },
  step: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center"
  },
  disabled: { opacity: 0.3 },
  footer: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "#E2E9F4",
    backgroundColor: "#FFFFFF"
  },
  search: {
    minHeight: 56,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primary,
    borderRadius: 16,
    padding: 14,
  },
  searchDisabled: { backgroundColor: "#A3B9DE" },
  searchText: { color: "white", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.75 },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "#11234066",
  },
  backdrop: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 },
  calendarSafe: {
    backgroundColor: "white",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: "90%",
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  calendar: { paddingHorizontal: 20, paddingBottom: 12 },
  calendarHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  days: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: "14.285714%",
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  weekday: { color: C.muted, fontSize: 12, fontWeight: "600" },
  day: {
    width: "100%",
    minHeight: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  daySelected: { backgroundColor: C.primary },
  dayText: { color: C.text, fontSize: 15, fontWeight: "500" },
  dayTextSelected: { color: "white" },
  flexible: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  }
});
