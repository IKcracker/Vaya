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

const BLUE = '#10B981';
const NAVY = '#063C35';
const BG = '#F6F8F7';
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
  const [notice, setNotice] = useState<string | null>(null);

  const next =
    typeof params.next === 'string' && params.next.startsWith('/') && !params.next.startsWith('//') && !params.next.startsWith('/auth')
      ? params.next
      : '/';

  async function submit() {
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === 'sign-in') {
        await signIn(email.trim(), password);
      } else {
        const message = await signUp({
          name: name.trim(),
          city: city.trim(),
          email: email.trim().toLowerCase(),
          password,
        });
        if (message) {
          setMode('sign-in');
          setPassword('');
          setNotice(message);
          return;
        }
      }

      router.replace((mode === 'sign-up' ? '/choose-role' : next) as never);
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
          <View style={styles.brandMark}><View style={styles.brandMarkInner} /></View>
          <Text style={styles.brand}>Vaya</Text>
          <Text style={styles.heroTitle}>
            {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
          </Text>
          <Text style={styles.heroText}>
            {mode === 'sign-in' ? 'Sign in to continue to Vaya' : 'Join Vaya and travel better together'}
          </Text>
        </View>

        <View style={styles.segment}>
          <Pressable
            disabled={submitting}
            onPress={() => {
              setMode('sign-in');
              setError(null);
              setNotice(null);
            }}
            style={[styles.segmentButton, mode === 'sign-in' && styles.segmentActive]}>
            <Text style={[styles.segmentText, mode === 'sign-in' && styles.segmentTextActive]}>
              Sign in
            </Text>
          </Pressable>
          <Pressable
            disabled={submitting}
            onPress={() => {
              setMode('sign-up');
              setError(null);
              setNotice(null);
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

          {notice ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{notice}</Text>
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
              <Text style={styles.primaryText}>
                {mode === 'sign-in' ? 'Sign in to Vaya' : 'Create my account'}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>Secure passenger account</Text>
          <Text style={styles.noteText}>
            Your account keeps your bookings, trips and profile together. Sign out on shared devices when you are finished.
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
  hero: { marginTop: 16, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  brandMark: { width: 48, height: 60, borderRadius: 25, backgroundColor: BLUE, transform: [{ rotate: '18deg' }], overflow: 'hidden' },
  brandMarkInner: { position: 'absolute', left: 13, top: 12, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },
  brand: { color: NAVY, fontSize: 24, fontWeight: '900', letterSpacing: -1.1, marginTop: 10 },
  heroTitle: { color: TEXT, fontSize: 22, fontWeight: '900', letterSpacing: -0.4, marginTop: 18 },
  heroText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 5, textAlign: 'center' },
  segment: {
    marginTop: 18,
    backgroundColor: '#E8EFEC',
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
  notice: {
    borderWidth: 1,
    borderColor: '#A6F4C5',
    backgroundColor: '#ECFDF3',
    borderRadius: 11,
    padding: 11,
  },
  noticeText: { color: '#027A48', fontSize: 10, lineHeight: 16 },
  primary: {
    height: 49,
    borderRadius: 11,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: { backgroundColor: '#B7D8CB' },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  note: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: '#E9F9F3',
    padding: 14,
  },
  noteTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  noteText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
});
