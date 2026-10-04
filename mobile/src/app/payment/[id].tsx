import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  fetchPassengerBooking,
  initializePassengerPayment,
  PassengerBookingDetail,
  verifyPassengerPayment,
} from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#1877F2';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const bookingId = typeof params.id === 'string' ? params.id : '';

  const { loading: authLoading, session, refresh } = usePassengerAuth();
  const [booking, setBooking] = useState<PassengerBookingDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(session && bookingId));
  const [initializing, setInitializing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !bookingId) return;

    let active = true;

    fetchPassengerBooking(session, bookingId)
      .then((response) => {
        if (active) setBooking(response.booking);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : 'Unable to load payment details'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [bookingId, session]);

  const latestPendingReference = useMemo(
    () =>
      booking?.payments.find((payment) => payment.status === 'Pending')
        ?.reference ?? null,
    [booking]
  );

  async function reloadBooking() {
    if (!session || !bookingId) return;

    const response = await fetchPassengerBooking(session, bookingId);
    setBooking(response.booking);
  }

  async function checkPayment(paymentReference?: string | null) {
    if (!session) return;

    const ref = paymentReference || reference || latestPendingReference;

    if (!ref) {
      setError('Start checkout first so Vaya has a payment reference to verify.');
      return;
    }

    setVerifying(true);
    setError(null);
    setMessage(null);

    try {
      const response = await verifyPassengerPayment(session, ref);
      setReference(ref);

      if (response.payment.status === 'Settled') {
        await Promise.all([reloadBooking(), refresh()]);
        setMessage('Payment confirmed. Your booking is now confirmed.');
      } else {
        setMessage(
          `Paystack reports this payment as ${response.payment.status}. You can check again after completing checkout.`
        );
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to verify payment status'
      );
    } finally {
      setVerifying(false);
    }
  }

  async function startCheckout() {
    if (!session || !bookingId || initializing) return;

    setInitializing(true);
    setError(null);
    setMessage(null);

    try {
      const response = await initializePassengerPayment(session, bookingId);
      const payment = response.payment;
      setReference(payment.reference);

      await WebBrowser.openBrowserAsync(payment.authorizationUrl);
      await checkPayment(payment.reference);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to start checkout'
      );
    } finally {
      setInitializing(false);
    }
  }

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator color={BLUE} />
          <Text style={styles.stateTitle}>Loading payment</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Sign in to pay</Text>
          <Text style={styles.stateText}>
            Vaya needs your passenger session to verify that this booking belongs to you.
          </Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/auth',
                params: { next: `/payment/${encodeURIComponent(bookingId)}` },
              })
            }
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Payment unavailable</Text>
          <Text style={styles.stateText}>
            {error || 'This booking could not be loaded.'}
          </Text>
          <Pressable
            onPress={() => router.replace('/trips')}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Back to trips</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const paid = booking.paymentStatus === 'Paid';

  if (paid) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successPage}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Payment confirmed</Text>
          <Text style={styles.successCopy}>
            Your booking is paid and confirmed in Vaya.
          </Text>

          <View style={styles.summary}>
            <Row label="Booking" value={booking.id} />
            <Row label="Trip" value={booking.trip.route} />
            <Row label="Amount" value={booking.amount} />
            <Row label="Payment" value={booking.paymentStatus} />
            <Row label="Status" value={booking.status} />
          </View>

          <Pressable
            onPress={() => router.replace('/trips')}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>View my trips</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>SECURE PAYMENT</Text>
            <Text style={styles.title}>{booking.id}</Text>
          </View>
        </View>

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount due</Text>
          <Text style={styles.amount}>{booking.amount}</Text>
          <Text style={styles.amountMeta}>{booking.trip.route}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Pay securely with Paystack</Text>
          <Text style={styles.infoText}>
            Checkout opens in Paystack’s hosted payment page. Card and supported South African payment methods are processed there; Vaya never receives your card details.
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Row label="Booking status" value={booking.status} />
          <Row label="Payment status" value={booking.paymentStatus} />
          <Row
            label="Latest attempt"
            value={
              reference ||
              latestPendingReference ||
              booking.payments[0]?.status ||
              'Not started'
            }
          />
        </View>

        {message ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Payment issue</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          disabled={initializing}
          onPress={() => void startCheckout()}
          style={({ pressed }) => [
            styles.primary,
            initializing && styles.primaryDisabled,
            pressed && !initializing && styles.pressed,
          ]}>
          {initializing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>Pay {booking.amount}</Text>
          )}
        </Pressable>

        {(reference || latestPendingReference) ? (
          <Pressable
            disabled={verifying}
            onPress={() => void checkPayment()}
            style={({ pressed }) => [
              styles.secondary,
              verifying && styles.secondaryDisabled,
              pressed && !verifying && styles.pressed,
            ]}>
            {verifying ? (
              <ActivityIndicator color={BLUE} />
            ) : (
              <Text style={styles.secondaryText}>Check payment status</Text>
            )}
          </Pressable>
        ) : null}

        <Text style={styles.footerNote}>
          Vaya marks a booking paid only after the server verifies the Paystack transaction reference and amount.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 40 },
  pressed: { opacity: 0.72 },
  centerState: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: { color: TEXT, fontSize: 18, fontWeight: '900', marginTop: 12 },
  stateText: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 310,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: TEXT, fontSize: 30, lineHeight: 30, marginTop: -3 },
  eyebrow: { color: BLUE, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: TEXT, fontSize: 18, fontWeight: '900', marginTop: 3 },
  amountCard: {
    marginTop: 22,
    borderRadius: 20,
    backgroundColor: '#0B1730',
    padding: 18,
  },
  amountLabel: { color: '#8FA0B8', fontSize: 9, fontWeight: '800' },
  amount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: 5,
  },
  amountMeta: { color: '#A9B6CA', fontSize: 10, marginTop: 5 },
  infoCard: {
    marginTop: 16,
    backgroundColor: '#EEF5FF',
    borderRadius: 15,
    padding: 14,
  },
  infoTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  infoText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
  statusCard: {
    marginTop: 16,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 16,
    paddingHorizontal: 15,
  },
  row: {
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    gap: 12,
  },
  rowLabel: { color: MUTED, fontSize: 10, fontWeight: '700' },
  rowValue: {
    color: TEXT,
    fontSize: 11,
    fontWeight: '900',
    maxWidth: '62%',
    textAlign: 'right',
  },
  messageCard: {
    marginTop: 14,
    borderRadius: 13,
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#ABEFC6',
    padding: 13,
  },
  messageText: { color: '#027A48', fontSize: 10, lineHeight: 16 },
  errorCard: {
    marginTop: 14,
    borderRadius: 13,
    backgroundColor: '#FFF8F7',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 13,
  },
  errorTitle: { color: '#B42318', fontSize: 11, fontWeight: '900' },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16, marginTop: 4 },
  primary: {
    marginTop: 18,
    height: 50,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: { backgroundColor: '#B7D5FA' },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  secondary: {
    marginTop: 10,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryDisabled: { opacity: 0.5 },
  secondaryText: { color: BLUE, fontSize: 12, fontWeight: '900' },
  footerNote: {
    color: MUTED,
    fontSize: 9,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 12,
  },
  successPage: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ECFDF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconText: { color: '#12B76A', fontSize: 28, fontWeight: '900' },
  successTitle: {
    color: TEXT,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 18,
    letterSpacing: -0.4,
  },
  successCopy: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 320,
  },
  summary: {
    width: '100%',
    marginTop: 24,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 16,
    paddingHorizontal: 15,
  },
});
