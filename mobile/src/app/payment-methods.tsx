import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GREEN = '#10B981';
const BG = '#F7F9F8';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

const cards = [
  { brand: 'VISA', number: '•••• 4242', status: 'Default' },
  { brand: 'MC', number: '•••• 8800', status: 'Mastercard' },
  { brand: 'AMEX', number: '•••• 1234', status: 'Amex' },
];

export default function PaymentMethodsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Header title="Payment Methods" onBack={() => router.back()} />
        <Pressable style={styles.add}><Text style={styles.addText}>＋ Add Card</Text></Pressable>

        <View style={styles.list}>
          {cards.map((card, index) => (
            <View key={card.number} style={[styles.row, index < cards.length - 1 && styles.border]}>
              <View style={[styles.brand, card.brand === 'MC' && styles.brandRed, card.brand === 'AMEX' && styles.brandBlue]}>
                <Text style={styles.brandText}>{card.brand}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.number}>{card.number}</Text>
                <Text style={styles.meta}>{card.status}</Text>
              </View>
              {index === 0 ? <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View> : <Text style={styles.chevron}>›</Text>}
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
  add: { alignSelf: 'center', marginTop: 18, paddingHorizontal: 12, paddingVertical: 9 },
  addText: { color: GREEN, fontSize: 10, fontWeight: '900' },
  list: { marginTop: 8, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 15, overflow: 'hidden' },
  row: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: LINE },
  brand: { width: 42, height: 28, borderRadius: 7, backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center' },
  brandRed: { backgroundColor: '#EF4444' },
  brandBlue: { backgroundColor: '#2563EB' },
  brandText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  number: { color: TEXT, fontSize: 10.5, fontWeight: '900' },
  meta: { color: MUTED, fontSize: 8, marginTop: 3 },
  defaultBadge: { backgroundColor: '#ECFDF3', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  defaultText: { color: '#027A48', fontSize: 7, fontWeight: '900' },
  chevron: { color: '#98A2B3', fontSize: 21 },
});
