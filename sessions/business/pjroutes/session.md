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

---

## 2026-05-19 08:00 [AUTO]

### Phase 1 — Market Snapshot

**Markets:**
- S&P 500: 7,403.05 (-0.07%)
- Nasdaq: 26,090.73 (-0.51%)
- Dow Jones: 49,686.12 (+0.32%)
- Bitcoin: $76,429.98 (-2.03%)

**Top 3 Aviation/Business Headlines:**
1. Air Charter Service Q1 2026: revenue +37% ($380M), charter flights +19% YoY — strongest demand in years
2. Private jet flight activity up ~5% globally YoY; ARGUS TRAQPak projects +2.1% into May
3. Private jet charter market on track to $25B+ by 2031 — real-time pricing algorithms and jet-card growth cited as key drivers

**New AI/Routing Dev Tools (last 7 days):**
- No specific new tool launched this week; broader landscape dominated by NextBillion.ai (enterprise AI routing APIs), Onfleet, and DispatchTrack
- AI-driven GIS framework for aircraft route classification published (MDPI, May 2026) — academic but applicable to charter routing logic
- Leon Software Marketplace (launched Dec 2025) gaining operator adoption in 2026 — note as competitor surface to watch

---

### Phase 2 — pjroutes Market Intel

**FAA / Regulatory:**
- FAA restored accurate public Part 135 operator list (data April 27, 2026) after Feb errors that omitted NetJets, FlyExclusive, and others — list is now reliable for outreach targeting
- 14 CFR Part 135 last amended May 8, 2026 — specifics not public yet; worth checking FAA eCFR for changes
- Regulatory pressure on gray charter increasing — FAA running ~24 active enforcement cases

**Market Trends:**
- Charter demand still hot despite geopolitical uncertainty (Iran situation flagged as risk by industry leaders)
- Operator-direct booking models gaining ground over broker-heavy platforms — pjroutes positioning is right
- Sustainability becoming table stakes: corporate clients requesting emissions data + SAF options — future feature consideration
- Crew shortages persisting; smaller fleets mean fewer available aircraft → supply constraint = pricing pressure upward

**Competitors:**
- Aeriel: AI-feature cloud OS for business aviation operators — gaining traction
- Leon Software: flight management SaaS with marketplace module — operator-side workflow tool
- Lido Labs: structured flight ops (preflight, dispatch, checklists) — workflow focus, not booking
- No new Part 135-specific charter booking SaaS launched this week

---

### Phase 3 — Code Health

**Note:** pjroutes repo (`jaylenmareko/pjroutes-`) is not cloned in this environment; GitHub MCP access scoped to `ranch-pad` only. Scan based on prior session state.

**Unresolved bugs (carried from 2026-05-15):**
- `depart_start`/`depart_end` React state not updating when set via JS → operator form submits empty → Supabase insert silently fails — **BLOCKER for operator listings**
- Stripe test keys still live in Vercel env vars — **BLOCKER before real transactions**
- Stripe bank transfer instruction emails not toggled on (manual: Stripe dashboard → Settings → Customer emails)
- Test data not purged from Supabase DB

**Unable to scan:** TODO/FIXME comments, imports, package.json — repo not accessible. Clone locally or add pjroutes- to GitHub MCP scope.

---

**Action Items**
- Fix `depart_start`/`depart_end` React state bug — operator listing is broken until this is resolved
- Swap Stripe test → live keys in Vercel before any outreach goes out
- Enable Stripe bank transfer instruction emails (manual toggle, 2 minutes)
- Purge all test data from Supabase before going live
- Start Part 135 outreach — 402 contacts in `outreach/tier1-operators-enriched.csv`; cross-reference against refreshed FAA list (April 27 data)

---

## 2026-05-20 09:00 [AUTO]

### Phase 1 — Market Snapshot

**Markets (May 20, 2026):**
- S&P 500: 7,391.76 (-0.15%)
- Dow Jones: 49,586.88 (-0.20%)
- Nasdaq: 26,030.91 (-0.23%)
- Bitcoin: $76,948.94 (+0.41%)

**Top 3 Aviation/Business Headlines:**
1. SMS mandate expanded — all Part 135 charter operators must implement Part 5-compliant Safety Management Systems by **May 2027** — new compliance burden for operators
2. Private jet charter market projected $25B–$45B by 2031 (CAGR 7.86–13.5%) — on-demand and real-time pricing tech cited as primary growth drivers
3. FAA Safe Air Charter site now has fully searchable certified Part 135 operator list — verifiability easier for passengers and brokers post-April 27 data restore

**New AI/Routing Dev Tools (last 7 days):**
- **Google Maps Platform MCP server** — standardized LLM interface for geocoding, routing, place search — directly applicable to pjroutes routing features
- **NextBillion.ai** — enterprise AI routing APIs with deep logistics customization; gaining ground in aviation logistics
- **Leon Marketplace** (Dec 2025 launch, gaining 2026 traction) — operator-side flight management module; watch as competitive surface

---

### Phase 2 — pjroutes Market Intel

**FAA / Regulatory:**
- FAA Part 135 operator list fully restored (April 27 data) — now reliable for outreach targeting after Feb 2026 errors omitting NetJets, FlyExclusive
- 14 CFR Part 135 last amended May 8, 2026 — specifics not yet public; worth checking FAA eCFR
- **New SMS mandate:** all Part 135 operators must have Part 5-compliant Safety Management System by May 2027 — potential operator pain point; pjroutes can reference this in outreach messaging
- Gray charter enforcement continuing — ~24 active FAA cases; regulatory pressure favors licensed operators on a verified platform like pjroutes

**Market Trends:**
- On-demand charter becoming the default for short/mid-range trips — subscription/jet-card growing 9.63% CAGR
- Corporate clients demanding SAF data and carbon compliance — sustainability becoming table stakes
- Broker consolidation accelerating (Gama/Hunt & Palmer) — operator-direct model increasingly well-timed
- Crew shortages + supply constraints pushing charter prices upward — good for operator revenue on platform

**Competitors / SaaS Landscape:**
- **Aeriel** — cloud OS for business aviation operators (workflow focus, not booking)
- **Leon Software** — flight management + marketplace module (operator-side)
- **ForeFlight** — flight planning/dispatch (crew tool, not charter booking)
- No new Part 135-specific charter booking SaaS launched this week — window remains open

---

### Phase 3 — Code Health

**Note:** pjroutes repo (`jaylenmareko/pjroutes-`) not accessible in this environment — GitHub MCP is scoped to `ranch-pad` only. Scan based on known state from prior session logs.

**Unresolved bugs (carried from 2026-05-15 — still blocking):**
- `depart_start`/`depart_end` React state not updating when set via JS → operator form submits empty → Supabase insert silently fails — **BLOCKER: operators cannot list flights**
- Stripe test keys still live in Vercel env vars — **BLOCKER before real transactions**
- Stripe bank transfer instruction emails not enabled (manual toggle: Stripe → Settings → Customer emails)
- Test data not purged from Supabase DB

**Unable to scan:** TODO/FIXME comments, imports, package.json — repo not accessible in this session.

---

**Action Items**
- Fix `depart_start`/`depart_end` React state bug — platform is non-functional for operators until resolved
- Swap Stripe test → live keys in Vercel before any outreach lands
- Enable Stripe bank transfer instruction emails (2-minute manual toggle in Stripe dashboard)
- Purge all test data from Supabase before going live
- SMS mandate angle: add one line to outreach email — pjroutes helps operators manage bookings as they prep for May 2027 SMS compliance

---

## 2026-05-21 [AUTO]

### Phase 1 — Market Snapshot

**Markets (May 21, 2026):**
- S&P 500: 7,418.40 (+0.88%)
- Dow Jones: 49,922.31 (+1.13%)
- Nasdaq: 26,201.68 (+1.28%)
- Bitcoin: $77,321.03 (+0.77%) — recovering from $77k dip

