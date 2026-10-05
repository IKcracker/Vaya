import DateTimePicker from '@expo/ui/community/datetime-picker';
import { useRouter } from 'expo-router';
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
  MobileDriverVehicle,
  publishDriverTrip,
} from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#1877F2';
const NAVY = '#0B1730';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

type PickerMode = 'date' | 'time' | null;

function initialDeparture() {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  value.setHours(8, 0, 0, 0);
  return value;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

function formatDateLong(value: Date) {
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

export default function PublishDriverTripScreen() {
  const router = useRouter();
  const { loading, session } = usePassengerAuth();

  const [vehicles, setVehicles] = useState<MobileDriverVehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departureAt, setDepartureAt] = useState(initialDeparture);
  const [draftDeparture, setDraftDeparture] = useState(departureAt);
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [seats, setSeats] = useState(3);
  const [fare, setFare] = useState('');
  const [now] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    fetchMobileDriver(session)
      .then((response) => {
        const approved = (response.driver?.vehicles ?? []).filter(
          (vehicle) => vehicle.status === 'Approved'
        );
        setVehicles(approved);
        const preferred =
          approved.find((vehicle) => vehicle.isPrimary) ?? approved[0];
        if (preferred) setVehicleId(preferred.id);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Unable to load your vehicles');
      });
  }, [session]);

  const fareAmount = Number(fare);
  const routeReady =
    from.trim().length >= 2 &&
    to.trim().length >= 2 &&
    from.trim().toLowerCase() !== to.trim().toLowerCase();

  const valid =
    Boolean(vehicleId) &&
    routeReady &&
    departureAt.getTime() > now &&
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

  async function submit() {
    if (!session || !valid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await publishDriverTrip(session, {
        vehicleId,
        from: from.trim(),
        to: to.trim(),
        departureAt: departureAt.toISOString(),
        seats,
        fare: fareAmount,
      });

      router.replace({
        pathname: '/explore',
        params: { refresh: 'published' },
      });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to publish trip'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={BLUE} />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.stateTitle}>Sign in to publish trips</Text>
          <Pressable
            onPress={() =>
              router.replace({
                pathname: '/auth',
                params: { next: '/driver-publish' },
              })
            }
            style={({ pressed }) => [
              styles.primary,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.primaryText}>Sign in</Text>
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
            style={({ pressed }) => [
              styles.back,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>DRIVER MODE</Text>
            <Text style={styles.title}>Publish a trip</Text>
            <Text style={styles.subtitle}>
              Add the journey you are already making.
            </Text>
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
                returnKeyType="next"
                style={styles.routeInput}
                placeholder="Johannesburg"
                placeholderTextColor="#98A2B3"
              />
            </View>

            <View style={styles.routeDivider} />

            <View style={styles.routeInputBlock}>
              <Text style={styles.label}>Going to</Text>
              <TextInput
                value={to}
                onChangeText={setTo}
                autoCapitalize="words"
                returnKeyType="done"
                style={styles.routeInput}
                placeholder="Durban"
                placeholderTextColor="#98A2B3"
              />
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>VEHICLE</Text>
        {vehicles.length ? (
          <View style={styles.vehicleList}>
            {vehicles.map((vehicle) => {
              const active = vehicle.id === vehicleId;
              return (
                <Pressable
                  key={vehicle.id}
                  onPress={() => setVehicleId(vehicle.id)}
                  style={({ pressed }) => [
                    styles.vehicleOption,
                    active && styles.vehicleOptionActive,
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.vehicleRadio, active && styles.vehicleRadioActive]}>
                    {active ? <View style={styles.vehicleRadioDot} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.vehicleName, active && styles.vehicleNameActive]}>
                      {vehicle.make} {vehicle.model}
                    </Text>
                    <Text style={styles.vehicleMeta}>
                      {vehicle.year} · {vehicle.color} · {vehicle.registration}
                    </Text>
                  </View>
                  {vehicle.isPrimary ? (
                    <View style={styles.primaryVehicleBadge}>
                      <Text style={styles.primaryVehicleText}>Primary</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.noVehicle}>
            <Text style={styles.noVehicleTitle}>No approved vehicle available</Text>
            <Text style={styles.noVehicleText}>
              Every vehicle needs its own registration and roadworthy approval before it can be used for a trip.
            </Text>
            <Pressable onPress={() => router.push('/driver-vehicle')} style={styles.manageVehicleButton}>
              <Text style={styles.manageVehicleText}>Manage vehicles</Text>
            </Pressable>
          </View>
        )}

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
              <Text style={styles.cardValue}>
                {formatDateLong(departureAt)}
              </Text>
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
              <Text style={styles.cardValue}>
                {formatTime(departureAt)}
              </Text>
            </View>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>SEATS & FARE</Text>
        <View style={styles.commercialCard}>
          <View style={styles.commercialTop}>
            <View>
              <Text style={styles.cardLabel}>Available seats</Text>
              <Text style={styles.cardHint}>Maximum 8 passengers</Text>
            </View>

            <View style={styles.stepper}>
              <Pressable
                disabled={seats <= 1}
                onPress={() =>
                  setSeats((value) => Math.max(1, value - 1))
                }
                style={({ pressed }) => [
                  styles.stepButton,
                  seats <= 1 && styles.stepDisabled,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.stepText}>−</Text>
              </Pressable>

              <Text style={styles.stepValue}>{seats}</Text>

              <Pressable
                disabled={seats >= 8}
                onPress={() =>
                  setSeats((value) => Math.min(8, value + 1))
                }
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
              <Text style={styles.cardHint}>What each passenger pays</Text>
            </View>

            <View style={styles.moneyField}>
              <Text style={styles.currency}>R</Text>
              <TextInput
                value={fare}
                onChangeText={(value) =>
                  setFare(
                    value.replace(/[^0-9.]/g, '').slice(0, 7)
                  )
                }
                keyboardType="decimal-pad"
                style={styles.moneyInput}
                placeholder="280"
                placeholderTextColor="#98A2B3"
              />
            </View>
          </View>
        </View>

        <View style={styles.quickFares}>
          {[180, 220, 280, 320].map((amount) => (
            <Pressable
              key={amount}
              onPress={() => setFare(String(amount))}
              style={({ pressed }) => [
                styles.quickFare,
                fare === String(amount) && styles.quickFareActive,
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  styles.quickFareText,
                  fare === String(amount) && styles.quickFareTextActive,
                ]}>
                R{amount}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>TRIP SUMMARY</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryRoute}>
                {routeReady
                  ? `${from.trim()} → ${to.trim()}`
                  : 'Your route'}
              </Text>
              <Text style={styles.summarySchedule}>
                {formatDate(departureAt)} · {formatTime(departureAt)}
              </Text>
            </View>

            <View style={styles.fareBadge}>
              <Text style={styles.fareBadgeValue}>
                {fareAmount > 0 ? `R${fareAmount}` : 'R—'}
              </Text>
              <Text style={styles.fareBadgeLabel}>per seat</Text>
            </View>
          </View>

          <View style={styles.summaryBottom}>
            <Text style={styles.summaryMeta}>
              {seats} seat{seats === 1 ? '' : 's'} available
            </Text>
            <Text style={styles.summaryMeta}>Scheduled</Text>
          </View>
        </View>

        {departureAt.getTime() <= now ? (
          <View style={styles.warning}>
            <Text style={styles.warningText}>
              Choose a future departure time.
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          disabled={!valid || submitting}
          onPress={() => void submit()}
          style={({ pressed }) => [
            styles.publishButton,
            (!valid || submitting) && styles.publishButtonDisabled,
            pressed && valid && !submitting && styles.publishPressed,
          ]}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.publishButtonText}>Publish trip</Text>
              <Text style={styles.publishButtonArrow}>→</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.footerText}>
          Your trip becomes visible to passengers as soon as it is published.
        </Text>
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
            if (pickerMode === 'date') {
              const next = new Date(departureAt);
              next.setFullYear(
                selectedValue.getFullYear(),
                selectedValue.getMonth(),
                selectedValue.getDate()
              );
              setDepartureAt(next);
            } else {
              const next = new Date(departureAt);
              next.setHours(
                selectedValue.getHours(),
                selectedValue.getMinutes(),
                0,
                0
              );
              setDepartureAt(next);
            }
            setPickerMode(null);
          }}
          onDismiss={() => setPickerMode(null)}
          mode={pickerMode}
          presentation="dialog"
          minimumDate={
            pickerMode === 'date' ? new Date(now) : undefined
          }
          is24Hour
          accentColor={BLUE}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  page: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 36,
  },
  pressed: {
    opacity: 0.72,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  stateTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '900',
  },
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
  backText: {
    color: TEXT,
    fontSize: 30,
    lineHeight: 30,
    marginTop: -3,
  },
  eyebrow: {
    color: BLUE,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.15,
  },
  title: {
    color: TEXT,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  subtitle: {
    color: MUTED,
    fontSize: 10,
    marginTop: 3,
  },
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
  routeFields: {
    flex: 1,
  },
  routeInputBlock: {
    minHeight: 58,
    justifyContent: 'center',
    paddingLeft: 8,
  },
  routeDivider: {
    height: 1,
    backgroundColor: LINE,
  },
  label: {
    color: MUTED,
    fontSize: 8,
    fontWeight: '800',
  },
  routeInput: {
    height: 30,
    color: TEXT,
    fontSize: 14,
    fontWeight: '900',
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginTop: 2,
  },
  vehicleList: { gap: 8, marginBottom: 4 },
  vehicleOption: { minHeight: 62, borderRadius: 14, borderWidth: 1, borderColor: LINE, backgroundColor: SURFACE, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  vehicleOptionActive: { borderColor: '#84ADFF', backgroundColor: '#F5F9FF' },
  vehicleRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#98A2B3', alignItems: 'center', justifyContent: 'center' },
  vehicleRadioActive: { borderColor: BLUE },
  vehicleRadioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: BLUE },
  vehicleName: { color: TEXT, fontSize: 11, fontWeight: '900' },
  vehicleNameActive: { color: '#175CD3' },
  vehicleMeta: { color: MUTED, fontSize: 9, marginTop: 3 },
  primaryVehicleBadge: { borderRadius: 999, backgroundColor: '#E7F3FF', paddingHorizontal: 7, paddingVertical: 5 },
  primaryVehicleText: { color: BLUE, fontSize: 7, fontWeight: '900' },
  noVehicle: { borderRadius: 15, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFF8F7', padding: 14, marginBottom: 4 },
  noVehicleTitle: { color: '#B42318', fontSize: 11, fontWeight: '900' },
  noVehicleText: { color: '#B42318', fontSize: 9, lineHeight: 15, marginTop: 4 },
  manageVehicleButton: { marginTop: 10, alignSelf: 'flex-start', borderRadius: 9, backgroundColor: '#B42318', paddingHorizontal: 11, paddingVertical: 8 },
  manageVehicleText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  sectionLabel: {
    color: MUTED,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 22,
    marginBottom: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: 10,
  },
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
  scheduleIcon: {
    color: BLUE,
    fontSize: 17,
    fontWeight: '900',
  },
  cardLabel: {
    color: MUTED,
    fontSize: 8,
    fontWeight: '800',
  },
  cardValue: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },
  cardHint: {
    color: MUTED,
    fontSize: 9,
    marginTop: 3,
  },
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
    justifyContent: 'space-between',
    gap: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: LINE,
  },
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
  stepDisabled: {
    opacity: 0.3,
  },
  stepText: {
    color: TEXT,
    fontSize: 19,
    fontWeight: '800',
  },
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
  currency: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '900',
  },
  moneyInput: {
    width: 62,
    height: 40,
    color: TEXT,
    fontSize: 13,
    fontWeight: '900',
    paddingHorizontal: 6,
  },
  quickFares: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 8,
  },
  quickFare: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 35,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 10,
    backgroundColor: SURFACE,
  },
  quickFareActive: {
    borderColor: '#9DC5FA',
    backgroundColor: '#E7F3FF',
  },
  quickFareText: {
    color: MUTED,
    fontSize: 9,
    fontWeight: '900',
  },
  quickFareTextActive: {
    color: BLUE,
  },
  summaryCard: {
    backgroundColor: NAVY,
    borderRadius: 18,
    padding: 15,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  summaryRoute: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  summarySchedule: {
    color: '#A9B6CA',
    fontSize: 9,
    marginTop: 5,
  },
  fareBadge: {
    alignItems: 'flex-end',
  },
  fareBadgeValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  fareBadgeLabel: {
    color: '#8FA0B8',
    fontSize: 8,
    marginTop: 2,
  },
  summaryBottom: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#263955',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryMeta: {
    color: '#A9B6CA',
    fontSize: 9,
    fontWeight: '700',
  },
  warning: {
    marginTop: 12,
    backgroundColor: '#FFFAEB',
    borderWidth: 1,
    borderColor: '#FEDF89',
    borderRadius: 12,
    padding: 11,
  },
  warningText: {
    color: '#B54708',
    fontSize: 10,
    fontWeight: '800',
  },
  error: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF8F7',
    borderRadius: 12,
    padding: 11,
  },
  errorText: {
    color: '#B42318',
    fontSize: 10,
    lineHeight: 16,
  },
  primary: {
    marginTop: 18,
    height: 50,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  publishButton: {
    marginTop: 18,
    height: 52,
    borderRadius: 13,
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  publishButtonDisabled: {
    backgroundColor: '#B7D5FA',
  },
  publishPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.995 }],
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  publishButtonArrow: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  footerText: {
    color: MUTED,
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 18,
  },
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
  sheetTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 3,
  },
  doneButton: {
    minWidth: 68,
    height: 38,
    borderRadius: 10,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  nativePickerWrap: {
    marginTop: 14,
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  nativePicker: {
    width: '100%',
    minHeight: 240,
  },
});
