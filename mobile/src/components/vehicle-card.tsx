import { SymbolView } from "expo-symbols";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Design } from "@/constants/design";
import type { MobileDriverVehicle } from "@/lib/auth";
type Props = {
  vehicle: MobileDriverVehicle;
  busy?: boolean;
  disabled?: boolean;
  onVerify: () => void;
  onEdit?: () => void;
  onManage?: () => void;
  onPrimary?: () => void;
  onRemove?: () => void;
};
export function VehicleCard({
  vehicle,
  busy,
  disabled,
  onVerify,
  onEdit,
  onManage,
  onPrimary,
  onRemove,
}: Props) {
  const approved = vehicle.status === "Approved";
  const attention = ["Rejected", "Suspended"].includes(vehicle.status);
  const statusColor = approved ? "#1765F3" : attention ? "#B42318" : "#9A6700";
  const statusBackground = approved
    ? "#EAF2FF"
    : attention
      ? "#FFF1F0"
      : "#FFFAEB";
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.icon}>
          <SymbolView
            name={{
              ios: "car",
              android: "directions_car",
              web: "directions_car",
            }}
            tintColor={Design.color.primary}
            size={30}
          />
        </View>
        <View style={styles.heading}>
          <Text style={styles.name}>
            {vehicle.make} {vehicle.model}
          </Text>
          <Text style={styles.meta}>
            {vehicle.year} · {vehicle.color}
          </Text>
        </View>
        {busy ? <ActivityIndicator color={Design.color.primary} /> : null}
      </View>
      <View style={styles.details}>
        <View style={styles.plate}>
          <Text style={styles.plateLabel}>REGISTRATION</Text>
          <Text style={styles.registration}>{vehicle.registration}</Text>
        </View>
        <View style={[styles.status, { backgroundColor: statusBackground }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {vehicle.status}
          </Text>
        </View>
      </View>
      {vehicle.isPrimary ? (
        <Text style={styles.primary}>Primary vehicle</Text>
      ) : null}
      <View style={styles.verification}>
        <Text style={styles.verificationTitle}>Vehicle verification</Text>
        <Text style={styles.verificationText}>
          {vehicle.checks ||
            "Upload your registration and roadworthy documents to begin verification."}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          disabled={disabled}
          accessibilityRole="button"
          onPress={onVerify}
          style={styles.verify}
        >
          <Text style={styles.verifyText}>
            {approved ? "View documents" : "Complete verification"}
          </Text>
        </Pressable>
        {onEdit || onManage ? (
          <Pressable
            disabled={disabled}
            accessibilityRole="button"
            onPress={onEdit || onManage}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>
              {onEdit ? "Edit" : "Manage"}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {onPrimary || onRemove ? (
        <View style={styles.footer}>
          {onPrimary && !vehicle.isPrimary ? (
            <Pressable
              disabled={disabled}
              accessibilityRole="button"
              onPress={onPrimary}
              style={styles.link}
            >
              <Text style={styles.linkText}>Set as primary</Text>
            </Pressable>
          ) : (
            <Text style={styles.note}>
              {vehicle.isPrimary ? "Used by default for new rides" : ""}
            </Text>
          )}
          {onRemove ? (
            <Pressable
              disabled={disabled}
              accessibilityRole="button"
              onPress={onRemove}
              style={styles.link}
            >
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderWidth: 1,
    borderColor: Design.color.border,
    borderRadius: 18,
    backgroundColor: Design.color.background,
    gap: 18,
  },
  top: { flexDirection: "row", gap: 14, alignItems: "center" },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Design.color.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: { flex: 1 },
  name: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "600",
    color: Design.color.text,
  },
  meta: { fontSize: 14, color: Design.color.muted, marginTop: 4 },
  details: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  plate: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Design.color.border,
    borderRadius: 8,
    backgroundColor: Design.color.surface,
  },
  plateLabel: { fontSize: 9, letterSpacing: 1, color: Design.color.muted },
  registration: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
    color: Design.color.text,
    marginTop: 4,
  },
  status: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: "600" },
  primary: { fontSize: 12, fontWeight: "600", color: Design.color.primary },
  verification: {
    borderTopWidth: 1,
    borderTopColor: Design.color.border,
    paddingTop: 16,
  },
  verificationTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Design.color.text,
  },
  verificationText: {
    fontSize: 13,
    lineHeight: 20,
    color: Design.color.muted,
    marginTop: 6,
  },
  actions: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  verify: {
    flex: 1,
    minWidth: 160,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: Design.color.primarySoft,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyText: { fontSize: 14, fontWeight: "600", color: Design.color.primary },
  secondary: {
    minWidth: 72,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Design.color.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { fontSize: 14, fontWeight: "600", color: Design.color.text },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  link: { minHeight: 44, justifyContent: "center" },
  linkText: { fontSize: 13, color: Design.color.primary, fontWeight: "600" },
  remove: { fontSize: 13, color: "#B42318" },
  note: { fontSize: 12, color: Design.color.muted, flex: 1 },
});
