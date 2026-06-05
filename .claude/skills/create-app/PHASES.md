# create-app — Phase Reference

---

## Phase 1: INTAKE

Ask these 5 questions upfront. Do not proceed without answers.

1. What are you building? _(1 sentence)_
2. App type: `web-saas` / `marketing-site` / `mobile-app` / `internal-tool`
3. Project category: `business` / `personal` / `school` / `music`
4. Auth needed? (y/n)
5. Payments needed? (y/n)

Store answers — they drive every downstream decision.

Project will be created at: `projects/[category]/[project-name]/`  
Session file will be created at: `sessions/[category]/[project-name]/session.md`

---

## Phase 2: STACK SELECTION

| App type        | Stack                                              |
|-----------------|----------------------------------------------------|
| web-saas        | Next.js 15 (App Router) + Tailwind CSS + shadcn/ui |
| marketing-site  | Next.js 15 (App Router) + Tailwind CSS + shadcn/ui |
| mobile-app      | React Native + Expo SDK + expo-router              |
| internal-tool   | Next.js 15 (App Router) + Tailwind CSS + shadcn/ui |

Confirm stack with user before moving on.

---

## Phase 3: DISCOVER

Use WebSearch to find competitors automatically. No URLs from user.

Search queries to run:
- `"best [description keyword] apps"`
- `"top [niche] companies"`
- `"[product type] alternatives"`

Extract 3–5 real competitor domains. Deduplicate. Skip obvious non-competitors (Wikipedia, Reddit, App Store listings, etc).

Output: list of competitor URLs passed to Phase 4.

---

## Phase 4: RESEARCH (Playwright)

**Note — mobile app type only:** Playwright is web-only. If app type is `mobile-app`, run Playwright on each competitor's marketing/web site, then add a manual note in `research/flows.md`: "Check App Store screenshots and preview videos for mobile UX flows."

For each competitor URL, run the following sequence using Playwright MCP:

1. Navigate to homepage → screenshot
2. **Dismiss cookie/consent popups first** — look for buttons containing "Accept", "Accept all", "I agree", "Got it", "Continue", "OK". Click the first match. If a consent iframe exists, switch to it first. Do this before any other interaction.
3. Find primary CTA ("Get started", "Sign up", "Try free") → click
4. Walk through signup / onboarding flow as a fake user (use fake name, `test@example.com`, etc.)
5. Navigate to pricing page → screenshot
6. Click upgrade / buy / checkout → screenshot the payment/paywall page
7. **STOP** — never fill card details, never submit payment forms
8. If site requires real email verification to proceed, screenshot what's visible and move on

Save all screenshots to `research/[competitor-name]/`:
- `01-homepage.png`
- `02-signup.png`
- `03-onboarding-[step].png`
- `04-pricing.png`
- `05-checkout-wall.png`

---

## Phase 5: BRIEF GENERATION

Generate 3 files from Phase 4 findings:

### `research/flows.md`
For each competitor:
- Steps from homepage → transaction wall (numbered)
- CTA copy used at each step
- Friction points (what slows a user down)
- What they do well

### `research/aesthetic.md`
For each competitor:
- Dominant colors (approximate hex or description)
- Font style (serif / sans-serif / mono, weight)
- Spacing density (tight / balanced / airy)
- Animation style (none / subtle / heavy)
- Section order pattern (e.g. Hero → Social proof → Features → Pricing → CTA)
- Overall vibe (e.g. "clean SaaS", "bold consumer", "earthy/natural")

### `research/steal-list.md`
- Specific flows worth copying (with source)
- UX patterns worth copying (with source)
- Aesthetic elements worth copying (with source)
- Anything to explicitly avoid

---

## Phase 6: SCAFFOLD

### Folder structure (web)
```
project-name/
├── app/
│   └── auth/
│       └── callback/
│           └── route.ts   ← required for Supabase Auth (OAuth + magic links)
├── components/
├── lib/
│   ├── supabase/
│   │   ├── client.ts      ← browser client
│   │   └── server.ts      ← server component client
├── public/
├── research/          ← from Phase 5 (gitignored)
├── artifacts/
├── outreach/
├── .env
├── .env.example
├── .gitignore
├── CONTEXT.md
├── package.json
└── README.md
```

### Folder structure (mobile)
```
project-name/
├── app/               ← expo-router
├── components/
├── lib/
├── assets/
├── research/
├── artifacts/
├── outreach/
├── .env
├── .env.example
├── .gitignore
├── CONTEXT.md
└── package.json
```

### `.gitignore` (always create this)
```
.env
.env.local
.next/
node_modules/
.expo/
research/
```

### Session file
Always create at scaffold time:
```
sessions/[category]/[project-name]/session.md
```
Starter content:
```md
# [Project Name] — Session Log

## [date] — Project initialized
- Scaffolded via create-app skill
- Stack: [stack from Phase 2]
- Competitors researched: [list from Phase 3]
```

### Git setup
Run in this exact order — initial commit must exist before pushing:
```bash
git init -b main
git add .
git commit -m "init"
gh repo create project-name --private --source=. --push
git checkout -b dev
git push -u origin dev
```

### Branch rules
- `main` = production. Auto-deploy **disabled** in Vercel settings. Only updated via `publish:prod`.
- `dev` = staging. Vercel auto-previews every push.

