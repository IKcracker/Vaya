import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#1877F2';
const NAVY = '#0B1730';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

export default function PassengerAuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const { signIn, signUp } = usePassengerAuth();

  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next =
    typeof params.next === 'string' && params.next.startsWith('/')
      ? params.next
      : '/';

  async function submit() {
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      if (mode === 'sign-in') {
        await signIn(email.trim(), password);
      } else {
        await signUp({
          name: name.trim(),
          city: city.trim(),
          email: email.trim().toLowerCase(),
          password,
        });
      }

      router.replace(next as never);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : mode === 'sign-in'
            ? 'Unable to sign in'
            : 'Unable to create account'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const valid =
    /^\S+@\S+\.\S+$/.test(email.trim()) &&
    password.length >= 8 &&
    (mode === 'sign-in' || (name.trim().length >= 2 && city.trim().length >= 2));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.hero}>
          <Text style={styles.brand}>
            vaya<Text style={styles.dot}>.</Text>
          </Text>
          <Text style={styles.heroTitle}>
            {mode === 'sign-in' ? 'Welcome back' : 'Create your Vaya account'}
          </Text>
          <Text style={styles.heroText}>
            Your bookings, trips and profile stay synced securely across the app.
          </Text>
        </View>

        <View style={styles.segment}>
          <Pressable
            onPress={() => {
              setMode('sign-in');
              setError(null);
            }}
            style={[styles.segmentButton, mode === 'sign-in' && styles.segmentActive]}>
            <Text style={[styles.segmentText, mode === 'sign-in' && styles.segmentTextActive]}>
              Sign in
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setMode('sign-up');
              setError(null);
            }}
            style={[styles.segmentButton, mode === 'sign-up' && styles.segmentActive]}>
            <Text style={[styles.segmentText, mode === 'sign-up' && styles.segmentTextActive]}>
              Create account
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          {mode === 'sign-up' ? (
            <>
              <Field label="Full name">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholder="Your full name"
                  placeholderTextColor="#98A2B3"
                  style={styles.input}
                />
              </Field>

              <Field label="Home city">
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  autoCapitalize="words"
                  placeholder="Johannesburg"
                  placeholderTextColor="#98A2B3"
                  style={styles.input}
                />
              </Field>
            </>
          ) : null}

          <Field label="Email">
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="name@example.com"
              placeholderTextColor="#98A2B3"
              style={styles.input}
            />
          </Field>

          <Field label="Password">
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              placeholder="At least 8 characters"
              placeholderTextColor="#98A2B3"
              style={styles.input}
            />
          </Field>

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
              <Text style={styles.primaryText}>
                {mode === 'sign-in' ? 'Sign in to Vaya' : 'Create my account'}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>Secure passenger account</Text>
          <Text style={styles.noteText}>
            Vaya validates your identity with Neon Auth. The mobile session is kept in encrypted device storage.
          </Text>
        </View>
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
  hero: {
    marginTop: 24,
    backgroundColor: NAVY,
    borderRadius: 20,
    padding: 20,
  },
  brand: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', letterSpacing: -1.1 },
  dot: { color: '#60A5FA' },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 28,
  },
  heroText: { color: '#A9B6CA', fontSize: 11, lineHeight: 18, marginTop: 7 },
  segment: {
    marginTop: 18,
    backgroundColor: '#E9EDF3',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
  },
  segmentButton: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: { backgroundColor: SURFACE },
  segmentText: { color: MUTED, fontSize: 10, fontWeight: '900' },
  segmentTextActive: { color: TEXT },
  card: {
    marginTop: 14,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 16,
    padding: 16,
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
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF8F7',
    borderRadius: 11,
    padding: 11,
  },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16 },
  primary: {
    height: 49,
    borderRadius: 11,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: { backgroundColor: '#B7D5FA' },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  note: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: '#EEF5FF',
    padding: 14,
  },
  noteTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  noteText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
});
