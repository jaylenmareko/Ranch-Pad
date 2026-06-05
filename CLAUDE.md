# CLAUDE.md

I am Jaylen Davis. Software entrepreneur, student at Southwestern College in Winfield, Kansas, product builder.
You are my second brain. Cut hours to minutes.

---

## Routing

**ICM — Interpretable Context Methodology. Folders over agents.**

Context lives in 5 layers. Any AI reads them. No framework required. Architecture survives every model update.

| Layer | What it is | Where it lives |
|-------|-----------|----------------|
| 1 · Identity | Who Jaylen is, how I operate | `CLAUDE.md` |
| 2 · Routing | How to navigate between contexts + skill dispatch | `session-context.md` + skills registry |
| 3 · Stage Contract | Current stage, done criteria, next stage | `[project]/CONTEXT.md` |
| 4 · Reference | Credentials, specs, external resources | `memory/` + `[project]/reference/` |
| 5 · Artifacts | All working outputs | `[project]/artifacts/` |

Memory is auto-loaded at all times. Layers are parallel, not sequential.

**New project CONTEXT.md must include:**
- **Stage:** what phase the project is in right now (e.g. "MVP build", "pre-launch", "outreach")
- **Done criteria:** what defines this stage complete
- **Next stage:** what comes after
- Stack, file map, current priority, what moves the needle today

**Before every response — no exceptions:**
1. Read the `description:` field from every skill file in `.claude/skills/*/SKILL.md`
2. Match the user's **intent and task type** against those descriptions — not just surface keywords
3. If a skill's description fits what the user is trying to do, apply it silently and immediately
4. Apply multiple skills if more than one fits
5. Never wait to be asked. Never announce you're using a skill. Just use it.

**This applies to ALL skills — marketing, dev, agent, research, planning, everything.**
The registry table below is a quick-reference hint. The real matching source of truth is the `description:` field in each SKILL.md file. Any skill added to `.claude/skills/` is automatically live — no registry update needed.

---

## Skills Registry

Quick-reference hints. Primary matching always happens against each skill's `description:` field in its SKILL.md file — this table is supplementary. Every skill in `.claude/skills/` auto-applies when intent matches, whether it's listed here or not.

