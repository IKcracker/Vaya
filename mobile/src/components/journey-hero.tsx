import type { ReactNode } from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Design } from "@/constants/design";
import { AppIcon } from "./app-icon";

export const journeyImage = require("../../assets/images/journey-hero.png");

export function JourneyHero({ title, subtitle, eyebrow = "GO TOGETHER", compact = false, showTag = true, children }: {
  title: string; subtitle?: string; eyebrow?: string; compact?: boolean; showTag?: boolean; children?: ReactNode;
}) {
  const { width } = useWindowDimensions();
  return <View style={[styles.hero, compact && styles.compact]}>
    <Image source={journeyImage} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="center" />
    <View style={styles.shade} />
    <View style={styles.copy}>
      <View style={styles.eyebrowRow}><View style={styles.signal} /><Text style={styles.eyebrow}>{eyebrow}</Text></View>
      <Text style={[styles.title, compact && styles.compactTitle, width < 360 && styles.smallTitle]}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
    {!compact && showTag ? <View style={styles.routeTag}><AppIcon name="road" size={14} color="#FFFFFF" /><Text style={styles.routeText}>MADE FOR THE JOURNEY</Text></View> : null}
  </View>;
}
const styles = StyleSheet.create({
  hero: { minHeight: 260, borderRadius: 28, overflow: "hidden", backgroundColor: Design.color.navy },
  compact: { minHeight: 190, borderRadius: 24 },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(7, 25, 57, 0.48)" },
  copy: { padding: 24, flex: 1, justifyContent: "center", paddingBottom: 45 },
  eyebrowRow: { flexDirection: "row", gap: 7, alignItems: "center", marginBottom: 12 },
  signal: { width: 6, height: 6, borderRadius: 3, backgroundColor: Design.color.accent },
  eyebrow: { color: "#D6E5FF", fontSize: 10, fontWeight: "700", letterSpacing: 1.7 },
  title: { color: "#FFFFFF", fontSize: 35, fontWeight: "800", lineHeight: 39, letterSpacing: -1.2, maxWidth: 340 },
  compactTitle: { fontSize: 30, lineHeight: 35 },
  smallTitle: { fontSize: 27, lineHeight: 32, letterSpacing: -0.8 },
  subtitle: { color: "#D6E3F8", fontSize: 13, lineHeight: 20, maxWidth: 260, marginTop: 12 },
  routeTag: { position: "absolute", bottom: 18, right: 18, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, backgroundColor: "rgba(7, 25, 57, 0.5)", flexDirection: "row", alignItems: "center", gap: 6 },
  routeText: { color: "#FFFFFF", fontSize: 8, fontWeight: "700", letterSpacing: 1.2 },
});
