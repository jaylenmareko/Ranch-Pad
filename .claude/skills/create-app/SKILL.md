---
name: create-app
description: Scaffolds a new web or mobile project end-to-end — competitor research via web search + Playwright UX scraping, stack selection, project structure, git/GitHub setup, staging environment, integration wiring, and a manual publish-gated deploy workflow. Use when starting a new app, website, SaaS, or mobile project from scratch, or when user says "build", "create", "start a new project", "new app", or "new site".
---

# create-app

## Quick start

User describes what they're building. Run all 8 phases in order. See [PHASES.md](PHASES.md) for full detail on each phase.

## Phases (run in order)

1. **INTAKE** — ask 4 questions, never skip
2. **STACK** — select and confirm stack based on app type
3. **DISCOVER** — web search finds competitors automatically (no URLs from user)
4. **RESEARCH** — Playwright walks each competitor as a fake user, stops at payment wall
5. **BRIEF** — generate `research/flows.md`, `research/aesthetic.md`, `research/steal-list.md`
6. **SCAFFOLD** — folder structure, git, GitHub, branches, `.env.example`, `CONTEXT.md`
7. **INTEGRATIONS** — wire core + conditional services based on intake answers
8. **HANDOFF** — print manual config checklist

## Publish workflow (non-negotiable)

```
dev branch  →  Vercel preview URL  (auto-updates, only you can see)
                        ↓
              test it, looks good?
                        ↓
         pnpm run publish:prod  →  production
```

`publish:prod` script: run tests locally → on pass, `vercel --prod`  
Auto-deploy on `main` is **always disabled** in Vercel settings.

## Stack defaults

| App type         | Stack                                      |
|------------------|--------------------------------------------|
| Web SaaS         | Next.js 15 + App Router + Tailwind + shadcn/ui |
| Marketing site   | Next.js 15 + Tailwind + shadcn/ui          |
| Mobile app       | React Native + Expo + expo-router          |
| Internal tool    | Next.js 15 + Tailwind + shadcn/ui          |

See [PHASES.md](PHASES.md) for integration matrix and full scaffold spec.
