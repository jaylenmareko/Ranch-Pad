# Outreach Machine — Design Doc
**Date:** 2026-05-21  
**Status:** Approved → moving to implementation

---

## What We're Building

A fully autonomous multi-project outreach system running as 4 scheduled Claude Code remote agents. No manual triggering. Scrapes new leads, sends personalized emails, monitors replies, and emails a daily cross-project digest.

---

## Projects in Scope

| Project | Goal | Resend from |
|---|---|---|
| Ranch-Pad | Acquire ranchers/farmers as users | `jaylen@ranchpad.app` |
| PJRoutes | Recruit charter operators | `support@pjroutes.com` |
| TopicLaunch | Recruit creators | `jaylen@topiclaunch.com` |

---

## File Structure

```
outreach/machine/                    ← lives in DoWhatever root (shared across projects)
├── config.json                      ← per-project config (keys, from, batch, thresholds)
├── state/
│   ├── ranchpad.json
│   ├── pjroutes.json
│   └── topiclaunch.json
├── queue_builder.py                 ← reads lead sources → dedupes → fills queues
├── sender.py                        ← picks batch → personalizes → sends → updates state
├── monitor.py                       ← polls Resend events API → updates open/reply status
└── digest.py                        ← cross-project summary email → j7beatss@gmail.com
```

---

## Batch Sizes & Velocity

| Project | Batch/run | Runs/week | Emails/week |
|---|---|---|---|
| Ranch-Pad | 500 | 3 | 1,500 |
| PJRoutes | 200 | 3 | 600 |
| TopicLaunch | 300 | 3 | 900 |
| **Total** | | | **~3,000/week** |

---

## Cron Schedule

| Agent | Schedule (CST) | Action |
|---|---|---|
| Sender | Mon / Wed / Fri 9am | Sends batches for all 3 projects |
| Monitor | Daily 7am | Polls Resend events, updates state |
| Digest | Daily 8am | Summary email to j7beatss@gmail.com |
| Scraper | Sunday 10pm + on-demand (queue < 200) | Refills queues from sources |

---

## Scrape Sources

| Project | Sources |
|---|---|
| Ranch-Pad | Ag creators (YouTube/IG/TikTok — ranching/farming niche) via Apify · State extension agent directories · State cattlemen/livestock association member lists |
| PJRoutes | FAA Part 135 certificate holders (faa.gov public registry) · aircharterguide.com · part135directory.com |
| TopicLaunch | Existing Google Sheet (2,464 contacts — finish sending) + new: YouTube/TikTok/IG/Podcasters via Apify (fitness, health, business, AI, dating, psychology, 1K–100K audience) |

Auto-scrape triggers when any project queue drops below 200 unsent leads.

---

## State Schema (per project)

```json
{
  "meta": {
    "project": "ranchpad",
    "last_scrape": "2026-05-21T22:00:00Z",
    "last_send": "2026-05-21T09:00:00Z"
  },
  "queue": [
    { "id": "uuid", "email": "...", "name": "...", "org": "...", "source": "apify_ag_creators", "scraped_at": "..." }
  ],
  "sent": [
    { "id": "uuid", "email": "...", "resend_id": "re_xxx", "sent_at": "...", "status": "sent|opened|clicked|replied", "opened_at": null, "replied_at": null }
  ],
  "stats": {
    "total_sent": 0, "opens": 0, "replies": 0, "open_rate": 0.0, "reply_rate": 0.0
  }
}
```

---

## config.json Schema

```json
{
  "ranchpad": {
    "resend_key_env": "RESEND_API_KEY_RANCHPAD",
    "from": "Jaylen @ RanchPad <jaylen@ranchpad.app>",
    "batch_size": 500,
    "queue_threshold": 200,
    "scrape_sources": ["apify_ag_creators", "extension_dirs", "cattlemen_assoc"]
  },
  "pjroutes": {
    "resend_key_env": "RESEND_API_KEY_PJROUTES",
    "from": "Jaylen @ PJRoutes <support@pjroutes.com>",
    "batch_size": 200,
    "queue_threshold": 200,
    "scrape_sources": ["faa_part135", "aircharterguide", "part135directory"]
  },
  "topiclaunch": {
    "resend_key_env": "RESEND_API_KEY_TOPICLAUNCH",
    "from": "Jaylen @ TopicLaunch <jaylen@topiclaunch.com>",
    "batch_size": 300,
    "queue_threshold": 200,
    "scrape_sources": ["google_sheet", "apify_youtube", "apify_tiktok", "apify_instagram", "apify_podcasts"]
  }
}
```

---

## Email Personalization

`sender.py` calls Claude API to generate a personalized 3-5 line email per lead using:
- Lead name, org, platform (if creator), state
- Project-specific template prompt stored in `config.json`
- Tone: direct, human, short — no fluff

---

## Digest Format

Daily 8am email to j7beatss@gmail.com:

```
Subject: Outreach — Wed May 21

Ranch-Pad:   sent 500 | opens 47 (9.4%) | replies 3 | queue 1,240
PJRoutes:    sent 200 | opens 31 (15.5%) | replies 7 | queue 890
TopicLaunch: sent 300 | opens 28 (9.3%) | replies 2 | queue 2,100

🔥 Hot replies today:
- john@smithranch.com (Ranch-Pad) — replied 2h ago
- pilot@texascharter.com (PJRoutes) — replied 6h ago
```

---

## Implementation Phases

1. **Scaffold** — create `outreach/machine/` structure, config.json, empty state files
2. **queue_builder.py** — read existing CSVs + Google Sheet, dedupe, populate initial queues
3. **sender.py** — batch pick, Claude personalization, Resend send, state update
4. **monitor.py** — Resend events polling, status updates
5. **digest.py** — summary email
6. **Apify scrapers** — per-source scraper functions (ag creators, FAA, TL creators)
7. **Cron wiring** — 4 CronCreate calls to activate remote agents
8. **Test run** — single manual trigger of each agent, verify end-to-end
