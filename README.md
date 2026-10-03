# Vaya

Vaya is a South African mobility platform focused first on scheduled long-distance shared travel, with local on-demand rides as a second mode.

## Current architecture

- `mobile/` — Expo + React Native app with passenger and driver modes
- `web/` — Next.js admin operations and driver-verification dashboard
- Backend/API — next implementation phase after the core product flows are locked

## Design direction

Vaya uses a Facebook-inspired visual language: confident blue, white surfaces, soft neutral backgrounds, rounded cards, clear typography, and familiar mobile interaction patterns. It does not copy Facebook layouts or brand assets.

## Initial MVP

1. Authentication and role selection
2. Driver onboarding and verification
3. Vehicle onboarding
4. Admin verification dashboard
5. Long-distance trip publishing
6. Route and stop matching
7. Seat and luggage booking
8. Messaging and notifications
9. Payments and payouts
10. Local ride mode

## Local development

```bash
npm install
npm run dev:mobile
npm run dev:web
```

`npm run mobile` is an alias for `npm run dev:mobile`. Run installs from the repository root and use the root `package-lock.json` for both workspaces.

The root development dependency on `expo-router` lets Expo's hoisted route-generation tooling resolve the router when generating mobile route types. Keep its version aligned with `mobile/package.json` when upgrading the Expo SDK.

The long-distance marketplace is the primary launch scope. Local ride dispatch comes after the scheduled-trip flow is production-ready.
