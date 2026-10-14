import { RetryButton } from "@/components/retry-button";
import { Design } from "@/constants/design";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  DriverDocumentKind,
  fetchMobileDriver,
  MobileDriver,
  uploadDriverDocument,
} from "@/lib/auth";
import {
  PERSONAL_DRIVER_DOCUMENT_REQUIREMENTS,
  VEHICLE_DOCUMENT_REQUIREMENTS,
  formatFileSize,
  pickDriverDocument,
} from "@/lib/driver-documents";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const BLUE = Design.color.primary;
const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

function tone(status: string) {
  if (status === "Approved") return { bg: "#ECFDF3", text: "#027A48" };
  if (status === "Rejected" || status === "Needs info") {
    return { bg: "#FFF1F0", text: "#B42318" };
  }
  return { bg: "#FFFAEB", text: "#B54708" };
}

export default function DriverVerificationScreen() {
  const [retryVersion, setRetryVersion] = useState(0);
  const router = useRouter();
  const params = useLocalSearchParams<{
    refresh?: string;
    vehicleId?: string;
  }>();
  const { session } = usePassengerAuth();
  const [driver, setDriver] = useState<MobileDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<DriverDocumentKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refreshKey = typeof params.refresh === "string" ? params.refresh : "";
  const vehicleId =
    typeof params.vehicleId === "string" ? params.vehicleId : "";
  const selectedVehicle = vehicleId
    ? (driver?.vehicles?.find((vehicle) => vehicle.id === vehicleId) ?? null)
    : null;

  async function refreshDriver() {
    if (!session) return;
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetchMobileDriver(session);
      setDriver(response.driver);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load verification",
      );
    } finally {
      setRefreshing(false);
    }
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
            if (!active) return;
            setDriver(response.driver);
          })
          .catch((reason: unknown) => {
            if (!active) return;
            setError(
              reason instanceof Error
                ? reason.message
                : "Unable to load verification",
            );
          })
          .finally(() => {
            if (active) setLoading(false);
          });

        return () => {
          active = false;
        };
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps -- Retry and refresh counters intentionally reload this request.
      [refreshKey, session, retryVersion],
    ),
  );

  const verification = selectedVehicle?.verification ?? driver?.verification;
  const requirements = vehicleId
    ? VEHICLE_DOCUMENT_REQUIREMENTS
    : PERSONAL_DRIVER_DOCUMENT_REQUIREMENTS;

  const documents = useMemo(
    () =>
      new Map(verification?.documents.map((item) => [item.kind, item]) ?? []),
    [verification?.documents],
  );

  async function replace(kind: DriverDocumentKind) {
    if (!session || uploading) return;
    setUploading(kind);
    setError(null);
    setNotice(null);

    try {
      const selected = await pickDriverDocument(kind);
      if (!selected) return;

      await uploadDriverDocument(session, {
        kind,
        vehicleId: vehicleId || null,
        fileName: selected.fileName,
        contentType: selected.contentType,
        fileData: selected.fileData,
      });

      await refreshDriver();
      setNotice("Document uploaded. Vaya staff will review this new copy.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to upload document",
      );
    } finally {
      setUploading(null);
    }
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>Sign in required</Text>
          <Text style={styles.muted}>
            Sign in to manage driver verification.
          </Text>
          <Pressable
            accessibilityRole="button"
            style={styles.primary}
            onPress={() =>
              router.replace({
                pathname: "/auth",
                params: { next: "/driver-verification" },
              })
            }
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

  if (!driver) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>No driver application found</Text>
          {error ? (
            <>
              <Text style={styles.errorText}>{error}</Text>
              <RetryButton onPress={() => setRetryVersion((v) => v + 1)} />
            </>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/driver-application")}
            style={styles.primary}
          >
            <Text style={styles.primaryText}>Start application</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (vehicleId && !selectedVehicle) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>Vehicle not found</Text>
          <Text style={styles.muted}>
            Return to your vehicle list and choose a vehicle to verify.
          </Text>
          <Pressable
            accessibilityRole="button"
            style={styles.primary}
            onPress={() => router.replace("/driver-vehicle")}
          >
            <Text style={styles.primaryText}>Open vehicles</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const requiredCount =
    verification?.requiredCount ??
    requirements.filter((requirement) => requirement.required).length;
  const progress = verification
    ? `${verification.approvedRequiredCount}/${verification.requiredCount} approved`
    : vehicleId
      ? (selectedVehicle?.checks ?? "Verification required")
      : driver.checks;
  const approved = vehicleId
    ? selectedVehicle?.status === "Approved"
    : driver.status === "Approved" && verification?.readyToApprove;
  const needsAction = Boolean(
    verification?.missingKinds.length ||
    verification?.needsAttentionKinds.length,
  );
  const nextAction = approved
    ? vehicleId
      ? "Vehicle approved"
      : "You’re ready to drive"
    : needsAction
      ? "Complete your checklist"
      : verification?.readyToApprove
        ? "Final approval pending"
        : "Your documents are in review";
  const explanation = approved
    ? vehicleId
      ? "This vehicle is approved and can be selected when you publish a trip."
      : "Your identity and driving licence have been approved."
    : needsAction
      ? "Upload missing documents and replace any copies flagged by Vaya staff."
      : "Vaya Operations reviews every required document before approval.";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refreshDriver()}
            tintColor={BLUE}
          />
        }
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>
              {vehicleId ? "VEHICLE VERIFICATION" : "DRIVER VERIFICATION"}
            </Text>
            <Text style={styles.title}>
              {vehicleId
                ? (selectedVehicle?.label ?? "Vehicle verification")
                : "Identity verification"}
            </Text>
          </View>
        </View>

        <View style={styles.stepper}>
          {[1, 2, 3].map((step, index) => {
            const activeStep = approved
              ? 3
              : (verification?.uploadedRequiredCount ?? 0) >= requiredCount
                ? 2
                : 1;
            const active = step <= activeStep;
            return (
              <View key={step} style={styles.stepperItem}>
                <View
                  style={[styles.stepCircle, active && styles.stepCircleActive]}
                >
                  <Text
                    style={[
                      styles.stepCircleText,
                      active && styles.stepCircleTextActive,
                    ]}
                  >
                    {step}
                  </Text>
                </View>
                {index < 2 ? (
                  <View
                    style={[
                      styles.stepLine,
                      activeStep > step && styles.stepLineActive,
                    ]}
                  />
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={styles.summaryCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>{nextAction}</Text>
            <Text style={styles.summaryMeta}>{explanation}</Text>
          </View>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>{progress}</Text>
          </View>
        </View>

        {notice ? (
          <View style={styles.approvedStrip}>
            <Text style={styles.approvedText}>{notice}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.error}>
            <>
              <Text style={styles.errorText}>{error}</Text>
              <RetryButton onPress={() => setRetryVersion((v) => v + 1)} />
            </>
          </View>
        ) : null}

        <View style={styles.list}>
          {requirements.map((requirement, index) => {
            const document = documents.get(requirement.kind);
            const status = document?.status ?? "Missing";
            const statusTone = tone(status);
            const busy = uploading === requirement.kind;

            return (
              <View
                key={requirement.kind}
                style={[
                  styles.row,
                  index < requirements.length - 1 && styles.rowBorder,
                ]}
              >
                <View style={styles.rowTop}>
                  <View
                    style={[
                      styles.docIcon,
                      status === "Approved" && styles.docIconApproved,
                    ]}
                  >
                    <Text
                      style={[
                        styles.docIconText,
                        status === "Approved" && styles.docIconTextApproved,
                      ]}
                    >
                      {status === "Approved" ? "✓" : "□"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docTitle}>{requirement.label}</Text>
                    <Text style={styles.docDescription}>
                      {requirement.description}
                    </Text>
                  </View>
                  <View
                    style={[styles.status, { backgroundColor: statusTone.bg }]}
                  >
                    <Text
                      style={[styles.statusText, { color: statusTone.text }]}
                    >
                      {status}
                    </Text>
                  </View>
                </View>

                {document ? (
                  <View style={styles.fileBox}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {document.fileName}
                      </Text>
                      <Text style={styles.fileMeta}>
                        {formatFileSize(document.sizeBytes)} · Uploaded{" "}
                        {new Date(document.uploadedAt).toLocaleDateString()}
                      </Text>
                      {document.reviewedAt ? (
                        <Text style={styles.fileMeta}>
                          Reviewed{" "}
                          {new Date(document.reviewedAt).toLocaleDateString()}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ) : null}

                {document?.reviewNote ? (
                  <View style={styles.note}>
                    <Text style={styles.noteTitle}>Vaya Operations note</Text>
                    <Text style={styles.noteText}>{document.reviewNote}</Text>
                  </View>
                ) : null}

                {status !== "Approved" ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={Boolean(uploading)}
                    onPress={() => void replace(requirement.kind)}
                    style={({ pressed }) => [
                      styles.uploadButton,
                      Boolean(uploading) && styles.disabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color={BLUE} />
                    ) : (
                      <Text style={styles.uploadText}>
                        {document ? "Replace document" : "Upload document"}
                      </Text>
                    )}
                  </Pressable>
                ) : (
                  <View style={styles.approvedStrip}>
                    <Text style={styles.approvedText}>
                      ✓ Verified by Vaya Operations
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.help}>
          <Text style={styles.helpTitle}>Clear copies make review easier</Text>
          <Text style={styles.helpText}>
            Keep the full document visible and legible. Use a PDF, JPG, PNG or
            WEBP up to 3 MB. Vehicle documents are tied only to the selected
            vehicle; replacing one returns that vehicle to review.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
    height: 44,
  },
  stepperItem: { flex: 1, flexDirection: "row", alignItems: "center" },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EEF2F0",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: { backgroundColor: BLUE },
  stepCircleText: {
    color: MUTED,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  stepCircleTextActive: { color: "#FFFFFF" },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E1E7E4",
    marginHorizontal: 6,
  },
  stepLineActive: { backgroundColor: "#8FE3C1" },
  safe: { flex: 1, backgroundColor: BG },
  page: {
    padding: 24,
    paddingBottom: 50,
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
  disabled: { opacity: 0.5 },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
    textAlign: "left",
    flexShrink: 1,
  },
  muted: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    textAlign: "center",
    flexShrink: 1,
  },
  primary: {
    marginTop: 16,
    backgroundColor: BLUE,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
    minHeight: 44,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: "#DFE6E3",
    borderRadius: Design.radius.card,
    padding: 16,
    marginBottom: 12,
  },
  summaryTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  summaryMeta: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
    flexShrink: 1,
  },
  summaryBadge: {
    backgroundColor: Design.color.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
  },
  summaryBadgeText: {
    color: "#1765F3",
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  error: {
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FFF8F7",
    borderRadius: Design.radius.card,
    padding: 16,
    marginBottom: 14,
  },
  errorText: { color: "#B42318", fontSize: 14, lineHeight: 21, flexShrink: 1 },
  list: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: "#DFE6E3",
    borderRadius: Design.radius.card,
    overflow: "hidden",
    marginTop: 10,
  },
  row: { padding: 13, backgroundColor: SURFACE, minHeight: 64 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: LINE },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  docIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F2F4F3",
    alignItems: "center",
    justifyContent: "center",
  },
  docIconApproved: { backgroundColor: "#ECFDF3" },
  docIconText: { color: MUTED, fontSize: 16, fontWeight: "600", flexShrink: 1 },
  docIconTextApproved: { color: "#027A48" },
  docTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  docDescription: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 2,
    flexShrink: 1,
  },
  status: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { fontSize: 12, fontWeight: "600", flexShrink: 1 },
  fileBox: {
    marginTop: 10,
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
  },
  fileName: { color: TEXT, fontSize: 15, fontWeight: "700", flexShrink: 1 },
  fileMeta: { color: MUTED, fontSize: 12, marginTop: 4, flexShrink: 1 },
  note: {
    marginTop: 10,
    backgroundColor: "#FFF7ED",
    borderRadius: 10,
    padding: 10,
  },
  noteTitle: {
    color: "#9A3412",
    fontSize: 18,
    fontWeight: "600",
    flexShrink: 1,
  },
  noteText: {
    color: "#7C2D12",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 3,
    flexShrink: 1,
  },
  uploadButton: {
    minHeight: 52,
    marginTop: 9,
    borderWidth: 1,
    borderColor: "#C7EEDF",
    backgroundColor: Design.color.primarySoft,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  uploadText: {
    color: "#1765F3",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  approvedStrip: {
    marginTop: 10,
    backgroundColor: "#ECFDF3",
    borderRadius: 10,
    padding: 10,
  },
  approvedText: {
    color: "#027A48",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  help: {
    marginTop: 16,
    backgroundColor: Design.color.primarySoft,
    borderRadius: 14,
    padding: 14,
  },
  helpTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  helpText: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
    flexShrink: 1,
  },
});
