import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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

export default function PublishDriverTripScreen() {
  const router = useRouter();
  const { loading, session } = usePassengerAuth();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState('3');
  const [fare, setFare] = useState('');
  const [now] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seatCount = Number(seats);
  const fareAmount = Number(fare);
  const departureAt =
    /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(time)
      ? new Date(`${date}T${time}:00+02:00`)
      : null;

  const valid =
    from.trim().length >= 2 &&
    to.trim().length >= 2 &&
    from.trim().toLowerCase() !== to.trim().toLowerCase() &&
    departureAt !== null &&
    !Number.isNaN(departureAt.getTime()) &&
    departureAt.getTime() > now &&
    Number.isInteger(seatCount) &&
    seatCount >= 1 &&
    seatCount <= 8 &&
    Number.isFinite(fareAmount) &&
    fareAmount > 0 &&
    fareAmount <= 10000;

  async function submit() {
    if (!session || !valid || !departureAt || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await publishDriverTrip(session, {
        from: from.trim(),
        to: to.trim(),
        departureAt: departureAt.toISOString(),
        seats: seatCount,
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
        <View style={styles.center}><ActivityIndicator color={BLUE} /></View>
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
        <View style={styles.twoColumn}>
          <View style={styles.halfCard}>
            <Field label="Date">
              <TextInput
                value={date}
                onChangeText={setDate}
                keyboardType="numbers-and-punctuation"
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#98A2B3"
              />
            </Field>
          </View>
          <View style={styles.halfCard}>
            <Field label="Time">
              <TextInput
                value={time}
                onChangeText={setTime}
                keyboardType="numbers-and-punctuation"
                style={styles.input}
                placeholder="06:30"
                placeholderTextColor="#98A2B3"
              />
            </Field>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Seats & fare</Text>
        <View style={styles.twoColumn}>
          <View style={styles.halfCard}>
            <Field label="Seats">
              <TextInput
                value={seats}
                onChangeText={setSeats}
                keyboardType="number-pad"
                style={styles.input}
                placeholder="3"
                placeholderTextColor="#98A2B3"
              />
            </Field>
          </View>
          <View style={styles.halfCard}>
            <Field label="Fare per seat (R)">
              <TextInput
                value={fare}
                onChangeText={setFare}
                keyboardType="decimal-pad"
                style={styles.input}
                placeholder="280"
                placeholderTextColor="#98A2B3"
              />
            </Field>
          </View>
        </View>

        <View style={styles.preview}>
          <Text style={styles.previewTitle}>Passenger listing</Text>
          <Text style={styles.previewText}>
            Once published, this route becomes visible in Vaya search with your
            approved driver profile, vehicle, remaining seats and fare.
          </Text>
        </View>

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 40 },
  pressed: { opacity: 0.72 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  stateTitle: { color: TEXT, fontSize: 18, fontWeight: '900' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 40, height: 40, borderRadius: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  backText: { color: TEXT, fontSize: 30, lineHeight: 30, marginTop: -3 },
  eyebrow: { color: BLUE, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: TEXT, fontSize: 21, fontWeight: '900', marginTop: 3 },
  card: { marginTop: 22, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 16, padding: 15, gap: 14 },
  sectionTitle: { color: TEXT, fontSize: 16, fontWeight: '900', marginTop: 22, marginBottom: 9 },
  twoColumn: { flexDirection: 'row', gap: 10 },
  halfCard: { flex: 1, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 14, padding: 12 },
  field: { gap: 6 },
  label: { color: MUTED, fontSize: 9, fontWeight: '800' },
  input: { minHeight: 44, borderWidth: 1, borderColor: LINE, borderRadius: 11, backgroundColor: '#F9FAFB', color: TEXT, paddingHorizontal: 12, fontSize: 13, fontWeight: '700' },
  preview: { marginTop: 18, borderRadius: 14, backgroundColor: '#EEF5FF', padding: 14 },
  previewTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  previewText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
  error: { marginTop: 14, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFF8F7', borderRadius: 12, padding: 12 },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16 },
  primary: { marginTop: 18, height: 50, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryDisabled: { backgroundColor: '#B7D5FA' },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
