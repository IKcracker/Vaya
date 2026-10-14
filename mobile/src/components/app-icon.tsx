import { SymbolView } from "expo-symbols";
import { Design } from "@/constants/design";

const icons = {
  home: { ios: "house.fill", android: "home", web: "home" },
  search: { ios: "magnifyingglass", android: "search", web: "search" },
  ticket: { ios: "ticket.fill", android: "confirmation_number", web: "confirmation_number" },
  messages: { ios: "bubble.left.and.bubble.right.fill", android: "chat_bubble", web: "chat_bubble" },
  profile: { ios: "person.crop.circle", android: "account_circle", web: "account_circle" },
  car: { ios: "car.fill", android: "directions_car", web: "directions_car" },
  wallet: { ios: "creditcard", android: "account_balance_wallet", web: "account_balance_wallet" },
  pin: { ios: "mappin.and.ellipse", android: "location_on", web: "location_on" },
  shield: { ios: "checkmark.shield.fill", android: "verified_user", web: "verified_user" },
  clock: { ios: "clock", android: "schedule", web: "schedule" },
  arrow: { ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" },
  back: { ios: "chevron.left", android: "arrow_back", web: "arrow_back" },
  onward: { ios: "arrow.up.right", android: "north_east", web: "north_east" },
  bell: { ios: "bell", android: "notifications_none", web: "notifications_none" },
  plus: { ios: "plus", android: "add", web: "add" },
  road: { ios: "point.topleft.down.curvedto.point.bottomright.up", android: "route", web: "route" },
} as const;
export type AppIconName = keyof typeof icons;

export function AppIcon({ name, size = 22, color = Design.color.primary }: {
  name: AppIconName; size?: number; color?: string;
}) {
  return <SymbolView name={icons[name]} size={size} tintColor={color} />;
}
