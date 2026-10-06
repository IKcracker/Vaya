import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BG = '#F7F9F8';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

const notifications = [
  { icon: '🚘', title: 'Ride confirmed', text: 'James K. accepted your trip.', time: '5m', tone: '#FFF4E8' },
  { icon: '✓', title: 'Driver on the way', text: 'James K. is 10 min away.', time: '15m', tone: '#ECFDF3' },
  { icon: '✓', title: 'Trip completed', text: 'Thanks for riding!', time: '2h', tone: '#ECFDF3' },
  { icon: '✉', title: 'New message', text: 'From Linda W.', time: '3h', tone: '#EEF4FF' },
  { icon: '✓', title: 'Verification approved', text: 'Your documents are approved.', time: '1d', tone: '#ECFDF3' },
  { icon: 'R', title: 'Payment received', text: 'KSh 4,800', time: '2d', tone: '#ECFDF3' },
];

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Header title="Notifications" onBack={() => router.back()} />
        <View style={styles.tabs}><View style={styles.tabActive}><Text style={styles.tabActiveText}>All</Text></View><View style={styles.tab}><Text style={styles.tabText}>Unread</Text></View></View>
        <View style={styles.list}>
          {notifications.map((item, index) => (
            <View key={item.title} style={[styles.row, index < notifications.length - 1 && styles.border]}>
              <View style={[styles.icon, { backgroundColor: item.tone }]}><Text style={styles.iconText}>{item.icon}</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.rowTitle}>{item.title}</Text><Text style={styles.rowText}>{item.text}</Text></View>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          ))}
        </View>
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
  tabs: { marginTop: 16, flexDirection: 'row', backgroundColor: '#EEF2F0', padding: 3, borderRadius: 10 },
  tab: { flex: 1, height: 34, alignItems: 'center', justifyContent: 'center' },
  tabActive: { flex: 1, height: 34, borderRadius: 8, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  tabText: { color: MUTED, fontSize: 8.5, fontWeight: '900' },
  tabActiveText: { color: '#FFFFFF', fontSize: 8.5, fontWeight: '900' },
  list: { marginTop: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 15, overflow: 'hidden' },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11 },
  border: { borderBottomWidth: 1, borderBottomColor: LINE },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 13, fontWeight: '900' },
  rowTitle: { color: TEXT, fontSize: 9.5, fontWeight: '900' },
  rowText: { color: MUTED, fontSize: 8, marginTop: 3 },
  time: { color: '#98A2B3', fontSize: 7 },
});
