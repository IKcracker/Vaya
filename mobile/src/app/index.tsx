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

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <ScreenReveal>
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>vaya</Text>
              <Text style={styles.subtitle}>Where are you headed?</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
              <Text style={styles.avatarText}>ZM</Text>
            </Pressable>
          </View>
        </ScreenReveal>

        <ScreenReveal delay={70}>
          <View style={styles.modeRow}>
            <Pressable style={[styles.mode, styles.modeActive]}>
              <Text style={styles.modeActiveText}>Long distance</Text>
            </Pressable>
            <Pressable style={styles.mode}>
              <Text style={styles.modeText}>Local ride</Text>
            </Pressable>
          </View>
        </ScreenReveal>

        <ScreenReveal delay={120}>
          <View style={styles.searchCard}>
            <Text style={styles.cardEyebrow}>PLAN YOUR TRIP</Text>

            <View style={styles.routeBlock}>
              <View style={styles.routeRail}>
                <View style={styles.routeDotMuted} />
                <View style={styles.routeLine} />
                <View style={styles.routeDotBlue} />
              </View>

              <View style={styles.routeFields}>
                <Pressable style={({ pressed }) => [styles.routeField, pressed && styles.inputPressed]}>
                  <Text style={styles.fieldLabel}>Leaving from</Text>
                  <Text style={styles.fieldValue}>Choose pickup area</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.routeField, pressed && styles.inputPressed]}>
                  <Text style={styles.fieldLabel}>Going to</Text>
                  <Text style={styles.fieldValue}>Choose destination</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.optionsRow}>
              <Pressable style={({ pressed }) => [styles.option, pressed && styles.inputPressed]}>
                <Text style={styles.optionLabel}>Date</Text>
                <Text style={styles.optionValue}>Choose</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.option, pressed && styles.inputPressed]}>
                <Text style={styles.optionLabel}>Seats</Text>
                <Text style={styles.optionValue}>1 passenger</Text>
              </Pressable>
            </View>

            <Pressable style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}>
              <Text style={styles.primaryText}>Search available rides</Text>
            </Pressable>
          </View>
        </ScreenReveal>

        <ScreenReveal delay={190}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Your next trip</Text>
              <Text style={styles.sectionSubtitle}>Nothing booked yet</Text>
            </View>
          </View>

          <View style={styles.emptyTrip}>
            <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>↗</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.emptyTitle}>Start with a route search</Text>
              <Text style={styles.emptyCopy}>When you book a ride, the driver, pickup point, departure time and luggage details will appear here.</Text>
            </View>
          </View>
        </ScreenReveal>

        <ScreenReveal delay={260}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Popular corridors</Text>
              <Text style={styles.sectionSubtitle}>Common long-distance directions</Text>
            </View>
          </View>

          {[
            ['Pretoria', 'Polokwane'],
            ['Johannesburg', 'Thohoyandou'],
            ['Pretoria', 'Giyani'],
          ].map(([from, to]) => (
            <Pressable key={from + to} style={({ pressed }) => [styles.routeCard, pressed && styles.routePressed]}>
              <View>
                <Text style={styles.routeTitle}>{from} → {to}</Text>
                <Text style={styles.routeMeta}>Tap to search this corridor</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </ScreenReveal>

        <ScreenReveal delay={340}>
          <View style={styles.safetyStrip}>
            <View style={styles.safetyBadge}><Text style={styles.safetyBadgeText}>✓</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.safetyTitle}>Verified driver marketplace</Text>
              <Text style={styles.safetyCopy}>Only approved drivers can publish long-distance trips.</Text>
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
  brand: { color: BLUE, fontSize: 36, fontWeight: '900', letterSpacing: -1.8 },
  subtitle: { color: MUTED, fontSize: 13, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E7F3FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BLUE, fontWeight: '900' },

  modeRow: { flexDirection: 'row', backgroundColor: '#E9EDF2', padding: 4, borderRadius: 13, marginBottom: 14 },
  mode: { flex: 1, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  modeActive: { backgroundColor: SURFACE },
  modeText: { color: MUTED, fontWeight: '700', fontSize: 13 },
  modeActiveText: { color: NAVY, fontWeight: '900', fontSize: 13 },

  searchCard: { backgroundColor: NAVY, borderRadius: 22, padding: 18, marginBottom: 26 },
  cardEyebrow: { color: '#7DB7FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },

  routeBlock: { flexDirection: 'row', marginTop: 15 },
  routeRail: { width: 26, alignItems: 'center', paddingTop: 21, paddingBottom: 21 },
  routeDotMuted: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#98A2B3' },
  routeDotBlue: { width: 9, height: 9, borderRadius: 5, backgroundColor: BLUE },
  routeLine: { flex: 1, width: 1, backgroundColor: '#34445E', marginVertical: 3 },
  routeFields: { flex: 1, gap: 10 },
  routeField: { borderRadius: 14, backgroundColor: '#13233F', paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: '#243552' },
  fieldLabel: { color: '#8FA0B8', fontSize: 10, fontWeight: '700' },
  fieldValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginTop: 4 },

  optionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  option: { flex: 1, borderRadius: 13, backgroundColor: '#13233F', paddingHorizontal: 13, paddingVertical: 12, borderWidth: 1, borderColor: '#243552' },
  optionLabel: { color: '#8FA0B8', fontSize: 10, fontWeight: '700' },
  optionValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginTop: 4 },
  inputPressed: { opacity: 0.78 },

  primary: { height: 52, backgroundColor: BLUE, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  primaryPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },

  sectionHeader: { marginBottom: 11 },
  sectionTitle: { color: TEXT, fontSize: 19, fontWeight: '900', letterSpacing: -0.3 },
  sectionSubtitle: { color: MUTED, fontSize: 11, marginTop: 3 },

  emptyTrip: { flexDirection: 'row', gap: 12, backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1, borderColor: LINE, padding: 15, marginBottom: 24 },
  emptyIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#E7F3FF', alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { color: BLUE, fontWeight: '900', fontSize: 18 },
  emptyTitle: { color: TEXT, fontSize: 13, fontWeight: '900' },
  emptyCopy: { color: MUTED, fontSize: 11, lineHeight: 17, marginTop: 4 },

  routeCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: SURFACE, borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 14 },
  routePressed: { opacity: 0.7 },
  routeTitle: { color: TEXT, fontSize: 13, fontWeight: '900' },
  routeMeta: { color: MUTED, fontSize: 11, marginTop: 4 },
  chevron: { color: '#98A2B3', fontSize: 22 },

  safetyStrip: { flexDirection: 'row', gap: 11, alignItems: 'center', marginTop: 24, backgroundColor: '#EDF5FF', borderRadius: 16, padding: 14 },
  safetyBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  safetyBadgeText: { color: '#FFFFFF', fontWeight: '900' },
  safetyTitle: { color: TEXT, fontSize: 12, fontWeight: '900' },
  safetyCopy: { color: MUTED, fontSize: 11, marginTop: 3 },
});
