import DateTimePicker from '@expo/ui/community/datetime-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  fetchMobileDriver,
  MobileDriverTrip,
  updateDriverTripDetails,
} from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#10B981';
const NAVY = '#063C35';
const BG = '#F6F8F7';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

type PickerMode = 'date' | 'time' | null;

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-ZA', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(value);
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value);
}

export default function EditDriverTripScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const { loading: authLoading, session } = usePassengerAuth();

  const [trip, setTrip] = useState<MobileDriverTrip | null>(null);
  const [loading, setLoading] = useState(Boolean(session && id));
  const [saving, setSaving] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departureAt, setDepartureAt] = useState(new Date());
  const [draftDeparture, setDraftDeparture] = useState(new Date());
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [seats, setSeats] = useState(1);
  const [fare, setFare] = useState('');
  const [now] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(
    id ? null : 'Trip reference is missing.'
  );

  useEffect(() => {
    if (!session || !id) return;

    let active = true;

    fetchMobileDriver(session)
      .then((response) => {
        if (!active) return;

        const found = response.trips.find((item) => item.id === id) ?? null;

        if (!found) {
          setError('This trip was not found in your driver account.');
          return;
        }

        const departure = new Date(found.departureAt);

        setTrip(found);
        setFrom(found.from);
        setTo(found.to);
        setDepartureAt(departure);
        setDraftDeparture(departure);
        setSeats(found.seatCapacity);
        setFare(String(found.fareCents / 100));
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : 'Unable to load trip'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, session]);

  const fareAmount = Number(fare);
  const editable =
    trip !== null &&
    trip.status !== 'Boarding' &&
    trip.status !== 'Completed' &&
    trip.status !== 'Cancelled';

  const valid =
    editable &&
    from.trim().length >= 2 &&
    to.trim().length >= 2 &&
    from.trim().toLowerCase() !== to.trim().toLowerCase() &&
    departureAt.getTime() > now &&
    seats >= (trip?.seatsBooked ?? 0) &&
    seats >= 1 &&
    seats <= 8 &&
    Number.isFinite(fareAmount) &&
    fareAmount > 0 &&
    fareAmount <= 10000;

  function openPicker(mode: Exclude<PickerMode, null>) {
    setDraftDeparture(new Date(departureAt));
    setPickerMode(mode);
  }

  function updateDraftDate(selectedDate: Date) {
    const next = new Date(draftDeparture);
    next.setFullYear(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );
    setDraftDeparture(next);
  }

  function updateDraftTime(selectedTime: Date) {
    const next = new Date(draftDeparture);
    next.setHours(
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      0,
      0
    );
    setDraftDeparture(next);
  }

  function confirmIosPicker() {
    setDepartureAt(new Date(draftDeparture));
    setPickerMode(null);
  }

  async function save() {
    if (!session || !trip || !valid || saving) return;

    setSaving(true);
    setError(null);

    try {
      await updateDriverTripDetails(session, trip.id, {
        from: from.trim(),
        to: to.trim(),
        departureAt: departureAt.toISOString(),
        seats,
        fare: fareAmount,
      });

      router.replace({
        pathname: '/driver-trip/[id]',
        params: {
          id: trip.id,
          refresh: 'updated',
        },
      });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to update trip'
      );
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={BLUE} />
          <Text style={styles.stateTitle}>Loading trip</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.stateTitle}>Sign in to edit this trip</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Trip unavailable</Text>
          <Text style={styles.stateText}>{error || 'Trip not found.'}</Text>
          <Pressable
            onPress={() => router.replace('/explore')}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.secondaryButtonText}>Back to Driver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!editable) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <View style={styles.lockIcon}>
            <Text style={styles.lockIconText}>!</Text>
          </View>
          <Text style={styles.stateTitle}>Trip details are locked</Text>
          <Text style={styles.stateText}>
            Boarding, completed and cancelled trips can no longer have their
            route, departure, fare or capacity changed.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.secondaryButtonText}>Back to trip</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>EDIT DRIVER TRIP</Text>
            <Text style={styles.title}>{trip.id}</Text>
            <Text style={styles.subtitle}>Update the trip before boarding begins.</Text>
          </View>
        </View>

        <View style={styles.routeCard}>
          <View style={styles.routeRail}>
            <View style={styles.originDot} />
            <View style={styles.routeLine} />
            <View style={styles.destinationDot} />
          </View>

          <View style={styles.routeFields}>
            <View style={styles.routeInputBlock}>
              <Text style={styles.label}>Leaving from</Text>
              <TextInput
                value={from}
                onChangeText={setFrom}
                autoCapitalize="words"
                style={styles.routeInput}
              />
            </View>

            <View style={styles.routeDivider} />

            <View style={styles.routeInputBlock}>
              <Text style={styles.label}>Going to</Text>
              <TextInput
                value={to}
                onChangeText={setTo}
                autoCapitalize="words"
                style={styles.routeInput}
              />
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>WHEN</Text>
        <View style={styles.scheduleRow}>
          <Pressable
            onPress={() => openPicker('date')}
            style={({ pressed }) => [
              styles.scheduleCard,
              pressed && styles.schedulePressed,
            ]}>
            <Text style={styles.scheduleIcon}>◷</Text>
            <View>
              <Text style={styles.cardLabel}>Date</Text>
              <Text style={styles.cardValue}>{formatDate(departureAt)}</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => openPicker('time')}
            style={({ pressed }) => [
              styles.scheduleCard,
              pressed && styles.schedulePressed,
            ]}>
            <Text style={styles.scheduleIcon}>◴</Text>
            <View>
              <Text style={styles.cardLabel}>Time</Text>
              <Text style={styles.cardValue}>{formatTime(departureAt)}</Text>
            </View>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>SEATS & FARE</Text>
        <View style={styles.commercialCard}>
          <View style={styles.commercialTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Seat capacity</Text>
              <Text style={styles.cardHint}>
                {trip.seatsBooked} seat{trip.seatsBooked === 1 ? '' : 's'} already booked
              </Text>
            </View>

            <View style={styles.stepper}>
              <Pressable
                disabled={seats <= Math.max(1, trip.seatsBooked)}
                onPress={() =>
                  setSeats((value) =>
                    Math.max(Math.max(1, trip.seatsBooked), value - 1)
                  )
                }
                style={({ pressed }) => [
                  styles.stepButton,
                  seats <= Math.max(1, trip.seatsBooked) && styles.stepDisabled,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.stepText}>−</Text>
              </Pressable>

              <Text style={styles.stepValue}>{seats}</Text>

              <Pressable
                disabled={seats >= 8}
                onPress={() => setSeats((value) => Math.min(8, value + 1))}
                style={({ pressed }) => [
                  styles.stepButton,
                  seats >= 8 && styles.stepDisabled,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.stepText}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.fareRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Fare per seat</Text>
              <Text style={styles.cardHint}>Applies to future bookings</Text>
            </View>

            <View style={styles.moneyField}>
              <Text style={styles.currency}>R</Text>
              <TextInput
                value={fare}
                onChangeText={(value) =>
                  setFare(value.replace(/[^0-9.]/g, '').slice(0, 7))
                }
                keyboardType="decimal-pad"
                style={styles.moneyInput}
              />
            </View>
          </View>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Existing bookings stay linked</Text>
          <Text style={styles.noticeText}>
            Changing the route or departure updates the shared trip for current
            passengers. Existing paid booking amounts are not recalculated.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>UPDATED TRIP</Text>
            <Text style={styles.summaryRoute}>
              {from.trim()} → {to.trim()}
            </Text>
            <Text style={styles.summaryMeta}>
              {formatDate(departureAt)} · {formatTime(departureAt)} · {seats} seats
            </Text>
          </View>
          <View style={styles.summaryFare}>
            <Text style={styles.summaryFareValue}>
              {fareAmount > 0 ? `R${fareAmount}` : 'R—'}
            </Text>
            <Text style={styles.summaryFareLabel}>per seat</Text>
          </View>
        </View>

        {departureAt.getTime() <= now ? (
          <View style={styles.warning}>
            <Text style={styles.warningText}>
              Departure must remain in the future.
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          disabled={!valid || saving}
          onPress={() => void save()}
          style={({ pressed }) => [
            styles.saveButton,
            (!valid || saving) && styles.saveButtonDisabled,
            pressed && valid && !saving && styles.savePressed,
          ]}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save trip changes</Text>
          )}
        </Pressable>
      </ScrollView>

      {Platform.OS === 'ios' && pickerMode ? (
        <Modal
          transparent
          animationType="slide"
          presentationStyle="overFullScreen"
          onRequestClose={() => setPickerMode(null)}>
          <View style={styles.modalBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setPickerMode(null)}
            />

            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetEyebrow}>
                    {pickerMode === 'date' ? 'DEPARTURE DATE' : 'DEPARTURE TIME'}
                  </Text>
                  <Text style={styles.sheetTitle}>
                    {pickerMode === 'date'
                      ? formatDate(draftDeparture)
                      : formatTime(draftDeparture)}
                  </Text>
                </View>

                <Pressable
                  onPress={confirmIosPicker}
                  style={({ pressed }) => [
                    styles.doneButton,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
              </View>

              <View style={styles.nativePickerWrap}>
                <DateTimePicker
                  value={draftDeparture}
                  onValueChange={(_, selectedValue) => {
                    if (pickerMode === 'date') {
                      updateDraftDate(selectedValue);
                    } else {
                      updateDraftTime(selectedValue);
                    }
                  }}
                  mode={pickerMode}
                  display={pickerMode === 'date' ? 'inline' : 'spinner'}
                  minimumDate={
                    pickerMode === 'date' ? new Date(now) : undefined
                  }
                  is24Hour
                  accentColor={BLUE}
                  themeVariant="light"
                  locale="en_ZA"
                  timeZoneName="Africa/Johannesburg"
                  style={styles.nativePicker}
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}

      {Platform.OS === 'android' && pickerMode ? (
        <DateTimePicker
          value={departureAt}
          onValueChange={(_, selectedValue) => {
            const next = new Date(departureAt);

            if (pickerMode === 'date') {
              next.setFullYear(
                selectedValue.getFullYear(),
                selectedValue.getMonth(),
                selectedValue.getDate()
              );
            } else {
              next.setHours(
                selectedValue.getHours(),
                selectedValue.getMinutes(),
                0,
                0
              );
            }

            setDepartureAt(next);
            setPickerMode(null);
          }}
          onDismiss={() => setPickerMode(null)}
          mode={pickerMode}
          presentation="dialog"
          minimumDate={pickerMode === 'date' ? new Date(now) : undefined}
          is24Hour
          accentColor={BLUE}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 36 },
  pressed: { opacity: 0.72 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  stateTitle: { color: TEXT, fontSize: 18, fontWeight: '900', marginTop: 12 },
  stateText: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 320,
  },
  errorTitle: { color: '#B42318', fontSize: 18, fontWeight: '900' },
  lockIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF1F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIconText: { color: '#B42318', fontSize: 20, fontWeight: '900' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: TEXT, fontSize: 30, lineHeight: 30, marginTop: -3 },
  eyebrow: { color: BLUE, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: TEXT, fontSize: 21, fontWeight: '900', marginTop: 2 },
  subtitle: { color: MUTED, fontSize: 10, marginTop: 3 },
  routeCard: {
    flexDirection: 'row',
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 18,
    padding: 14,
  },
  routeRail: {
    width: 24,
    alignItems: 'center',
    paddingTop: 19,
    paddingBottom: 19,
  },
  originDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#98A2B3',
  },
  routeLine: {
    width: 1,
    flex: 1,
    backgroundColor: '#D9DEE7',
    marginVertical: 4,
  },
  destinationDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: BLUE,
  },
  routeFields: { flex: 1 },
  routeInputBlock: {
    minHeight: 58,
    justifyContent: 'center',
    paddingLeft: 8,
  },
  routeDivider: { height: 1, backgroundColor: LINE },
  label: { color: MUTED, fontSize: 8, fontWeight: '800' },
  routeInput: {
    height: 30,
    color: TEXT,
    fontSize: 14,
    fontWeight: '900',
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginTop: 2,
  },
  sectionLabel: {
    color: MUTED,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 22,
    marginBottom: 8,
  },
  scheduleRow: { flexDirection: 'row', gap: 10 },
  scheduleCard: {
    flex: 1,
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 15,
    paddingHorizontal: 13,
  },
  schedulePressed: {
    borderColor: '#9DC5FA',
    backgroundColor: '#F8FBFF',
  },
  scheduleIcon: { color: BLUE, fontSize: 17, fontWeight: '900' },
  cardLabel: { color: MUTED, fontSize: 8, fontWeight: '800' },
  cardValue: { color: TEXT, fontSize: 12, fontWeight: '900', marginTop: 4 },
  cardHint: { color: MUTED, fontSize: 9, marginTop: 3 },
  commercialCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 17,
    paddingHorizontal: 15,
  },
  commercialTop: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardDivider: { height: 1, backgroundColor: LINE },
  fareRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  stepButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDisabled: { opacity: 0.3 },
  stepText: { color: TEXT, fontSize: 19, fontWeight: '800' },
  stepValue: {
    minWidth: 34,
    textAlign: 'center',
    color: TEXT,
    fontSize: 12,
    fontWeight: '900',
  },
  moneyField: {
    minWidth: 98,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 11,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
  },
  currency: { color: TEXT, fontSize: 12, fontWeight: '900' },
  moneyInput: {
    width: 62,
    height: 40,
    color: TEXT,
    fontSize: 13,
    fontWeight: '900',
    paddingHorizontal: 6,
  },
  notice: {
    marginTop: 16,
    backgroundColor: '#E9F9F3',
    borderRadius: 14,
    padding: 13,
  },
  noticeTitle: { color: TEXT, fontSize: 10, fontWeight: '900' },
  noticeText: { color: MUTED, fontSize: 9, lineHeight: 15, marginTop: 4 },
  summaryCard: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: NAVY,
    borderRadius: 17,
    padding: 15,
  },
  summaryLabel: {
    color: '#72AFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  summaryRoute: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 5,
  },
  summaryMeta: { color: '#A9B6CA', fontSize: 9, marginTop: 5 },
  summaryFare: { alignItems: 'flex-end' },
  summaryFareValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  summaryFareLabel: { color: '#8FA0B8', fontSize: 8, marginTop: 2 },
  warning: {
    marginTop: 12,
    backgroundColor: '#FFFAEB',
    borderWidth: 1,
    borderColor: '#FEDF89',
    borderRadius: 12,
    padding: 11,
  },
  warningText: { color: '#B54708', fontSize: 10, fontWeight: '800' },
  error: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF8F7',
    borderRadius: 12,
    padding: 11,
  },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16 },
  saveButton: {
    marginTop: 18,
    height: 52,
    borderRadius: 13,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: { backgroundColor: '#B7D5FA' },
  savePressed: { opacity: 0.86, transform: [{ scale: 0.995 }] },
  saveButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  secondaryButton: {
    marginTop: 18,
    minWidth: 180,
    height: 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SURFACE,
  },
  secondaryButtonText: { color: BLUE, fontSize: 11, fontWeight: '900' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(8, 15, 30, 0.38)',
  },
  sheet: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 26,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D5DD',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sheetEyebrow: {
    color: BLUE,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sheetTitle: { color: TEXT, fontSize: 20, fontWeight: '900', marginTop: 3 },
  doneButton: {
    minWidth: 68,
    height: 38,
    borderRadius: 10,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  nativePickerWrap: {
    marginTop: 14,
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  nativePicker: { width: '100%', minHeight: 240 },
});
