import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GREEN = '#10B981';
const BG = '#F7F9F8';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

const topics = ['Booking a Ride', 'Becoming a Driver', 'Vehicle Verification', 'Payments & Earnings', 'Safety & Reporting', 'Account Settings'];

export default function HelpSupportScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Header title="Help & Support" onBack={() => router.back()} />
        <View style={styles.search}><Text style={styles.searchIcon}>⌕</Text><TextInput placeholder="Search for help..." placeholderTextColor="#98A2B3" style={styles.input} /></View>

        <View style={styles.list}>
          {topics.map((topic, index) => (
            <Pressable key={topic} style={[styles.row, index < topics.length - 1 && styles.border]}>
              <View style={styles.icon}><Text style={styles.iconText}>?</Text></View>
              <Text style={styles.rowTitle}>{topic}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.primary}><Text style={styles.primaryText}>Contact Support</Text></Pressable>
        <Pressable style={styles.secondary}><Text style={styles.secondaryText}>Report an Issue</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return <View style={styles.header}><Pressable onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.title}>{title}</Text><View style={{ width: 38 }} /></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 38, height: 38, borderRadius: 11, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  backText: { color: TEXT, fontSize: 29, lineHeight: 29, marginTop: -3 },
  title: { color: TEXT, fontSize: 18, fontWeight: '900' },
  search: { marginTop: 18, height: 44, borderWidth: 1, borderColor: LINE, borderRadius: 11, backgroundColor: SURFACE, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11 },
  searchIcon: { color: MUTED, fontSize: 18 },
  input: { flex: 1, height: 42, color: TEXT, fontSize: 10, paddingHorizontal: 8 },
  list: { marginTop: 14, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 15, overflow: 'hidden' },
  row: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11 },
  border: { borderBottomWidth: 1, borderBottomColor: LINE },
  icon: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#E9F9F3', alignItems: 'center', justifyContent: 'center' },
  iconText: { color: '#087F5B', fontSize: 11, fontWeight: '900' },
  rowTitle: { flex: 1, color: TEXT, fontSize: 9.5, fontWeight: '900' },
  chevron: { color: '#98A2B3', fontSize: 20 },
  primary: { marginTop: 18, height: 44, borderRadius: 11, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  secondary: { marginTop: 9, height: 44, borderRadius: 11, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: TEXT, fontSize: 10, fontWeight: '900' },
});
