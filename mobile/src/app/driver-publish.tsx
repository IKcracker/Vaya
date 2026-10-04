import DateTimePicker from '@expo/ui/community/datetime-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { publishDriverTrip } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#1877F2';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

function initialDeparture() {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  value.setHours(8, 0, 0, 0);
  return value;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-ZA', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value);
}

export default function PublishDriverTripScreen() {
  const router = useRouter();
  const { loading, session } = usePassengerAuth();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departureAt, setDepartureAt] = useState(initialDeparture);
  const [seats, setSeats] = useState(3);
  const [fare, setFare] = useState('');
  const [now] = useState(() => Date.now());
  const [showAndroidDate, setShowAndroidDate] = useState(false);
  const [showAndroidTime, setShowAndroidTime] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fareAmount = Number(fare);
  const valid =
    from.trim().length >= 2 &&
    to.trim().length >= 2 &&
    from.trim().toLowerCase() !== to.trim().toLowerCase() &&
    departureAt.getTime() > now &&
    seats >= 1 &&
    seats <= 8 &&
    Number.isFinite(fareAmount) &&
    fareAmount > 0 &&
    fareAmount <= 10000;

  function updateDate(selectedDate: Date) {
    const next = new Date(departureAt);
    next.setFullYear(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );
    setDepartureAt(next);
  }

  function updateTime(selectedTime: Date) {
    const next = new Date(departureAt);
    next.setHours(
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      0,
      0
    );
    setDepartureAt(next);
  }

  async function submit() {
    if (!session || !valid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await publishDriverTrip(session, {
        from: from.trim(),
        to: to.trim(),
        departureAt: departureAt.toISOString(),
        seats,
        fare: fareAmount,
      });

      router.replace({ pathname: '/explore', params: { refresh: 'published' } });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to publish trip'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={BLUE} />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.stateTitle}>Sign in to publish trips</Text>
          <Pressable
            onPress={() =>
              router.replace({
                pathname: '/auth',
                params: { next: '/driver-publish' },
              })
            }
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
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
            <Text style={styles.eyebrow}>DRIVER MODE</Text>
            <Text style={styles.title}>Publish a trip</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Route</Text>
        <View style={styles.card}>
          <Field label="Leaving from">
            <TextInput
              value={from}
              onChangeText={setFrom}
              autoCapitalize="words"
              style={styles.input}
              placeholder="Johannesburg"
              placeholderTextColor="#98A2B3"
            />
          </Field>
          <Field label="Going to">
            <TextInput
              value={to}
              onChangeText={setTo}
              autoCapitalize="words"
              style={styles.input}
              placeholder="Durban"
              placeholderTextColor="#98A2B3"
            />
          </Field>
        </View>

        <Text style={styles.sectionTitle}>Departure</Text>
        <View style={styles.departureCard}>
          <View style={styles.pickerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.pickerValue}>{formatDate(departureAt)}</Text>
            </View>

            {Platform.OS === 'android' ? (
              <Pressable
                onPress={() => setShowAndroidDate(true)}
                style={({ pressed }) => [
                  styles.nativeTrigger,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.nativeTriggerText}>Choose date</Text>
              </Pressable>
            ) : (
              <DateTimePicker
                value={departureAt}
                onValueChange={(_, selectedDate) => updateDate(selectedDate)}
                mode="date"
                display="compact"
                minimumDate={new Date(now)}
                accentColor={BLUE}
                locale="en_ZA"
                timeZoneName="Africa/Johannesburg"
              />
            )}
          </View>

          <View style={styles.pickerDivider} />

          <View style={styles.pickerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Time</Text>
              <Text style={styles.pickerValue}>{formatTime(departureAt)}</Text>
            </View>

            {Platform.OS === 'android' ? (
              <Pressable
                onPress={() => setShowAndroidTime(true)}
                style={({ pressed }) => [
                  styles.nativeTrigger,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.nativeTriggerText}>Choose time</Text>
              </Pressable>
            ) : (
              <DateTimePicker
                value={departureAt}
                onValueChange={(_, selectedTime) => updateTime(selectedTime)}
                mode="time"
                display="compact"
                is24Hour
                accentColor={BLUE}
                locale="en_ZA"
                timeZoneName="Africa/Johannesburg"
              />
            )}
          </View>
        </View>

        {showAndroidDate ? (
          <DateTimePicker
            value={departureAt}
            onValueChange={(_, selectedDate) => {
              setShowAndroidDate(false);
              updateDate(selectedDate);
            }}
            onDismiss={() => setShowAndroidDate(false)}
            mode="date"
            presentation="dialog"
            minimumDate={new Date(now)}
            accentColor={BLUE}
          />
        ) : null}

        {showAndroidTime ? (
          <DateTimePicker
            value={departureAt}
            onValueChange={(_, selectedTime) => {
              setShowAndroidTime(false);
              updateTime(selectedTime);
            }}
            onDismiss={() => setShowAndroidTime(false)}
            mode="time"
            presentation="dialog"
            is24Hour
            accentColor={BLUE}
          />
        ) : null}

        <Text style={styles.sectionTitle}>Seats & fare</Text>
        <View style={styles.commercialCard}>
          <View style={styles.commercialRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Available seats</Text>
              <Text style={styles.helper}>How many passengers can book?</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                disabled={seats <= 1}
                onPress={() => setSeats((value) => Math.max(1, value - 1))}
                style={({ pressed }) => [
                  styles.stepButton,
                  seats <= 1 && styles.stepDisabled,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.stepText}>−</Text>
              </Pressable>
              <Text style={styles.stepValue}>{seats}</Text>
              <Pressable
                disabled={seats >= 8}
                onPress={() => setSeats((value) => Math.min(8, value + 1))}
                style={({ pressed }) => [
                  styles.stepButton,
                  seats >= 8 && styles.stepDisabled,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.stepText}>＋</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.pickerDivider} />

          <Field label="Fare per seat">
            <View style={styles.moneyInput}>
              <Text style={styles.currency}>R</Text>
              <TextInput
                value={fare}
                onChangeText={(value) =>
                  setFare(value.replace(/[^0-9.]/g, '').slice(0, 8))
                }
                keyboardType="decimal-pad"
                style={styles.moneyField}
                placeholder="280"
                placeholderTextColor="#98A2B3"
              />
            </View>
          </Field>

          <View style={styles.suggestions}>
            {[180, 220, 280, 320].map((amount) => (
              <Pressable
                key={amount}
                onPress={() => setFare(String(amount))}
                style={({ pressed }) => [
                  styles.suggestion,
                  fare === String(amount) && styles.suggestionActive,
                  pressed && styles.pressed,
                ]}>
                <Text
                  style={[
                    styles.suggestionText,
                    fare === String(amount) && styles.suggestionTextActive,
                  ]}>
                  R{amount}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Passenger preview</Text>
        <View style={styles.preview}>
          <View style={styles.previewHeader}>
            <View>
              <Text style={styles.previewEyebrow}>YOUR LISTING</Text>
              <Text style={styles.previewRoute}>
                {from.trim() || 'Origin'} → {to.trim() || 'Destination'}
              </Text>
            </View>
            <Text style={styles.previewFare}>
              {fareAmount > 0 ? `R${fareAmount}` : 'R—'}
            </Text>
          </View>

          <View style={styles.previewDivider} />

          <View style={styles.previewGrid}>
            <PreviewMetric label="Date" value={formatDate(departureAt)} />
            <PreviewMetric label="Time" value={formatTime(departureAt)} />
            <PreviewMetric
              label="Seats"
              value={`${seats} available`}
            />
            <PreviewMetric label="Status" value="Scheduled" />
          </View>
        </View>

        {departureAt.getTime() <= now ? (
          <View style={styles.warning}>
            <Text style={styles.warningText}>
              Choose a departure time in the future.
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          disabled={!valid || submitting}
          onPress={() => void submit()}
          style={({ pressed }) => [
            styles.primary,
            (!valid || submitting) && styles.primaryDisabled,
            pressed && valid && !submitting && styles.pressed,
          ]}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>Publish trip</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewMetric}>
      <Text style={styles.previewMetricLabel}>{label}</Text>
      <Text style={styles.previewMetricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 40 },
  pressed: { opacity: 0.72 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  stateTitle: { color: TEXT, fontSize: 18, fontWeight: '900' },
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
  title: { color: TEXT, fontSize: 21, fontWeight: '900', marginTop: 3 },
  sectionTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 22,
    marginBottom: 9,
  },
  card: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 16,
    padding: 15,
    gap: 14,
  },
  field: { gap: 6 },
  label: { color: MUTED, fontSize: 9, fontWeight: '800' },
  helper: { color: MUTED, fontSize: 9, marginTop: 3 },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 11,
    backgroundColor: '#F9FAFB',
    color: TEXT,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
  },
  departureCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 16,
    paddingHorizontal: 15,
  },
  pickerRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickerValue: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 5,
  },
  pickerDivider: { height: 1, backgroundColor: LINE },
  nativeTrigger: {
    borderRadius: 10,
    backgroundColor: '#E7F3FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  nativeTriggerText: { color: BLUE, fontSize: 10, fontWeight: '900' },
  commercialCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 16,
    padding: 15,
  },
  commercialRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 11,
    overflow: 'hidden',
  },
  stepButton: {
    width: 39,
    height: 39,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDisabled: { opacity: 0.35 },
  stepText: { color: TEXT, fontSize: 18, fontWeight: '800' },
  stepValue: {
    minWidth: 36,
    textAlign: 'center',
    color: TEXT,
    fontSize: 12,
    fontWeight: '900',
  },
  moneyInput: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 11,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
  },
  currency: { color: TEXT, fontSize: 13, fontWeight: '900' },
  moneyField: {
    flex: 1,
    height: 46,
    color: TEXT,
    fontSize: 14,
    fontWeight: '900',
    paddingHorizontal: 7,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 10,
  },
  suggestion: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#F9FAFB',
  },
  suggestionActive: {
    borderColor: '#9DC5FA',
    backgroundColor: '#E7F3FF',
  },
  suggestionText: { color: MUTED, fontSize: 9, fontWeight: '800' },
  suggestionTextActive: { color: BLUE },
  preview: {
    borderRadius: 17,
    backgroundColor: '#0B1730',
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  previewEyebrow: {
    color: '#72AFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  previewRoute: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 5,
  },
  previewFare: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  previewDivider: {
    height: 1,
    backgroundColor: '#263955',
    marginVertical: 14,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
  },
  previewMetric: { width: '50%' },
  previewMetricLabel: {
    color: '#8FA0B8',
    fontSize: 8,
    fontWeight: '700',
  },
  previewMetricValue: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 4,
  },
  warning: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FEDF89',
    backgroundColor: '#FFFAEB',
    borderRadius: 12,
    padding: 12,
  },
  warningText: { color: '#B54708', fontSize: 10, fontWeight: '800' },
  error: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF8F7',
    borderRadius: 12,
    padding: 12,
  },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16 },
  primary: {
    marginTop: 18,
    height: 50,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryDisabled: { backgroundColor: '#B7D5FA' },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
