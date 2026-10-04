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

import { updatePassengerProfile } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#1877F2';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { session, passenger, refresh } = usePassengerAuth();
  const [name, setName] = useState(passenger?.name ?? '');
  const [phone, setPhone] = useState(passenger?.phone ?? '');
  const [city, setCity] = useState(passenger?.city ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length >= 2 && city.trim().length >= 2;

  async function save() {
    if (!session || !valid || saving) return;

    setSaving(true);
    setError(null);

    try {
      await updatePassengerProfile(session, {
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
      });
      await refresh();
      router.back();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update profile');
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
          <View>
            <Text style={styles.eyebrow}>PROFILE</Text>
            <Text style={styles.title}>Personal details</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Account email</Text>
          <Text style={styles.noticeText}>
            {passenger?.email ?? 'Your signed-in email'} is managed by your Vaya login and cannot be changed here.
          </Text>
        </View>

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

          <Field label="Phone number">
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
              placeholder="e.g. 071 234 5678"
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
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          disabled={!valid || saving}
          onPress={() => void save()}
          style={[styles.primary, (!valid || saving) && styles.disabled]}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>Save changes</Text>
          )}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  back: { width: 40, height: 40, borderRadius: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  backText: { color: TEXT, fontSize: 30, lineHeight: 30, marginTop: -3 },
  eyebrow: { color: BLUE, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: TEXT, fontSize: 22, fontWeight: '900', marginTop: 3 },
  notice: { backgroundColor: '#EEF5FF', borderRadius: 14, padding: 14, marginBottom: 14 },
  noticeTitle: { color: TEXT, fontSize: 10, fontWeight: '900' },
  noticeText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
  card: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 16, padding: 15, gap: 16 },
  field: { gap: 6 },
  label: { color: MUTED, fontSize: 9, fontWeight: '800' },
  input: { minHeight: 46, borderWidth: 1, borderColor: LINE, borderRadius: 11, backgroundColor: '#F9FAFB', color: TEXT, paddingHorizontal: 12, fontSize: 13, fontWeight: '700' },
  error: { marginTop: 14, borderRadius: 12, backgroundColor: '#FFF1F0', padding: 12 },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16 },
  primary: { marginTop: 18, height: 50, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  disabled: { opacity: 0.45 },
});
