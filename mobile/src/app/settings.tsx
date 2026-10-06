import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMobileDriver, MobileDriver } from '@/lib/auth';
import { API_URL } from '@/lib/api';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#10B981';
const BG = '#F6F8F7';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

export default function SettingsScreen() {
  const router = useRouter();
  const { loading, session, user, passenger, signOut } = usePassengerAuth();
  const [driver, setDriver] = useState<MobileDriver | null>(null);

  useEffect(() => {
    if (!session) return;
    fetchMobileDriver(session)
      .then((response) => setDriver(response.driver))
      .catch(() => setDriver(null));
  }, [session]);

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
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.centerText}>Sign in to manage your Vaya account and safety settings.</Text>
          <Pressable onPress={() => router.replace({ pathname: '/auth', params: { next: '/settings' } })} style={styles.primary}>
            <Text style={styles.primaryText}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const name = passenger?.name || user?.name || 'Vaya member';
  const email = passenger?.email || user?.email || '';
  const imageSource = passenger?.profileImageUrl
    ? { uri: `${API_URL}${passenger.profileImageUrl}`, headers: { 'x-vaya-session': session } }
    : null;
  const initials = name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const approvedVehicles = driver?.vehicles?.filter((vehicle) => vehicle.status === 'Approved').length ?? 0;
  const vehicleCount = driver?.vehicles?.length ?? 0;
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.accountCard}>
          <View style={styles.avatar}>
            {imageSource ? <Image source={imageSource} style={styles.avatarImage} contentFit="cover" /> : <Text style={styles.avatarText}>{initials || 'V'}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountName}>{name}</Text>
            <Text style={styles.accountEmail}>{email}</Text>
            <Text style={styles.accountMeta}>{passenger?.city || 'Home city not set'} · {passenger?.status || 'Active'}</Text>
          </View>
          <Pressable onPress={() => router.push('/profile-edit')} style={styles.editButton}><Text style={styles.editText}>Edit</Text></Pressable>
        </View>

        <Section title="Account">
          <Row icon="👤" title="Account" note="Personal details and profile photo" onPress={() => router.push('/profile-edit')} />
          <Row icon="💳" title="Payment Methods" note="Cards and preferred payment method" onPress={() => router.push('/payment-methods')} />
          <Row icon="🛡" title="Safety" note="Report a trip or safety concern" onPress={() => router.push('/profile-safety')} />
          {driver ? (
            <>
              <Row icon="✓" title="Driver Verification" note={`${driver.status} · ${driver.checks}`} onPress={() => router.push('/driver-verification')} />
              <Row icon="🚙" title="Vehicles (Drivers)" note={`${vehicleCount} vehicle${vehicleCount === 1 ? '' : 's'} · ${approvedVehicles} approved`} onPress={() => router.push('/driver-vehicle')} />
            </>
          ) : null}
          <Row icon="🔒" title="Privacy & Security" note="Visibility, location sharing and sessions" onPress={() => router.push('/privacy-security')} />
          <Row icon="🔔" title="Notifications" note="Trip, verification and payment alerts" onPress={() => router.push('/notifications')} />
          <Row icon="?" title="Help & Support" note="FAQs, support and issue reporting" onPress={() => router.push('/help-support')} />
          <InfoRow icon="文" title="Language" note="English" />
          <InfoRow icon="◐" title="Appearance" note="System" />
          <InfoRow icon="i" title="App Information" note={`Vaya version ${version}`} last />
        </Section>

        <Pressable onPress={() => void signOut()} style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <Text style={styles.footer}>Vaya · Shared inter-city travel</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  title,
  note,
  onPress,
  last,
}: {
  icon: string;
  title: string;
  note: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, !last && styles.rowBorder, pressed && styles.pressed]}>
      <View style={styles.rowIcon}><Text style={styles.rowIconText}>{icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowNote}>{note}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function InfoRow({
  icon,
  title,
  note,
  last,
}: {
  icon: string;
  title: string;
  note: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowIcon}><Text style={styles.rowIconText}>{icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowNote}>{note}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { padding: 18, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  centerText: { color: MUTED, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 7, maxWidth: 300 },
  pressed: { opacity: 0.72 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSpacer: { width: 40 },
  back: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: LINE, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  backText: { color: TEXT, fontSize: 30, lineHeight: 30, marginTop: -3 },
  title: { color: TEXT, fontSize: 19, fontWeight: '900', letterSpacing: -0.25 },
  primary: { marginTop: 18, height: 48, paddingHorizontal: 18, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  accountCard: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 14, backgroundColor: SURFACE, borderWidth: 1, borderColor: '#DFE6E3', padding: 13 },
  avatar: { width: 54, height: 54, borderRadius: 27, overflow: 'hidden', backgroundColor: '#E9F9F3', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: BLUE, fontSize: 15, fontWeight: '900' },
  accountName: { color: TEXT, fontSize: 15, fontWeight: '900' },
  accountEmail: { color: MUTED, fontSize: 9, marginTop: 4 },
  accountMeta: { color: '#087F5B', fontSize: 8, fontWeight: '800', marginTop: 4 },
  editButton: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, backgroundColor: '#E9F9F3', borderWidth: 1, borderColor: '#C7EEDF' },
  editText: { color: '#087F5B', fontSize: 9, fontWeight: '900' },
  section: { marginTop: 19 },
  sectionTitle: { color: MUTED, fontSize: 9, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 7 },
  sectionCard: { borderWidth: 1, borderColor: '#DDE7E3', borderRadius: 15, backgroundColor: SURFACE, overflow: 'hidden' },
  row: { minHeight: 58, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: LINE },
  rowIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F3', alignItems: 'center', justifyContent: 'center' },
  rowIconText: { fontSize: 15 },
  rowTitle: { color: TEXT, fontSize: 10, fontWeight: '900' },
  rowNote: { color: MUTED, fontSize: 8, lineHeight: 13, marginTop: 2 },
  chevron: { color: '#98A2B3', fontSize: 22 },
  signOut: { marginTop: 25, height: 47, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFF8F7', alignItems: 'center', justifyContent: 'center' },
  signOutText: { color: '#B42318', fontSize: 11, fontWeight: '900' },
  footer: { color: '#98A2B3', fontSize: 9, textAlign: 'center', marginTop: 18, letterSpacing: 0.4 },
});
