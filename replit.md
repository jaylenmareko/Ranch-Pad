# RanchPad - Livestock Management Platform

## Overview
A full-stack livestock management app for modern ranches. Features include animal tracking, health events, famacha scores, medication records, weather, AI-powered alerts, and ranch/user authentication.

## Architecture

### Monorepo Structure (pnpm workspaces)
- **`artifacts/ranchpad/`** — React + Vite frontend (port 24400, previewPath `/`)
- **`artifacts/api-server/`** — Express + TypeScript REST API backend (port 8080)
- **`lib/db/`** — Drizzle ORM schema + PostgreSQL client (`@workspace/db`)
- **`lib/api-client-react/`** — Generated React Query hooks from OpenAPI spec (`@workspace/api-client-react`)

### Frontend (`artifacts/ranchpad`)
- React 19 + Vite + TypeScript
- Tailwind CSS v4 with warm earth/ranch color palette (forest green, cream, terracotta)
- Fonts: DM Sans (body) + Rokkitt (display)
- Routing: `wouter` with base path from `import.meta.env.BASE_URL`
- State: `@tanstack/react-query` via generated hooks
- Auth: JWT token stored in `localStorage` as `ranchpad_token`
- Auth hook: `artifacts/ranchpad/src/hooks/use-auth.tsx` — `AuthProvider` wraps app, `AuthGuard` protects routes
- Fetch interceptor: `artifacts/ranchpad/src/lib/fetch-interceptor.ts` — handles 401s globally by dispatching `auth-expired` event

### Backend (`artifacts/api-server`)
- Express + TypeScript (ESM, tsx)
- JWT auth middleware: `artifacts/api-server/src/middleware/auth.ts`
- Routes: auth, animals, alerts, famacha, field-notes, health-events, medications, ranch, weather
- Startup: checks DB connectivity, generates initial alerts for all ranches
- Requires env vars: `PORT`, `JWT_SECRET`, `DATABASE_URL`

### Database (`lib/db`)
- PostgreSQL via Drizzle ORM
- Tables: users, ranches, ranch_users, animals, alerts, famacha_scores, field_notes, health_events, medication_records
- Push schema: `pnpm --filter @workspace/db run push`

### API Client (`lib/api-client-react`)
- Auto-generated from OpenAPI spec at `lib/api-client-react/src/openapi.yaml`
- Provides type-safe React Query hooks for all endpoints

## Key Bugs Fixed
- **Login redirect bug**: After login/signup, users were getting redirected back to the landing page. Root cause: `use-auth.tsx` had a `useEffect` that cleared the token on ANY `useGetRanch` query error (network errors, 500s, etc.). The fetch-interceptor already handles true 401s via the `auth-expired` event. Fix: removed the erroneous `useEffect` and changed `isAuthenticated` from `!!token && !isError` to just `!!token`.

## Environment Variables
- `JWT_SECRET` — Secret for signing/verifying JWTs (auto-generated, stored as shared env var)
- `DATABASE_URL` — PostgreSQL connection string (managed by Replit)
- `PORT` — Port for each service (auto-assigned by Replit per workflow)

## Development
- Install: `pnpm install`
- Push DB schema: `pnpm --filter @workspace/db run push`
- Frontend workflow: `artifacts/ranchpad: web`
- API workflow: `artifacts/api-server: API Server`

## Notes
- `bcrypt` is listed in `pnpm-workspace.yaml` `onlyBuiltDependencies` to allow its native build
- The api-client-react package uses `.js` extensions in imports for ESM compatibility
