import { Design } from "@/constants/design";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createDriverVehicle } from "@/lib/auth";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const GREEN = Design.color.primary;
const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

export default function AddVehicleScreen() {
  const router = useRouter();
  const { session } = usePassengerAuth();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [registration, setRegistration] = useState("");
  const [color, setColor] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedYear = Number(year);
  const valid =
    make.trim().length >= 2 &&
    model.trim().length >= 1 &&
    registration.trim().length >= 2 &&
    color.trim().length >= 2 &&
    Number.isInteger(parsedYear) &&
    parsedYear >= 1980 &&
    parsedYear <= 2100;

  async function submit() {
    if (!session || !valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await createDriverVehicle(session, {
        vehicleMake: make.trim(),
        vehicleModel: model.trim(),
        vehicleYear: parsedYear,
        vehicleRegistration: registration.trim().toUpperCase(),
        vehicleColor: color.trim(),
      });
      router.replace({
        pathname: "/driver-verification",
        params: { vehicleId: response.vehicle.id },
      });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to add vehicle",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
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
          <Text style={styles.title}>Add Vehicle</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.stepper}>
          {[1, 2, 3].map((step, index) => (
            <View key={step} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  step === 1 && styles.stepCircleActive,
                ]}
              >
                <Text
                  style={[styles.stepText, step === 1 && styles.stepTextActive]}
                >
                  {step}
                </Text>
              </View>
              {index < 2 ? <View style={styles.stepLine} /> : null}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Vehicle Details</Text>
        <View style={styles.card}>
          <Field label="Make">
            <TextInput
              accessibilityLabel="Toyota"
              value={make}
              onChangeText={setMake}
              style={styles.input}
              placeholder="Toyota"
              placeholderTextColor="#98A2B3"
            />
          </Field>
          <Field label="Model">
            <TextInput
              accessibilityLabel="Prado"
              value={model}
              onChangeText={setModel}
              style={styles.input}
              placeholder="Prado"
              placeholderTextColor="#98A2B3"
            />
          </Field>
          <Field label="Year">
            <TextInput
              accessibilityLabel="2020"
              value={year}
              onChangeText={(v) => setYear(v.replace(/\D/g, "").slice(0, 4))}
              keyboardType="number-pad"
              style={styles.input}
              placeholder="2020"
              placeholderTextColor="#98A2B3"
            />
          </Field>
          <Field label="Registration Number">
            <TextInput
              accessibilityLabel="KCN 123A"
              value={registration}
              onChangeText={setRegistration}
              autoCapitalize="characters"
              style={styles.input}
              placeholder="KCN 123A"
              placeholderTextColor="#98A2B3"
            />
          </Field>
          <Field label="Colour">
            <TextInput
              accessibilityLabel="White"
              value={color}
              onChangeText={setColor}
              style={styles.input}
              placeholder="White"
              placeholderTextColor="#98A2B3"
            />
          </Field>
        </View>

        <Text style={styles.sectionTitle}>Verification</Text>
        <View style={styles.info}>
          <Text style={styles.infoTitle}>
            Documents are verified per vehicle
          </Text>
          <Text style={styles.infoText}>
            After saving, upload the registration, roadworthy certificate and
            optional insurance for this vehicle.
          </Text>
        </View>

        {error ? (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={!valid || saving}
          onPress={() => void submit()}
          style={[styles.primary, (!valid || saving) && styles.disabled]}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>Continue to Verification</Text>
          )}
        </Pressable>
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
    paddingBottom: 40,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontSize: 29,
    lineHeight: 43,
    marginTop: -3,
    flexShrink: 1,
  },
  title: { color: TEXT, fontSize: 26, fontWeight: "600", flexShrink: 1 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    paddingHorizontal: 6,
    height: 44,
  },
  stepItem: { flex: 1, flexDirection: "row", alignItems: "center" },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EEF2F0",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: { backgroundColor: GREEN },
  stepText: { color: MUTED, fontSize: 16, fontWeight: "600", flexShrink: 1 },
  stepTextActive: { color: "#FFFFFF" },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#DDE5E2",
    marginHorizontal: 6,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 22,
    marginBottom: 8,
    flexShrink: 1,
  },
  card: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    padding: 16,
    gap: 12,
  },
  field: { gap: 5 },
  label: { color: MUTED, fontSize: 12, fontWeight: "600", flexShrink: 1 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 11,
    color: TEXT,
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
    paddingVertical: 10,
  },
  info: {
    backgroundColor: Design.color.primarySoft,
    borderRadius: Design.radius.card,
    padding: 16,
  },
  infoTitle: {
    color: "#1765F3",
    fontSize: 18,
    fontWeight: "600",
    flexShrink: 1,
  },
  infoText: {
    color: "#1765F3",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 3,
    flexShrink: 1,
  },
  error: {
    marginTop: 12,
    borderRadius: Design.radius.card,
    backgroundColor: "#FFF1F0",
    padding: 16,
  },
  errorText: { color: "#B42318", fontSize: 14, flexShrink: 1 },
  primary: {
    marginTop: 18,
    minHeight: 52,
    borderRadius: 11,
    backgroundColor: GREEN,
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
  disabled: { opacity: 0.45 },
});
