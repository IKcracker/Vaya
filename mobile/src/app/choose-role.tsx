import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BG = '#F7F9F8';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

export default function ChooseRoleScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View>
          <Text style={styles.title}>Join as</Text>
          <Text style={styles.subtitle}>Choose how you want to use Vaya.</Text>
        </View>

        <View style={styles.cards}>
          <Pressable onPress={() => router.replace('/')} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={styles.icon}><Text style={styles.iconText}>🚗</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Passenger</Text>
              <Text style={styles.cardText}>Find and book inter-city rides</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable onPress={() => router.replace('/explore')} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={styles.icon}><Text style={styles.iconText}>🚘</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Driver</Text>
              <Text style={styles.cardText}>Offer rides and earn from trips you already make</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>One account, both roles</Text>
          <Text style={styles.noteText}>You can switch between passenger and driver mode at any time.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { flex: 1, padding: 20, justifyContent: 'space-between' },
  title: { color: TEXT, fontSize: 28, fontWeight: '900', letterSpacing: -0.7, marginTop: 12 },
  subtitle: { color: MUTED, fontSize: 11, marginTop: 6 },
  cards: { gap: 12, marginTop: 28, flex: 1 },
  card: { minHeight: 106, borderWidth: 1, borderColor: LINE, borderRadius: 18, backgroundColor: SURFACE, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13 },
  pressed: { opacity: 0.72 },
  icon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#E9F9F3', alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 27 },
  cardTitle: { color: TEXT, fontSize: 15, fontWeight: '900' },
  cardText: { color: MUTED, fontSize: 9.5, lineHeight: 15, marginTop: 4 },
  chevron: { color: '#98A2B3', fontSize: 28 },
  note: { backgroundColor: '#E9F9F3', borderRadius: 14, padding: 14, marginBottom: 8 },
  noteTitle: { color: '#087F5B', fontSize: 10, fontWeight: '900' },
  noteText: { color: '#087F5B', fontSize: 9, lineHeight: 14, marginTop: 3 },
});
