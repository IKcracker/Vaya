import { useTravelMode } from "@/providers/travel-mode-provider";
import { SymbolView } from "expo-symbols";
import { Design } from "@/constants/design";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

export default function ChooseRoleScreen() {
  const router = useRouter();
  const { setMode } = useTravelMode();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.back}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>How will you travel?</Text>
        <Text style={styles.subtitle}>Choose how you want to use Vaya</Text>

        <View style={styles.cards}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMode("passenger");
              router.replace("/");
            }}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.iconWrap}>
              <SymbolView
                name={{ ios: "person", android: "person", web: "person" }}
                tintColor={Design.color.primary}
                size={24}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Passenger</Text>
              <Text style={styles.cardText}>Find and book rides</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMode("driver");
              router.replace("/");
            }}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.iconWrap}>
              <SymbolView
                name={{
                  ios: "car",
                  android: "directions_car",
                  web: "directions_car",
                }}
                tintColor={Design.color.primary}
                size={24}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Driver</Text>
              <Text style={styles.cardText}>Offer rides and earn</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            You can switch roles anytime from your profile.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: {
    flex: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    flexGrow: 1,
    paddingBottom: 24,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: TEXT,
    fontSize: 26,
    lineHeight: 38,
    marginTop: -2,
    flexShrink: 1,
  },
  title: {
    color: TEXT,
    fontSize: 26,
    fontWeight: "600",
    marginTop: 36,
    flexShrink: 1,
  },
  subtitle: {
    color: MUTED,
    fontSize: 14,
    marginTop: 4,
    flexShrink: 1,
    lineHeight: 21,
  },
  cards: { gap: 14, marginTop: 32 },
  card: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    backgroundColor: SURFACE,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  pressed: { opacity: 0.72 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Design.color.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  cardText: { color: MUTED, fontSize: 14, marginTop: 4, flexShrink: 1 },
  chevron: { color: "#98A2B3", fontSize: 24, flexShrink: 1 },
  note: {
    marginTop: 32,
    marginBottom: 20,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F8FAF9",
    borderWidth: 1,
    borderColor: LINE,
  },
  noteText: { color: MUTED, fontSize: 14, textAlign: "center", flexShrink: 1 },
});
