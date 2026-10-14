import { Pressable, StyleSheet, Text } from "react-native";
import { Design } from "@/constants/design";
export function RetryButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.text}>Try again</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Design.color.border,
    backgroundColor: Design.color.background,
    marginTop: 12,
  },
  text: { color: Design.color.primary, fontSize: 14, fontWeight: "600" },
  pressed: { opacity: 0.65 },
});
