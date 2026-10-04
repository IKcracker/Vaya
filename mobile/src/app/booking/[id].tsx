import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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

import { createBooking, PublicBooking } from '@/lib/api';

const BLUE = '#1877F2';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; seats?: string }>();
  const tripId = typeof params.id === 'string' ? params.id : '';
  const seats = Math.max(
    1,
    Number(typeof params.seats === 'string' ? params.seats : '1') || 1
  );

  const [name, setName] = useState('Zack Moropane');
  const [email, setEmail] = useState('zack@example.com');
  const [city, setCity] = useState('Johannesburg');
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () =>
      tripId.length > 0 &&
      name.trim().length > 1 &&
      city.trim().length > 1 &&
      /^\S+@\S+\.\S+$/.test(email.trim()),
    [city, email, name, tripId]
  );

  async function confirmBooking() {
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await createBooking({
        tripId,
        seats,
        passenger: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          city: city.trim(),
        },
      });

      setBooking(response.booking);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to create booking'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (booking) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successPage}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Booking created</Text>
          <Text style={styles.successCopy}>
            Your seat reservation is saved in Vaya and is awaiting payment.
          </Text>

          <View style={styles.successCard}>
            <Row label="Booking" value={booking.id} />
            <Row label="Trip" value={booking.trip.route} />
            <Row label="Seats" value={String(booking.seats)} />
            <Row label="Amount" value={booking.amount} />
            <Row label="Status" value={booking.status} />
            <Row label="Payment" value={booking.paymentStatus} />
          </View>

          <Pressable
            onPress={() => router.replace('/trips')}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>View my trips</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/')}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Back to Ride</Text>
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
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>BOOK YOUR SEAT</Text>
            <Text style={styles.title}>{tripId}</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>Seats</Text>
            <Text style={styles.summaryValue}>{seats}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.summaryLabel}>Booking status</Text>
            <Text style={styles.summaryValue}>Awaiting payment</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Passenger details</Text>
        <View style={styles.formCard}>
          <Field label="Full name">
            <TextInput
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#98A2B3"
            />
          </Field>

          <Field label="Email">
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              placeholder="name@example.com"
              placeholderTextColor="#98A2B3"
            />
          </Field>

          <Field label="Home city">
            <TextInput
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
              style={styles.input}
              placeholder="Johannesburg"
              placeholderTextColor="#98A2B3"
            />
          </Field>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Booking couldn’t be completed</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.note}>
          <Text style={styles.noteTitle}>Seat availability is checked again</Text>
          <Text style={styles.noteText}>
            Vaya only confirms the booking if the requested seats are still
            available when you submit.
          </Text>
        </View>

        <Pressable
          disabled={!canSubmit || submitting}
          onPress={() => void confirmBooking()}
          style={({ pressed }) => [
            styles.primary,
            (!canSubmit || submitting) && styles.primaryDisabled,
            pressed && canSubmit && !submitting && styles.pressed,
          ]}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>Confirm booking</Text>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
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
  eyebrow: { color: BLUE, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: TEXT, fontSize: 18, fontWeight: '900', marginTop: 3 },
  summaryCard: {
    marginTop: 22,
    backgroundColor: '#0B1730',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: { color: '#8FA0B8', fontSize: 9, fontWeight: '700' },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 24,
    marginBottom: 10,
  },
  formCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 16,
    padding: 15,
    gap: 14,
  },
  field: { gap: 6 },
  label: { color: MUTED, fontSize: 9, fontWeight: '800' },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 11,
    paddingHorizontal: 12,
    color: TEXT,
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: '#F9FAFB',
  },
  errorCard: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF8F7',
    padding: 14,
  },
  errorTitle: { color: '#B42318', fontSize: 11, fontWeight: '900' },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16, marginTop: 4 },
  note: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: '#EEF5FF',
    padding: 14,
  },
  noteTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  noteText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
  primary: {
    marginTop: 18,
    height: 50,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: { backgroundColor: '#B7D5FA' },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  secondary: {
    marginTop: 10,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SURFACE,
  },
  secondaryText: { color: TEXT, fontSize: 12, fontWeight: '900' },
  successPage: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ECFDF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconText: { color: '#12B76A', fontSize: 28, fontWeight: '900' },
  successTitle: {
    color: TEXT,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 18,
    letterSpacing: -0.4,
  },
  successCopy: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 320,
  },
  successCard: {
    width: '100%',
    marginTop: 24,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 16,
    paddingHorizontal: 15,
  },
  row: {
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  rowLabel: { color: MUTED, fontSize: 10, fontWeight: '700' },
  rowValue: { color: TEXT, fontSize: 11, fontWeight: '900' },
});
