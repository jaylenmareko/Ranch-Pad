---
name: topiclaunch-context
type: project
routes_to: projects/business/TopicLaunch/
description: Context for TopicLaunch — fan-to-creator commission marketplace. Currently on hold.
---

# TopicLaunch — Context

**Status: ON HOLD**
**Site:** topiclaunch.com
**Stack:** Replit, Stripe
**North Star:** Completed transactions. Everything else is noise.

---

## What It Is

Content demand marketplace. Fans pay to request video topics from creators. Creators fulfill and keep 90%.

**Core loop:** Fan submits + funds a topic → Creator delivers → Creator gets paid

- Fans can crowdfund topics together
- Creators set prices from $5
- Platform takes 10% per transaction

---

## Who's On It

**Target creators:** 1K–100K subscribers, niches: Fitness, Health, Business, Money, AI, Dating, Psychology, Family, Cosmetics
**Current active creator:** stopplayinntre — 60K IG, 80–90K TikTok, 30K YouTube (street-style debates, Black women's cultural identity)

---

## File Map

```
TopicLaunch/
├── CONTEXT.md               ← you are here
└── outreach/
    ├── linkedin-outreach.md
    ├── email-outreach.md    ← runbook for email campaigns
    ├── resend.md            ← Resend API notes (TopicLaunch-specific)
    ├── send-emails.mjs      ← email send script
    ├── sent_log.txt         ← send history
    └── tl_emails.json       ← contact list
```

---

## Departments (when active)

- **Growth** — creator cold outreach, DM campaigns, creator onboarding
- **Retention** — fulfillment tracking, fan re-engagement
- **Revenue** — Stripe monitoring, refund reduction, pricing
- **Intelligence** — topic demand patterns, fan behavior, competitor analysis
