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

import { submitDriverApplication } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#1877F2';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

export default function DriverApplicationScreen() {
  const router = useRouter();
  const { loading, session, passenger, user } = usePassengerAuth();
  const [name, setName] = useState(passenger?.name || user?.name || '');
  const [phone, setPhone] = useState(passenger?.phone || '');
  const [location, setLocation] = useState(passenger?.city || '');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const year = Number(vehicleYear);
  const valid =
    name.trim().length >= 2 &&
    location.trim().length >= 2 &&
    vehicleMake.trim().length >= 2 &&
    vehicleModel.trim().length >= 1 &&
    Number.isInteger(year) &&
    year >= 1980 &&
    year <= 2100;

  async function submit() {
    if (!session || !valid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await submitDriverApplication(session, {
        name: name.trim(),
        phone: phone.trim(),
        location: location.trim(),
        vehicleMake: vehicleMake.trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleYear: year,
      });

      router.replace({ pathname: '/explore', params: { refresh: 'application' } });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to submit driver application'
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
          <Text style={styles.stateTitle}>Sign in to become a driver</Text>
          <Text style={styles.stateText}>
            Driver applications are linked to your Vaya passenger identity.
          </Text>
          <Pressable
            onPress={() =>
              router.replace({
                pathname: '/auth',
                params: { next: '/driver-application' },
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
            <Text style={styles.eyebrow}>DRIVER APPLICATION</Text>
            <Text style={styles.title}>Drive with Vaya</Text>
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={styles.introTitle}>One account, two modes.</Text>
          <Text style={styles.introText}>
            Submit your identity and vehicle details for review. The Admin CRM
            must approve your driver profile before you can publish trips.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Driver details</Text>
        <View style={styles.card}>
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
          <Field label="Phone">
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
              placeholder="Optional"
              placeholderTextColor="#98A2B3"
            />
          </Field>
          <Field label="Operating area">
            <TextInput
              value={location}
              onChangeText={setLocation}
              autoCapitalize="words"
              style={styles.input}
              placeholder="Johannesburg"
              placeholderTextColor="#98A2B3"
            />
          </Field>
        </View>

        <Text style={styles.sectionTitle}>Vehicle</Text>
        <View style={styles.card}>
          <Field label="Make">
            <TextInput
              value={vehicleMake}
              onChangeText={setVehicleMake}
              autoCapitalize="words"
              style={styles.input}
              placeholder="Toyota"
              placeholderTextColor="#98A2B3"
            />
          </Field>
          <Field label="Model">
            <TextInput
              value={vehicleModel}
              onChangeText={setVehicleModel}
              autoCapitalize="words"
              style={styles.input}
              placeholder="Corolla"
              placeholderTextColor="#98A2B3"
            />
          </Field>
          <Field label="Year">
            <TextInput
              value={vehicleYear}
              onChangeText={setVehicleYear}
              keyboardType="number-pad"
              maxLength={4}
              style={styles.input}
              placeholder="2022"
              placeholderTextColor="#98A2B3"
            />
          </Field>
        </View>

        {error ? (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.reviewNote}>
          <Text style={styles.reviewTitle}>What happens next?</Text>
          <Text style={styles.reviewText}>
            Your profile enters Review in Vaya Admin CRM. Operations can approve,
            request more information, reject or suspend the driver account.
          </Text>
        </View>

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
            <Text style={styles.primaryText}>Submit for review</Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  stateTitle: { color: TEXT, fontSize: 18, fontWeight: '900' },
  stateText: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
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
  title: { color: TEXT, fontSize: 21, fontWeight: '900', marginTop: 3 },
  intro: {
    marginTop: 22,
    backgroundColor: '#0B1730',
    borderRadius: 18,
    padding: 17,
  },
  introTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  introText: { color: '#A9B6CA', fontSize: 10, lineHeight: 17, marginTop: 5 },
  sectionTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 24,
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
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 11,
    backgroundColor: '#F9FAFB',
    color: TEXT,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
  },
  error: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF8F7',
    borderRadius: 12,
    padding: 12,
  },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16 },
  reviewNote: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: '#EEF5FF',
    padding: 14,
  },
  reviewTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  reviewText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
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
