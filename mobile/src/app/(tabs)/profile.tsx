import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#1877F2';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

const sections = [
  ['Personal details', 'Name, phone number and home city'],
  ['Payments', 'Saved payment methods and refunds'],
  ['Safety', 'Emergency contacts and reporting'],
  ['Notifications', 'Trip updates and reminders'],
  ['Help & support', 'Get assistance with Vaya'],
];

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((value) => value[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ProfileScreen() {
  const router = useRouter();
  const { loading, session, user, passenger, signOut } = usePassengerAuth();

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator color={BLUE} />
          <Text style={styles.stateTitle}>Loading your profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <View style={styles.avatarLarge}><Text style={styles.avatarText}>V</Text></View>
          <Text style={styles.stateTitle}>Your Vaya profile</Text>
          <Text style={styles.stateText}>
            Sign in to keep bookings, contact details and travel history synced.
          </Text>
          <Pressable
            onPress={() => router.push({ pathname: '/auth', params: { next: '/profile' } })}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>Sign in or create account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = passenger?.name || user?.name || 'Vaya Passenger';
  const email = passenger?.email || user?.email || '';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>ACCOUNT</Text>

        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(displayName) || 'VP'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.contact}>{email}</Text>
          </View>
        </View>

        <View style={styles.verifiedCard}>
          <View style={styles.verifiedIcon}>
            <Text style={styles.verifiedIconText}>✓</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.verifiedTitle}>Signed in securely</Text>
            <Text style={styles.verifiedCopy}>
              Your Neon Auth session is stored securely on this device.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Passenger details</Text>
        <View style={styles.summaryGrid}>
          <Info label="Home city" value={passenger?.city || 'Not set'} />
          <Info label="Phone" value={passenger?.phone || 'Not set'} />
          <Info label="Account status" value={passenger?.status || 'Profile incomplete'} />
          <Info label="Trips" value={String(passenger?.tripsCount ?? 0)} />
        </View>

        <Text style={styles.sectionTitle}>Account settings</Text>
        <View style={styles.settingsCard}>
          {sections.map(([title, note], index) => (
            <Pressable
              key={title}
              style={({ pressed }) => [
                styles.settingRow,
                index < sections.length - 1 && styles.border,
                pressed && styles.pressed,
              ]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>{title}</Text>
                <Text style={styles.settingNote}>{note}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 26 }]}>Driver mode</Text>
        <View style={styles.driverCard}>
          <View>
            <Text style={styles.driverTitle}>Already going somewhere?</Text>
            <Text style={styles.driverCopy}>
              Publish your route, seats and fare for passengers going the same way.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/explore')}
            style={({ pressed }) => [styles.driverButton, pressed && styles.pressed]}>
            <Text style={styles.driverButtonText}>Open driver mode</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => void signOut()}
          style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 120 },
  pressed: { opacity: 0.7 },
  centerState: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: { color: TEXT, fontSize: 18, fontWeight: '900', marginTop: 14 },
  stateText: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 300,
  },
  primary: {
    marginTop: 18,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  eyebrow: { color: BLUE, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  profileHeader: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E7F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLarge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E7F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: BLUE, fontSize: 16, fontWeight: '900' },
  name: { color: TEXT, fontSize: 21, fontWeight: '900', letterSpacing: -0.3 },
  contact: { color: MUTED, fontSize: 11, marginTop: 4 },
  verifiedCard: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 11,
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#ECFDF3',
  },
  verifiedIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#12B76A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedIconText: { color: '#FFFFFF', fontWeight: '900' },
  verifiedTitle: { color: TEXT, fontSize: 12, fontWeight: '900' },
  verifiedCopy: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 3 },
  sectionTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 24,
    marginBottom: 10,
  },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoCard: {
    width: '48%',
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 14,
    padding: 13,
  },
  infoLabel: { color: MUTED, fontSize: 9, fontWeight: '700' },
  infoValue: { color: TEXT, fontSize: 11, fontWeight: '900', marginTop: 5 },
  settingsCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  border: { borderBottomWidth: 1, borderBottomColor: LINE },
  settingTitle: { color: TEXT, fontSize: 13, fontWeight: '900' },
  settingNote: { color: MUTED, fontSize: 10, marginTop: 4 },
  chevron: { color: '#98A2B3', fontSize: 22 },
  driverCard: { backgroundColor: '#0B1730', borderRadius: 18, padding: 16 },
  driverTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  driverCopy: { color: '#A9B6CA', fontSize: 11, lineHeight: 17, marginTop: 5 },
  driverButton: {
    marginTop: 15,
    height: 42,
    borderRadius: 11,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  signOut: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
    backgroundColor: '#FFF8F7',
  },
  signOutText: { color: '#B42318', fontSize: 12, fontWeight: '900' },
});
