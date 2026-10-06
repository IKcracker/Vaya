import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GREEN = '#10B981';
const BG = '#F7F9F8';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

export default function OnboardingScreen() {
  const router = useRouter();

  async function continueToAuth() {
    await SecureStore.setItemAsync('vaya.onboarding.completed', '1');
    router.replace('/auth');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.visual}>
          <View style={styles.sun} />
          <View style={styles.mountainOne} />
          <View style={styles.mountainTwo} />
          <View style={styles.road} />
          <View style={styles.car}>
            <View style={styles.carRoof} />
            <View style={styles.carBody} />
          </View>
          <View style={styles.peopleRow}>
            {['A', 'B', 'C'].map((label, index) => (
              <View key={label} style={[styles.person, { left: 36 + index * 46 }]}>
                <View style={styles.personHead} />
                <View style={styles.personBody} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>A safer, smarter way to travel</Text>
          <Text style={styles.copy}>
            Share rides, save money and meet great people along the way.
          </Text>

          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          <Pressable onPress={() => void continueToAuth()} style={styles.primary}>
            <Text style={styles.primaryText}>Next</Text>
          </Pressable>

          <Pressable onPress={() => router.replace('/auth')} style={styles.skip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { flexGrow: 1, padding: 16, justifyContent: 'space-between' },
  visual: { height: 330, borderRadius: 28, overflow: 'hidden', backgroundColor: '#EAF4FF', position: 'relative' },
  sun: { position: 'absolute', right: 38, top: 42, width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFD66B' },
  mountainOne: { position: 'absolute', left: -40, right: 90, bottom: 112, height: 140, backgroundColor: '#D7E2FF', transform: [{ rotate: '-8deg' }], borderRadius: 70 },
  mountainTwo: { position: 'absolute', left: 100, right: -50, bottom: 100, height: 120, backgroundColor: '#C9D9F8', transform: [{ rotate: '10deg' }], borderRadius: 60 },
  road: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 114, backgroundColor: '#8DB59B' },
  car: { position: 'absolute', left: 56, right: 56, bottom: 40, height: 94 },
  carRoof: { position: 'absolute', left: 28, right: 28, top: 0, height: 40, borderTopLeftRadius: 25, borderTopRightRadius: 25, backgroundColor: '#063C35' },
  carBody: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 62, borderRadius: 18, backgroundColor: '#10B981' },
  peopleRow: { position: 'absolute', left: 0, right: 0, bottom: 83, height: 90 },
  person: { position: 'absolute', bottom: 0, width: 34, alignItems: 'center' },
  personHead: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#C98C62' },
  personBody: { width: 30, height: 42, borderTopLeftRadius: 15, borderTopRightRadius: 15, backgroundColor: SURFACE },
  content: { paddingHorizontal: 8, paddingTop: 26, paddingBottom: 8 },
  title: { color: TEXT, fontSize: 27, lineHeight: 33, fontWeight: '900', textAlign: 'center', letterSpacing: -0.7 },
  copy: { color: MUTED, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 10, paddingHorizontal: 18 },
  dots: { marginTop: 22, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D0D5DD' },
  dotActive: { width: 18, backgroundColor: GREEN },
  primary: { marginTop: 24, height: 50, borderRadius: 12, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  skip: { marginTop: 12, alignSelf: 'center', padding: 8 },
  skipText: { color: MUTED, fontSize: 10, fontWeight: '800' },
});