**Top 3 Aviation/Business Headlines:**
1. Air Charter Service posts record Q1 2026 — charters up 19%, revenue up 37% ($380M) — demand is real and accelerating
2. FIFA World Cup 2026 charter demand forecast: +200–300% on host-city routes during peak match periods — operators booking multi-leg itineraries months out
3. SMS mandate confirmed: all Part 135 operators must have Part 5-compliant Safety Management Systems by **May 2027** — compliance burden growing

**New AI/Routing Dev Tools (last 7 days):**
- **NextBillion.ai** — AI routing APIs with time windows, vehicle attributes, traffic logic; gaining aviation logistics traction
- **Airspace** — patented AI routing + auto-booking for time-critical logistics and Next Flight Out; direct aviation relevance
- **Onfleet 2026 update** — complex delivery routing with multi-stop, continuous rerouting, real-time fleet visibility; patterns applicable to multi-leg charter routing UX

---

### Phase 2 — pjroutes Market Intel

**FAA / Regulatory:**
- FAA restored Part 135 certified operator list (May 2, 2026) — now updated daily for operator details, weekly for aircraft — outreach list is reliable again
- 14 CFR Part 135 last amended May 8, 2026 — specifics not yet detailed publicly; worth checking eCFR for exact changes
- Gray charter enforcement ongoing — FAA crackdown on Part 91 operators advertising charter; legitimate Part 135 operators are the beneficiaries — messaging angle for pjroutes
- SMS mandate (Part 5 compliance by May 2027) — growing compliance overhead for operators; pjroutes as streamlined ops tool is well-timed

**Market Trends:**
- On-demand and real-time pricing tech cited by analysts as primary growth driver for $25–45B charter market
- World Cup 2026 demand surge coming — operators need routing and booking tools that handle multi-leg, multi-city itineraries
- SAF and sustainability mandates becoming table stakes — data tracking will be expected by corporate clients
- Broker consolidation continuing — operator-direct platforms gaining strategic advantage

**Competitors / SaaS:**
- **Portside Horizon** (launched March 2026) — cloud-based modular platform for larger flight departments, fractional programs, jet card operators; advanced reporting + API — closest new competitive surface
- **Leon Software** — flight management + marketplace module; operator-side tool
- No new Part 135-specific charter booking SaaS launched this week — window still open

---

### Phase 3 — Code Health

**Note:** pjroutes repo (`jaylenmareko/pjroutes-`) not in scope for this environment's GitHub MCP. Scan reflects known state from prior sessions.

**Unresolved — still blocking:**
- `depart_start`/`depart_end` React state not updating via JS → operator form submits empty → Supabase insert silently fails — **BLOCKER: operators cannot list flights**
- Stripe test keys still in Vercel env vars — **BLOCKER before real transactions**
- Stripe bank transfer instruction emails not enabled (manual toggle: Stripe → Settings → Customer emails)
- Test data not purged from Supabase

**Unable to scan:** TODO/FIXME comments, imports, package.json — repo not accessible in this session environment.

---

**Action Items**
- Fix `depart_start`/`depart_end` React state bug — nothing else matters until operators can list flights
- Swap Stripe test → live keys in Vercel env vars before first outreach wave
- Enable Stripe bank transfer instruction emails (2-minute manual fix)
- Purge Supabase test data before going live
- World Cup angle: add multi-leg/multi-city routing capability to roadmap — 200–300% demand spikes incoming on host-city routes

---

## 2026-05-22 [AUTO]

### Phase 1 — Market Snapshot

**Markets (May 22, 2026):**
- S&P 500: 7,445.72 (+0.17%)
- Dow Jones: 50,285.66 (+0.55%)
- Nasdaq: 26,293.10 (+0.09%)
- Bitcoin: $77,539.67 (+0.15%)
- Markets green across the board; Dow crossed 50,000 — macro sentiment recovering

**Top 3 Aviation/Business Headlines:**
1. Air Charter Service Q1 2026: revenue $380M (+37%), charter flights +19% YoY — demand accelerating into spring
2. Private jet flight activity: 80,126 flights week of May 17 (+4% YoY); US fractional/charter up **11% YoY** — strongest segment
3. FIFA World Cup 2026 charter surge: round-trip host-city charters forecast $15K–$60K depending on aircraft; +200–300% demand on peak match routes

**New AI/Routing Dev Tools (last 7 days):**
- **Google Maps Platform MCP server** — LLM-native interface for geocoding, routing, place search; directly integrable into pjroutes routing layer
- **NextBillion.ai** — enterprise AI routing APIs; time windows, vehicle attributes, traffic logic; aviation logistics traction building
- No aviation-specific routing SaaS launched this week — window still open

---

### Phase 2 — pjroutes Market Intel

**FAA / Regulatory:**
- FAA restored public Part 135 operator list (April 27 data, updated daily for operators, weekly for aircraft) — reliable for outreach again after Feb errors
- FAA Safe Air Charter website now fully searchable with certified Part 135 operators — verifiability easier for passengers and brokers
- SMS mandate (14 CFR Part 5): all Part 135 operators must have Safety Management Systems live by **May 28, 2027** — growing compliance overhead
- Gray charter enforcement ongoing (~24 active FAA cases) — legitimate Part 135 operators want verified platform exposure

**Market Trends:**
- Charter demand remains hot; Q1 2026 record results despite geopolitical uncertainty (Iran conflict flagged as H2 risk)
- US fractional/charter +11% YoY — sharpest growth segment in private aviation right now
- Operator-direct booking gaining ground vs. broker platforms — pjroutes positioning is right
- World Cup 2026 multi-city demand incoming — multi-leg routing is a near-term product gap
- Private aviation market projected at $41.38B by 2030

**Competitors / SaaS:**
- **Avi-Go** — AI charter marketplace, NBAA/EBAA/AsBAA-backed — closest direct competitor; real-time quoting + flight tracking
- **Portside Horizon** (March 2026) — cloud platform for larger flight departments and fractional programs
- **Leon Software** — flight management + marketplace module; operator-side workflow tool
- No new Part 135-specific charter booking SaaS launched this week — window still open

---

### Phase 3 — Code Health

**Note:** pjroutes repo (`jaylenmareko/pjroutes-`) is outside GitHub MCP scope for this environment (scoped to `ranch-pad` only). Scan reflects known state from prior session logs.

**Unresolved — still blocking (carried since 2026-05-15):**
- `depart_start`/`depart_end` React state not updating via JS → operator form submits empty → Supabase insert silently fails — **BLOCKER: operators cannot list flights**
- Stripe test keys still in Vercel env vars — **BLOCKER before real transactions**
- Stripe bank transfer instruction emails not enabled (manual toggle: Stripe → Settings → Customer emails)
- Test data not purged from Supabase DB

**Unable to scan:** TODO/FIXME comments, imports, package.json — repo not accessible in this environment. Clone locally or add `pjroutes-` to GitHub MCP scope to enable live code scans.

---

**Action Items**
- Fix `depart_start`/`depart_end` React state bug — this is the #1 blocker; platform is non-functional for operators until resolved
- Swap Stripe test → live keys in Vercel env vars before first outreach email lands
- Enable Stripe bank transfer instruction emails (2-minute manual toggle in Stripe dashboard)
- Purge all test data from Supabase before going live
- Launch Part 135 outreach wave — 402 contacts in `outreach/tier1-operators-enriched.csv`; cross-reference against FAA's refreshed April 27 list; use SMS compliance angle in messaging

---

## 2026-05-23 [AUTO]

### Phase 1 — Market Snapshot

**Markets (May 23, 2026):**
- S&P 500: 7,473.47 (+0.37%)
- Dow Jones: 50,579.70 (+0.58%)
- Nasdaq: 26,343.97 (+0.19%)
- Bitcoin: $74,691.01 (-3.28%) — notable drop while equities green

**Top 3 Aviation/Business Headlines:**
1. Air Charter Service Q1 2026: charter flights +19%, revenue +37% ($380M) — demand accelerating
2. FIFA World Cup 2026: +200–300% charter demand forecast on host-city routes; multi-leg bookings arriving months out
3. FAA SMS Compliance Review Act of 2026 advancing in Senate post-DCA midair collision — regulatory scrutiny of Part 135 SMS at all-time high