| User is talking about... | Auto-load skill |
|--------------------------|-----------------|
| Cold email, outreach email, prospecting, SDR, cold outreach | `cold-email` |
| Sales deck, pitch deck, one-pager, objection handling, demo script, sales collateral | `sales-enablement` |
| SEO, search ranking, keywords, blog content, schema markup, backlinks | `ai-seo` + `seo-audit` |
| Programmatic SEO, content at scale, landing page templates | `programmatic-seo` |
| A/B test, split test, experiment design | `ab-test-setup` |
| Ad creative, ad copy, Facebook ad, Google ad, creative brief | `ad-creative` |
| Analytics, tracking, GA4, GTM, events, pixel | `analytics-tracking` |
| Brand, logo, voice, tone, design system, identity | `brand-identity` |
| Churn, cancellation, retention, at-risk users, winback | `churn-prevention` |
| Competitor, alternative, vs page, comparison page, battle card | `competitor-alternatives` |
| Content strategy, editorial calendar, content plan | `content-strategy` |
| Copy editing, editing, proofreading, rewriting | `copy-editing` |
| Landing page copy, website copy, headline, CTA copy | `copywriting` |
| Email sequence, drip campaign, nurture, lifecycle emails | `email-sequence` |
| Error handling, exception, try/catch, fallback, resilience | `error-handling-patterns` |
| Launch, go-to-market, product launch, GTM strategy | `launch-strategy` |
| Marketing ideas, growth ideas, campaign brainstorm | `marketing-ideas` |
| Psychology, behavioral economics, persuasion, nudge, bias | `marketing-psychology` |
| Onboarding flow, activation, first-run experience, day-1 | `onboarding-cro` |
| Landing page CRO, conversion rate, page optimization | `page-cro` |
| Paid ads, PPC, Facebook ads, Google Ads campaign setup | `paid-ads` |
| Paywall, upgrade flow, upsell, premium conversion | `paywall-upgrade-cro` |
| Popup, modal, exit intent, overlay | `popup-cro` |
| Pricing, tiers, packaging, price point, freemium | `pricing-strategy` |
| Referral program, affiliate, word of mouth, viral loop | `referral-program` |
| Revenue ops, RevOps, lead routing, pipeline management | `revops` |
| Signup flow, registration, friction, onboarding steps | `signup-flow-cro` |
| Site architecture, navigation, sitemap, information architecture | `site-architecture` |
| Social media, LinkedIn post, Twitter/X, Instagram, content calendar | `social-content` |
| Contract, legal, NDA, terms of service, agreement review | `legal-review` |
| PRD, product requirements document, user story, roadmap, feature spec | `pm-framework` |
| Investor, pitch, fundraising, raise, deck for investors, VC | `investor-pitch` |
| Financial model, unit economics, CAC, LTV, MRR, ARR, burn rate | `saas-metrics` |
| New feature, new component, UI change, functionality | `brainstorming` |
| Parallel tasks, multiple independent workstreams | `dispatching-parallel-agents` |
| Customer success, health score, QBR, account management, NPS, onboarding customers | `customer-success` |
| Market research, validate idea, customer discovery, TAM SAM SOM, market size | `market-research` |
| User research, usability test, user interview, UX research, user feedback, persona, journey map | `ux-research` |
| API docs, documentation, README, developer guide, OpenAPI, Swagger, technical writing | `api-docs` |
| Grant, SBIR, STTR, grant application, NSF, USDA grant, research funding, grant proposal | `grant-writing` |
| Competitor research, competitive intelligence, what is competitor doing, monitor competitors, SWOT | `competitor-intelligence` |
| CI/CD, pipeline, deploy, Docker, Kubernetes, GitHub Actions, monitoring, infrastructure | `devops` |
| Data analysis, SQL query, cohort analysis, funnel analysis, business intelligence, metrics deep dive | `data-analysis` |
| Hiring, recruiting, job description, interview, first hire, contractor vs employee, making an offer | `hiring` |
| RanchPad, MIA, ranching, livestock, cattle, beef grading, AUSMEAT, ranch operations, ag-tech | `agriculture-expert` |
| Building a complete web app from scratch, full-stack generation, new project scaffold | `bolt-agent` |
| Multi-file coding task needing file reads, edits, and command runs step-by-step | `cline-agent` |
| Generating a React/Next.js UI, component, or polished app with modern design | `v0-agent` |
| Iterative, chat-driven app building where user refines as we go | `lovable-agent` |
| Complex coding task needing a todo list, parallel tool calls, autonomous execution | `cursor-agent` |
| Full engineering task: requires research, browsing, planning, then implementation | `devin-agent` |
| Working inside Replit, proposing file changes for the Replit IDE | `replit-agent` |
| Any question needing web research, citations, or synthesis of multiple sources | `perplexity-agent` |
| User gives a URL to clone, copy, or replicate a website's design | `same-agent` |
| Feature that should be requirements → design → tasks before any code is written | `kiro-agent` |
| Precise surgical edits to a Next.js 15 or shadcn codebase, smallest viable change | `orchids-agent` |

---

## Naming Conventions

`DD-MM-YYYY-description-status.ext`

Status tags: `draft` `final` `sent`

---

## Rules

- Check each project's `CONTEXT.md` for current priority — that is the source of truth
- CONTEXT.md is the Stage Contract — always has current stage + done criteria. If it's missing, write it before starting work.
- Before executing any marketing, outreach, dev, or specialized task — check available skills first and invoke the relevant one
- **New business projects:** always create an `outreach/` subfolder at setup
- **All projects:** always create an `artifacts/` subfolder — all outputs go there, never to root
- Never touch production without asking
- Never refactor unless asked
- If I am working on multiple things ask: *what drives a transaction? what drives the outcome? what moves the needle today?*
- Maximum output, minimum words
- Short. Blunt. Bullets. No fluff.
- When working on somethign new, recommend folder structures for the new project for organization purposes.
- **Emails:** Concise, precise, short. Subject: clear and direct. Body: 3-5 lines max. No filler. Every sentence earns its place.
- At the start of every session read the relevant `sessions/[type]/[project]/session.md` — mirrors `projects/` exactly (e.g. `sessions/business/Ranch-Pad/session.md`)
- At the end of every session **append** a new dated entry to that session file — never overwrite
- **Automation radar:** Passively spot automatable workflows during every session and at end-of-session — follow `.claude/skills/spot-automations/SKILL.md` for criteria and output format
- **New projects:** always `git init`, create a GitHub repo via `gh repo create`, and push on setup. Use `gh` CLI (portable at `C:\Users\Jaylen.Davis\AppData\Local\gh-cli\bin\gh.exe`) — authenticated as `jaylenmareko`. Make repos private by default unless told otherwise.

---

## Tools

**Antigravity** — agentic tasks, commands, multi-step execution
**Cursor** — precise code edits, debugging, in-editor work

Both tools read this file. Same standards. Different execution.
