import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BLUE = '#1877F2';
const BG = '#F0F2F5';
const SURFACE = '#FFFFFF';
const TEXT = '#050505';
const MUTED = '#65676B';
const LINE = '#E4E6EB';

export default function DriverScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>DRIVER MODE</Text>
            <Text style={styles.title}>Good evening, Thabo</Text>
            <Text style={styles.muted}>Ready for your next journey?</Text>
          </View>
          <View style={styles.status}><View style={styles.dot} /><Text style={styles.statusText}>Approved</Text></View>
        </View>

        <Pressable style={styles.primary}><Text style={styles.primaryText}>+ Publish a trip</Text></Pressable>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View>
              <Text style={styles.smallBlue}>UPCOMING TRIP</Text>
              <Text style={styles.tripTitle}>Polokwane → Pretoria</Text>
              <Text style={styles.muted}>Tomorrow • 06:00</Text>
            </View>
            <View style={styles.seatBadge}><Text style={styles.seatText}>3 / 4 seats</Text></View>
          </View>

          <View style={styles.divider} />
          <View style={styles.metricRow}>
            <View><Text style={styles.metricLabel}>Expected earnings</Text><Text style={styles.metricValue}>R900</Text></View>
            <View><Text style={styles.metricLabel}>Passengers</Text><Text style={styles.metricValue}>3</Text></View>
            <View><Text style={styles.metricLabel}>Luggage</Text><Text style={styles.metricValue}>4 bags</Text></View>
          </View>

          <Pressable style={styles.secondary}><Text style={styles.secondaryText}>Manage trip</Text></Pressable>
        </View>

        <Text style={styles.sectionTitle}>Driver checklist</Text>
        {[
          ['Profile verified', 'Identity and contact details approved'],
          ['Vehicle approved', '2021 Toyota Corolla • White'],
          ['Payout details', 'Bank account connected'],
        ].map(([title, note]) => (
          <View style={styles.checkRow} key={title}>
            <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.checkTitle}>{title}</Text><Text style={styles.checkNote}>{note}</Text></View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>This month</Text>
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statValue}>12</Text><Text style={styles.statLabel}>Trips</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>4.9</Text><Text style={styles.statLabel}>Rating</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>R6,480</Text><Text style={styles.statLabel}>Earned</Text></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { padding: 18, paddingBottom: 110 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  eyebrow: { color: BLUE, fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  title: { color: TEXT, fontSize: 24, fontWeight: '900', marginTop: 5 },
  muted: { color: MUTED, fontSize: 13, marginTop: 4 },
  status: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E7F3FF', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 999 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#31A24C', marginRight: 6 },
  statusText: { color: BLUE, fontSize: 11, fontWeight: '900' },
  primary: { height: 54, borderRadius: 14, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  card: { backgroundColor: SURFACE, borderRadius: 20, padding: 17, marginBottom: 24 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallBlue: { color: BLUE, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  tripTitle: { color: TEXT, fontSize: 18, fontWeight: '900', marginTop: 5 },
  seatBadge: { backgroundColor: '#E7F3FF', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
  seatText: { color: BLUE, fontSize: 11, fontWeight: '900' },
  divider: { height: 1, backgroundColor: LINE, marginVertical: 16 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { color: MUTED, fontSize: 10, fontWeight: '700' },
  metricValue: { color: TEXT, fontSize: 16, fontWeight: '900', marginTop: 4 },
  secondary: { marginTop: 16, height: 46, borderRadius: 11, backgroundColor: '#E7F3FF', alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: BLUE, fontWeight: '900' },
  sectionTitle: { color: TEXT, fontSize: 19, fontWeight: '900', marginBottom: 11 },
  checkRow: { backgroundColor: SURFACE, padding: 14, borderRadius: 15, marginBottom: 9, flexDirection: 'row', alignItems: 'center' },
  check: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E7F3FF', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  checkText: { color: BLUE, fontWeight: '900' },
  checkTitle: { color: TEXT, fontWeight: '900', fontSize: 14 },
  checkNote: { color: MUTED, fontSize: 12, marginTop: 3 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: SURFACE, borderRadius: 15, paddingVertical: 17, alignItems: 'center' },
  statValue: { color: TEXT, fontSize: 17, fontWeight: '900' },
  statLabel: { color: MUTED, fontSize: 11, marginTop: 4 },
});