**New AI/Routing Dev Tools (last 7 days):**
- **Airvoyant** (AAR, April 2026) — AI-powered aviation procurement; auto-sourcing parts, quote consolidation, one-click purchasing for airlines/MROs; integrates with Trax ERP
- **CargoTech 2026 roadmap** — 9 new AI products rolling out this year including AgentAi functionalities and Rotate Data Services
- **Autonomous AI routing agents** (logistics trend) — next-gen engines chain complex routing actions without human intervention; real-time dynamic rerouting becoming standard

---

### Phase 2 — pjroutes Market Intel

**FAA / Regulatory:**
- FAA Part 135 certified operator list restored May 2, 2026 — updated daily for operators, weekly for aircraft; reliable for outreach now
- 14 CFR Part 135 last amended May 8, 2026 (Amdt. 135-149) — flight data recorder requirements for multi-engine turbine-powered airplanes and rotorcraft
- SMS mandate: all Part 135 operators must have Part 5-compliant SMS live by **May 28, 2027** — Senate SMS Compliance Review Act advancing; regulatory pressure intensifying post-DCA
- FAA Safe Air Charter website: fully searchable certified Part 135 operator list — good for cross-referencing outreach targets
- NBAA May 12 conference: recordkeeping and logbooks emphasized as aviation enters more demanding regulatory environment; international ops under greater scrutiny

**Market Trends:**
- US fractional/charter +11% YoY; North America +5.0% YoY through Week 20 — sharpest growth segment in private aviation
- World Cup 2026 multi-leg demand building — operators need booking tools that handle complex multi-city itineraries
- Online/direct booking shift accelerating; AI-driven pricing algorithms cited as primary growth driver for $41.38B market by 2030
- Middle East flying down 48% YoY Week 20 — geopolitical risk dampening one segment

**Competitors / SaaS:**
- **Avi-Go** — NBAA/EBAA/AsBAA-backed AI charter marketplace; real-time quoting, flight tracking, AI analytics — closest direct competitor
- **Strafos** — B2B cloud platform for private jet operators; instant booking, revenue optimization, fleet algorithms
- **Schedaero** — all-in-one ops platform: charter sales, flight ops, maintenance, accounting, crew; integrated payments
- **Moove** — booking/scheduling engine; scales from single aircraft to 50+ fleet
- No new Part 135-specific charter booking SaaS launched this week — window still open

---

### Phase 3 — Code Health

**Note:** pjroutes repo (`jaylenmareko/pjroutes-`) is outside GitHub MCP scope for this environment (scoped to `ranch-pad` only). Local project directory `/projects/business/pjroutes/` not present in this clone. Scan reflects known state from prior session logs.

**Unresolved — still blocking (carried since 2026-05-15):**
- `depart_start`/`depart_end` React state not updating via JS → operator form submits empty → Supabase insert silently fails — **BLOCKER: operators cannot list flights**
- Stripe test keys still in Vercel env vars — **BLOCKER before real transactions**
- Stripe bank transfer instruction emails not enabled (manual toggle: Stripe → Settings → Customer emails)
- Test data not purged from Supabase DB

**Unable to scan:** TODO/FIXME comments, imports, package.json — repo inaccessible in this environment. Clone locally or add `pjroutes-` to GitHub MCP scope.

---

**Action Items**
- Fix `depart_start`/`depart_end` React state bug — still the #1 blocker; no operator can list a flight until this is resolved
- Swap Stripe test → live keys in Vercel before any outreach email lands
- Enable Stripe bank transfer instruction emails (2-minute manual toggle in Stripe dashboard)
- Purge all test data from Supabase before going live
- Launch Part 135 outreach — 402 contacts ready; use SMS mandate angle (May 2027 deadline) + FAA Safe Air Charter verifiability as trust signals in copy

---

## 2026-05-24 [AUTO]

### Phase 1 — Market Snapshot

**Markets (May 24, 2026 — Saturday; figures reflect Friday close):**
- S&P 500: 7,473.47 (+0.37%)
- Dow Jones: 50,579.70 (+0.58%)
- Nasdaq: 26,343.97 (+0.19%)
- Bitcoin: $77,164.02 (+3.28%) — recovered ~$2,400 from yesterday's -3.28% drop; trades 24/7

**Top 3 Aviation/Business Headlines:**
1. Air Charter Service Q1 2026: charter flights +19%, revenue +37% ($380M) — record demand continues into spring
2. FAA SMS Compliance Review Act of 2026 advancing in Senate post-DCA — regulatory scrutiny of Part 135 SMS at all-time high; May 2027 deadline firms up
3. Private jet charter services market projected at $25B+ by 2031 — real-time pricing algorithms and jet-card growth cited as primary drivers

**New AI/Routing Dev Tools (last 7 days):**
- No aviation-specific routing SaaS launched this week; dominant platforms remain NextBillion.ai (enterprise AI routing APIs), Onfleet, and Airspace (time-critical logistics)
- Broader trend: autonomous AI routing agents chaining complex multi-stop decisions without human input — applies to multi-leg charter routing UX pjroutes will need for World Cup demand

---

### Phase 2 — pjroutes Market Intel

**FAA / Regulatory:**
- FAA Part 135 certified operator list restored and updated (data April 27–May 18, 2026) — now updated daily for operators, weekly for aircraft; reliable for outreach cross-reference
- 14 CFR Part 135 last amended May 8, 2026 (Amdt. 135-149) — flight data recorder requirements for multi-engine turbine-powered airplanes and rotorcraft
- SMS mandate: all Part 135 operators must have Part 5-compliant Safety Management Systems live by **May 28, 2027** — Senate SMS Compliance Review Act advancing; compliance messaging angle is live now
- NBAA updated Air Charter Broker Best Practices Guide released — signals continued NBAA engagement in charter compliance guidance
- NBAA 2026 International Operators Conference focused on global ops excellence — international operator segment worth watching for platform expansion

**Market Trends:**
- US fractional/charter +11% YoY; global private jet activity +5% — sharpest growth in years
- On-demand direct booking accelerating; broker-heavy platforms losing ground to operator-direct models — pjroutes timing is right
- World Cup 2026 multi-leg demand building — operators need tools for complex multi-city itineraries; product gap for pjroutes roadmap
- Gray charter enforcement ongoing (~24 active FAA cases) — legitimate Part 135 operators want verified platform exposure; use as trust signal

**Competitors / SaaS:**
- **Avi-Go** — NBAA/EBAA/AsBAA-backed AI charter marketplace; real-time quoting, flight tracking — closest direct competitor
- **Portside Horizon** (March 2026) — cloud platform for larger flight departments and fractional programs
- **Leon Software** — flight management + marketplace module; operator-side workflow tool
- **Schedaero** — all-in-one ops platform; charter sales, flight ops, maintenance, accounting, crew; integrated payments
- No new Part 135-specific charter booking SaaS launched this week — window still open

---

### Phase 3 — Code Health

**Note:** pjroutes repo (`jaylenmareko/pjroutes-`) is outside GitHub MCP scope for this environment (scoped to `ranch-pad` only). Local project directory `/projects/business/pjroutes/` does not exist in this clone. Scan reflects known state from prior session logs.

**Unresolved — still blocking (carried since 2026-05-15):**
- `depart_start`/`depart_end` React state not updating via JS → operator form submits empty → Supabase insert silently fails — **BLOCKER: operators cannot list flights**
- Stripe test keys still in Vercel env vars — **BLOCKER before real transactions**
- Stripe bank transfer instruction emails not enabled (manual toggle: Stripe → Settings → Customer emails)
- Test data not purged from Supabase DB

**Unable to scan:** TODO/FIXME comments, imports, package.json — repo inaccessible in this environment. Clone locally or add `pjroutes-` to GitHub MCP scope to enable live scans.

