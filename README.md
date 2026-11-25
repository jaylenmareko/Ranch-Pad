# RanchPad

RanchPad is a mobile-first livestock management platform for ranchers, at ranchpad.app. It covers herd records, ear-tag photo scanning, weights, breeding, and health tracking in one place, built for use in the field.

## What is in this repo

- `artifacts/ranchpad/` is the web app: landing, sign-in, herd and animal pages, alerts, team, and settings.
- `artifacts/api-server/` is the API behind the app: animals, health events, medications, locations, photos, weather, alerts, team, and billing routes.
- `artifacts/mockup-sandbox/` holds design mockups used to explore the app's look before changes land in the real app.
- `lib/` holds shared packages: the database schema, the API spec, and the generated API clients.
- `scripts/` holds workspace scripts, including the post-merge script wired up in `.replit`.
- `CONTEXT.md` is the full project context: product status, priorities, and history.

## Notes

Work on the live app happens through Replit, and this repo is the snapshot that work is pushed to. See `CONTEXT.md` before making changes.
