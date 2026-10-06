import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchPassengerPayments, PassengerPayment } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#10B981';
const BG = '#F6F8F7';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export default function ProfilePaymentsScreen() {
  const router = useRouter();
  const { session } = usePassengerAuth();
  const [payments, setPayments] = useState<PassengerPayment[]>([]);
  const [loading, setLoading] = useState(Boolean(session));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    let active = true;

    fetchPassengerPayments(session)
      .then((response) => {
        if (active) setPayments(response.payments);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load payments');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.eyebrow}>ACCOUNT</Text>
            <Text style={styles.title}>Payments</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Payment attempts and settled transactions linked to your bookings.
        </Text>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={BLUE} />
            <Text style={styles.stateTitle}>Loading payments</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Couldn’t load payments</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : payments.length ? (
          <View style={styles.list}>
            {payments.map((payment, index) => (
              <Pressable
                key={payment.reference}
                onPress={() =>
                  router.push({
                    pathname: '/payment/[id]',
                    params: { id: payment.bookingId },
                  })
                }
                style={[
                  styles.row,
                  index < payments.length - 1 && styles.border,
                ]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.route}>{payment.route}</Text>
                  <Text style={styles.meta}>
                    {payment.reference} · {formatDate(payment.createdAt)}
                  </Text>
                  <Text style={styles.method}>{payment.method}</Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.amount}>{payment.amount}</Text>
                  <Text style={[
                    styles.status,
                    payment.status === 'Settled' ? styles.settled : styles.pending,
                  ]}>
                    {payment.status}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>No payment history yet</Text>
            <Text style={styles.stateText}>Payments will appear here after you start a booking checkout.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { padding: 18, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 40, height: 40, borderRadius: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  backText: { color: TEXT, fontSize: 30, lineHeight: 30, marginTop: -3 },
  eyebrow: { color: BLUE, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: TEXT, fontSize: 22, fontWeight: '900', marginTop: 3 },
  subtitle: { color: MUTED, fontSize: 11, lineHeight: 18, marginTop: 18, marginBottom: 16 },
  stateCard: { minHeight: 170, borderWidth: 1, borderColor: LINE, borderRadius: 16, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateTitle: { color: TEXT, fontSize: 13, fontWeight: '900', marginTop: 10 },
  stateText: { color: MUTED, fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 4 },
  errorCard: { borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFF8F7', borderRadius: 14, padding: 14 },
  errorTitle: { color: '#B42318', fontSize: 12, fontWeight: '900' },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16, marginTop: 4 },
  list: { borderWidth: 1, borderColor: LINE, borderRadius: 16, backgroundColor: SURFACE, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: 12, padding: 15 },
  border: { borderBottomWidth: 1, borderBottomColor: LINE },
  route: { color: TEXT, fontSize: 12, fontWeight: '900' },
  meta: { color: MUTED, fontSize: 9, lineHeight: 14, marginTop: 4 },
  method: { color: BLUE, fontSize: 9, fontWeight: '800', marginTop: 5 },
  right: { alignItems: 'flex-end' },
  amount: { color: TEXT, fontSize: 12, fontWeight: '900' },
  status: { marginTop: 6, fontSize: 9, fontWeight: '900' },
  settled: { color: '#027A48' },
  pending: { color: '#B54708' },
});
