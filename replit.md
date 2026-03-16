# RanchPad

## Overview

RanchPad is a full-stack livestock management platform for small farmers and ranchers. It features JWT authentication, animal records with lineage tracking, health events, FAMACHA scores, medications, field notes, AI-powered weather alerts, and a mobile-first React frontend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Auth**: JWT (jsonwebtoken + bcrypt)
- **AI**: Anthropic Claude (claude-sonnet-4-5) for weather alert analysis
- **Weather**: OpenWeatherMap API

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080)
│   └── ranchpad/           # React + Vite frontend (previewPath: /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── replit.md
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. Always typecheck from the root:

- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`
- `pnpm run build` — runs typecheck, then recursively builds all packages

## Database Schema

All tables in PostgreSQL via Drizzle ORM (`lib/db/src/schema/`):

- **users** — email, bcrypt password hash, name
- **ranches** — name, city, state, lat/lon
- **ranch_users** — many-to-many join with roles (owner/viewer)
- **animals** — name, species, sex, tag number, date of birth, dam/sire (self-referential), notes, status
- **medication_records** — animal FK, medication name, dose, frequency, dates, vet info
- **health_events** — animal FK, event type, severity (low/medium/high), notes, date
- **famacha_scores** — animal FK, score (1-5), date, notes
- **field_notes** — animal FK, free-text notes with date
- **alerts** — ranch FK, optional animal FK, alert type, message, severity, dismissed flag, alert key (idempotency)

## API Routes (all at /api/)

### Auth
- `POST /api/auth/signup` — create user + ranch, returns JWT
- `POST /api/auth/login` — returns JWT

### Ranch
- `GET /api/ranch` — ranch profile with weather coords
- `PUT /api/ranch` — update ranch name/location

### Animals
- `GET /api/animals` — list all for ranch (optional `?search=`)
- `POST /api/animals` — create animal
- `GET /api/animals/:id` — animal detail with lineage/offspring
- `PUT /api/animals/:id` — update animal
- `DELETE /api/animals/:id` — soft delete

### Sub-resources (all under /api/animals/:animalId)
- `GET/POST /api/animals/:id/medications`
- `GET/POST /api/animals/:id/health-events`
- `GET/POST /api/animals/:id/famacha`
- `GET/POST /api/animals/:id/field-notes`

### Alerts
- `GET /api/alerts` — list active/all alerts
- `POST /api/alerts/generate` — run AI + record-based alert generation
- `PATCH /api/alerts/:id/dismiss` — dismiss alert

### Weather
- `GET /api/weather` — proxy to OpenWeatherMap for ranch location

## Authentication

- JWT stored in `localStorage` as `"ranchpad_token"`
- Fetch interceptor (`src/lib/fetch-interceptor.ts`) auto-injects `Authorization: Bearer <token>` for all `/api/` requests
- Auto-logout on 401 via `auth-expired` DOM event

## Alert System

Record-based alerts check:
- Medications ending within 3 days
- FAMACHA score ≥ 4 or 3 consecutive worsening scores
- Health events with medium/high severity in past 7 days

AI weather alerts:
- Calls OpenWeatherMap for current conditions
- Sends prompt to Anthropic claude-sonnet-4-5 with weather data
- Generates ranch-relevant alerts (extreme heat/cold, high winds, drought, flood risk)
- Idempotency via `alertKey` (date + type + animal_id) — no duplicates

## Frontend Pages

- `/login` — Login + Signup tabs with ranch setup on first login
- `/` — Dashboard: herd stats, weather widget, active alerts
- `/animals` — Herd directory with search and species filter
- `/animals/new` — Add animal form
- `/animals/:id` — Animal detail with health history, FAMACHA sparkline, medications, field notes, lineage
- `/alerts` — Full alerts list with dismiss

## Environment Variables / Secrets

- `DATABASE_URL` — PostgreSQL (provided by Replit automatically)
- `JWT_SECRET` — secret for signing JWTs
- `OPENWEATHERMAP_API_KEY` — for weather data
- `ANTHROPIC_API_KEY` — for AI weather alert analysis

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — CORS, JSON parsing, routes at `/api`
- Auth middleware: `src/middlewares/auth.ts` (requireAuth)
- JWT utils: `src/lib/jwt.ts`
- Routes: `src/routes/index.ts` mounts all sub-routers

### `artifacts/ranchpad` (`@workspace/ranchpad`)

React 19 + Vite frontend.

- Preview path: `/` (root)
- `src/App.tsx` — router, providers
- `src/hooks/use-auth.tsx` — auth context
- `src/lib/fetch-interceptor.ts` — auto JWT injection
- Pages in `src/pages/`

### `lib/db` (`@workspace/db`)

- `src/schema/index.ts` — all Drizzle table definitions
- `drizzle.config.ts` — Drizzle Kit config
- Push: `pnpm --filter @workspace/db run push`

### `lib/api-spec` (`@workspace/api-spec`)

- `openapi.yaml` — full OpenAPI 3.1 spec for all RanchPad endpoints
- Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks used by the frontend.

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas used by the API server for validation.
