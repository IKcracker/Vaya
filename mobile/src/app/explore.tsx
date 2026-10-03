import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenReveal } from '@/components/screen-reveal';

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
        <ScreenReveal>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>DRIVER MODE</Text>
              <Text style={styles.title}>Good evening, Thabo</Text>
              <Text style={styles.muted}>Ready for your next journey?</Text>
            </View>
            <View style={styles.status}><View style={styles.dot} /><Text style={styles.statusText}>Approved</Text></View>
          </View>
        </ScreenReveal>

        <ScreenReveal delay={70}>
          <Pressable style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}>
            <Text style={styles.plus}>＋</Text>
            <Text style={styles.primaryText}>Publish a trip</Text>
          </Pressable>
        </ScreenReveal>

        <ScreenReveal delay={140}>
          <View style={styles.card}>
            <View style={styles.cardAccent} />
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
              <View><Text style={styles.metricLabel}>Expected</Text><Text style={styles.metricValue}>R900</Text></View>
              <View><Text style={styles.metricLabel}>Passengers</Text><Text style={styles.metricValue}>3</Text></View>
              <View><Text style={styles.metricLabel}>Luggage</Text><Text style={styles.metricValue}>4 bags</Text></View>
            </View>

            <Pressable style={({ pressed }) => [styles.secondary, pressed && styles.secondaryPressed]}>
              <Text style={styles.secondaryText}>Manage trip</Text>
              <Text style={styles.secondaryArrow}>→</Text>
            </Pressable>
          </View>
        </ScreenReveal>

        <ScreenReveal delay={210}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Driver readiness</Text>
            <Text style={styles.complete}>3 of 3 complete</Text>
          </View>
        </ScreenReveal>

        {[
          ['Profile verified', 'Identity and contact details approved'],
          ['Vehicle approved', '2021 Toyota Corolla • White'],
          ['Payout details', 'Bank account connected'],
        ].map(([title, note], index) => (
          <ScreenReveal key={title} delay={260 + index * 55}>
            <View style={styles.checkRow}>
              <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkTitle}>{title}</Text>
                <Text style={styles.checkNote}>{note}</Text>
              </View>
              <Text style={styles.rowArrow}>›</Text>
            </View>
          </ScreenReveal>
        ))}

        <ScreenReveal delay={440}>
          <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 11 }]}>This month</Text>
          <View style={styles.stats}>
            <View style={styles.stat}><Text style={styles.statValue}>12</Text><Text style={styles.statLabel}>Trips</Text></View>
            <View style={styles.stat}><Text style={styles.statValue}>4.9</Text><Text style={styles.statLabel}>Rating</Text></View>
            <View style={styles.stat}><Text style={styles.statValue}>R6,480</Text><Text style={styles.statLabel}>Earned</Text></View>
          </View>
        </ScreenReveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { padding: 18, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 8 },
  eyebrow: { color: BLUE, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: TEXT, fontSize: 25, fontWeight: '900', marginTop: 6, letterSpacing: -0.6 },
  muted: { color: MUTED, fontSize: 12, marginTop: 4 },
  status: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E7F3FF', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: '#D4E7FF' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#31A24C', marginRight: 6 },
  statusText: { color: BLUE, fontSize: 10, fontWeight: '900' },
  primary: { height: 56, borderRadius: 15, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', marginBottom: 16, flexDirection: 'row', gap: 5, shadowColor: BLUE, shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 4 },
  primaryPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  plus: { color: '#fff', fontSize: 22, fontWeight: '700' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  card: { position: 'relative', overflow: 'hidden', backgroundColor: SURFACE, borderRadius: 22, padding: 18, marginBottom: 25, borderWidth: 1, borderColor: '#EDF0F3', shadowColor: '#345', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  cardAccent: { position: 'absolute', right: -30, top: -40, width: 125, height: 125, borderRadius: 63, backgroundColor: '#E7F3FF' },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallBlue: { color: BLUE, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  tripTitle: { color: TEXT, fontSize: 19, fontWeight: '900', marginTop: 5, letterSpacing: -0.25 },
  seatBadge: { backgroundColor: '#E7F3FF', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#D6E8FF' },
  seatText: { color: BLUE, fontSize: 10, fontWeight: '900' },
  divider: { height: 1, backgroundColor: LINE, marginVertical: 17 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { color: MUTED, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  metricValue: { color: TEXT, fontSize: 17, fontWeight: '900', marginTop: 5 },
  secondary: { marginTop: 17, height: 47, borderRadius: 12, backgroundColor: '#E7F3FF', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  secondaryPressed: { backgroundColor: '#DDEEFF', transform: [{ scale: 0.99 }] },
  secondaryText: { color: BLUE, fontWeight: '900' },
  secondaryArrow: { color: BLUE, fontSize: 18, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  sectionTitle: { color: TEXT, fontSize: 19, fontWeight: '900', letterSpacing: -0.3 },
  complete: { color: '#31A24C', fontSize: 10, fontWeight: '900' },
  checkRow: { backgroundColor: SURFACE, padding: 14, borderRadius: 16, marginBottom: 9, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EDF0F3' },
  check: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E7F3FF', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  checkText: { color: BLUE, fontWeight: '900' },
  checkTitle: { color: TEXT, fontWeight: '900', fontSize: 13 },
  checkNote: { color: MUTED, fontSize: 11, marginTop: 3 },
  rowArrow: { color: '#A3ABB5', fontSize: 22, marginLeft: 6 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: SURFACE, borderRadius: 16, paddingVertical: 18, alignItems: 'center', borderWidth: 1, borderColor: '#EDF0F3' },
  statValue: { color: TEXT, fontSize: 17, fontWeight: '900' },
  statLabel: { color: MUTED, fontSize: 10, marginTop: 4, fontWeight: '700' },
});
