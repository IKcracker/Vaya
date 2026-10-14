import { useTravelMode } from "@/providers/travel-mode-provider";
import { ActivityIndicator, View } from "react-native";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Design } from "@/constants/design";

export default function AppTabs() {
  const { mode, loading } = useTravelMode();
  if (loading)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#1765F3" />
      </View>
    );
  const driving = mode === "driver";
  return (
    <NativeTabs
      backgroundColor={driving ? Design.color.navy : "#FFFFFF"}
      indicatorColor={Design.color.primarySoft}
      tintColor={driving ? "#FFFFFF" : Design.color.primary}
      labelStyle={{
        default: { color: driving ? "#A5B8D9" : "#64748B" },
        selected: { color: driving ? "#FFFFFF" : "#1765F3", fontWeight: "700" },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>
          {driving ? "Dashboard" : "Home"}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: driving ? "car" : "house", selected: driving ? "car.fill" : "house.fill" }}
          md={{ default: driving ? "directions_car" : "home", selected: driving ? "directions_car" : "home" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="trips">
        <NativeTabs.Trigger.Label>
          {driving ? "My Rides" : "My Trips"}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "ticket", selected: "ticket.fill" }}
          md={{
            default: "confirmation_number",
            selected: "confirmation_number",
          }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="messages">
        <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "message", selected: "message.fill" }}
          md={{ default: "chat_bubble_outline", selected: "chat_bubble" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>
          {driving ? "Driver" : "Profile"}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md={{ default: "person", selected: "person" }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
