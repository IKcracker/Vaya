# Vaya mobile

Expo SDK 57 app for scheduled shared travel, with passenger and driver modes on one account. Routes live in `src/app/`.

## Run locally

From the repository root:

```sh
npm install
npm run dev:mobile
npm run lint --workspace mobile
npm run typecheck --workspace mobile
node --test scripts/*.test.cjs
```

On Windows PowerShell, use `npm.cmd` if the execution policy blocks `npm.ps1`.

Launch the app from the repository root with `npm.cmd start -- --clear` or
`npm.cmd run mobile -- --clear`. `npm run dev` starts both the mobile and web
workspaces. If using Expo directly from the repository root, specify the app
directory: `npx.cmd expo start mobile --clear`. Inside `mobile/`, use
`npx.cmd expo start --clear`.

An `expo/AppEntry.js` error about `../../App` means Expo is using the default
entry from the wrong project directory. Stop that Metro server with Ctrl+C,
restart using one of the commands above, and open the new QR code or web URL.
The mobile app uses `expo-router/entry`; its screens are in `mobile/src/app/`.

Set `EXPO_PUBLIC_API_URL` in `mobile/.env` to the backend origin, without `/api`. The current deployed backend is `https://vaya-wego.vercel.app`. For Expo Web, the backend must allow the exact browser origin in `MOBILE_WEB_ORIGINS`. The root README covers backend Auth, database and Paystack configuration.

Install SDK dependencies with `npx expo install <package>` from `mobile/`. Keep the root React, Expo Router and native navigation/animation dependency versions aligned with the mobile workspace so hoisted router dependencies use the same runtime. The web workspace retains its own React version.

## Visual design

The app uses a shared navy and blue palette in `src/constants/design.ts`, with reusable brand, icon, journey hero and account-state components. Home route-discovery cards open real searches; trip cards and fares come from the API.

The locally bundled hero image is `assets/images/journey-hero.png`, generated with the built-in image-generation tool. Prompt brief: cinematic South African mountain-road travel photograph, Drakensberg scenery, a blue car on a winding road, blue sky and warm grass, space for text on the left, natural photography, no lettering or logos. It is decorative travel imagery, not a photograph of an advertised route or driver.

## Passenger flow

1. Search a departure city, destination, date and seat count.
2. Open a ride and review its route, driver, departure and availability.
3. Sign in and review the fare per seat and total before reserving. The backend rechecks availability, departure and the quoted fare.
4. Pay through hosted Paystack checkout. The server confirms payment; closing checkout does not confirm a booking.
5. Return to **My Trips** to resume payment, follow an active journey or review a completed ride. Active journeys remain visible after their scheduled departure.
6. Release an unpaid reservation before checkout starts. Once a payment attempt exists, use support for cancellation or refund assistance. Release operations are atomic and safe to retry.

If a booking request loses its connection, check **My Trips** before reserving again.

## Driver flow

1. Choose driver mode, complete the application, add a vehicle and upload verification documents.
2. Wait for driver and vehicle approval. Publishing requires approved documents and an approved vehicle.
3. Publish a ride and open its management screen.
4. Review passenger names, booking references, seat counts and payment statuses; message passengers from their booking row.
5. Mark the ride on schedule or boarding and share location when permissions and account preferences permit it.
6. Confirm completion or cancellation. These operations close the ride and update passenger bookings in one transaction. Closed rides cannot reopen; boarding cannot revert to an editable state. Late payment settlement preserves cancelled or completed booking states.

Native apps use Google Maps on Android and Apple Maps on iOS. Expo Web renders a route overview from backend coordinates, including the driver's latest position, without importing native map code.

## Build and device verification

Preview and production EAS profiles include the deployed API URL so builds do not fall back to localhost. Deploy the current `web/` backend before testing the new reservation release and driver passenger-list endpoints. No schema migration is needed for these changes.

Configure `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in the chosen EAS environment for Android maps, restricted to the app package and signing certificate. `app.config.js` passes it to the Maps config plugin. SecureStore and background location plugins are included in `app.json`.

```sh
cd mobile
npx expo install --check
npx expo export --platform all
npx eas-cli@latest build --profile preview --platform android
```

Before release, test on physical devices: sign-in restoration, verification uploads, trip publishing, two-account booking and messaging, Paystack test checkout, seat release, background location, and trip completion/cancellation. Native bundle export validates compilation; it does not replace signed builds or device testing.

Refunds and payouts require operational/payment-provider handling. Unpaid reservations do not expire automatically. Local on-demand dispatch is outside the scheduled-trip launch scope.