---

**Action Items**
- Fix `depart_start`/`depart_end` React state bug — #1 blocker since May 15; no operator can list a flight until resolved
- Swap Stripe test → live keys in Vercel env vars before any outreach email lands
- Enable Stripe bank transfer instruction emails (2-minute manual toggle in Stripe dashboard)
- Purge all test data from Supabase before going live
- Launch Part 135 outreach — 402 contacts ready; lead with SMS mandate deadline (May 2027) + FAA Safe Air Charter verifiability as trust signals

---

## 2026-05-25 [AUTO]

### Phase 1 — Market Snapshot

**Markets (May 25, 2026 — Sunday; figures reflect Friday close):**
- S&P 500: 7,473.47 (+0.37%)
- Dow Jones: 50,579.70 (+0.58%)
- Nasdaq: 26,343.97 (+0.19%)
- Bitcoin: $77,013.65 (+0.38%) — markets closed weekend; equities holding near highs

**Top 3 Aviation/Business Headlines:**
1. Air Charter Service Q1 2026: charter flights +19%, revenue +37% ($380M) — record demand continues into spring
2. FIFA World Cup 2026 charter demand forecast: +200–300% on host-city routes during peak match periods; operators receiving multi-leg booking requests months ahead
3. Private jet activity Week 20 (May 17): 80,126 flights globally (+4% YoY); US fractional/charter +11% YoY — sharpest growth segment in private aviation

**New AI/Routing Dev Tools (last 7 days):**
- **Descartes** integrated generative AI for delivery scenario simulation — logistics teams plan proactively; applicable pattern for charter disruption handling
- **Airline route planning software market** projected $8.36B → $9.04B in 2026 (8.1% CAGR) — institutional investment in routing tech accelerating
- **Autonomous AI dispatch engines** (trend) — chaining multi-stop routing decisions without human input; directly relevant to pjroutes multi-leg charter routing roadmap

---

### Phase 2 — pjroutes Market Intel

**FAA / Regulatory:**
- FAA restored public Part 135 operator list (May 2, 2026) — updated daily for operators, weekly for aircraft; reliable for outreach cross-reference after Feb data errors
- FAA Safe Air Charter website: fully searchable certified Part 135 operator list live — verifiability easier for passengers and brokers; use as trust signal in outreach
- 14 CFR Part 135 last amended May 8, 2026 (Amdt. 135-149) — flight data recorder requirements for multi-engine turbine-powered airplanes and rotorcraft
- SMS mandate: all Part 135 operators must have Part 5-compliant Safety Management Systems by **May 28, 2027** — Senate SMS Compliance Review Act advancing; compliance messaging angle is live and timely
- Gray charter enforcement ongoing (~24 active FAA cases) — legitimate Part 135 operators want verified platform exposure

**Market Trends:**
- Charter demand remains hot despite geopolitical uncertainty; record Q1 2026 results across major operators
- On-demand direct booking accelerating; broker-heavy platforms losing ground — pjroutes positioning is right
- World Cup 2026 multi-leg demand building — operators need tools for complex multi-city itineraries; product gap on pjroutes roadmap
- Private aviation market projected at $41.38B by 2030; North America leading at +5.0% YoY

**Competitors / SaaS:**
- **Avi-Go** — NBAA/EBAA/AsBAA-backed AI charter marketplace; real-time quoting, flight tracking — closest direct competitor
- **Portside Horizon** (March 2026) — cloud platform for larger flight departments and fractional programs
- **Schedaero** — all-in-one charter sales, flight ops, maintenance, accounting, crew; integrated payments
- No new Part 135-specific charter booking SaaS launched this week — window still open

---

### Phase 3 — Code Health

**Note:** pjroutes repo (`jaylenmareko/pjroutes-`) is outside GitHub MCP scope for this environment (scoped to `ranch-pad` only). Local project directory `/projects/business/pjroutes/` does not exist in this clone. Scan reflects known state from prior session logs.

**Unresolved — still blocking (carried since 2026-05-15):**
- `depart_start`/`depart_end` React state not updating via JS → operator form submits empty → Supabase insert silently fails — **BLOCKER: operators cannot list flights**
- Stripe test keys still in Vercel env vars — **BLOCKER before real transactions**
- Stripe bank transfer instruction emails not enabled (manual toggle: Stripe → Settings → Customer emails)
- Test data not purged from Supabase DB

**Unable to scan:** TODO/FIXME comments, imports, package.json — repo inaccessible in this environment. Clone locally or add `pjroutes-` to GitHub MCP scope to enable live code scans.

---

**Action Items**
- Fix `depart_start`/`depart_end` React state bug — #1 blocker for 10 days; no operator can list a flight until this is resolved
- Swap Stripe test → live keys in Vercel env vars before any outreach email lands
- Enable Stripe bank transfer instruction emails (2-minute manual toggle in Stripe dashboard)
- Purge all test data from Supabase before going live
- Launch Part 135 outreach this week — 402 contacts ready; SMS mandate deadline (May 2027) + FAA Safe Air Charter verifiability are the trust anchors in the copy

---

## 2026-05-26 [AUTO]

### Phase 1 — Market Snapshot

**Markets (May 26, 2026 — Tuesday post-Memorial Day; equity figures reflect Friday May 23 close; markets reopening today):**
- S&P 500: 7,473.47 (+0.37%)
- Dow Jones: 50,579.70 (+0.58%)
- Nasdaq: 26,343.97 (+0.19%)
- Bitcoin: $76,911.87 (+2.70% 24hr / -1.90% 7-day) — equities holding near highs; BTC recovering

**Top 3 Aviation/Business Headlines:**
1. NBAA SDC2026 record-breaking conference — Premier Air Charter and others attending to explore emerging aviation technologies; strongest operator engagement NBAA has seen at this event
2. Air Charter Service Q1 2026: charter flights +19%, revenue +35% YoY ($380M) — record results confirming demand acceleration into spring
3. FIFA World Cup 2026 charter demand forecast: +200–300% on host-city routes during peak match periods; round-trip charters $15K–$60K depending on aircraft — operators booking months out

**New AI/Routing Dev Tools (last 7 days):**
- No aviation-specific routing SaaS launched this week
- Dominant platforms: NextBillion.ai (enterprise AI routing APIs), Onfleet (complex multi-stop delivery), Locus (high-volume enterprise logistics)
- Broader trend: autonomous AI dispatch engines chaining multi-stop routing without human input — applicable to pjroutes multi-leg charter roadmap

---

### Phase 2 — pjroutes Market Intel

**FAA / Regulatory:**
- FAA Part 135 certified operator list fully restored (May 2, 2026) — updated daily for operators, weekly for aircraft; reliable for outreach cross-reference
- FAA deactivated then restored public Part 135 list after Feb 2026 data errors (omitted NetJets, FlyExclusive and others) — list is now accurate and fully searchable on Safe Air Charter website
- 14 CFR Part 135 Amdt. 135-149 (May 8, 2026) — flight data recorder requirements for multi-engine turbine-powered airplanes and rotorcraft
- SMS mandate: all Part 135 operators must have Part 5-compliant Safety Management Systems by **May 28, 2027** — Senate SMS Compliance Review Act advancing post-DCA midair collision; Congressional and public scrutiny at all-time high
- Gray charter enforcement ongoing: ~24 active FAA cases — legitimate Part 135 operators are motivated to gain verified platform exposure

**Market Trends:**
- US fractional/charter +11% YoY; global private jet activity +4–5% YoY; Week 20: 80,126 flights globally
- On-demand direct booking accelerating; broker-heavy platforms losing ground — pjroutes operator-direct positioning is right
- World Cup 2026 demand surge incoming — operators need multi-leg, multi-city booking tools; product gap to address on roadmap
- Private aircraft industry projected at $41.38B by 2030; airline route planning software market $8.36B → $9.04B in 2026 (8.1% CAGR)
- SAF + sustainability data becoming table stakes for corporate clients

