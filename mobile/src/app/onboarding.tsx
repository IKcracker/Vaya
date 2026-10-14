import { useRouter } from "expo-router";
import { completeOnboarding } from "@/lib/onboarding-storage";
import { useState } from "react";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Design } from "@/constants/design";
import { BrandMark } from "@/components/brand-mark";
import { JourneyHero } from "@/components/journey-hero";
import { AppIcon } from "@/components/app-icon";

const benefits = [
  {
    title: "Find your next ride",
    copy: "Search routes, compare fares and choose a trip that works for you.",
    ios: "magnifyingglass",
    material: "search",
  },
  {
    title: "Keep every trip together",
    copy: "Manage your bookings, payments and conversations in one place.",
    ios: "ticket",
    material: "confirmation_number",
  },
  {
    title: "Make room for someone",
    copy: "Apply to drive and offer seats on journeys you already make.",
    ios: "car",
    material: "directions_car",
  },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function finishOnboarding(destination: "/auth" | "/") {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await completeOnboarding();
      router.replace(destination);
    } catch {
      setError("Unable to save your preferences. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}><BrandMark /><Text style={styles.topLabel}>GO TOGETHER</Text></View>
        <JourneyHero title={"Good company.\nGreat journeys."} subtitle="Discover a better way to travel across South Africa." eyebrow="WELCOME TO VAYA" />
        <View style={styles.intro}>
          <Text style={styles.title}>More than a seat.</Text>
          <Text style={styles.copy}>A simpler way to get there, together.</Text>
        </View>
        <View style={styles.benefits}>
          {benefits.map((item) => (
            <View key={item.title} style={styles.benefit}>
              <View style={styles.icon}>
                <SymbolView
                  name={{
                    ios: item.ios,
                    android: item.material,
                    web: item.material,
                  }}
                  tintColor={Design.color.primary}
                  size={22}
                />
              </View>
              <View style={styles.benefitCopy}>
                <Text style={styles.benefitTitle}>{item.title}</Text>
                <Text style={styles.benefitText}>{item.copy}</Text>
              </View>
            </View>
          ))}
        </View>
        {error ? <Text style={styles.copy}>{error}</Text> : null}
        <Pressable
          disabled={busy}
          accessibilityRole="button"
          onPress={() => void finishOnboarding("/auth")}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        >
          <Text style={styles.primaryText}>
            {busy ? "Getting ready…" : "Let’s go"}
          </Text>
          <AppIcon name="arrow" color="#FFFFFF" size={21} />
        </Pressable>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void finishOnboarding("/")} style={styles.browse}>
          <Text style={styles.browseText}>Browse rides first</Text>
        </Pressable>
        <Text style={styles.footer}>Your next journey, with Vaya.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Design.color.background },
  page: { ...Design.page, flexGrow: 1, paddingTop: 20, paddingBottom: 24 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  topLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 1.2, color: Design.color.muted },
  brand: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -1,
    color: Design.color.text,
  },
  intro: { marginTop: 26, marginBottom: 18 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.4,
    color: Design.color.primary,
    marginBottom: 14,
  },
  title: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "800",
    letterSpacing: -0.7,
    color: Design.color.text,
  },
  copy: {
    fontSize: 13,
    lineHeight: 21,
    color: Design.color.muted,
    marginTop: 7,
  },
  benefits: { gap: 20, marginBottom: 24, padding: 20, borderRadius: 24, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: Design.color.border, boxShadow: Design.shadow.card },
  benefit: { flexDirection: "row", gap: 13, alignItems: "flex-start" },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Design.color.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitCopy: { flex: 1 },
  benefitTitle: { fontSize: 14, fontWeight: "700", color: Design.color.text },
  benefitText: {
    fontSize: 12,
    lineHeight: 18,
    color: Design.color.muted,
    marginTop: 5,
  },
  primary: {
    minHeight: 56,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 17,
    backgroundColor: Design.color.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    boxShadow: Design.shadow.button,
  },
  primaryText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  arrow: { fontSize: 22, color: "#FFFFFF" },
  browse: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 6 },
  browseText: { fontSize: 13, color: Design.color.primary, fontWeight: "600" },
  pressed: { opacity: 0.7 },
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: Design.color.muted,
    marginTop: 16,
  },
});
