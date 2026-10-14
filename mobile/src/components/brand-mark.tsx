import { StyleSheet, Text, View } from "react-native";
import { Design } from "@/constants/design";

export function BrandMark({ inverted = false, compact = false }: { inverted?: boolean; compact?: boolean }) {
  return <View style={styles.brand}>
    <View style={[styles.mark, inverted && styles.markLight]}>
      <Text style={[styles.letter, inverted && { color: Design.color.primary }]}>v</Text>
      <View style={[styles.dot, inverted && { backgroundColor: Design.color.primary }]} />
    </View>
    {!compact ? <Text style={[styles.name, inverted && { color: "#FFFFFF" }]}>vaya<Text style={styles.nameDot}>.</Text></Text> : null}
  </View>;
}
const styles = StyleSheet.create({
  brand: { flexDirection: "row", alignItems: "center", gap: 9 },
  mark: { width: 38, height: 38, borderRadius: 13, backgroundColor: Design.color.primary, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  markLight: { backgroundColor: "#FFFFFF" },
  letter: { color: "#FFFFFF", fontSize: 32, fontWeight: "800", marginTop: -6, letterSpacing: -2 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#FFFFFF", position: "absolute", right: 6, bottom: 8 },
  name: { color: Design.color.navy, fontSize: 28, fontWeight: "800", letterSpacing: -1.1 },
  nameDot: { color: Design.color.primary },
});
