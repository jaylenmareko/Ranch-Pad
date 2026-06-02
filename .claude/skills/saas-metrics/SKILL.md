---
name: saas-metrics
description: Calculate, interpret, and improve SaaS unit economics and financial health metrics. Use when the user mentions "MRR", "ARR", "churn", "CAC", "LTV", "unit economics", "burn rate", "runway", "Rule of 40", "NRR", "Quick Ratio", or asks about financial modeling for a SaaS business.
metadata:
  version: 1.0.0
  source: alirezarezvani/claude-skills saas-metrics-coach (adapted)
---

# SaaS Metrics Skill

Calculate, benchmark, and diagnose the financial health of a SaaS business. Give the user a clear picture of where they are and what to fix.

---

## Before Starting

Ask for:
1. **Business model** — B2B or B2C? Subscription or usage-based?
2. **Stage** — Pre-revenue, early ($0-100K MRR), growth ($100K-$1M MRR), scale?
3. **Available data** — What numbers do they have? (MRR, customers, CAC spend, etc.)

Work with whatever they have. Flag what's missing and why it matters.

---

## Core Metrics Reference

### Revenue

**MRR (Monthly Recurring Revenue)**
```
MRR = Sum of all active subscription monthly fees
New MRR = MRR from new customers this month
Expansion MRR = MRR from upgrades/upsells
Churned MRR = MRR lost from cancellations
Net New MRR = New MRR + Expansion MRR - Churned MRR
```

**ARR (Annual Recurring Revenue)**
```
ARR = MRR × 12
```
Use ARR for annual contracts. Use MRR × 12 only for monthly subscriptions.

**MRR Growth Rate**
```
MoM Growth = (MRR this month - MRR last month) / MRR last month × 100
```
Benchmarks: <5% = slow, 10-15% = healthy early-stage, 20%+ = strong

---

### Retention

**Gross Revenue Churn**
```
Gross Churn = Churned MRR / MRR at start of period × 100
```
Benchmarks: <1% monthly (<12% annual) = excellent, 2% = acceptable, >3% = problem

**Net Revenue Retention (NRR / NDR)**
```
NRR = (Starting MRR + Expansion MRR - Churned MRR - Contraction MRR) / Starting MRR × 100
```
- NRR > 100% = revenue grows even without new customers
- NRR > 120% = world-class (Snowflake, Datadog territory)
- NRR < 90% = leaking bucket — fix before scaling acquisition

**Logo Churn (Customer Churn)**
```
Logo Churn = Customers lost / Customers at start of period × 100
```

---

### Acquisition Economics

**CAC (Customer Acquisition Cost)**
```
Blended CAC = Total Sales & Marketing Spend / New Customers Acquired
Paid CAC = Paid S&M Spend / New Customers from Paid Channels
```

**LTV (Customer Lifetime Value)**
```
LTV = ARPU / Churn Rate (monthly)
     = ARPU × Average Customer Lifetime (months)
     = ARPU × Gross Margin % / Monthly Churn Rate
```
Always use gross margin-adjusted LTV.

**LTV:CAC Ratio**
```
LTV:CAC = LTV / CAC
```
| Ratio | Interpretation |
|-------|----------------|
| < 1:1 | Destroying value — stop scaling |
| 1:1 - 3:1 | Marginal — optimize before scaling |
| 3:1 | Healthy — standard benchmark |
| > 5:1 | Strong, may be underinvesting in growth |

**CAC Payback Period**
```
CAC Payback (months) = CAC / (ARPU × Gross Margin %)
```
Benchmarks: <12 months = excellent, 12-18 = acceptable, >24 = slow (capital intensive)

---

### Efficiency

**Rule of 40**
```
Rule of 40 = Revenue Growth Rate (%) + Profit Margin (%)
```
- Score > 40 = healthy
- Score > 60 = elite
- Early-stage: prioritize growth. Later-stage: balance both.

**Burn Multiple**
```
Burn Multiple = Net Burn / Net New ARR
```
| Score | Interpretation |
|-------|----------------|
| < 1x | Exceptional |
| 1-1.5x | Great |
| 1.5-2x | Good |
| 2-3x | Needs improvement |
| > 3x | Inefficient — fix before next raise |

**Magic Number**
```
Magic Number = (Current Quarter ARR - Last Quarter ARR) / Last Quarter S&M Spend
```
- > 0.75 = efficient, step on the gas
- 0.5 - 0.75 = proceed carefully
- < 0.5 = fix the funnel before spending more

---

### Runway & Burn

**Runway**
```
Runway (months) = Cash on Hand / Net Monthly Burn
```

**Net Burn**
```
Net Burn = Total Expenses - Total Revenue
```

**Gross Margin**
```
Gross Margin % = (Revenue - COGS) / Revenue × 100
```
SaaS benchmarks: >70% = good, >80% = great. COGS = hosting, support, customer success.

---

## Diagnostic Framework

When given a set of metrics, run this health check:

1. **Revenue direction** — Is MRR growing? What's the MoM rate?
2. **Retention quality** — NRR above or below 100%? Gross churn rate?
3. **Acquisition efficiency** — CAC payback < 18 months? LTV:CAC > 3:1?
4. **Unit economics** — Is each new customer profitable on a gross margin basis?
5. **Capital efficiency** — Burn multiple < 2x? Rule of 40 score?
6. **Runway** — Months of runway with current burn?

**Priority order for fixing:**
- Retention problems first (leaky bucket)
- Unit economics second (make each customer profitable)
- Acquisition efficiency third (scale what works)

---

## 12-Month Projection Template

```
Month 1 MRR: $X
Monthly growth rate: Y%
New customers/month: Z
Avg contract value: $W
Churn rate: V%

Projected Month 12 MRR: $X × (1 + Y%)^11
Projected ARR: Month 12 MRR × 12
```

Add scenario modeling: base (current trajectory), bull (+20% growth), bear (-20% growth).

---

## Benchmarks by Stage

| Metric | Pre-Seed | Seed | Series A | Series B |
|--------|----------|------|----------|----------|
| MoM Growth | N/A | 15-20% | 10-15% | 8-12% |
| NRR | N/A | >90% | >100% | >110% |
| Gross Margin | N/A | >60% | >70% | >75% |
| CAC Payback | N/A | <24mo | <18mo | <12mo |
| LTV:CAC | N/A | >2x | >3x | >4x |
| Rule of 40 | N/A | N/A | >20 | >40 |

---

## Common Mistakes

- **Confusing MRR and ARR** — Don't mix monthly and annual contracts without normalizing
- **CAC without channel split** — Blended CAC hides where acquisition is efficient
- **LTV without gross margin** — Revenue-based LTV overstates customer value
- **Ignoring contraction MRR** — NRR includes downgrades, not just churn
- **Vanity ARR** — Counting pilots, one-time revenue, or non-recurring deals in ARR

---

## Related Skills

- **investor-pitch** — For presenting these metrics to investors
- **pricing-strategy** — For improving the ACV and margin inputs
- **churn-prevention** — For fixing the retention metrics
- **revops** — For building the systems that track these metrics
