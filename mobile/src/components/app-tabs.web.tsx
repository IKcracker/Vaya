import { useTravelMode } from "@/providers/travel-mode-provider";
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  type TabTriggerSlotProps,
} from "expo-router/ui";
import {
  Pressable,
  StyleSheet,
  Text,
  ActivityIndicator,
  View,
} from "react-native";
import { Design } from "@/constants/design";
import { AppIcon, type AppIconName } from "./app-icon";

export default function AppTabs() {
  const { mode, loading } = useTravelMode();
  if (loading)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={Design.color.primary} />
      </View>
    );
  const driving = mode === "driver";
  return (
    <Tabs style={styles.root}>
      <TabSlot style={styles.content} />
      <TabList
        style={[styles.list, driving && { backgroundColor: Design.color.text }]}
      >
        <TabTrigger name="home" href="/" asChild>
          <TabButton icon={driving ? "car" : "home"}>{driving ? "Dashboard" : "Home"}</TabButton>
        </TabTrigger>
        <TabTrigger name="trips" href="/trips" asChild>
          <TabButton icon="ticket">{driving ? "My rides" : "My trips"}</TabButton>
        </TabTrigger>
        <TabTrigger name="messages" href="/messages" asChild>
          <TabButton icon="messages">Messages</TabButton>
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" asChild>
          <TabButton icon="profile">{driving ? "Driver" : "Profile"}</TabButton>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, icon, ...props }: TabTriggerSlotProps & { icon: AppIconName }) {
  const { mode } = useTravelMode();
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [
        styles.tab,
        isFocused && styles.active,
        pressed && styles.pressed,
      ]}
    >
      <AppIcon name={icon} size={21} color={isFocused ? Design.color.primary : mode === "driver" ? "#A5B8D9" : "#8190A8"} />
      <Text
        style={[
          styles.label,
          mode === "driver" && { color: "#A5B8D9" },
          isFocused && styles.activeLabel,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Design.color.background },
  content: { flex: 1 },
  list: {
    position: "absolute",
    bottom: 14,
    alignSelf: "center",
    width: "92%",
    maxWidth: 560,
    minHeight: 74,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E3EAF4",
    borderRadius: 25,
    boxShadow: "0px 8px 32px rgba(13,33,72,0.12)",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  tab: {
    flex: 1,
    maxWidth: 140,
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    gap: 5,
  },
  active: { backgroundColor: Design.color.primarySoft },
  label: { fontSize: 10, fontWeight: "600", color: Design.color.muted },
  activeLabel: { color: Design.color.primary, fontWeight: "600" },
  pressed: { opacity: 0.65 },
});