**Competitors / SaaS:**
- **Avi-Go** — NBAA/EBAA/AsBAA-backed AI charter marketplace; real-time quoting, flight tracking — closest direct competitor
- **Portside Horizon** (March 2026) — cloud platform for larger flight departments and fractional programs
- **Schedaero** — all-in-one charter sales, flight ops, maintenance, accounting, crew; integrated payments
- **Leon Software** — flight management + marketplace module; operator-side workflow tool
- No new Part 135-specific charter booking SaaS launched this week — window still open

---

### Phase 3 — Code Health

**Note:** pjroutes repo (`jaylenmareko/pjroutes-`) is outside GitHub MCP scope for this environment (scoped to `ranch-pad` only). Local project directory `/projects/business/pjroutes/` does not exist in this clone. Scan reflects known state from prior session logs.

**Unresolved — still blocking (carried since 2026-05-15 — 11 days):**
- `depart_start`/`depart_end` React state not updating via JS → operator form submits empty → Supabase insert silently fails — **BLOCKER: operators cannot list flights**
- Stripe test keys still in Vercel env vars — **BLOCKER before real transactions**
- Stripe bank transfer instruction emails not enabled (manual toggle: Stripe → Settings → Customer emails)
- Test data not purged from Supabase DB

**Unable to scan:** TODO/FIXME comments, imports, package.json — repo inaccessible in this environment. Clone locally or add `pjroutes-` to GitHub MCP scope to enable live code scans.

---

**Action Items**
- Fix `depart_start`/`depart_end` React state bug — 11 days unresolved; this is the only thing blocking operator listings
- Swap Stripe test → live keys in Vercel env vars before any outreach email lands
- Enable Stripe bank transfer instruction emails (2-minute manual toggle in Stripe dashboard)
- Purge all test data from Supabase before going live
- Launch Part 135 outreach this week — 402 contacts ready; NBAA SDC2026 buzz + SMS mandate deadline (May 2027) + FAA Safe Air Charter verifiability are the trust anchors in the copy

---

## 2026-05-27 08:00 [AUTO]

### Phase 1 — Market Snapshot

**Markets (May 26, 2026 close — most recent available; markets open today May 27):**
- S&P 500: 7,473.47 (+0.37%)
- Dow Jones: 50,579.70 (+0.58%)
- Nasdaq: 26,343.97 (+0.19%)
- Bitcoin: ~$76,797 (-1.5% from recent highs) — retreating while equities green
- Driver: Iran peace hopes + AI rally; oil surged to $106; markets edging higher on reopening after Memorial Day

**Top 3 Aviation/Business Headlines:**
1. Cessna Citation Ascend — first 3 delivered to NetJets (launch fleet customer); new midsize jet entering service now
2. UK RAF Dassault Falcon 900LX GPS jammed for 3 hours over Europe (May 21) — GPS spoofing/jamming threats to business aviation escalating; operators increasingly exposed
3. Volato + FlyExclusive merger expected to close by end of Q2 2026 — consolidation in on-demand charter accelerating; fewer independent operators, bigger fleets

**New AI/Routing Dev Tools (last 7 days):**
- **Google Maps Platform Geospatial AI + MCP server** — LLM-native interface for geocoding, routing, place search; directly integrable into pjroutes routing layer
- **NextBillion.ai** — enterprise AI routing APIs (time windows, traffic, vehicle attributes); gaining aviation logistics traction
- **Autonomous AI dispatch agents** (industry trend) — chaining complex multi-stop routing without human input; directly applicable to pjroutes multi-leg charter roadmap for World Cup 2026

---

### Phase 2 — pjroutes Market Intel

**FAA / Regulatory:**
- FAA Part 135 certified operator list restored and updated (May 2, 2026) — daily updates for operators, weekly for aircraft; reliable for outreach cross-reference
- FAA Safe Air Charter website: fully searchable certified Part 135 operator list — verifiability easier for passengers and brokers; strong trust signal for outreach copy
- 14 CFR Part 135 Amdt. 135-149 (May 8, 2026) — flight data recorder requirements for multi-engine turbine-powered airplanes and rotorcraft
- SMS mandate: all Part 135 operators must have Part 5-compliant Safety Management Systems by **May 28, 2027** — exactly 366 days out; Senate SMS Compliance Review Act advancing post-DCA; congressional and public scrutiny at all-time high
- Gray charter enforcement ongoing (~24 active FAA cases) — legitimate Part 135 operators motivated to gain verified platform exposure

**Market Trends:**
- Volato + FlyExclusive merger closing Q2 2026 — consolidation = fewer indie brokers, larger fleet operators; pjroutes operator-direct model is right
- Air Charter Service Q1 2026: charters +19%, revenue +37% ($380M) — demand accelerating, record results
- US fractional/charter +11% YoY — sharpest growth segment; North America +5% YoY
- On-demand direct booking accelerating; broker-heavy platforms losing ground — pjroutes positioning on time
- World Cup 2026 demand surge incoming — operators need multi-leg, multi-city booking tools; product gap on roadmap
- Private aviation market → $41.38B by 2030; airline route planning software market → $9.04B in 2026

**Competitors / SaaS:**
- **Avi-Go** — NBAA/EBAA/AsBAA-backed AI charter marketplace; real-time quoting, flight tracking — closest direct competitor
- **Portside Horizon** (March 2026) — cloud platform for larger flight departments and fractional programs
- **Schedaero** — all-in-one charter sales, flight ops, maintenance, accounting, crew; integrated payments
- **Leon Software** — flight management + marketplace module; operator-side workflow tool
- No new Part 135-specific charter booking SaaS launched this week — window still open

---

### Phase 3 — Code Health

**Note:** pjroutes repo (`jaylenmareko/pjroutes-`) is outside GitHub MCP scope for this environment (scoped to `ranch-pad` only). Local directory `/projects/business/pjroutes/` does not exist in this clone. Scan reflects known state from prior session logs.

**Unresolved — still blocking (carried since 2026-05-15 — 12 days):**
- `depart_start`/`depart_end` React state not updating via JS → operator form submits empty → Supabase insert silently fails — **BLOCKER: operators cannot list flights**
- Stripe test keys still in Vercel env vars — **BLOCKER before real transactions**
- Stripe bank transfer instruction emails not enabled (manual toggle: Stripe → Settings → Customer emails)
- Test data not purged from Supabase DB

**Unable to scan:** TODO/FIXME comments, imports, package.json — repo inaccessible in this environment. Clone locally or add `pjroutes-` to GitHub MCP scope to enable live code scans.

---

**Action Items**
- Fix `depart_start`/`depart_end` React state bug — 12 days unresolved; this is the only thing blocking operator listings
- Swap Stripe test → live keys in Vercel env vars before any outreach email lands
- Enable Stripe bank transfer instruction emails (2-minute manual toggle in Stripe dashboard)
- Purge all test data from Supabase before going live
- Launch Part 135 outreach today — 402 contacts ready; SMS mandate deadline (May 28, 2027 = exactly 1 year) is the hook; pair with FAA Safe Air Charter verifiability as trust signal

---

## 2026-05-28 [AUTO]

### Phase 1 — Market Snapshot

**Markets (May 27–28, 2026):**
- S&P 500: 7,520.36 (+0.0%) — record high
- Nasdaq: 26,674.73 (+0.1%) — record high
- Dow Jones: 50,644.28 (+0.36%)
- Bitcoin: $75,884.41 (-1.57%) — retreating while equities at records
- Rally driven by lower oil, easing Treasury yields, strong earnings; Dow crossed 50,600

**Top 3 Aviation/Business Headlines:**
1. Air Charter Service Q1 2026: revenue $380M (+37%), charter flights +19% YoY — record demand confirmed, not slowing
2. FAA SMS Compliance Review Act of 2026 advancing in Senate post-DCA midair collision — Part 135 SMS scrutiny at all-time high; **TODAY (May 28) is exactly 1 year before the May 28, 2027 compliance deadline**
3. Private aviation +4% YoY globally (80,126 flights week of May 17); US fractional/charter +11% YoY — sharpest growth segment in the market

