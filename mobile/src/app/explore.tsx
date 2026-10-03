import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenReveal } from '@/components/screen-reveal';

const BLUE = '#1877F2';
const NAVY = '#0B1730';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

export default function DriverScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <ScreenReveal>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>DRIVER</Text>
              <Text style={styles.title}>Your trips</Text>
              <Text style={styles.muted}>Publish, manage and complete your journeys.</Text>
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

        <ScreenReveal delay={130}>
          <Text style={styles.sectionTitle}>Next departure</Text>
          <View style={styles.tripCard}>
            <View style={styles.tripTop}>
              <View>
                <Text style={styles.tripTime}>Tomorrow • 06:00</Text>
                <Text style={styles.tripRoute}>Polokwane → Pretoria</Text>
              </View>
              <View style={styles.seatBadge}><Text style={styles.seatText}>3/4 booked</Text></View>
            </View>

            <View style={styles.tripDivider} />

            <View style={styles.tripMetrics}>
              <View><Text style={styles.metricLabel}>Fare</Text><Text style={styles.metricValue}>R300</Text></View>
              <View><Text style={styles.metricLabel}>Expected</Text><Text style={styles.metricValue}>R900</Text></View>
              <View><Text style={styles.metricLabel}>Luggage</Text><Text style={styles.metricValue}>4 bags</Text></View>
            </View>

            <Pressable style={({ pressed }) => [styles.secondary, pressed && styles.secondaryPressed]}>
              <Text style={styles.secondaryText}>Open trip</Text>
              <Text style={styles.secondaryArrow}>→</Text>
            </Pressable>
          </View>
        </ScreenReveal>

        <ScreenReveal delay={200}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Before you leave</Text>
            <Text style={styles.readyText}>Ready</Text>
          </View>

          {[
            ['Passenger list', '3 confirmed passengers'],
            ['Pickup plan', 'Mall of the North • 05:45'],
            ['Vehicle', 'Toyota Corolla • White'],
          ].map(([title, note]) => (
            <Pressable key={title} style={({ pressed }) => [styles.actionRow, pressed && styles.rowPressed]}>
              <View>
                <Text style={styles.actionTitle}>{title}</Text>
                <Text style={styles.actionNote}>{note}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </ScreenReveal>

        <ScreenReveal delay={290}>
          <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 10 }]}>Driver account</Text>
          <View style={styles.accountStrip}>
            <View style={styles.accountDot}><Text style={styles.accountDotText}>✓</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.accountTitle}>Verification complete</Text>
              <Text style={styles.accountNote}>Identity, licence and vehicle approved.</Text>
            </View>
          </View>
        </ScreenReveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { padding: 18, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 18 },
  eyebrow: { color: BLUE, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: TEXT, fontSize: 26, fontWeight: '900', marginTop: 4, letterSpacing: -0.5 },
  muted: { color: MUTED, fontSize: 12, marginTop: 3 },
  status: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF7EF', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#12B76A', marginRight: 6 },
  statusText: { color: '#027A48', fontSize: 10, fontWeight: '900' },

  primary: { height: 54, borderRadius: 14, backgroundColor: NAVY, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24 },
  primaryPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  plus: { color: '#FFFFFF', fontSize: 21, fontWeight: '700' },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },

  sectionTitle: { color: TEXT, fontSize: 18, fontWeight: '900', letterSpacing: -0.25, marginBottom: 10 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  readyText: { color: '#027A48', fontSize: 10, fontWeight: '900' },

  tripCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 18, padding: 16, marginBottom: 24 },
  tripTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  tripTime: { color: BLUE, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  tripRoute: { color: TEXT, fontSize: 18, fontWeight: '900', marginTop: 5 },
  seatBadge: { backgroundColor: '#E7F3FF', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 999 },
  seatText: { color: BLUE, fontSize: 10, fontWeight: '900' },
  tripDivider: { height: 1, backgroundColor: LINE, marginVertical: 16 },
  tripMetrics: { flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { color: MUTED, fontSize: 10, fontWeight: '700' },
  metricValue: { color: TEXT, fontSize: 15, fontWeight: '900', marginTop: 4 },
  secondary: { height: 44, borderRadius: 11, backgroundColor: '#EEF5FF', marginTop: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  secondaryPressed: { opacity: 0.75 },
  secondaryText: { color: BLUE, fontSize: 12, fontWeight: '900' },
  secondaryArrow: { color: BLUE, fontSize: 16, fontWeight: '900' },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: SURFACE, borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 14 },
  rowPressed: { opacity: 0.7 },
  actionTitle: { color: TEXT, fontSize: 13, fontWeight: '900' },
  actionNote: { color: MUTED, fontSize: 11, marginTop: 4 },
  chevron: { color: '#98A2B3', fontSize: 22 },

  accountStrip: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#EDF7F2', borderRadius: 15, padding: 14 },
  accountDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#12B76A', alignItems: 'center', justifyContent: 'center' },
  accountDotText: { color: '#FFFFFF', fontWeight: '900' },
  accountTitle: { color: TEXT, fontSize: 12, fontWeight: '900' },
  accountNote: { color: MUTED, fontSize: 11, marginTop: 3 },
});
