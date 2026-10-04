import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
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

import {
  fetchPassengerTrips,
  PassengerTrip,
  submitPassengerSafetyReport,
} from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#1877F2';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

export default function ProfileSafetyScreen() {
  const router = useRouter();
  const { session } = usePassengerAuth();
  const [trips, setTrips] = useState<PassengerTrip[]>([]);
  const [tripId, setTripId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [note, setNote] = useState('');
  const [loadingTrips, setLoadingTrips] = useState(Boolean(session));
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    let active = true;

    fetchPassengerTrips(session)
      .then((response) => {
        if (active) setTrips(response.trips.slice(0, 6));
      })
      .catch(() => {
        if (active) setTrips([]);
      })
      .finally(() => {
        if (active) setLoadingTrips(false);
      });

    return () => {
      active = false;
    };
  }, [session]);

  const valid = subject.trim().length >= 3 && note.trim().length >= 10;

  async function submit() {
    if (!session || !valid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await submitPassengerSafetyReport(session, {
        subject: subject.trim(),
        note: note.trim(),
        tripId,
      });
      setSubmittedId(response.safetyCase.id);
      setSubject('');
      setNote('');
      setTripId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to submit safety report');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.eyebrow}>SAFETY</Text>
            <Text style={styles.title}>Report a concern</Text>
          </View>
        </View>

        <View style={styles.alert}>
          <Text style={styles.alertTitle}>For immediate danger, contact emergency services.</Text>
          <Text style={styles.alertText}>
            This form creates a high-priority case for Vaya Operations. It is intended for trip safety, driver/passenger conduct, or serious travel concerns.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Related trip</Text>
        <View style={styles.tripList}>
          <Pressable
            onPress={() => setTripId(null)}
            style={[styles.tripRow, tripId === null && styles.tripRowSelected]}>
            <Text style={styles.tripTitle}>Not linked to a specific trip</Text>
            <Text style={styles.tripCheck}>{tripId === null ? '✓' : ''}</Text>
          </Pressable>
          {loadingTrips ? (
            <View style={styles.loadingRow}><ActivityIndicator color={BLUE} /></View>
          ) : (
            trips.map((trip) => (
              <Pressable
                key={trip.id}
                onPress={() => setTripId(trip.tripId)}
                style={[
                  styles.tripRow,
                  tripId === trip.tripId && styles.tripRowSelected,
                ]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tripTitle}>{trip.route}</Text>
                  <Text style={styles.tripMeta}>{trip.id} · {trip.bookingStatus}</Text>
                </View>
                <Text style={styles.tripCheck}>{tripId === trip.tripId ? '✓' : ''}</Text>
              </Pressable>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Concern details</Text>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              style={styles.input}
              placeholder="What happened?"
              placeholderTextColor="#98A2B3"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Details</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              style={[styles.input, styles.textarea]}
              placeholder="Tell Vaya Operations what happened, where, and what you need help with."
              placeholderTextColor="#98A2B3"
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {submittedId ? (
          <View style={styles.success}>
            <Text style={styles.successTitle}>Report submitted</Text>
            <Text style={styles.successText}>Reference {submittedId}. Vaya Operations can now see this case in the Admin CRM.</Text>
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
          style={[styles.primary, (!valid || submitting) && styles.disabled]}>
          {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Submit safety report</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { padding: 18, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 40, height: 40, borderRadius: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  backText: { color: TEXT, fontSize: 30, lineHeight: 30, marginTop: -3 },
  eyebrow: { color: BLUE, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: TEXT, fontSize: 22, fontWeight: '900', marginTop: 3 },
  alert: { marginTop: 20, borderRadius: 14, backgroundColor: '#FFF1F0', padding: 14 },
  alertTitle: { color: '#B42318', fontSize: 11, fontWeight: '900' },
  alertText: { color: '#7A271A', fontSize: 10, lineHeight: 16, marginTop: 4 },
  sectionTitle: { color: TEXT, fontSize: 16, fontWeight: '900', marginTop: 22, marginBottom: 9 },
  tripList: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 16, overflow: 'hidden' },
  tripRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderBottomWidth: 1, borderBottomColor: LINE },
  tripRowSelected: { backgroundColor: '#EEF5FF' },
  tripTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  tripMeta: { color: MUTED, fontSize: 9, marginTop: 3 },
  tripCheck: { width: 18, color: BLUE, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  loadingRow: { minHeight: 54, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 16, padding: 14, gap: 14 },
  field: { gap: 6 },
  label: { color: MUTED, fontSize: 9, fontWeight: '800' },
  input: { minHeight: 44, borderWidth: 1, borderColor: LINE, borderRadius: 11, backgroundColor: '#F9FAFB', color: TEXT, paddingHorizontal: 12, fontSize: 12, fontWeight: '700' },
  textarea: { minHeight: 120, paddingTop: 12 },
  success: { marginTop: 14, borderRadius: 12, backgroundColor: '#ECFDF3', padding: 12 },
  successTitle: { color: '#027A48', fontSize: 11, fontWeight: '900' },
  successText: { color: '#05603A', fontSize: 10, lineHeight: 16, marginTop: 3 },
  error: { marginTop: 14, borderRadius: 12, backgroundColor: '#FFF1F0', padding: 12 },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16 },
  primary: { marginTop: 18, height: 50, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  disabled: { opacity: 0.45 },
});
