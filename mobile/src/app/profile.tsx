import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenReveal } from '@/components/screen-reveal';

const BLUE = '#1877F2';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

const sections = [
  ['Personal details', 'Name, phone number and email'],
  ['Payments', 'Saved payment methods and refunds'],
  ['Safety', 'Emergency contacts and reporting'],
  ['Notifications', 'Trip updates and reminders'],
  ['Help & support', 'Get assistance with Vaya'],
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <ScreenReveal>
          <Text style={styles.eyebrow}>ACCOUNT</Text>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}><Text style={styles.avatarText}>ZM</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>Zack Moropane</Text>
              <Text style={styles.contact}>zack@example.com</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.edit, pressed && styles.pressed]}>
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          </View>
        </ScreenReveal>

        <ScreenReveal delay={70}>
          <View style={styles.verifiedCard}>
            <View style={styles.verifiedIcon}><Text style={styles.verifiedIconText}>✓</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.verifiedTitle}>Passenger account ready</Text>
              <Text style={styles.verifiedCopy}>Your contact details are ready for trip bookings.</Text>
            </View>
          </View>
        </ScreenReveal>

        <ScreenReveal delay={130}>
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
        </ScreenReveal>

        <ScreenReveal delay={210}>
          <Text style={[styles.sectionTitle, { marginTop: 26 }]}>Driver mode</Text>
          <View style={styles.driverCard}>
            <View>
              <Text style={styles.driverTitle}>Already going somewhere?</Text>
              <Text style={styles.driverCopy}>Publish your route, seats and fare for passengers going the same way.</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.driverButton, pressed && styles.pressed]}>
              <Text style={styles.driverButtonText}>Open driver mode</Text>
            </Pressable>
          </View>
        </ScreenReveal>

        <ScreenReveal delay={280}>
          <Pressable style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </ScreenReveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 120 },
  pressed: { opacity: 0.7 },
  eyebrow: { color: BLUE, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  profileHeader: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#E7F3FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BLUE, fontSize: 16, fontWeight: '900' },
  name: { color: TEXT, fontSize: 21, fontWeight: '900', letterSpacing: -0.3 },
  contact: { color: MUTED, fontSize: 11, marginTop: 4 },
  edit: { paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderColor: LINE, borderRadius: 10, backgroundColor: SURFACE },
  editText: { color: TEXT, fontSize: 11, fontWeight: '900' },
  verifiedCard: { marginTop: 24, flexDirection: 'row', gap: 11, alignItems: 'center', padding: 14, borderRadius: 16, backgroundColor: '#ECFDF3' },
  verifiedIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#12B76A', alignItems: 'center', justifyContent: 'center' },
  verifiedIconText: { color: '#FFFFFF', fontWeight: '900' },
  verifiedTitle: { color: TEXT, fontSize: 12, fontWeight: '900' },
  verifiedCopy: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 3 },
  sectionTitle: { color: TEXT, fontSize: 18, fontWeight: '900', marginTop: 24, marginBottom: 10 },
  settingsCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 16, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  border: { borderBottomWidth: 1, borderBottomColor: LINE },
  settingTitle: { color: TEXT, fontSize: 13, fontWeight: '900' },
  settingNote: { color: MUTED, fontSize: 10, marginTop: 4 },
  chevron: { color: '#98A2B3', fontSize: 22 },
  driverCard: { backgroundColor: '#0B1730', borderRadius: 18, padding: 16 },
  driverTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  driverCopy: { color: '#A9B6CA', fontSize: 11, lineHeight: 17, marginTop: 5 },
  driverButton: { marginTop: 15, height: 42, borderRadius: 11, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  driverButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  signOut: { height: 46, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', justifyContent: 'center', marginTop: 26, backgroundColor: '#FFF8F7' },
  signOutText: { color: '#B42318', fontSize: 12, fontWeight: '900' },
});
