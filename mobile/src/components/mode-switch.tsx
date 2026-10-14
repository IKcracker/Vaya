import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { useTravelMode } from "@/providers/travel-mode-provider";
import { Design } from "@/constants/design";
export function ModeSwitch() {
  const { mode, setMode } = useTravelMode();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        setMode(mode === "driver" ? "passenger" : "driver");
        router.replace("/");
      }}
      style={styles.button}
    >
      <Text style={styles.label}>
        Switch to {mode === "driver" ? "passenger" : "driver"} →
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Design.color.border,
    marginVertical: 12,
  },
  label: { fontSize: 13, fontWeight: "600", color: Design.color.primary },
});
