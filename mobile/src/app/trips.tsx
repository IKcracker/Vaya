import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenReveal } from '@/components/screen-reveal';

const BLUE = '#1877F2';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

const upcoming = [
  {
    id: 'BK-20491',
    route: 'Johannesburg → Durban',
    date: 'Fri, 09 Oct · 06:30',
    driver: 'Lebo Mokoena',
    pickup: 'Park Station',
    amount: 'R280',
    status: 'Confirmed',
  },
];

const history = [
  {
    id: 'BK-20310',
    route: 'Pretoria → Polokwane',
    date: '28 Sep · 07:00',
    driver: 'Zanele Nkosi',
    amount: 'R180',
  },
  {
    id: 'BK-20184',
    route: 'Cape Town → Worcester',
    date: '11 Sep · 08:15',
    driver: 'Anele Dlamini',
    amount: 'R120',
  },
];

export default function TripsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <ScreenReveal>
          <Text style={styles.eyebrow}>YOUR TRAVEL</Text>
          <Text style={styles.title}>Trips</Text>
          <Text style={styles.subtitle}>Bookings, departures and completed journeys in one place.</Text>
        </ScreenReveal>

        <ScreenReveal delay={70}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            <Text style={styles.sectionMeta}>{upcoming.length} booking</Text>
          </View>

          {upcoming.map((trip) => (
            <Pressable key={trip.id} style={({ pressed }) => [styles.upcomingCard, pressed && styles.pressed]}>
              <View style={styles.statusRow}>
                <View style={styles.statusBadge}><Text style={styles.statusText}>{trip.status}</Text></View>
                <Text style={styles.bookingId}>{trip.id}</Text>
              </View>
              <Text style={styles.route}>{trip.route}</Text>
              <Text style={styles.date}>{trip.date}</Text>

              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View><Text style={styles.detailLabel}>Driver</Text><Text style={styles.detailValue}>{trip.driver}</Text></View>
                <View><Text style={styles.detailLabel}>Pickup</Text><Text style={styles.detailValue}>{trip.pickup}</Text></View>
                <View><Text style={styles.detailLabel}>Paid</Text><Text style={styles.detailValue}>{trip.amount}</Text></View>
              </View>
            </Pressable>
          ))}
        </ScreenReveal>

        <ScreenReveal delay={140}>
          <View style={[styles.sectionHeader, { marginTop: 28 }]}>
            <Text style={styles.sectionTitle}>Past trips</Text>
            <Text style={styles.sectionMeta}>Recent</Text>
          </View>

          <View style={styles.historyList}>
            {history.map((trip, index) => (
              <Pressable
                key={trip.id}
                style={({ pressed }) => [
                  styles.historyRow,
                  index < history.length - 1 && styles.historyBorder,
                  pressed && styles.pressed,
                ]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyRoute}>{trip.route}</Text>
                  <Text style={styles.historyMeta}>{trip.date} · {trip.driver}</Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyAmount}>{trip.amount}</Text>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScreenReveal>

        <ScreenReveal delay={210}>
          <View style={styles.helpCard}>
            <View style={styles.helpIcon}><Text style={styles.helpIconText}>?</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.helpTitle}>Need help with a trip?</Text>
              <Text style={styles.helpText}>Booking and safety support will stay linked to the journey.</Text>
            </View>
          </View>
        </ScreenReveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 120 },
  pressed: { opacity: 0.72 },
  eyebrow: { color: BLUE, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: TEXT, fontSize: 30, fontWeight: '900', letterSpacing: -0.7, marginTop: 4 },
  subtitle: { color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 5, maxWidth: 330 },
  sectionHeader: { marginTop: 24, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: TEXT, fontSize: 18, fontWeight: '900' },
  sectionMeta: { color: MUTED, fontSize: 11, fontWeight: '700' },
  upcomingCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 18, padding: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { backgroundColor: '#ECFDF3', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 },
  statusText: { color: '#027A48', fontSize: 10, fontWeight: '900' },
  bookingId: { color: MUTED, fontSize: 10, fontWeight: '800' },
  route: { color: TEXT, fontSize: 20, fontWeight: '900', marginTop: 16, letterSpacing: -0.3 },
  date: { color: BLUE, fontSize: 12, fontWeight: '800', marginTop: 5 },
  divider: { height: 1, backgroundColor: LINE, marginVertical: 15 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  detailLabel: { color: MUTED, fontSize: 9, fontWeight: '700' },
  detailValue: { color: TEXT, fontSize: 11, fontWeight: '900', marginTop: 4 },
  historyList: { backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1, borderColor: LINE, overflow: 'hidden' },
  historyRow: { padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyBorder: { borderBottomWidth: 1, borderBottomColor: LINE },
  historyRoute: { color: TEXT, fontSize: 13, fontWeight: '900' },
  historyMeta: { color: MUTED, fontSize: 10, marginTop: 4 },
  historyRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyAmount: { color: TEXT, fontSize: 12, fontWeight: '900' },
  chevron: { color: '#98A2B3', fontSize: 22 },
  helpCard: { marginTop: 26, backgroundColor: '#EEF5FF', borderRadius: 16, padding: 14, flexDirection: 'row', gap: 11, alignItems: 'center' },
  helpIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  helpIconText: { color: '#FFFFFF', fontWeight: '900' },
  helpTitle: { color: TEXT, fontSize: 12, fontWeight: '900' },
  helpText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 3 },
});
