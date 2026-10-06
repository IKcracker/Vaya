import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GREEN = '#10B981';
const BG = '#F7F9F8';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const [profileVisible, setProfileVisible] = useState(true);
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [locationSharing, setLocationSharing] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Header title="Privacy & Security" onBack={() => router.back()} />

        <Text style={styles.section}>PRIVACY</Text>
        <View style={styles.card}>
          <ToggleRow title="Profile Visibility" note="Show my profile to other users" value={profileVisible} setValue={setProfileVisible} />
          <ToggleRow title="Share Phone Number" note="Only after booking" value={phoneVisible} setValue={setPhoneVisible} />
          <ToggleRow title="Location Sharing" note="During active trip only" value={locationSharing} setValue={setLocationSharing} last />
        </View>

        <Text style={styles.section}>SECURITY</Text>
        <View style={styles.card}>
          <ToggleRow title="Two-Factor Authentication" note="Add an extra login step" value={twoFactor} setValue={setTwoFactor} />
          <LinkRow title="Change Password" />
          <LinkRow title="Active Sessions" last />
        </View>

        <Pressable style={styles.delete}><Text style={styles.deleteText}>Delete Account</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return <View style={styles.header}><Pressable onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.title}>{title}</Text><View style={{ width: 38 }} /></View>;
}

function ToggleRow({ title, note, value, setValue, last }: { title: string; note: string; value: boolean; setValue: (v: boolean) => void; last?: boolean }) {
  return <View style={[styles.row, !last && styles.border]}><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowNote}>{note}</Text></View><Switch value={value} onValueChange={setValue} trackColor={{ false: '#D0D5DD', true: '#A6F4C5' }} thumbColor={value ? GREEN : '#FFFFFF'} /></View>;
}

function LinkRow({ title, last }: { title: string; last?: boolean }) {
  return <Pressable style={[styles.row, !last && styles.border]}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.chevron}>›</Text></Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 38, height: 38, borderRadius: 11, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  backText: { color: TEXT, fontSize: 29, lineHeight: 29, marginTop: -3 },
  title: { color: TEXT, fontSize: 18, fontWeight: '900' },
  section: { color: MUTED, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 20, marginBottom: 7 },
  card: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 15, overflow: 'hidden' },
  row: { minHeight: 62, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: LINE },
  rowTitle: { color: TEXT, fontSize: 10, fontWeight: '900' },
  rowNote: { color: MUTED, fontSize: 8, marginTop: 3 },
  chevron: { color: '#98A2B3', fontSize: 21 },
  delete: { marginTop: 22, height: 44, borderRadius: 11, backgroundColor: '#FFF1F0', borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: '#B42318', fontSize: 9.5, fontWeight: '900' },
});
