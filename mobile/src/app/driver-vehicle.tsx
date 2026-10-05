import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createDriverVehicle,
  fetchMobileDriver,
  MobileDriver,
  MobileDriverVehicle,
  removeDriverVehicle,
  setPrimaryDriverVehicle,
  updateDriverVehicleById,
} from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#1877F2';
const NAVY = '#0B1730';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

function statusTone(status: string) {
  if (status === 'Approved') return { bg: '#ECFDF3', text: '#027A48' };
  if (status === 'Rejected' || status === 'Suspended') {
    return { bg: '#FFF1F0', text: '#B42318' };
  }
  return { bg: '#FFFAEB', text: '#B54708' };
}

type VehicleDraft = {
  make: string;
  model: string;
  year: string;
  registration: string;
  color: string;
};

const EMPTY: VehicleDraft = {
  make: '',
  model: '',
  year: '',
  registration: '',
  color: '',
};

export default function DriverVehicleScreen() {
  const router = useRouter();
  const { session } = usePassengerAuth();
  const [driver, setDriver] = useState<MobileDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MobileDriverVehicle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<VehicleDraft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const vehicles = driver?.vehicles ?? [];
  const approvedCount = vehicles.filter((vehicle) => vehicle.status === 'Approved').length;

  const parsedYear = Number(draft.year);
  const valid =
    draft.make.trim().length >= 2 &&
    draft.model.trim().length >= 1 &&
    draft.registration.trim().length >= 2 &&
    draft.color.trim().length >= 2 &&
    Number.isInteger(parsedYear) &&
    parsedYear >= 1980 &&
    parsedYear <= 2100;

  const refresh = useCallback(async () => {
    if (!session) return;
    const response = await fetchMobileDriver(session);
    setDriver(response.driver);
  }, [session]);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    refresh()
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : 'Unable to load vehicles')
      )
      .finally(() => setLoading(false));
  }, [refresh, session]);

  function startAdd() {
    setEditing(null);
    setDraft(EMPTY);
    setShowForm(true);
    setError(null);
  }

  function startEdit(vehicle: MobileDriverVehicle) {
    setEditing(vehicle);
    setDraft({
      make: vehicle.make,
      model: vehicle.model,
      year: String(vehicle.year),
      registration: vehicle.registration,
      color: vehicle.color,
    });
    setShowForm(true);
    setError(null);
  }

  async function save() {
    if (!session || !valid || saving) return;
    setSaving(true);
    setError(null);

    const input = {
      vehicleMake: draft.make.trim(),
      vehicleModel: draft.model.trim(),
      vehicleYear: parsedYear,
      vehicleRegistration: draft.registration.trim().toUpperCase(),
      vehicleColor: draft.color.trim(),
    };

    try {
      if (editing) {
        await updateDriverVehicleById(session, editing.id, input);
      } else {
        await createDriverVehicle(session, input);
      }
      await refresh();
      setShowForm(false);
      setEditing(null);
      setDraft(EMPTY);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save vehicle');
    } finally {
      setSaving(false);
    }
  }

  async function makePrimary(vehicle: MobileDriverVehicle) {
    if (!session || actionId) return;
    setActionId(vehicle.id);
    setError(null);
    try {
      await setPrimaryDriverVehicle(session, vehicle.id);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to set primary vehicle');
    } finally {
      setActionId(null);
    }
  }

  function confirmRemove(vehicle: MobileDriverVehicle) {
    Alert.alert(
      'Remove vehicle?',
      `${vehicle.make} ${vehicle.model} · ${vehicle.registration} will be removed from your account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => void remove(vehicle),
        },
      ]
    );
  }

  async function remove(vehicle: MobileDriverVehicle) {
    if (!session || actionId) return;
    setActionId(vehicle.id);
    setError(null);
    try {
      await removeDriverVehicle(session, vehicle.id);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to remove vehicle');
    } finally {
      setActionId(null);
    }
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>Sign in required</Text>
          <Text style={styles.muted}>Sign in to manage your driver vehicles.</Text>
          <Pressable
            onPress={() => router.replace({ pathname: '/auth', params: { next: '/driver-vehicle' } })}
            style={styles.primary}>
            <Text style={styles.primaryText}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={BLUE} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>DRIVER VEHICLES</Text>
            <Text style={styles.title}>Your vehicles</Text>
            <Text style={styles.muted}>Add every car you may use on Vaya. Each vehicle is verified separately.</Text>
          </View>
        </View>

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>VEHICLES</Text>
            <Text style={styles.summaryValue}>{vehicles.length}</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>APPROVED</Text>
            <Text style={styles.summaryValue}>{approvedCount}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>TRIP RULE</Text>
            <Text style={styles.summaryText}>Only approved vehicles can publish trips.</Text>
          </View>
        </View>

        <Pressable
          onPress={startAdd}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <Text style={styles.addPlus}>＋</Text>
          <Text style={styles.addText}>Add another vehicle</Text>
        </Pressable>

        {showForm ? (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formTitle}>{editing ? 'Edit vehicle' : 'Add vehicle'}</Text>
                <Text style={styles.formMeta}>Registration and roadworthy documents will need approval.</Text>
              </View>
              <Pressable onPress={() => { setShowForm(false); setEditing(null); }} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <Field label="Make">
              <TextInput value={draft.make} onChangeText={(value) => setDraft((current) => ({ ...current, make: value }))} style={styles.input} placeholder="Toyota" placeholderTextColor="#98A2B3" />
            </Field>
            <Field label="Model">
              <TextInput value={draft.model} onChangeText={(value) => setDraft((current) => ({ ...current, model: value }))} style={styles.input} placeholder="Corolla" placeholderTextColor="#98A2B3" />
            </Field>
            <View style={styles.twoColumns}>
              <View style={{ flex: 1 }}>
                <Field label="Year">
                  <TextInput value={draft.year} onChangeText={(value) => setDraft((current) => ({ ...current, year: value.replace(/\D/g, '').slice(0, 4) }))} keyboardType="number-pad" style={styles.input} placeholder="2022" placeholderTextColor="#98A2B3" />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Colour">
                  <TextInput value={draft.color} onChangeText={(value) => setDraft((current) => ({ ...current, color: value }))} style={styles.input} placeholder="White" placeholderTextColor="#98A2B3" />
                </Field>
              </View>
            </View>
            <Field label="Registration number">
              <TextInput value={draft.registration} onChangeText={(value) => setDraft((current) => ({ ...current, registration: value }))} autoCapitalize="characters" style={styles.input} placeholder="AB 12 CD GP" placeholderTextColor="#98A2B3" />
            </Field>
            <Pressable disabled={!valid || saving} onPress={() => void save()} style={[styles.saveButton, (!valid || saving) && styles.disabled]}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>{editing ? 'Save and re-verify vehicle' : 'Add vehicle'}</Text>}
            </Pressable>
          </View>
        ) : null}

        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

        <View style={styles.list}>
          {vehicles.map((vehicle) => {
            const tone = statusTone(vehicle.status);
            const busy = actionId === vehicle.id;
            return (
              <View key={vehicle.id} style={styles.vehicleCard}>
                <View style={styles.vehicleTop}>
                  <View style={styles.carIcon}><Text style={styles.carIconText}>◆</Text></View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.vehicleNameRow}>
                      <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text>
                      {vehicle.isPrimary ? <View style={styles.primaryBadge}><Text style={styles.primaryBadgeText}>Primary</Text></View> : null}
                    </View>
                    <Text style={styles.vehicleMeta}>{vehicle.year} · {vehicle.color} · {vehicle.registration}</Text>
                  </View>
                  <View style={[styles.status, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.statusText, { color: tone.text }]}>{vehicle.status}</Text>
                  </View>
                </View>

                <View style={styles.checkRow}>
                  <Text style={styles.checkLabel}>Verification</Text>
                  <Text style={styles.checkValue}>{vehicle.checks}</Text>
                </View>

                <View style={styles.actions}>
                  <Pressable
                    onPress={() => router.push({ pathname: '/driver-verification', params: { vehicleId: vehicle.id } })}
                    style={({ pressed }) => [styles.verifyButton, pressed && styles.pressed]}>
                    <Text style={styles.verifyText}>{vehicle.status === 'Approved' ? 'View verification' : 'Verify vehicle'}</Text>
                  </Pressable>
                  <Pressable onPress={() => startEdit(vehicle)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                    <Text style={styles.secondaryText}>Edit</Text>
                  </Pressable>
                </View>

                <View style={styles.footerActions}>
                  {!vehicle.isPrimary ? (
                    <Pressable disabled={Boolean(actionId)} onPress={() => void makePrimary(vehicle)}>
                      <Text style={styles.linkText}>{busy ? 'Updating…' : 'Set as primary'}</Text>
                    </Pressable>
                  ) : <Text style={styles.primaryHint}>Default vehicle for your driver account</Text>}
                  <Pressable disabled={Boolean(actionId)} onPress={() => confirmRemove(vehicle)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>Trips keep their assigned vehicle</Text>
          <Text style={styles.infoText}>When you publish a trip you choose one approved vehicle. That exact car remains attached to the journey even if you later change your primary vehicle.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { padding: 18, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  back: { width: 40, height: 40, borderRadius: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  backText: { color: TEXT, fontSize: 30, lineHeight: 30, marginTop: -3 },
  eyebrow: { color: BLUE, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: TEXT, fontSize: 24, fontWeight: '900', marginTop: 3 },
  muted: { color: MUTED, fontSize: 11, lineHeight: 17, marginTop: 5 },
  primary: { marginTop: 16, height: 48, paddingHorizontal: 18, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  summary: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 20, backgroundColor: NAVY, borderRadius: 17, padding: 16 },
  summaryLabel: { color: '#8FA0B8', fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  summaryValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 4 },
  summaryText: { color: '#D7E1EE', fontSize: 9, lineHeight: 14, marginTop: 4 },
  addButton: { marginTop: 14, height: 50, borderRadius: 13, borderWidth: 1, borderColor: '#B2CCFF', backgroundColor: '#F5F9FF', flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center' },
  addPlus: { color: BLUE, fontSize: 19, fontWeight: '700' },
  addText: { color: BLUE, fontSize: 11, fontWeight: '900' },
  formCard: { marginTop: 14, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 16, padding: 15, gap: 13 },
  formHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  formTitle: { color: TEXT, fontSize: 15, fontWeight: '900' },
  formMeta: { color: MUTED, fontSize: 9, lineHeight: 14, marginTop: 3 },
  closeButton: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#F2F4F7', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#667085', fontSize: 20, lineHeight: 20 },
  twoColumns: { flexDirection: 'row', gap: 10 },
  field: { gap: 6 },
  label: { color: MUTED, fontSize: 9, fontWeight: '800' },
  input: { minHeight: 44, borderWidth: 1, borderColor: LINE, borderRadius: 10, backgroundColor: '#F9FAFB', color: TEXT, paddingHorizontal: 12, fontSize: 12, fontWeight: '700' },
  saveButton: { height: 46, borderRadius: 11, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  errorBox: { marginTop: 14, borderRadius: 12, backgroundColor: '#FFF1F0', padding: 12 },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16 },
  list: { marginTop: 18, gap: 12 },
  vehicleCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 17, padding: 15 },
  vehicleTop: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  carIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF5FF', alignItems: 'center', justifyContent: 'center' },
  carIconText: { color: BLUE, fontSize: 13 },
  vehicleNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  vehicleName: { color: TEXT, fontSize: 13, fontWeight: '900' },
  vehicleMeta: { color: MUTED, fontSize: 9, marginTop: 4 },
  primaryBadge: { backgroundColor: '#E7F3FF', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4 },
  primaryBadgeText: { color: BLUE, fontSize: 7, fontWeight: '900' },
  status: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { fontSize: 8, fontWeight: '900' },
  checkRow: { marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: LINE },
  checkLabel: { color: MUTED, fontSize: 8, fontWeight: '800' },
  checkValue: { color: TEXT, fontSize: 10, lineHeight: 15, marginTop: 3, fontWeight: '700' },
  actions: { marginTop: 13, flexDirection: 'row', gap: 8 },
  verifyButton: { flex: 1, height: 39, borderRadius: 10, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  verifyText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  secondaryButton: { width: 72, height: 39, borderRadius: 10, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: TEXT, fontSize: 9, fontWeight: '900' },
  footerActions: { marginTop: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkText: { color: BLUE, fontSize: 9, fontWeight: '800' },
  primaryHint: { color: '#027A48', fontSize: 8, fontWeight: '800' },
  removeText: { color: '#B42318', fontSize: 9, fontWeight: '800' },
  info: { marginTop: 18, backgroundColor: '#EEF5FF', borderRadius: 14, padding: 14 },
  infoTitle: { color: TEXT, fontSize: 10, fontWeight: '900' },
  infoText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
});
