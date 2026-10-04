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

import { updateDriverVehicle } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#1877F2';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

export default function DriverVehicleScreen() {
  const router = useRouter();
  const { session } = usePassengerAuth();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [registration, setRegistration] = useState('');
  const [color, setColor] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedYear = Number(year);
  const valid =
    make.trim().length >= 2 &&
    model.trim().length >= 1 &&
    registration.trim().length >= 2 &&
    color.trim().length >= 2 &&
    Number.isInteger(parsedYear) &&
    parsedYear >= 1980 &&
    parsedYear <= 2100;

  async function save() {
    if (!session || !valid || saving) return;
    setSaving(true);
    setError(null);

    try {
      await updateDriverVehicle(session, {
        vehicleMake: make.trim(),
        vehicleModel: model.trim(),
        vehicleYear: parsedYear,
        vehicleRegistration: registration.trim().toUpperCase(),
        vehicleColor: color.trim(),
      });
      router.replace('/driver-verification');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update vehicle');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>DRIVER VEHICLE</Text>
            <Text style={styles.title}>Change your vehicle</Text>
          </View>
        </View>

        <View style={styles.warning}>
          <Text style={styles.warningTitle}>The replacement car must be verified.</Text>
          <Text style={styles.warningText}>
            Your ID and driver's licence approval stay intact. Vehicle registration,
            roadworthy and insurance documents are cleared and must be uploaded again.
            New trip publishing stays locked until Vaya approves the replacement vehicle.
          </Text>
        </View>

        <View style={styles.card}>
          <Field label="Make">
            <TextInput value={make} onChangeText={setMake} style={styles.input} placeholder="Toyota" placeholderTextColor="#98A2B3" />
          </Field>
          <Field label="Model">
            <TextInput value={model} onChangeText={setModel} style={styles.input} placeholder="Corolla" placeholderTextColor="#98A2B3" />
          </Field>
          <Field label="Year">
            <TextInput value={year} onChangeText={setYear} style={styles.input} keyboardType="number-pad" maxLength={4} placeholder="2022" placeholderTextColor="#98A2B3" />
          </Field>
          <Field label="Registration number">
            <TextInput value={registration} onChangeText={setRegistration} style={styles.input} autoCapitalize="characters" placeholder="AB 12 CD GP" placeholderTextColor="#98A2B3" />
          </Field>
          <Field label="Colour">
            <TextInput value={color} onChangeText={setColor} style={styles.input} autoCapitalize="words" placeholder="White" placeholderTextColor="#98A2B3" />
          </Field>
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>Existing trips</Text>
          <Text style={styles.infoText}>
            Trips already published keep the original vehicle snapshot so passengers
            and audit history still show the car that was assigned when the trip was created.
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          disabled={!valid || saving}
          onPress={() => void save()}
          style={[styles.primary, (!valid || saving) && styles.disabled]}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Save vehicle and re-verify</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
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
  warning: { marginTop: 20, backgroundColor: '#FFFAEB', borderRadius: 14, padding: 14 },
  warningTitle: { color: '#B54708', fontSize: 11, fontWeight: '900' },
  warningText: { color: '#7A2E0E', fontSize: 10, lineHeight: 16, marginTop: 4 },
  card: { marginTop: 16, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 16, padding: 14, gap: 14 },
  field: { gap: 6 },
  label: { color: MUTED, fontSize: 9, fontWeight: '800' },
  input: { minHeight: 44, borderWidth: 1, borderColor: LINE, borderRadius: 11, backgroundColor: '#F9FAFB', color: TEXT, paddingHorizontal: 12, fontSize: 13, fontWeight: '700' },
  info: { marginTop: 14, backgroundColor: '#EEF5FF', borderRadius: 14, padding: 14 },
  infoTitle: { color: TEXT, fontSize: 10, fontWeight: '900' },
  infoText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
  error: { marginTop: 14, color: '#B42318', fontSize: 10, lineHeight: 16 },
  primary: { marginTop: 18, height: 50, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  disabled: { opacity: 0.45 },
});
