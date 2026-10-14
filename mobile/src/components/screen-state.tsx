import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Design } from "@/constants/design";
import { AppIcon, type AppIconName } from "./app-icon";
import { BrandMark } from "./brand-mark";

export function ScreenState({ icon, eyebrow, title, description, action, onPress }: {
  icon: AppIconName; eyebrow: string; title: string; description: string;
  action?: string; onPress?: () => void;
}) {
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
    <BrandMark />
    <View style={styles.art}>
      <View style={styles.orbit} /><View style={styles.orbitInner} />
      <View style={styles.icon}><AppIcon name={icon} size={40} color="#FFFFFF" /></View>
      <View style={styles.pin}><AppIcon name="pin" size={18} /></View>
      <View style={styles.dot} />
    </View>
    <Text style={styles.eyebrow}>{eyebrow}</Text>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
    {action && onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}>
      <Text style={styles.buttonText}>{action}</Text><AppIcon name="arrow" size={20} color="#FFFFFF" />
    </Pressable> : null}
    <Text style={styles.footer}>Your next journey, with Vaya.</Text>
  </ScrollView>;
}
const styles = StyleSheet.create({
  scroll: { flex: 1 },
  page: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 28, paddingTop: 35, paddingBottom: 110, width: "100%", maxWidth: 500, alignSelf: "center" },
  art: { width: 210, height: 190, alignItems: "center", justifyContent: "center", marginTop: 30, marginBottom: 20 },
  orbit: { position: "absolute", width: 190, height: 190, borderRadius: 95, borderWidth: 1, borderColor: "#DBE7FA" },
  orbitInner: { position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: "#EAF2FF" },
  icon: { width: 88, height: 88, backgroundColor: Design.color.primary, borderRadius: 28, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }], boxShadow: Design.shadow.button },
  pin: { position: "absolute", width: 40, height: 40, borderRadius: 14, backgroundColor: "#FFFFFF", right: 8, top: 28, alignItems: "center", justifyContent: "center", boxShadow: Design.shadow.card },
  dot: { position: "absolute", width: 13, height: 13, borderRadius: 7, backgroundColor: Design.color.accent, left: 21, bottom: 26 },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.8, color: Design.color.primary, marginBottom: 12 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.9, color: Design.color.navy, textAlign: "center" },
  description: { color: Design.color.muted, fontSize: 14, lineHeight: 22, textAlign: "center", marginTop: 14, maxWidth: 310 },
  button: { marginTop: 28, minHeight: 56, width: "100%", borderRadius: 17, backgroundColor: Design.color.primary, flexDirection: "row", gap: 12, alignItems: "center", justifyContent: "center", boxShadow: Design.shadow.button },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  footer: { marginTop: 24, color: "#8B98AC", fontSize: 11 },
});
