import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
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

import { fetchMobileDriver, MobileDriver } from '@/lib/auth';
import { API_URL } from '@/lib/api';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#10B981';
const BG = '#F6F8F7';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((value) => value[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function joinedLabel(value?: string) {
  if (!value) return 'Vaya member';

  return `Member since ${new Intl.DateTimeFormat('en-ZA', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))}`;
}

function driverTone(status?: string) {
  if (status === 'Approved') return { bg: '#ECFDF3', text: '#027A48' };
  if (status === 'Rejected' || status === 'Suspended') {
    return { bg: '#FFF1F0', text: '#B42318' };
  }
  return { bg: '#FFFAEB', text: '#B54708' };
}

export default function ProfileScreen() {
  const router = useRouter();
  const { loading, session, user, passenger, signOut } = usePassengerAuth();
  const [driver, setDriver] = useState<MobileDriver | null>(null);

  useEffect(() => {
    if (!session) return;

    let active = true;

    fetchMobileDriver(session)
      .then((response) => {
        if (active) setDriver(response.driver);
      })
      .catch(() => {
        if (active) setDriver(null);
      });

    return () => {
      active = false;
    };
  }, [session]);

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
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>V</Text>
          </View>
          <Text style={styles.stateTitle}>Your Vaya account</Text>
          <Text style={styles.stateText}>
            Sign in to manage your details, trips, payments and driver profile.
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
  const tone = driverTone(driver?.status);
  const profileImageSource =
    passenger?.profileImageUrl && session
      ? {
          uri: `${API_URL}${passenger.profileImageUrl}`,
          headers: { 'x-vaya-session': session },
        }
      : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={styles.pageTitle}>My Profile</Text>
          <Pressable
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}>
            <Text style={styles.settingsButtonText}>⚙</Text>
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              {profileImageSource ? (
                <Image source={profileImageSource} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarText}>{initials(displayName) || 'VP'}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.contact}>{email}</Text>
              <Text style={styles.memberSince}>{joinedLabel(passenger?.joinedAt)}</Text>
            </View>
          </View>

          <View style={styles.stats}>
            <Stat label="Trips" value={String(passenger?.tripsCount ?? 0)} />
            <Stat label="Home" value={passenger?.city || 'Not set'} />
            <Stat label="Status" value={passenger?.status || 'Active'} />
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/profile-edit')}
          style={({ pressed }) => [styles.editProfileButton, pressed && styles.pressed]}>
          <Text style={styles.editProfileButtonText}>Edit profile</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.actionCard}>
          <AccountRow
            title="Personal details"
            note={passenger?.phone ? `${passenger.phone} · ${passenger.city}` : 'Add your phone number and home city'}
            icon="👤"
            onPress={() => router.push('/profile-edit')}
          />
          <AccountRow
            title="Trips"
            note="Upcoming bookings and travel history"
            icon="🎫"
            onPress={() => router.push('/trips')}
          />
          <AccountRow
            title="Payments"
            note="Payment attempts, references and settled transactions"
            icon="💳"
            onPress={() => router.push('/profile-payments')}
          />
          <AccountRow
            title="Safety"
            note="Report a trip or travel safety concern"
            icon="🛡"
            onPress={() => router.push('/profile-safety')}
          />
          <AccountRow
            title="Settings"
            note="Account, privacy, vehicles, verification and app information"
            icon="⚙"
            onPress={() => router.push('/settings')}
            last
          />
        </View>

        <Text style={styles.sectionTitle}>Driver mode</Text>
        <View style={styles.driverCard}>
          <View style={styles.driverTop}>
            <View style={styles.driverIcon}>
              <Text style={styles.driverIconText}>↗</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverTitle}>
                {driver ? 'Driver profile' : 'Drive with Vaya'}
              </Text>
              <Text style={styles.driverCopy}>
                {driver
                  ? driver.vehicle || driver.checks
                  : 'Apply once, verify your documents and publish routes you are already travelling.'}
              </Text>
            </View>
            {driver ? (
              <View style={[styles.driverStatus, { backgroundColor: tone.bg }]}>
                <Text style={[styles.driverStatusText, { color: tone.text }]}>
                  {driver.status}
                </Text>
              </View>
            ) : null}
          </View>

          {driver ? (
            <View style={styles.driverActions}>
              <Pressable
                onPress={() => router.push('/driver-vehicle')}
                style={({ pressed }) => [styles.vehicleButton, pressed && styles.pressed]}>
                <Text style={styles.vehicleButtonText}>Manage vehicles</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/explore')}
                style={({ pressed }) => [styles.driverButton, styles.driverButtonFlex, pressed && styles.pressed]}>
                <Text style={styles.driverButtonText}>Open driver mode</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push('/explore')}
              style={({ pressed }) => [styles.driverButton, pressed && styles.pressed]}>
              <Text style={styles.driverButtonText}>Apply to become a driver</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.securityCard}>
          <View style={styles.securityDot}>
            <Text style={styles.securityDotText}>✓</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.securityTitle}>Signed in securely</Text>
            <Text style={styles.securityCopy}>
              Your authenticated Vaya session is stored securely on this device.
            </Text>
          </View>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AccountRow({
  title,
  note,
  icon,
  onPress,
  last,
}: {
  title: string;
  note: string;
  icon: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        !last && styles.actionBorder,
        pressed && styles.pressed,
      ]}>
      <View style={styles.actionIcon}>
        <Text style={styles.actionIconText}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionNote}>{note}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 120 },
  pressed: { opacity: 0.7 },
  centerState: { flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  stateTitle: { color: TEXT, fontSize: 18, fontWeight: '900', marginTop: 14 },
  stateText: { color: MUTED, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 6, maxWidth: 300 },
  primary: { marginTop: 18, height: 48, paddingHorizontal: 20, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { color: TEXT, fontSize: 24, fontWeight: '900', letterSpacing: -0.45 },
  settingsButton: { width: 38, height: 38, borderRadius: 11, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  settingsButtonText: { fontSize: 16 },
  editProfileButton: { marginTop: 10, height: 42, borderRadius: 10, backgroundColor: '#E9F9F3', alignItems: 'center', justifyContent: 'center' },
  editProfileButtonText: { color: '#087F5B', fontSize: 9.5, fontWeight: '900' },
  profileCard: { marginTop: 16, backgroundColor: SURFACE, borderWidth: 1, borderColor: '#DFE6E3', borderRadius: 15, overflow: 'hidden' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16 },
  avatar: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden', backgroundColor: '#E9F9F3', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  avatarLarge: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#E9F9F3', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BLUE, fontSize: 17, fontWeight: '900' },
  name: { color: TEXT, fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  contact: { color: MUTED, fontSize: 10, marginTop: 4 },
  memberSince: { color: '#98A2B3', fontSize: 9, marginTop: 4 },
  stats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: LINE, backgroundColor: '#FAFBFC' },
  stat: { flex: 1, paddingHorizontal: 10, paddingVertical: 13, alignItems: 'center' },
  statValue: { color: TEXT, fontSize: 11, fontWeight: '900', maxWidth: '100%' },
  statLabel: { color: MUTED, fontSize: 8, fontWeight: '700', marginTop: 3 },
  sectionTitle: { color: TEXT, fontSize: 14, fontWeight: '900', marginTop: 22, marginBottom: 8 },
  actionCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 16, overflow: 'hidden' },
  actionRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11 },
  actionBorder: { borderBottomWidth: 1, borderBottomColor: LINE },
  actionIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F3', alignItems: 'center', justifyContent: 'center' },
  actionIconText: { fontSize: 16 },
  actionTitle: { color: TEXT, fontSize: 12, fontWeight: '900' },
  actionNote: { color: MUTED, fontSize: 9, lineHeight: 14, marginTop: 3 },
  chevron: { color: '#98A2B3', fontSize: 22 },
  driverCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: '#DFE6E3', borderRadius: 15, padding: 13 },
  driverTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  driverIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#E9F9F3', alignItems: 'center', justifyContent: 'center' },
  driverIconText: { color: '#087F5B', fontSize: 15, fontWeight: '900' },
  driverTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  driverCopy: { color: MUTED, fontSize: 8.5, lineHeight: 14, marginTop: 3 },
  driverStatus: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  driverStatusText: { fontSize: 8, fontWeight: '900' },
  driverActions: { marginTop: 14, flexDirection: 'row', gap: 8 },
  vehicleButton: { flex: 1, height: 38, borderRadius: 9, borderWidth: 1, borderColor: '#DDE5E2', alignItems: 'center', justifyContent: 'center' },
  vehicleButtonText: { color: '#087F5B', fontSize: 8.5, fontWeight: '900' },
  driverButton: { marginTop: 12, height: 38, borderRadius: 9, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  driverButtonFlex: { flex: 1, marginTop: 0 },
  driverButtonText: { color: '#FFFFFF', fontSize: 8.5, fontWeight: '900' },
  securityCard: { marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ECFDF3', borderRadius: 14, padding: 13 },
  securityDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#12B76A', alignItems: 'center', justifyContent: 'center' },
  securityDotText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  securityTitle: { color: TEXT, fontSize: 10, fontWeight: '900' },
  securityCopy: { color: MUTED, fontSize: 9, lineHeight: 14, marginTop: 3 },
  signOut: { height: 46, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', justifyContent: 'center', marginTop: 22, backgroundColor: '#FFF8F7' },
  signOutText: { color: '#B42318', fontSize: 11, fontWeight: '900' },
});
