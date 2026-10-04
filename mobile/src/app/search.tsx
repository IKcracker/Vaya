import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BLUE = '#1877F2';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat('en-ZA', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string; to?: string }>();
  const [from, setFrom] = useState(
    typeof params.from === 'string' ? params.from : 'Johannesburg'
  );
  const [to, setTo] = useState(
    typeof params.to === 'string' ? params.to : 'Durban'
  );
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  const dateOptions = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const nextFriday = new Date(today);
    const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
    nextFriday.setDate(today.getDate() + daysUntilFriday);

    return [
      { label: 'Any date', value: '' },
      { label: dateLabel(tomorrow), value: isoDate(tomorrow) },
      { label: dateLabel(nextFriday), value: isoDate(nextFriday) },
    ];
  }, []);

  const canSearch = from.trim().length > 1 && to.trim().length > 1;

  function submit() {
    if (!canSearch) return;

    router.push({
      pathname: '/search-results',
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
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.eyebrow}>PLAN A TRIP</Text>
            <Text style={styles.title}>Search available rides</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.routeRow}>
            <View style={styles.rail}>
              <View style={styles.dotMuted} />
              <View style={styles.line} />
              <View style={styles.dotBlue} />
            </View>

            <View style={styles.fields}>
              <View style={styles.field}>
                <Text style={styles.label}>Leaving from</Text>
                <TextInput
                  value={from}
                  onChangeText={setFrom}
                  placeholder="City or town"
                  placeholderTextColor="#98A2B3"
                  autoCapitalize="words"
                  returnKeyType="next"
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Going to</Text>
                <TextInput
                  value={to}
                  onChangeText={setTo}
                  placeholder="City or town"
                  placeholderTextColor="#98A2B3"
                  autoCapitalize="words"
                  returnKeyType="done"
                  style={styles.input}
                />
              </View>
            </View>
          </View>

          <Text style={styles.groupLabel}>Travel date</Text>
          <View style={styles.chips}>
            {dateOptions.map((option) => (
              <Pressable
                key={option.label}
                onPress={() => setDate(option.value)}
                style={({ pressed }) => [
                  styles.chip,
                  date === option.value && styles.chipActive,
                  pressed && styles.pressed,
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    date === option.value && styles.chipTextActive,
                  ]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.passengerRow}>
            <View>
              <Text style={styles.groupLabel}>Passengers</Text>
              <Text style={styles.passengerHint}>
                Reserve the correct number of seats.
              </Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                disabled={passengers <= 1}
                onPress={() => setPassengers((value) => Math.max(1, value - 1))}
                style={({ pressed }) => [
                  styles.stepButton,
                  passengers <= 1 && styles.stepDisabled,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.stepText}>−</Text>
              </Pressable>
              <Text style={styles.count}>{passengers}</Text>
              <Pressable
                disabled={passengers >= 8}
                onPress={() => setPassengers((value) => Math.min(8, value + 1))}
                style={({ pressed }) => [
                  styles.stepButton,
                  passengers >= 8 && styles.stepDisabled,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.stepText}>＋</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Pressable
          disabled={!canSearch}
          onPress={submit}
          style={({ pressed }) => [
            styles.primary,
            !canSearch && styles.primaryDisabled,
            pressed && canSearch && styles.primaryPressed,
          ]}>
          <Text style={styles.primaryText}>Search rides</Text>
        </Pressable>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>What Vaya checks</Text>
          <Text style={styles.noteText}>
            Results only include trips with enough available seats. Driver,
            vehicle, fare and departure details are returned from the Vaya
            backend.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 40 },
  pressed: { opacity: 0.72 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: TEXT, fontSize: 30, lineHeight: 30, marginTop: -3 },
  eyebrow: {
    color: BLUE,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  title: {
    color: TEXT,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: 3,
  },
  card: {
    marginTop: 24,
    backgroundColor: SURFACE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LINE,
    padding: 16,
  },
  routeRow: { flexDirection: 'row' },
  rail: {
    width: 25,
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 24,
  },
  dotMuted: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#98A2B3',
  },
  dotBlue: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BLUE,
  },
  line: {
    flex: 1,
    width: 1,
    backgroundColor: '#D0D5DD',
    marginVertical: 3,
  },
  fields: { flex: 1, gap: 10 },
  field: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  label: { color: MUTED, fontSize: 9, fontWeight: '800' },
  input: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '800',
    paddingVertical: 5,
    marginTop: 2,
  },
  groupLabel: {
    color: TEXT,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 20,
  },
  chips: {
    marginTop: 9,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: SURFACE,
  },
  chipActive: { borderColor: '#9DC5FA', backgroundColor: '#E7F3FF' },
  chipText: { color: MUTED, fontSize: 10, fontWeight: '800' },
  chipTextActive: { color: BLUE },
  passengerRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  passengerHint: { color: MUTED, fontSize: 9, marginTop: 4 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 11,
    overflow: 'hidden',
  },
  stepButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  stepDisabled: { opacity: 0.35 },
  stepText: { color: TEXT, fontSize: 18, fontWeight: '800' },
  count: {
    width: 34,
    textAlign: 'center',
    color: TEXT,
    fontSize: 12,
    fontWeight: '900',
  },
  primary: {
    marginTop: 16,
    height: 50,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: { backgroundColor: '#B7D5FA' },
  primaryPressed: { opacity: 0.88, transform: [{ scale: 0.995 }] },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  note: {
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: '#EEF5FF',
    padding: 14,
  },
  noteTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  noteText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
});