### `publish:prod` script in package.json

**Web:**
```json
"publish:prod": "vitest run --passWithNoTests && vercel --prod"
```
Requires `vercel` CLI installed globally: `npm i -g vercel`

**Mobile:** Vercel does not deploy mobile apps. Use EAS Build instead:
```json
"publish:prod": "vitest run --passWithNoTests && eas build --platform all --auto-submit"
```
Requires `eas-cli` installed globally: `npm i -g eas-cli`

### CONTEXT.md template
```md
# [Project Name]

## Stage
MVP Build

## Done criteria
- [ ] Core user flow works end-to-end
- [ ] Auth + DB connected
- [ ] Deployed to production via publish:prod

## Next stage
Beta / Soft Launch

## Stack
[filled from Phase 2]

## Priority today
[filled by user]

## Competitive brief
See research/steal-list.md

## Notes
[blank]
```

---

## Phase 7: INTEGRATIONS

Phase 7 appends all env var slots to the `.env.example` created in Phase 6.

### Always included

**Web (Next.js):**
| Service  | Purpose             | Env var slots |
|----------|---------------------|---------------|
| Vercel   | Deploy              | — (CLI-based) |
| Supabase | DB + Auth           | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_STAGING_URL`, `SUPABASE_STAGING_ANON_KEY` |
| Resend   | Transactional email | `RESEND_API_KEY`, `RESEND_STAGING_API_KEY` |
| App URL  | Auth callbacks, email links, OG images | `NEXT_PUBLIC_APP_URL` (e.g. `https://yourapp.com`), `NEXT_PUBLIC_STAGING_URL` |

**Mobile (Expo):**
| Service  | Purpose             | Env var slots |
|----------|---------------------|---------------|
| EAS      | Deploy              | — (CLI-based) |
| Supabase | DB + Auth           | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Resend   | Transactional email | `RESEND_API_KEY`, `RESEND_STAGING_API_KEY` |

Note: `NEXT_PUBLIC_` = accessible client-side in Next.js. `EXPO_PUBLIC_` = accessible client-side in Expo. `SUPABASE_SERVICE_ROLE_KEY` is always server-only — never expose to client.

### Conditional
| Condition         | Service       | Env var slots (web / mobile)                         |
|-------------------|---------------|------------------------------------------------------|
| payments=y        | Stripe        | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (or `EXPO_PUBLIC_`), `STRIPE_WEBHOOK_SECRET`, `STRIPE_TEST_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY` |
| AI features       | Anthropic     | `ANTHROPIC_API_KEY`                                  |
| Scraping needed   | Apify         | `APIFY_API_TOKEN`                                    |
| Rate limiting     | Upstash Redis | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Background jobs   | Trigger.dev   | `TRIGGER_API_KEY`, `TRIGGER_API_URL`                 |
| Analytics         | PostHog       | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (web) or `EXPO_PUBLIC_POSTHOG_KEY` (mobile) |
| Error tracking    | Sentry        | `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`                    |
| SMS               | Twilio        | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |

All slots go into `.env.example` with empty values. Never populate real keys.

### Staging env var pattern
```
# Production
NEXT_PUBLIC_SUPABASE_URL=
STRIPE_SECRET_KEY=            # sk_live_...

# Staging
NEXT_PUBLIC_SUPABASE_STAGING_URL=
STRIPE_TEST_SECRET_KEY=       # sk_test_...
RESEND_STAGING_API_KEY=       # use a separate Resend API key pointed at a test domain
```

---

## Phase 8: HANDOFF

Print this checklist at the end. User must complete manually.

```
SETUP CHECKLIST
───────────────────────────────────────────────────
REQUIRED INSTALLS
[ ] Install Vercel CLI: npm i -g vercel          (web only)
[ ] Install EAS CLI:    npm i -g eas-cli         (mobile only)

SUPABASE
[ ] Create production Supabase project → paste into NEXT_PUBLIC_SUPABASE_URL + keys
[ ] Create staging Supabase project   → paste into NEXT_PUBLIC_SUPABASE_STAGING_URL + keys

VERCEL (web only)
[ ] Run: vercel link   (connects local project to Vercel)
[ ] Vercel dashboard → Settings → Git → disable auto-deploy on main branch
[ ] Add all env vars in Vercel dashboard:
    - Preview environment  → staging vars
    - Production environment → production vars

EAS (mobile only)
[ ] Run: eas init      (links project to Expo Application Services)
[ ] Configure eas.json for build profiles (development / preview / production)

EMAIL
[ ] Add Resend domain + sender address (production)
[ ] Create a second Resend API key for staging → paste into RESEND_STAGING_API_KEY

STRIPE (if payments)
[ ] Add Stripe test keys (sk_test_...) for staging
[ ] Add Stripe live keys (sk_live_...) for production
[ ] Note: STRIPE_WEBHOOK_SECRET is generated per-environment in Stripe dashboard

FINAL CHECK
[ ] Confirm .env is in .gitignore and NOT committed
[ ] Test publish gate: pnpm run publish:prod (should run tests then deploy)
───────────────────────────────────────────────────
After checklist: all work happens on dev branch.
Ship to production via: pnpm run publish:prod
```