**New AI/Routing Dev Tools (last 7 days):**
- No aviation-specific routing SaaS launched specifically this week
- Dominant platforms: NextBillion.ai (enterprise AI routing APIs), Onfleet (multi-stop), Locus (enterprise logistics)
- Trend: autonomous AI dispatch engines chaining complex multi-stop routing without human input — directly applicable to pjroutes multi-leg charter roadmap

---

### Phase 2 — pjroutes Market Intel

**FAA / Regulatory:**
- FAA Part 135 certified operator list restored May 2, 2026 — updated daily for operators, weekly for aircraft; reliable for outreach cross-reference
- FAA Safe Air Charter website: fully searchable certified Part 135 operator list — strong trust signal for outreach copy
- 14 CFR Part 135 Amdt. 135-149 (May 8, 2026) — flight data recorder requirements for multi-engine turbine-powered airplanes and rotorcraft
- **SMS mandate: TODAY (May 28, 2026) is exactly 1 year until the May 28, 2027 Part 5 SMS compliance deadline** — Senate SMS Compliance Review Act advancing; regulatory pressure intensifying post-DCA
- Gray charter enforcement ongoing (~24 active FAA cases) — legitimate Part 135 operators want verified platform exposure
- FAA crackdown on Part 91 operators advertising charter — Part 135 legitimacy is a differentiator

**Market Trends:**
- Air Charter Service Q1 2026: charters +19%, revenue +37% ($380M) — record results; demand accelerating
- US fractional/charter +11% YoY; North America +5% YoY; global private jet activity +4% YoY
- On-demand direct booking accelerating; broker-heavy platforms losing ground — pjroutes operator-direct model is right
- World Cup 2026 demand surge incoming — operators need multi-leg, multi-city booking tools; product gap on pjroutes roadmap
- Geopolitical uncertainty (Iran) flagged as H2 2026 risk by operators; near-term demand remains strong
- Private aircraft market → $41.38B by 2030; airline routing software market → $9.04B in 2026 (8.1% CAGR)

**Competitors / SaaS:**
- **Avi-Go** — NBAA/EBAA/AsBAA-backed AI charter marketplace; real-time quoting, flight tracking — closest direct competitor
- **Portside Horizon** (March 2026) — cloud platform for larger flight departments and fractional programs
- **Schedaero** — all-in-one charter sales, flight ops, maintenance, accounting, crew; integrated payments
- **Leon Software** — flight management + marketplace module; operator-side workflow tool
- No new Part 135-specific charter booking SaaS launched this week — window still open

---

### Phase 3 — Code Health

**Note:** pjroutes repo (`jaylenmareko/pjroutes-`) is outside GitHub MCP scope for this environment (scoped to `ranch-pad` only). Local directory `/projects/business/pjroutes/` does not exist in this clone. Scan reflects known state from prior session logs.

**Unresolved — still blocking (carried since 2026-05-15 — 13 days):**
- `depart_start`/`depart_end` React state not updating via JS → operator form submits empty → Supabase insert silently fails — **BLOCKER: operators cannot list flights**
- Stripe test keys still in Vercel env vars — **BLOCKER before real transactions**
- Stripe bank transfer instruction emails not enabled (manual toggle: Stripe → Settings → Customer emails)
- Test data not purged from Supabase DB

**Unable to scan:** TODO/FIXME comments, imports, package.json — repo inaccessible in this environment. Clone locally or add `pjroutes-` to GitHub MCP scope to enable live code scans.

---

**Action Items**
- Fix `depart_start`/`depart_end` React state bug — 13 days unresolved; operators cannot list flights; nothing else matters until this is done
- Swap Stripe test → live keys in Vercel env vars before any outreach email lands
- Enable Stripe bank transfer instruction emails (2-minute manual toggle in Stripe dashboard)
- Purge all test data from Supabase before going live
- Launch Part 135 outreach TODAY — 402 contacts ready; **May 28 = exactly 1 year until SMS mandate deadline** — strongest possible hook; pair with FAA Safe Air Charter verifiability as trust signal

---

## 2026-05-29 08:00 [AUTO]

### Phase 1 — Market Snapshot

**Markets (May 29, 2026):**
- S&P 500: 7,563.63 (+0.58%)
- Nasdaq: 26,917.47 (+0.91%)
- Dow Jones: 50,668.97 (+0.05%)
- Bitcoin: $73,690.45 — retreating from recent highs while equities grind higher

**Top 3 Aviation/Business Headlines:**
1. **FlyHouse acquires Sun Air Jets** (CMA Camarillo, CA) — nearly doubles managed fleet; charter consolidation continues; fewer independent operators = more urgency for pjroutes operator acquisition
2. **Cessna Citation CJ4 Gen3 enters service** — Garmin Emergency Autoland standard; new midsize fleet entering charter market in 2026; operators upgrading = active fleet churn = outreach window
3. **Private jet flight activity +10% YoY** in US (WingX Week 21 data) — 30,470 Part 91K/135 departures; demand not softening; on-demand segment leading growth

**New AI/Routing Dev Tools (last 7 days):**
- **Autonomous AI dispatch agents** — chain complex multi-stop routing without human input; applicable to pjroutes multi-leg/World Cup 2026 roadmap
- **AI-GIS airport routing frameworks** — intelligent route-level classification for airport networks (MDPI research); usable for FBO/waypoint intelligence layer
- **NextBillion.ai** — gaining traction in aviation logistics; enterprise routing APIs (time windows, traffic, vehicle attributes, runway constraints)

---

### Phase 2 — pjroutes Market Intel

**FAA / Regulatory:**
- **Real ID enforcement active as of May 7, 2026** — applies to all air transportation including Part 135 charter; operators need to verify passenger ID compliance; potential friction point pjroutes can address in booking flow
- **FAA Safe Air Charter** — fully searchable certified Part 135 operator list, updated daily; strong trust anchor for outreach copy and operator onboarding
- FAA Part 135 list restored May 2 (was pulled after errors in Feb) — now reliable for outreach list cross-referencing
- SMS mandate: **May 28, 2027 deadline = 364 days out** — Senate SMS Compliance Review Act advancing; pressure building; still the sharpest urgency hook in outreach

**Market Trends:**
- FlyHouse/Sun Air Jets acquisition: consolidation narrative accelerating — independent operators watching closely; pjroutes platform = survival tool for independents
- US fractional/charter +11% YoY; global +4% YoY — demand not slowing
- On-demand direct booking accelerating; broker-heavy platforms losing ground — operator-direct model remains right positioning
- World Cup 2026 demand surge still incoming — multi-leg charter gap on product roadmap

**Competitors / SaaS:**
- **Avi-Go** — NBAA/EBAA/AsBAA-backed AI charter marketplace; closest direct competitor; real-time quoting + tracking
- **Aerotalon** — Part 135-specific ops platform; 80K+ waypoints; focused on operations not marketplace
- **Portside** — enterprise/fractional focus; not direct threat to indie operator segment
- No new Part 135 charter booking SaaS launched this week — window still open

---

### Phase 3 — Code Health

**Note:** pjroutes repo (`jaylenmareko/pjroutes-`) is outside GitHub MCP scope for this environment (scoped to `ranch-pad` only). Local directory `projects/business/pjroutes/` does not exist in this clone. Scan reflects carried state from prior session logs.

**Unresolved blockers (carried since 2026-05-15 — now 14 days):**
- `depart_start`/`depart_end` React state not updating via JS → operator form submits empty → Supabase insert silently fails — **BLOCKER: operators cannot list flights**
- Stripe test keys still in Vercel env vars — **BLOCKER before real transactions**
- Stripe bank transfer instruction emails not enabled (Stripe → Settings → Customer emails — manual 2-min toggle)
- Test data not purged from Supabase DB

**Unable to scan:** TODO/FIXME comments, imports, package.json — repo inaccessible in this environment. Add `pjroutes-` to GitHub MCP scope or scan locally to enable live code health checks.

