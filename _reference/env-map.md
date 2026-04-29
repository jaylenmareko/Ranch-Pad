---
name: env-map
type: reference
description: Where every API key lives — not the keys themselves
---

# Env Map

| Key | Stored In | Used By |
|---|---|---|
| `ANTHROPIC_API_KEY` | root `.env` | Prompt-Smith, outreach scripts |
| `RESEND_API_KEY` | root `.env`, `outreach/.env` | FFA email sender, creators outreach |
| `STRIPE_SECRET_KEY` | Replit secrets | Ranch-Pad billing |
| `STRIPE_WEBHOOK_SECRET` | Replit secrets | Ranch-Pad webhooks |
| `STRIPE_PRICE_ID` | Replit secrets | Ranch-Pad subscriptions |
| `APIFY_API_KEY` | see `memory/reference_credentials.md` | FFA + creator scrapers |
| `ROBOFLOW_API_KEY` | meat-image-america `.env` | MIA grading model |
| `SUPABASE_URL` / `SUPABASE_KEY` | meat-image-america `.env` | MIA database |

## ⚠️ Open Issue
Ranch-Pad live Stripe key may still be in `.replit` file — move to Replit secrets.

## Rule
Keys go in `.env` (local) or Replit secrets (production). Never in markdown. Never committed.
