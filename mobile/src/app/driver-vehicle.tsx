import { VehicleCard } from "@/components/vehicle-card";
import { RetryButton } from "@/components/retry-button";
import { Design } from "@/constants/design";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  createDriverVehicle,
  fetchMobileDriver,
  MobileDriver,
  MobileDriverVehicle,
  removeDriverVehicle,
  setPrimaryDriverVehicle,
  updateDriverVehicleById,
} from "@/lib/auth";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const BLUE = Design.color.primary;
const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

type VehicleDraft = {
  make: string;
  model: string;
  year: string;
  registration: string;
  color: string;
};

const EMPTY: VehicleDraft = {
  make: "",
  model: "",
  year: "",
  registration: "",
  color: "",
};

export default function DriverVehicleScreen() {
  const [retryVersion, setRetryVersion] = useState(0);
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
  const approvedCount = vehicles.filter(
    (vehicle) => vehicle.status === "Approved",
  ).length;

  const parsedYear = Number(draft.year);
  const valid =
    draft.make.trim().length >= 2 &&
    draft.model.trim().length >= 1 &&
    draft.registration.trim().length >= 2 &&
    draft.color.trim().length >= 2 &&
    Number.isInteger(parsedYear) &&
    parsedYear >= 1980 &&
    parsedYear <= 2100;

  async function refresh() {
    if (!session) return;
    const response = await fetchMobileDriver(session);
    setDriver(response.driver);
  }

  useFocusEffect(
    useCallback(
      () => {
        if (!session) return;

        setLoading(true);
        setError(null);
        let active = true;
        fetchMobileDriver(session)
          .then((response) => {
            if (active) setDriver(response.driver);
          })
          .catch((reason) => {
            if (active) {
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Unable to load vehicles",
              );
            }
          })
          .finally(() => {
            if (active) setLoading(false);
          });

        return () => {
          active = false;
        };
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps -- Retry and refresh counters intentionally reload this request.
      [session, retryVersion],
    ),
  );

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
      setError(
        reason instanceof Error ? reason.message : "Unable to save vehicle",
      );
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
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to set primary vehicle",
      );
    } finally {
      setActionId(null);
    }
  }

  function confirmRemove(vehicle: MobileDriverVehicle) {
    Alert.alert(
      "Remove vehicle?",
      `${vehicle.make} ${vehicle.model} · ${vehicle.registration} will be removed from your account.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => void remove(vehicle),
        },
      ],
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
      setError(
        reason instanceof Error ? reason.message : "Unable to remove vehicle",
      );
    } finally {
      setActionId(null);
    }
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>Sign in required</Text>
          <Text style={styles.muted}>
            Sign in to manage your driver vehicles.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.replace({
                pathname: "/auth",
                params: { next: "/driver-vehicle" },
              })
            }
            style={styles.primary}
          >
            <Text style={styles.primaryText}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.back}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>DRIVER VEHICLES</Text>
            <Text style={styles.title}>Your vehicles</Text>
            <Text style={styles.muted}>
              Add every car you may use on Vaya. Each vehicle is verified
              separately.
            </Text>
          </View>
        </View>

        <View style={styles.countRow}>
          <Text style={styles.countLabel}>My vehicles</Text>
          <Text style={styles.countMeta}>
            {vehicles.length} total · {approvedCount} approved
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/add-vehicle")}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Text style={styles.addPlus}>＋</Text>
          <Text style={styles.addText}>Add vehicle</Text>
        </Pressable>

        {showForm ? (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formTitle}>
                  {editing ? "Edit vehicle" : "Add vehicle"}
                </Text>
                <Text style={styles.formMeta}>
                  Registration and roadworthy documents will need approval.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <Field label="Make">
              <TextInput
                accessibilityLabel="Toyota"
                value={draft.make}
                onChangeText={(value) =>
                  setDraft((current) => ({ ...current, make: value }))
                }
                style={styles.input}
                placeholder="Toyota"
                placeholderTextColor="#98A2B3"
              />
            </Field>
            <Field label="Model">
              <TextInput
                accessibilityLabel="Corolla"
                value={draft.model}
                onChangeText={(value) =>
                  setDraft((current) => ({ ...current, model: value }))
                }
                style={styles.input}
                placeholder="Corolla"
                placeholderTextColor="#98A2B3"
              />
            </Field>
            <View style={styles.twoColumns}>
              <View style={{ flex: 1 }}>
                <Field label="Year">
                  <TextInput
                    accessibilityLabel="2022"
                    value={draft.year}
                    onChangeText={(value) =>
                      setDraft((current) => ({
                        ...current,
                        year: value.replace(/\D/g, "").slice(0, 4),
                      }))
                    }
                    keyboardType="number-pad"
                    style={styles.input}
                    placeholder="2022"
                    placeholderTextColor="#98A2B3"
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Colour">
                  <TextInput
                    accessibilityLabel="White"
                    value={draft.color}
                    onChangeText={(value) =>
                      setDraft((current) => ({ ...current, color: value }))
                    }
                    style={styles.input}
                    placeholder="White"
                    placeholderTextColor="#98A2B3"
                  />
                </Field>
              </View>
            </View>
            <Field label="Registration number">
              <TextInput
                accessibilityLabel="AB 12 CD GP"
                value={draft.registration}
                onChangeText={(value) =>
                  setDraft((current) => ({ ...current, registration: value }))
                }
                autoCapitalize="characters"
                style={styles.input}
                placeholder="AB 12 CD GP"
                placeholderTextColor="#98A2B3"
              />
            </Field>
            <Pressable
              accessibilityRole="button"
              disabled={!valid || saving}
              onPress={() => void save()}
              style={[styles.saveButton, (!valid || saving) && styles.disabled]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editing ? "Save and re-verify vehicle" : "Add vehicle"}
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <>
              <Text style={styles.errorText}>{error}</Text>
              <RetryButton onPress={() => setRetryVersion((v) => v + 1)} />
            </>
          </View>
        ) : null}

        <View style={styles.list}>
          {vehicles.map((vehicle) => {
            const busy = actionId === vehicle.id;
            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                busy={busy}
                disabled={Boolean(actionId) || saving}
                onEdit={() => startEdit(vehicle)}
                onVerify={() =>
                  router.push({
                    pathname: "/driver-verification",
                    params: { vehicleId: vehicle.id },
                  })
                }
                onPrimary={() => void makePrimary(vehicle)}
                onRemove={() => confirmRemove(vehicle)}
              />
            );
          })}
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>
            Trips keep their assigned vehicle
          </Text>
          <Text style={styles.infoText}>
            When you publish a trip you choose one approved vehicle. That exact
            car remains attached to the journey even if you later change your
            primary vehicle.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: {
    padding: 24,
    paddingBottom: 60,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
    minHeight: 48,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: TEXT,
    fontSize: 30,
    lineHeight: 44,
    marginTop: -3,
    flexShrink: 1,
  },
  eyebrow: {
    color: BLUE,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.1,
    flexShrink: 1,
  },
  title: {
    color: TEXT,
    fontSize: 26,
    fontWeight: "600",
    marginTop: 3,
    flexShrink: 1,
  },
  muted: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 5,
    flexShrink: 1,
  },
  primary: {
    marginTop: 16,
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  countRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countLabel: { color: TEXT, fontSize: 12, fontWeight: "600", flexShrink: 1 },
  countMeta: { color: MUTED, fontSize: 12, fontWeight: "700", flexShrink: 1 },
  addButton: {
    marginTop: 10,
    minHeight: 52,
    borderRadius: 11,
    backgroundColor: BLUE,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  addPlus: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", flexShrink: 1 },
  addText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600", flexShrink: 1 },
  formCard: {
    marginTop: 14,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    padding: 16,
    gap: 13,
  },
  formHeader: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  formTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  formMeta: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
    flexShrink: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F2F4F7",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: Design.color.muted,
    fontSize: 20,
    lineHeight: 29,
    flexShrink: 1,
  },
  twoColumns: { flexDirection: "row", gap: 10 },
  field: { gap: 6 },
  label: { color: MUTED, fontSize: 12, fontWeight: "600", flexShrink: 1 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    color: TEXT,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
    paddingVertical: 10,
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 11,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  errorBox: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: "#FFF1F0",
    padding: 12,
  },
  errorText: { color: "#B42318", fontSize: 14, lineHeight: 21, flexShrink: 1 },
  list: { marginTop: 18, gap: 12 },
  vehicleCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: "#DFE6E3",
    borderRadius: Design.radius.card,
    padding: 16,
  },
  vehicleTop: { flexDirection: "row", gap: 10, alignItems: "center" },
  carIcon: {
    width: 44,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F1F5F3",
    alignItems: "center",
    justifyContent: "center",
  },
  carIconText: { color: BLUE, fontSize: 16, flexShrink: 1 },
  vehicleNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  vehicleName: { color: TEXT, fontSize: 15, fontWeight: "600", flexShrink: 1 },
  vehicleMeta: { color: MUTED, fontSize: 12, marginTop: 4, flexShrink: 1 },
  primaryBadge: {
    backgroundColor: Design.color.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  primaryBadgeText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  status: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { fontSize: 12, fontWeight: "600", flexShrink: 1 },
  checkRow: {
    marginTop: 12,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: LINE,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BLUE,
  },
  checkLabel: { color: MUTED, fontSize: 16, fontWeight: "600", flexShrink: 1 },
  checkValue: {
    color: TEXT,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 3,
    fontWeight: "700",
    flexShrink: 1,
  },
  actions: { marginTop: 11, flexDirection: "row", gap: 7, flexWrap: "wrap" },
  verifyButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 9,
    backgroundColor: Design.color.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  verifyText: {
    color: "#1765F3",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  secondaryButton: {
    width: 72,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  footerActions: {
    marginTop: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkText: { color: BLUE, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  primaryHint: {
    color: "#027A48",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  removeText: {
    color: "#B42318",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  info: {
    marginTop: 18,
    backgroundColor: Design.color.primarySoft,
    borderRadius: Design.radius.card,
    padding: 16,
  },
  infoTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  infoText: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
    flexShrink: 1,
  },
});
