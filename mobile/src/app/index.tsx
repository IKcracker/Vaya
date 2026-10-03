import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenReveal } from '@/components/screen-reveal';

const BLUE = '#1877F2';
const BG = '#F0F2F5';
const SURFACE = '#FFFFFF';
const TEXT = '#050505';
const MUTED = '#65676B';
const LINE = '#E4E6EB';

const routes = [
  { from: 'Pretoria', to: 'Polokwane', price: 'From R250', note: '12 rides available' },
  { from: 'Johannesburg', to: 'Thohoyandou', price: 'From R350', note: '8 rides available' },
  { from: 'Pretoria', to: 'Giyani', price: 'From R320', note: '6 rides available' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <ScreenReveal>
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>vaya</Text>
              <Text style={styles.subtitle}>Travel further, together.</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
              <Text style={styles.avatarText}>ZM</Text>
            </Pressable>
          </View>
        </ScreenReveal>

        <ScreenReveal delay={70}>
          <View style={styles.modeRow}>
            <Pressable style={({ pressed }) => [styles.mode, styles.modeActive, pressed && styles.pressed]}>
              <Text style={styles.modeActiveText}>Long distance</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.mode, pressed && styles.pressed]}>
              <Text style={styles.modeText}>Local ride</Text>
            </Pressable>
          </View>
        </ScreenReveal>

        <ScreenReveal delay={130}>
          <View style={styles.heroCard}>
            <View style={styles.heroAccent} />
            <Text style={styles.heroTitle}>Where are you going?</Text>
            <Text style={styles.heroCopy}>Find verified drivers already travelling your route.</Text>

            <Text style={styles.label}>From</Text>
            <Pressable style={({ pressed }) => [styles.inputLike, pressed && styles.inputPressed]}>
              <Text style={styles.locationDot}>●</Text>
              <Text style={styles.placeholder}>e.g. Polokwane</Text>
            </Pressable>

            <Text style={styles.label}>To</Text>
            <Pressable style={({ pressed }) => [styles.inputLike, pressed && styles.inputPressed]}>
              <Text style={[styles.locationDot, { color: BLUE }]}>●</Text>
              <Text style={styles.placeholder}>e.g. Pretoria</Text>
            </Pressable>

            <View style={styles.twoCol}>
              <View style={styles.half}>
                <Text style={styles.label}>Travel date</Text>
                <Pressable style={({ pressed }) => [styles.inputLike, pressed && styles.inputPressed]}>
                  <Text style={styles.placeholder}>Choose date</Text>
                </Pressable>
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Passengers</Text>
                <Pressable style={({ pressed }) => [styles.inputLike, pressed && styles.inputPressed]}>
                  <Text style={styles.placeholder}>1</Text>
                </Pressable>
              </View>
            </View>

            <Pressable style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}>
              <Text style={styles.primaryText}>Find rides</Text>
              <Text style={styles.primaryArrow}>→</Text>
            </Pressable>
          </View>
        </ScreenReveal>

        <ScreenReveal delay={200}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Popular routes</Text>
              <Text style={styles.sectionSubtitle}>Trips people are planning now</Text>
            </View>
            <Pressable><Text style={styles.link}>See all</Text></Pressable>
          </View>
        </ScreenReveal>

        {routes.map((route, index) => (
          <ScreenReveal key={route.from + route.to} delay={250 + index * 55}>
            <Pressable style={({ pressed }) => [styles.routeCard, pressed && styles.routePressed]}>
              <View style={styles.routeIcon}><Text style={styles.routeIconText}>↗</Text></View>
              <View style={styles.routeMain}>
                <Text style={styles.routeTitle}>{route.from} → {route.to}</Text>
                <Text style={styles.routeMeta}>{route.note} • luggage friendly</Text>
              </View>
              <View style={styles.pricePill}><Text style={styles.price}>{route.price}</Text></View>
            </Pressable>
          </ScreenReveal>
        ))}

        <ScreenReveal delay={430}>
          <View style={styles.safetyCard}>
            <View style={styles.safetyIcon}><Text style={styles.safetyIconText}>✓</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.safetyTitle}>Travel with verified drivers</Text>
              <Text style={styles.safetyCopy}>Identity, licence and vehicle checks are reviewed before drivers can publish long-distance trips.</Text>
            </View>
          </View>
        </ScreenReveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 120 },
  pressed: { opacity: 0.72 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  brand: { color: BLUE, fontSize: 38, fontWeight: '900', letterSpacing: -2, textTransform: 'lowercase' },
  subtitle: { color: MUTED, fontSize: 13, marginTop: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E7F3FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D6E8FF' },
  avatarText: { color: BLUE, fontWeight: '900' },
  modeRow: { flexDirection: 'row', backgroundColor: '#E4E6EB', padding: 4, borderRadius: 15, marginBottom: 14 },
  mode: { flex: 1, height: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  modeActive: { backgroundColor: SURFACE, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 7, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  modeText: { color: MUTED, fontWeight: '700' },
  modeActiveText: { color: BLUE, fontWeight: '900' },
  heroCard: { position: 'relative', overflow: 'hidden', backgroundColor: SURFACE, borderRadius: 22, padding: 18, marginBottom: 26, borderWidth: 1, borderColor: '#EDF0F3', shadowColor: '#345', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  heroAccent: { position: 'absolute', right: -28, top: -35, width: 120, height: 120, borderRadius: 60, backgroundColor: '#E7F3FF' },
  heroTitle: { color: TEXT, fontSize: 23, fontWeight: '900', letterSpacing: -0.5 },
  heroCopy: { color: MUTED, fontSize: 13, lineHeight: 20, marginTop: 4, marginBottom: 8, maxWidth: '80%' },
  label: { color: MUTED, fontSize: 11, fontWeight: '900', marginTop: 13, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
  inputLike: { height: 52, borderRadius: 13, backgroundColor: '#F7F8FA', borderWidth: 1, borderColor: LINE, alignItems: 'center', flexDirection: 'row', paddingHorizontal: 14, gap: 9 },
  inputPressed: { borderColor: '#AFCFF8', backgroundColor: '#F3F8FF' },
  locationDot: { color: '#98A1AF', fontSize: 10 },
  placeholder: { color: '#4E5663', fontSize: 14, fontWeight: '600' },
  twoCol: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  primary: { marginTop: 18, height: 54, backgroundColor: BLUE, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, shadowColor: BLUE, shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 4 },
  primaryPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  primaryArrow: { color: '#fff', fontSize: 20, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  sectionTitle: { color: TEXT, fontSize: 20, fontWeight: '900', letterSpacing: -0.35 },
  sectionSubtitle: { color: MUTED, fontSize: 11, marginTop: 3 },
  link: { color: BLUE, fontWeight: '900', fontSize: 13 },
  routeCard: { backgroundColor: SURFACE, borderRadius: 17, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EDF0F3' },
  routePressed: { transform: [{ scale: 0.99 }], backgroundColor: '#FAFCFF' },
  routeIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#E7F3FF', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  routeIconText: { color: BLUE, fontSize: 18, fontWeight: '900' },
  routeMain: { flex: 1 },
  routeTitle: { color: TEXT, fontSize: 14, fontWeight: '900' },
  routeMeta: { color: MUTED, fontSize: 11, marginTop: 4 },
  pricePill: { backgroundColor: '#F2F7FF', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10, marginLeft: 7 },
  price: { color: BLUE, fontSize: 11, fontWeight: '900' },
  safetyCard: { marginTop: 14, padding: 16, borderRadius: 18, backgroundColor: '#E7F3FF', flexDirection: 'row', gap: 11, borderWidth: 1, borderColor: '#D4E7FF' },
  safetyIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', shadowColor: BLUE, shadowOpacity: 0.2, shadowRadius: 8, elevation: 2 },
  safetyIconText: { color: '#fff', fontWeight: '900' },
  safetyTitle: { color: TEXT, fontWeight: '900', marginBottom: 4 },
  safetyCopy: { color: MUTED, fontSize: 12, lineHeight: 18 },
});
