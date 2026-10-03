import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>vaya</Text>
            <Text style={styles.subtitle}>Travel further, together.</Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>ZM</Text></View>
        </View>

        <View style={styles.modeRow}>
          <Pressable style={[styles.mode, styles.modeActive]}>
            <Text style={styles.modeActiveText}>Long distance</Text>
          </Pressable>
          <Pressable style={styles.mode}>
            <Text style={styles.modeText}>Local ride</Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Where are you going?</Text>
          <Text style={styles.heroCopy}>Find verified drivers already travelling your route.</Text>

          <Text style={styles.label}>From</Text>
          <Pressable style={styles.inputLike}><Text style={styles.placeholder}>e.g. Polokwane</Text></Pressable>

          <Text style={styles.label}>To</Text>
          <Pressable style={styles.inputLike}><Text style={styles.placeholder}>e.g. Pretoria</Text></Pressable>

          <View style={styles.twoCol}>
            <View style={styles.half}>
              <Text style={styles.label}>Travel date</Text>
              <Pressable style={styles.inputLike}><Text style={styles.placeholder}>Choose date</Text></Pressable>
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Passengers</Text>
              <Pressable style={styles.inputLike}><Text style={styles.placeholder}>1</Text></Pressable>
            </View>
          </View>

          <Pressable style={styles.primary}>
            <Text style={styles.primaryText}>Find rides</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular routes</Text>
          <Text style={styles.link}>See all</Text>
        </View>

        {routes.map((route) => (
          <Pressable key={route.from + route.to} style={styles.routeCard}>
            <View style={styles.routeIcon}><Text style={styles.routeIconText}>↗</Text></View>
            <View style={styles.routeMain}>
              <Text style={styles.routeTitle}>{route.from} → {route.to}</Text>
              <Text style={styles.routeMeta}>{route.note} • luggage friendly</Text>
            </View>
            <Text style={styles.price}>{route.price}</Text>
          </Pressable>
        ))}

        <View style={styles.safetyCard}>
          <View style={styles.safetyIcon}><Text style={styles.safetyIconText}>✓</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.safetyTitle}>Travel with verified drivers</Text>
            <Text style={styles.safetyCopy}>Driver identity, licence and vehicle checks are reviewed before they can publish trips.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 110 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  brand: { color: BLUE, fontSize: 36, fontWeight: '900', letterSpacing: -1.8, textTransform: 'lowercase' },
  subtitle: { color: MUTED, fontSize: 14, marginTop: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E7F3FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BLUE, fontWeight: '900' },
  modeRow: { flexDirection: 'row', backgroundColor: '#E4E6EB', padding: 4, borderRadius: 14, marginBottom: 14 },
  mode: { flex: 1, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  modeActive: { backgroundColor: SURFACE },
  modeText: { color: MUTED, fontWeight: '700' },
  modeActiveText: { color: BLUE, fontWeight: '800' },
  heroCard: { backgroundColor: SURFACE, borderRadius: 20, padding: 17, marginBottom: 24 },
  heroTitle: { color: TEXT, fontSize: 22, fontWeight: '900' },
  heroCopy: { color: MUTED, fontSize: 14, lineHeight: 20, marginTop: 4, marginBottom: 8 },
  label: { color: MUTED, fontSize: 12, fontWeight: '800', marginTop: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  inputLike: { height: 50, borderRadius: 12, backgroundColor: BG, borderWidth: 1, borderColor: LINE, justifyContent: 'center', paddingHorizontal: 14 },
  placeholder: { color: MUTED, fontSize: 15 },
  twoCol: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  primary: { marginTop: 18, height: 52, backgroundColor: BLUE, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  sectionTitle: { color: TEXT, fontSize: 20, fontWeight: '900' },
  link: { color: BLUE, fontWeight: '800', fontSize: 13 },
  routeCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  routeIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E7F3FF', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  routeIconText: { color: BLUE, fontSize: 18, fontWeight: '900' },
  routeMain: { flex: 1 },
  routeTitle: { color: TEXT, fontSize: 14, fontWeight: '900' },
  routeMeta: { color: MUTED, fontSize: 12, marginTop: 4 },
  price: { color: BLUE, fontSize: 13, fontWeight: '900', marginLeft: 8 },
  safetyCard: { marginTop: 14, padding: 15, borderRadius: 16, backgroundColor: '#E7F3FF', flexDirection: 'row', gap: 11 },
  safetyIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  safetyIconText: { color: '#fff', fontWeight: '900' },
  safetyTitle: { color: TEXT, fontWeight: '900', marginBottom: 4 },
  safetyCopy: { color: MUTED, fontSize: 12, lineHeight: 17 },
});
