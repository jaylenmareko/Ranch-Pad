---
name: ranchpad-context
type: project
routes_to: projects/business/Ranch-Pad/
description: Full context for RanchPad — read before any RanchPad task
---

# RanchPad — Context

## Stage Contract

| | |
|---|---|
| **Stage** | Growth — user acquisition |
| **Done criteria** | 10 paying users on the platform |
| **Next stage** | Double down on the channel that converts; expand outreach |

---

**What:** Mobile-first livestock management platform.
**URL:** ranchpad.app
**Price:** $12/mo, 14-day free trial
**Status:** Built. Growth mode. Focus is user acquisition.
**Target user:** Ranchers and farmers — Kansas and surrounding states.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite |
| Backend | Express |
| Database | PostgreSQL |
| Payments | Stripe |
| AI | Claude API |
| Email | Resend |
| Hosting | Replit |

---

## Current Priority

**Guest onboarding rebuild (product-led growth) — in progress on Replit.**

6-prompt build list for unauthenticated/guest access flow:
1. Ranch name first screen — ✓ done
2. Unauthenticated app access + localStorage (guest route guards) — ✓ done (fixed via `useLocation()` subscription + flattened `location.startsWith()` checks in `App.tsx`, replacing a broken nested `<Switch>` inside `path="*"`)
3. Streamlined first Add Animal form — ✓ done (guest schema: Tag #, Name, Species required; Breed/Sex/DOB/etc. optional; saves to `rp_guest_animals` localStorage key)
4. One-step-at-a-time setup card — ✓ done (`GuestSetupCard.tsx`, 2 steps: Add Animal → Add Location; collapses to "Setup complete 🎉" dismissible row, `rp_guest_setup_dismissed` localStorage key)
5. First alert celebration — ✓ done (demo alert card on Alerts page for guests with ≥1 animal; species-personalized screwworm/barber pole/WNV message; "Example" badge; `rp_guest_seen_demo_alert` localStorage key; shows once then reverts to plain empty state)
6. "Save your ranch" prompt timing — ✓ done (`GuestSavePrompt.tsx`, floating card global to all guest pages; triggers on 2+ animals, full setup completion, or 3+ sessions; 24h dismiss cooldown via `rp_guest_save_prompt_dismissed_at`; suppressed when setup card or demo alert card is visible)

**All 6 prompts complete and verified live on ranchpad.app as of 2026-06-17/18.** Guest onboarding rebuild is feature-complete.

**Prompt 7 (extension, in progress):** Make scan-photo the default first-animal entry point for guests, not the manual form. A `ScanPhotoDialog.tsx` (Claude vision OCR of record books/tag lists) already exists but is wired for authenticated users only and hits the real paid API — needs a guest-safe rate-limited path that saves to localStorage instead. Manual entry and CSV upload become secondary fallback buttons, not the default.

**Prompt 8 — done and verified live on ranchpad.app (2026-06-18):** Guest onboarding is now a forced 2-step wizard (`/onboarding` route) instead of a passive Herd-page checklist. Flow: ranch name entry → `/onboarding` Step 1 of 2 "Add your first animal" (scan-photo primary CTA, Add Manually / Upload CSV secondary, from Prompt 7) → after adding 1 animal, auto-advances to Step 2 of 2 "Add your location" (skippable) → lands on Herd page with bottom nav, `rp_guest_onboarding_wizard_done` set, no setup card.

**Refresh behavior (fixed 2026-06-18):** Refreshing while onboarding is incomplete (no animal yet, or animal added but location step not finished) wipes all guest localStorage and returns to the ranch-name landing page — verified via Playwright on ranchpad.app for both sub-cases. Refreshing AFTER onboarding is complete (`rp_guest_onboarding_wizard_done` set) does NOT wipe anything — verified data survives multiple consecutive refreshes, guest lands on Herd page with their animals intact every time. This was a real regression caught before being left alone (initial version wiped on every refresh regardless of completion, which would have defeated the entire purpose of the Prompt 6 "save your ranch" nudge) — fixed by gating the wipe-on-refresh logic in `main.tsx` behind the wizard-done flag.

**Prompt 9 (9a+9b combined) — VERIFIED LIVE on ranchpad.app (2026-06-18).** Full 9-screen one-field-per-screen wizard confirmed end-to-end via Playwright: 1 Tag # → 2 Name → 3 Species (icon select) → 4 Sex (optional, species-aware: Heifer/Cow/Bull/Steer for Cattle) → 5 Breed (optional) → 6 DOB (optional, tested Skip path) → 7 Breeding Status (optional: Open/Bred·Pregnant/Nursing·Lactating/Other) → 8 Parentage (optional: Sire/Dam) → 9 Review & Confirm (correctly omits skipped DOB, shows all entered fields) → Add Animal saves to `rp_guest_animals` and auto-advances to onboarding Step 2 of 2 (location, skippable) → lands on Herd page with animal + ranch name intact. Confirmed data survives a page refresh post-completion (no wipe regression). Guest onboarding rebuild is now fully feature-complete through Prompt 9.

(Fixed earlier blocker: Playwright MCP Chrome profile `mcp-chrome-d3882a8` had orphaned processes holding the singleton lock — resolved by killing all chrome.exe processes with that `--user-data-dir` and removing `SingletonLock`/`SingletonSocket`/`SingletonCookie`, no Claude Code restart needed.)

**Prompt 10 — Fix broken guest scan limit. VERIFIED LIVE on ranchpad.app (2026-06-18).** Found via live testing + reading the production JS bundle: the intended 3-scan guest cap (`rp_guest_scan_count` in localStorage, limit=3) only worked on the onboarding Step 1 "Scan photo" button — the post-onboarding "Add from Photo" entry point never checked or incremented it (tested 6 consecutive scans through it pre-fix, all succeeded, counter stuck at 1).

Replit fix: extracted shared utility `src/lib/guestScanLimit.ts` (`SCAN_LIMIT = 3`, `getScanCount()`, `incrementScanCount()`, `isScanLimitReached()`), used by both `GuestAddChoiceScreen` (onboarding) and `ScanPhotoDialog` (post-onboarding Add tab). Gate skipped entirely for authenticated users.

Re-tested end-to-end with a fresh guest: scan #1 via onboarding (count 0→1) → completed onboarding → scan #2 via Add tab → Add from Photo (count 1→2, confirmed this path now increments — the actual bug fix) → scan #3 via same path (count 2→3, hit limit) → attempt #4 via "Try another photo" loop-back (the original bypass vector) → correctly blocked, shows "Sign up to keep scanning records" → attempt #4 via fresh "Add from Photo" entry → also correctly blocked. Counter is shared and cumulative across both entry points as intended. No further action needed on this item.

Guest localStorage keys in use: `rp_guest_ranch_name`, `rp_guest_animals` (JSON array), `rp_guest_lat`/`rp_guest_lon`.

Work happens directly via Replit agent prompts (not pulled into this repo yet — `artifacts/ranchpad/` snapshot here is stale relative to Replit).

**Other active tasks (older, still pending):**
- Push Landing.tsx hero headline to Replit: *"Never lose a record. Never miss a medication. Never lose an animal to preventable disease."*
- Monitor FFA batch (1,473 emails sent 2026-04-27) for replies
- DM creator targets on IG: @veaterranch, @jamesbigleyranches, @cowhorsegallery, @twobabesonebarn, @rancher.life
- 3 creator emails sent (oceanofgrassfilm, americanimplement, legacybrokergroup) — monitor replies

---

## File Map

```
Ranch-Pad/
├── CONTEXT.md               ← you are here
├── outreach/
│   ├── ffa/
│   │   ├── data/            ← CSV contact lists by state (50 states scraped)
│   │   ├── scrapers/        ← apify_ffa_scraper.mjs, ksffa_scraper.py, scrape_ffa_advisors.py
│   │   └── scripts/         ← send_ranchpad_all.mjs, send_ranchpad_remaining.mjs, cancel_and_send_now.mjs, etc.
│   ├── creators/
│   │   ├── data/            ← creators.csv, sent_log.csv
│   │   ├── scrapers/        ← scrape_creators.mjs, process_profiles.mjs
│   │   └── scripts/         ← send_creators.mjs
│   ├── farm-bureau/
│   │   └── nefb/
│   │       ├── data/        ← nefb_regional_managers.csv
│   │       └── scrapers/    ← nefb_scraper.py
│   ├── ffa-email-sender/    ← package.json (Node deps for email scripts)
│   └── scripts/             ← general outreach scripts (track_replies.py — planned)
├── marketing/               ← copy, campaign assets
├── research/                ← market research
└── scripts/                 ← app-level scripts (post-merge.sh, build scripts)
```

---

## Outreach State

| Channel | Volume | Status |
|---|---|---|
| FFA instructors (batch email) | 1,473 sent 2026-04-27 | Monitoring for replies |
| Creators (email) | 3 sent (oceanofgrassfilm, americanimplement, legacybrokergroup) | Monitoring |
| Creators (IG DM) | 5 targets queued | Not started |
| NEFB regional managers | Data scraped | Not sent |

---

## Warm Contacts

- FFA instructors — outreach data in `outreach/ffa/data/`
- NEFB regional managers — `outreach/farm-bureau/nefb/data/`

---

## App Repo

GitHub: github.com/jaylenmareko (push from here → pull into Replit)
Never touch production without asking Jay first.
