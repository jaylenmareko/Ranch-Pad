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
