# PJRoutes — Session Log

---

## 2026-05-13

**Done this session:**
- Built full Next.js 14 marketplace (landing, flights, booking, operator form, admin, auth)
- Supabase project `rjqwjfzvhkdkdjldlnqs` — schema run, auth OTP configured
- Vercel deployed — all 9 env vars set, build passing, live at `https://pjroutes.vercel.app`
- GitHub repo created — `github.com/jaylenmareko/pjroutes-`
- Removed SVG logo from Navbar, AuthModal, and auth page — text-only wordmark
- Fixed Resend build error (lazy initialization)
- Renamed project folder from `skyleg` to `pjroutes`
- Created CONTEXT.md

**Pending (carried forward):**
- Swap Stripe test keys → live keys before first real booking

---

## 2026-05-15

**Focus:** End-to-end testing and feature completion.

**Confirmed working:**
- OTP auth — 8-digit codes, no magic links, from `support@pjroutes.com`
- Navbar auth state — email + dropdown (My Bookings / My Listings / List a Flight / Sign out)
- My Bookings (`/bookings`) — shows real bookings, RLS fixed
- My Listings (`/listings`) — shows operator's flights, booked flights show passenger contact info
- Booking flow end-to-end — card + ACH (PaymentElement), success page, flight disappears after booking
- Passenger confirmation email — flight details, receipt, FBO address, Stripe receipt link
- Operator notification email — passenger contact info
- Admin (`/admin`) — pending queue, Approve/Reject working
- Demo flights removed — only real DB flights show
- FBO address on operator form and in confirmation email
- Broker language removed everywhere
- PJR favicon

**Remaining:**
1. Fix operator form datetime bug — `depart_start`/`depart_end` don't update React state when set via JS; form submits empty → Supabase insert fails silently
2. Swap Stripe test → live keys in Vercel env vars
3. Enable Stripe bank transfer instruction emails — Stripe dashboard → Settings → Customer emails (manual toggle)
4. Delete test data before going live
5. Operator outreach — 402 contacts in `outreach/tier1-operators-enriched.csv`

---

## 2026-05-18 [AUTO]

### Phase 1 — Market Snapshot

**Markets:**
- S&P 500: 7,408.50 (-1.24%)
- Dow Jones: 49,526.17 (-1.07%)
- Nasdaq: 26,225.15 (-1.54%)
- Bitcoin: ~$78,350 (+0.48%)
- Macro headwinds: US inflation at 3.8% (above 3.7% forecast), oil elevated on US-Iran deal uncertainty

**Top 3 Aviation/Logistics Headlines:**
1. WingX: Global business aircraft utilization on track for ~5% YoY growth — record high expected in 2026
2. Gama Aviation acquired charter broker Hunt & Palmer — consolidation accelerating in charter space
3. MD Aircraft signs LOI for 20 eViator electric aircraft with Aerova for autonomous air logistics corridors

**New AI/Routing Dev Tools (last 7 days):**
- Avi-Go gaining traction: NBAA/EBAA-backed AI charter marketplace with real-time quoting, flight tracking, analytics — direct pjroutes competitor
- NextBillion.ai: enterprise-grade AI routing with deep logistics customization
- GIS + ML framework published for aircraft route classification at airport networks (MDPI, May 2026)

---

### Phase 2 — pjroutes Market Intel

**FAA / Regulatory:**
- FAA restored public Part 135 operator list (data refreshed April 27, 2026) — was pulled in Feb due to data errors; accurate list now usable for outreach targeting
- 14 CFR Part 135 last amended May 8, 2026 — specifics unknown, worth reviewing
- NBAA released new "Operations Specifications Guide" for Part 135 operators (March 30, 2026) — plain-language ops specs breakdown, useful for operator onboarding content
- FAA has ~24 active enforcement cases against illegal gray-charter operators — regulatory pressure on unlicensed operators increasing

**Market Trends:**
- Private aviation market growing ~4.5% annually; APAC and LATAM leading expansion
- Demand shift toward on-demand platforms and operator-direct booking (away from broker middlemen)
- New entrant: Freedom Air (FAA-licensed Oct 2025, expanding in Utah and SF Bay Area)
- Gama/Hunt & Palmer consolidation = fewer independent brokers → pjroutes operator-direct model is well-timed

**Competitors:**
- Avi-Go: AI charter marketplace, broker-to-operator focus, backed by NBAA/EBAA/AsBAA — most relevant competitive threat
- XO: 2,000+ aircraft, instant booking — large incumbent in on-demand space
- No major new SaaS launches specifically targeting Part 135 charter booking this week

---

### Phase 3 — Code Health

**Note:** pjroutes repo (`jaylenmareko/pjroutes-`) is not cloned in this environment and is outside GitHub MCP scope for this session. Code scan performed against known state from prior session logs.

**Known bugs (unresolved from 2026-05-15):**
- Operator form datetime bug: `depart_start`/`depart_end` don't update React state when set via JS → form submits empty → Supabase insert fails silently — **blocker for operator listings**
- Stripe test keys still in Vercel env vars — **blocker before live transactions**
- Stripe bank transfer instruction emails not enabled (manual toggle in Stripe dashboard)
- Test data not purged from DB

**No TODO/FIXME scan possible** — repo not accessible in session. Recommend cloning locally or granting MCP access to `pjroutes-` repo.

---

**Action Items**
- Fix `depart_start`/`depart_end` React state bug in operator form — this blocks operators from listing flights
- Swap Stripe test keys → live keys in Vercel dashboard before first outreach email lands
- Enable Stripe bank transfer instruction emails (Stripe → Settings → Customer emails)
- Delete all test data from Supabase before any operator onreach
- Start Part 135 outreach — 402 contacts ready in `outreach/tier1-operators-enriched.csv`; FAA list just refreshed April 27 for cross-reference
