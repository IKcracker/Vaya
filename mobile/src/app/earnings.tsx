import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GREEN = '#10B981';
const BG = '#F7F9F8';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

const bars = [22, 34, 49, 65, 84, 100];
const payouts = [
  { date: '12 May 2025', amount: 'KSh 5,200' },
  { date: '5 May 2025', amount: 'KSh 4,800' },
  { date: '28 Apr 2025', amount: 'KSh 3,000' },
];

export default function EarningsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Header title="Earnings" onBack={() => router.back()} />
        <Text style={styles.label}>Total Earnings</Text>
        <Text style={styles.total}>KSh 24,500</Text>
        <Text style={styles.meta}>This month</Text>

        <View style={styles.chartCard}>
          <View style={styles.chart}>
            {bars.map((height, index) => <View key={index} style={styles.barWrap}><View style={[styles.bar, { height }]} /></View>)}
          </View>
          <View style={styles.months}>{['Jan','Feb','Mar','Apr','May','Jun'].map((m)=><Text key={m} style={styles.month}>{m}</Text>)}</View>
        </View>

        <Text style={styles.sectionTitle}>Recent Payouts</Text>
        <View style={styles.list}>
          {payouts.map((payout, index) => (
            <View key={payout.date} style={[styles.row, index < payouts.length - 1 && styles.border]}>
              <View><Text style={styles.date}>{payout.date}</Text><Text style={styles.completed}>Completed</Text></View>
              <View style={{ alignItems: 'flex-end' }}><Text style={styles.amount}>{payout.amount}</Text><Text style={styles.completed}>Completed</Text></View>
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
  label: { color: MUTED, fontSize: 9, marginTop: 22 },
  total: { color: TEXT, fontSize: 27, fontWeight: '900', letterSpacing: -0.5, marginTop: 3 },
  meta: { color: MUTED, fontSize: 8, marginTop: 2 },
  chartCard: { marginTop: 14, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 15, padding: 14 },
  chart: { height: 120, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  barWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 110 },
  bar: { width: 18, borderRadius: 6, backgroundColor: GREEN },
  months: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  month: { flex: 1, textAlign: 'center', color: MUTED, fontSize: 7 },
  sectionTitle: { color: TEXT, fontSize: 13, fontWeight: '900', marginTop: 22, marginBottom: 8 },
  list: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 15, overflow: 'hidden' },
  row: { minHeight: 62, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  border: { borderBottomWidth: 1, borderBottomColor: LINE },
  date: { color: TEXT, fontSize: 9.5, fontWeight: '900' },
  amount: { color: TEXT, fontSize: 9.5, fontWeight: '900' },
  completed: { color: '#027A48', fontSize: 7.5, marginTop: 3, fontWeight: '800' },
});
