/** Shared visual language for Vaya passenger and driver screens. */
export const Design = {
  color: {
    primary: "#1765F3",
    primaryDark: "#124DCC",
    primarySoft: "#EAF2FF",
    navy: "#0D2148",
    background: "#F3F6FC",
    surface: "#FFFFFF",
    text: "#112340",
    muted: "#64748B",
    border: "#E2E9F4",
    accent: "#FFCA63",
    success: "#148A67",
  },
  radius: { control: 14, card: 22 },
  type: { caption: 12, body: 15, label: 15, section: 20, title: 30 },
  shadow: { card: "0px 8px 28px rgba(20, 46, 92, 0.07)", button: "0px 6px 16px rgba(23, 101, 243, 0.22)" },
  page: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
} as const;