---

**Action Items**
- Fix `depart_start`/`depart_end` React state bug — 14 days unresolved; single blocker between product and first real operator listing
- Swap Stripe test → live keys in Vercel env vars; nothing ships without this
- Enable Stripe bank transfer instruction emails (2-minute toggle in Stripe dashboard)
- Purge test data from Supabase before any outreach lands on pjroutes.vercel.app
- Launch Part 135 outreach — 402 contacts, SMS mandate urgency (364 days), FAA Safe Air Charter trust anchor; Real ID (May 7) adds fresh operator friction angle

---

## 2026-05-30 [AUTO]

### Phase 1 — Market Snapshot

**Markets (May 30, 2026):**
- S&P 500: 7,580.06 (+0.22%) — ninth consecutive weekly gain
- Nasdaq: 26,972.62 (+0.20%)
- Dow Jones: 51,032.46 (+0.72%) — crossed 51K
- Bitcoin: $73,515.11 (+0.20%) — recovering modestly; still off recent highs
- Driver: Dell earnings + peace talk optimism + Memorial Day reopening lift

**Top 3 Aviation/Business Headlines:**
1. **Premier Air Charter Holdings** receives FAA approval for 10+ passenger charter flights (Gulfstream fleet); service entry July 2026 — larger cabin market opening; new Part 135 entrant
2. **Private jet activity Week 20:** 80,126 flights globally (+4% YoY); US charter/fractional +11% YoY — demand not slowing
3. **JETBAY relaunches** as fixed-price private aviation OTA — new direct competitor in the on-demand charter marketplace space; watch closely

**New AI/Routing Dev Tools (last 7 days):**
- **NextBillion.ai** — enterprise AI routing APIs (time windows, traffic, vehicle attributes); gaining aviation logistics traction; directly applicable to pjroutes routing layer
- **Autonomous AI dispatch agents** — chain complex multi-stop routing without human input; applicable to pjroutes multi-leg/World Cup 2026 roadmap
- **AI-GIS airport routing frameworks** — intelligent route-level classification for airport networks; usable for FBO/waypoint intelligence layer

---

### Phase 2 — pjroutes Market Intel

**FAA / Regulatory:**
- FAA Part 135 certified operator list restored May 2, 2026 — updated daily for operators, weekly for aircraft; reliable for outreach cross-reference
- **14 CFR Part 135 Amdt. 135-149 (May 8, 2026)** — flight data recorder requirements for multi-engine turbine-powered airplanes and rotorcraft; new compliance burden for operators
- **SMS mandate: 363 days to May 28, 2027 deadline** — Senate SMS Compliance Review Act advancing post-DCA midair collision; regulatory scrutiny at all-time high; sharpest urgency hook in outreach
- Gray charter enforcement ongoing (~24 active FAA cases) — legitimate Part 135 operators motivated to gain verified platform exposure
- Real ID enforcement active since May 7 — passenger ID compliance friction; potential pjroutes booking-flow differentiator

**Market Trends:**
- Air Charter Service Q1 2026: +19% charter flights, +37% revenue ($380M) — record; demand accelerating
- US fractional/charter +11% YoY; global +4% YoY — on-demand segment leading growth
- JETBAY relaunch as fixed-price OTA — validates direct-booking model; but adds a real competitor; move fast
- Charter consolidation (Volato + FlyExclusive closing Q2, FlyHouse/Sun Air Jets) — fewer indie brokers; independents need a platform
- World Cup 2026 demand surge incoming — operators need multi-leg, multi-city booking tools; gap still on pjroutes roadmap
- Airline route planning software market: $9.04B in 2026 (8.1% CAGR → $12.27B by 2030)

**Competitors / SaaS:**
- **JETBAY** (relaunched) — fixed-price private aviation OTA; most relevant new entrant this week; direct threat
- **Avi-Go** — NBAA/EBAA/AsBAA-backed AI charter marketplace; real-time quoting + tracking; closest prior competitor
- **Schedaero** — all-in-one charter ops + marketplace; operator-side tool
- **Leon Software** — flight management + marketplace module; operator workflow
- No other new Part 135-specific booking SaaS this week — window tightening; JETBAY relaunch is a signal to move faster

---

### Phase 3 — Code Health

**Note:** pjroutes repo (`jaylenmareko/pjroutes-`) is outside GitHub MCP scope for this environment (scoped to `ranch-pad` only). Local directory `projects/business/pjroutes/` does not exist in this clone. Scan reflects carried state from prior session logs.

**Unresolved blockers (carried since 2026-05-15 — now 15 days):**
- `depart_start`/`depart_end` React state not updating via JS → operator form submits empty → Supabase insert silently fails — **BLOCKER: operators cannot list flights**
- Stripe test keys still in Vercel env vars — **BLOCKER before real transactions**
- Stripe bank transfer instruction emails not enabled (Stripe → Settings → Customer emails — manual 2-min toggle)
- Test data not purged from Supabase DB

**Unable to scan:** TODO/FIXME comments, imports, package.json — repo inaccessible in this environment. Add `pjroutes-` to GitHub MCP scope or scan locally for live code health.

---

**Action Items**
- Fix `depart_start`/`depart_end` React state bug — 15 days unresolved; JETBAY just relaunched; every day this stays broken is market share given away
- Swap Stripe test → live keys in Vercel env vars before outreach lands
- Enable Stripe bank transfer instruction emails (2-minute toggle in Stripe dashboard)
- Purge test data from Supabase; go live-ready today
- Launch Part 135 outreach — 402 contacts, SMS mandate urgency (363 days out), JETBAY relaunch adds competitive urgency to the hook

---

## 2026-05-31 08:00 [AUTO]

### Phase 1 — Market Snapshot

**Markets (May 31, 2026):**
- S&P 500: **7,580.06** (+0.22%)
- Nasdaq: **26,972.62** (+0.20%)
- Dow Jones: **51,032.46** (+0.72%) — above 51K
- Bitcoin: **$74,033** (+1.97% 24hr) — recovering; equities holding near highs

