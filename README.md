# Vaya

Vaya is a South African mobility platform focused first on scheduled long-distance shared travel, with local on-demand rides as a second mode.

## Current architecture

- `mobile/` — Expo + React Native app with passenger and driver modes
- `web/` — Next.js landing page, Admin CRM, and REST API routes
- Database — Neon Postgres with Drizzle ORM migrations
- Backend/API — Next.js Route Handlers backed by Neon for CRM reads and mutations

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

> Security: the Admin CRM API routes require an authentication/authorization layer before public production exposure. Database persistence is implemented separately from admin identity and access control.

## Neon backend

The Vaya Admin CRM uses Neon Postgres with Drizzle ORM.

### Environment

Copy `web/.env.example` to `web/.env.local` and set:

```bash
DATABASE_URL="postgresql://user:password@your-neon-pooler-host/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:password@your-neon-direct-host/neondb?sslmode=require"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Use the pooled Neon connection string for application traffic. Use the direct/unpooled connection string for Drizzle migrations; the migration hostname must not contain `-pooler`.

### Database commands

Run these from `web/`:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

- `db:generate` creates SQL migrations from `web/lib/db/schema.ts`.
- `db:migrate` applies committed migrations to the configured Neon database.
- `db:seed` is idempotent and loads development/demo CRM records.
- `db:studio` opens Drizzle Studio.

### Admin API

The CRM currently uses:

- `GET /api/admin/dashboard` — load drivers, trips, bookings, passengers, payments, safety cases, and activity.
- `PATCH /api/admin/drivers/:id` — update driver verification status.
- `POST /api/admin/trips` — create a trip.
- `POST /api/admin/passengers` — create a passenger.
- `POST /api/admin/safety-cases` — create a safety/dispute case.
- `GET /api/health` — report application/database configuration health.

When `DATABASE_URL` is absent, the Admin CRM explicitly falls back to preview mode and does not claim changes are persisted.

### Deployment

Set `DATABASE_URL` in the deployment environment before enabling production CRM use. Keep `DATABASE_URL_UNPOOLED` available only where migrations run; the runtime application does not need the direct connection. Apply migrations and seed only the environments that need seed data. Database credentials must never use a `NEXT_PUBLIC_` prefix.