**Top 3 Aviation/Business Headlines:**
1. **Premier Air Charter Holdings** receives FAA approval for 10+ passenger charter flights on Gulfstream fleet — service entry July 2026; new larger-cabin Part 135 entrant
2. **Air Charter Service Q1 2026:** charter flights +19%, revenue +37% ($380M) — record demand, not slowing into summer
3. **Amazon Supply Chain Services** expanding third-party logistics via new division (P&G, 3M, Lands' End as early adopters) — logistics tech investment signal relevant to routing infra plays

**New AI/Routing Dev Tools (last 7 days):**
- **Google Maps Agentic UI Toolkit** (Experimental, May 19) — AI agents get interactive map layer for real-time geospatial visualization; directly integrable into pjroutes routing UX
- **Grounding with Google Maps** — now GA in Firebase AI Logic SDK; anchors AI apps to real-world location data (Android, iOS, web, Unity); strong fit for FBO/airport intelligence
- **Maps Grounding Lite (MCP)** — portable MCP tool grounding LLMs in Google Maps data (300M+ places); designed for rapid AI agent prototyping; directly applicable to pjroutes routing layer

---

### Phase 2 — pjroutes Market Intel

**FAA / Regulatory:**
- FAA restored public Part 135 operator list (April 27 data) — updated daily for operators, weekly for aircraft; reliable for outreach cross-reference
- FAA Safe Air Charter website: fully searchable certified Part 135 operator list — trust anchor for outreach copy
- SMS mandate: **362 days to May 28, 2027 Part 5 deadline** — Senate SMS Compliance Review Act advancing post-DCA; urgency sharpening
- Gray charter enforcement ongoing (~24 active FAA cases) — legitimate Part 135 operators motivated by verified platform exposure
- **NBAA Member Rewards program** launched May 21 — cost-reduction push for operators; NBAA engagement signals operator pain around operating costs

**Market Trends:**
- Private jet charter market: **$27.38B in 2026 → $45.43B by 2030** (13.5% CAGR) — large and accelerating
- Week 20: 80,126 flights globally (+4% YoY); YTD global +4%; North America +5% YoY; US charter/fractional +11% YoY
- On-demand charter cementing as default for short/mid-range private flying
- Jet fuel costs down 8%+ YoY — operator margins improving; reduces their cost objection to platform fees

**Competitors / SaaS:**
- **Flight Science** raised $7M (seed, Root Ventures) — real-time AI altitude/speed/route recommendations to pilots in-flight; validates AI routing market appetite in aviation
- **JETBAY** relaunched as fixed-price private aviation OTA (April 27) — no membership fees, all-inclusive charter packages on high-demand US city pairs; direct competitive threat; validates direct-booking model
- **FLYR** — $392M total raised; revenue intelligence + dynamic pricing for aviation; institutional signal on routing/pricing tech value
- Airline route planning software market: $9.04B in 2026 (8.1% CAGR → $12.27B by 2030)
- No new Part 135-specific charter booking SaaS launched this week — window tightening with JETBAY; move faster

---

### Phase 3 — Code Health

**Note:** pjroutes repo (`jaylenmareko/pjroutes-`) is outside GitHub MCP scope for this environment (scoped to `ranch-pad` only). Local directory `projects/business/pjroutes/` does not exist in this clone. Scan reflects carried state from prior session logs.

**Unresolved blockers (carried since 2026-05-15 — now 16 days):**
- `depart_start`/`depart_end` React state not updating via JS → operator form submits empty → Supabase insert silently fails — **BLOCKER: operators cannot list flights**
- Stripe test keys still in Vercel env vars — **BLOCKER before real transactions**
- Stripe bank transfer instruction emails not enabled (Stripe → Settings → Customer emails — 2-min manual toggle)
- Test data not purged from Supabase DB

**Unable to scan:** TODO/FIXME comments, imports, package.json — repo inaccessible in this environment. Clone locally or add `pjroutes-` to GitHub MCP scope for live code health checks.

---

**Action Items**
- Fix `depart_start`/`depart_end` React state bug — 16 days unresolved; JETBAY is live; every day this is broken is ground ceded to competitors
- Swap Stripe test → live keys in Vercel env vars before outreach lands
- Enable Stripe bank transfer instruction emails (2-minute toggle in Stripe dashboard)
- Purge test data from Supabase; go live-ready today
- Integrate Google Maps Grounding Lite (MCP) into pjroutes routing layer — it's purpose-built for this use case and now GA

---

## 2026-06-01 [AUTO]

### Phase 1 — Market Snapshot

**Markets (June 1, 2026):**
- S&P 500: 7,580.06 (+0.22%)
- Nasdaq: 26,972.62 (+0.20%)
- Dow Jones: 51,032.46 (+0.72%) — holding above 51K
- Bitcoin: ~$73,400 (-0.66%) — retreating while equities green
- Driver: Nvidia new PC chip launch leading tech; Dow futures up 260 pts pre-market; markets opening June on May momentum

**Top 3 Aviation/Business Headlines:**
1. **Premier Air Charter Holdings** receives FAA approval to operate 10+ passenger charter flights (Gulfstream fleet) — service entry July 2026; signals fleet buildout ahead of World Cup demand
2. **NBAA launches ATC modernization tracker** (May 29) — public site tracks US ATC infrastructure upgrade progress; relevant to routing, airspace planning, and ATC data feeds in routing software
3. **Nvidia leads markets higher** on new PC chip — Dow futures +260 pts; tech sector driving June open; aviation AI/tech spend cycle follows

**New AI/Routing Dev Tools (last 7 days):**
- **Google Maps Agentic UI Toolkit** (GA May 19) — LLMs get interactive geospatial map layer; converts unstructured text to real-time maps; directly embeddable via SDK into routing apps
- **Google Maps MCP Server ("Grounding Lite")** — geocoding, routing, isochrones, matrix routing, 300M+ POIs as LLM-callable tools; purpose-built for AI agent routing; now available
- **CARTO Agentic Tools** (open-source TypeScript) — agents create/style data layers, run spatial analytics, navigate maps from natural language; one `npm install`; relevant for pjroutes route viz layer
- **Mapbox MCP Server** — geocoding, routing, isochrones, matrix routing as LLM-callable tools; solid complement/alternative to Google for aviation route planning

---

### Phase 2 — pjroutes Market Intel

**FAA / Regulatory:**
- FAA Part 135 certified operator list restored April 27, 2026 — updated daily for operators, weekly for aircraft; was pulled in Feb due to data errors (omitting NetJets, FlyExclusive); now reliable
- FAA Safe Air Charter website upgraded — fully searchable certified Part 135 operator list live; strong trust anchor for outreach copy
- **SMS compliance deadline: May 28, 2027** — all Part 135 operators must implement Part 5 Safety Management System and submit declaration of compliance; Senate SMS Compliance Review Act advancing post-DCA; 361 days out
- Gray charter crackdown ongoing — FAA + NBAA enforcing against Part 91 operators advertising Part 135 services; ~24 active enforcement cases; verified platform exposure = value prop for legit operators

**Market Trends:**
- Charter activity: Jan +1.3%, Feb +5.3%, Apr +3.6% YoY — sustained demand curve, not softening
- **FIFA World Cup 2026 demand surge: June 11–July 19** (US/Canada/Mexico) — 73,000+ private jet flights forecast on match days; $274M in additional charter/fractional revenue expected; FAA slot reservation systems activated at host airports — operators need booking/routing tools NOW
- Jet-A fuel up 30% since March 1; charter prices up 15–20% overall — pricing pressure on operators; cost-reduction messaging resonates
- Private jet charter market: $27.38B in 2026 → $45.43B by 2030 (13.5% CAGR)
- Vista/VistaJet ordered 40 Bombardier Challenger 3500s; Jet OUT scaling to 17-aircraft CJ4 Gen2 fleet by end of 2026 — fleet expansion in progress

**Competitors / SaaS:**
- **JETBAY** relaunched as private aviation OTA (April 27) — fixed-price, all-inclusive charter packages on select US/international city pairs; no membership fees; direct competitive threat; validates direct-booking model
- **Avi-Go** — NBAA/EBAA/AsBAA-backed AI charter marketplace; real-time quoting, tracking, analytics — closest ongoing competitor
- Airline route planning software market: $9.04B in 2026 (8.1% CAGR); flight route optimization market → $17B by 2034 — institutional money following this space
- No new Part 135-specific charter booking SaaS launched this week — window tightening; JETBAY is live and moving

---

### Phase 3 — Code Health

**Note:** pjroutes repo (`jaylenmareko/pjroutes-`) is outside GitHub MCP scope for this environment (scoped to `ranch-pad` only). Local directory `projects/business/pjroutes/` does not exist in this clone. Scan reflects carried state from prior session logs.

**Unresolved blockers (carried since 2026-05-15 — now 17 days):**
- `depart_start`/`depart_end` React state not updating via JS → operator form submits empty → Supabase insert silently fails — **BLOCKER: operators cannot list flights**
- Stripe test keys still in Vercel env vars — **BLOCKER before real transactions**
- Stripe bank transfer instruction emails not enabled (manual toggle: Stripe → Settings → Customer emails — 2-min fix)
- Test data not purged from Supabase DB

**Unable to scan:** TODO/FIXME comments, imports, package.json — repo inaccessible in this environment. Clone locally or add `pjroutes-` to GitHub MCP scope for live code health checks.

---

**Action Items**
- Fix `depart_start`/`depart_end` React state bug — 17 days; World Cup starts June 11; operators need to be listing flights before that window opens
- Swap Stripe test → live keys in Vercel env vars before any outreach email lands
- Enable Stripe bank transfer instruction emails (2-minute toggle in Stripe dashboard)
- Purge test data from Supabase; go live-ready today
- Integrate Google Maps Grounding Lite (MCP) or Agentic UI Toolkit — both now GA; purpose-built for pjroutes routing layer; one-sprint integration
