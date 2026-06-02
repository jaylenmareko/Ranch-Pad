---
name: data-analysis
description: Analyze data, write SQL queries, interpret metrics, build dashboards, and turn raw numbers into decisions. Use when the user mentions "analyze this data", "SQL query", "data analysis", "what does this data tell us", "cohort analysis", "funnel analysis", "user behavior", "business intelligence", "dashboard", or "metrics deep dive".
metadata:
  version: 1.0.0
---

# Data Analysis Skill

Turn data into decisions. SQL, cohort analysis, funnel breakdowns, and metric interpretation — structured thinking for messy data.

---

## Before Starting

1. **Data source** — What database/tool? (PostgreSQL, Supabase, BigQuery, Mixpanel, GA4, CSV)
2. **Question** — What decision does this analysis inform?
3. **Output format** — SQL query, summary table, chart recommendation, or written insight?

---

## SQL Patterns

### Funnel Analysis

```sql
-- Count users who completed each step of a funnel
SELECT
  COUNT(DISTINCT user_id) AS total_users,
  COUNT(DISTINCT CASE WHEN event = 'signup' THEN user_id END) AS signed_up,
  COUNT(DISTINCT CASE WHEN event = 'activated' THEN user_id END) AS activated,
  COUNT(DISTINCT CASE WHEN event = 'paid' THEN user_id END) AS paid,
  ROUND(
    COUNT(DISTINCT CASE WHEN event = 'activated' THEN user_id END) * 100.0 /
    NULLIF(COUNT(DISTINCT CASE WHEN event = 'signup' THEN user_id END), 0), 1
  ) AS signup_to_activation_pct
FROM events
WHERE created_at >= NOW() - INTERVAL '30 days';
```

### Cohort Retention

```sql
-- Weekly cohort retention
WITH cohorts AS (
  SELECT
    user_id,
    DATE_TRUNC('week', MIN(created_at)) AS cohort_week
  FROM users
  GROUP BY user_id
),
activity AS (
  SELECT
    user_id,
    DATE_TRUNC('week', created_at) AS activity_week
  FROM events
  WHERE event = 'session_start'
)
SELECT
  c.cohort_week,
  DATE_DIFF('week', c.cohort_week, a.activity_week) AS week_number,
  COUNT(DISTINCT a.user_id) AS retained_users,
  COUNT(DISTINCT c.user_id) AS cohort_size,
  ROUND(COUNT(DISTINCT a.user_id) * 100.0 / COUNT(DISTINCT c.user_id), 1) AS retention_pct
FROM cohorts c
JOIN activity a USING (user_id)
GROUP BY 1, 2
ORDER BY 1, 2;
```

### Time-Series MRR

```sql
-- Monthly MRR trend
SELECT
  DATE_TRUNC('month', subscription_start) AS month,
  SUM(monthly_amount) AS new_mrr,
  SUM(SUM(monthly_amount)) OVER (ORDER BY DATE_TRUNC('month', subscription_start)) AS cumulative_mrr
FROM subscriptions
WHERE status = 'active'
GROUP BY 1
ORDER BY 1;
```

### Segmentation

```sql
-- Segment users by engagement level
SELECT
  user_id,
  COUNT(DISTINCT DATE(created_at)) AS active_days,
  COUNT(*) AS total_events,
  CASE
    WHEN COUNT(DISTINCT DATE(created_at)) >= 20 THEN 'power'
    WHEN COUNT(DISTINCT DATE(created_at)) >= 5 THEN 'regular'
    WHEN COUNT(DISTINCT DATE(created_at)) >= 1 THEN 'occasional'
    ELSE 'dormant'
  END AS segment
FROM events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id;
```

---

## Analysis Frameworks

### North Star Metric

Every product has one metric that matters most. Everything else is a supporting metric.

| Product Type | Typical North Star |
|------------|-------------------|
| Marketplace | GMV or transactions |
| SaaS | MRR or ARR |
| Consumer app | DAU or WAU |
| Agriculture platform | Active animals monitored |
| Grading tool | Scans completed per week |

**Supporting metrics** feed the North Star. They explain *why* the North Star moved.

### AARRR Funnel

| Stage | Metric | Question |
|-------|--------|---------|
| Acquisition | New users | Where are they coming from? |
| Activation | % reach "aha moment" | Did they get value in first session? |
| Retention | 30/60/90-day return | Do they come back? |
| Revenue | MRR, ARPU | Are they paying? |
| Referral | NPS, viral coefficient | Do they tell others? |

### Cohort Analysis Interpretation

| Pattern | Meaning |
|---------|---------|
| Retention improves in later cohorts | Product getting better |
| Retention drops in later cohorts | Attracting lower-quality users |
| High early drop then flatten | Strong core audience, weak acquisition targeting |
| Consistent decay | Normal — but what's the floor? |

---

## Data Exploration Checklist

When given a new dataset:

1. **Count rows and check date range** — Is this all the data? Missing periods?
2. **Check for nulls** — Which columns have nulls? Does it matter?
3. **Check distributions** — Min, max, avg, median. Any obvious outliers?
4. **Check for duplicates** — Unique ID count vs. row count
5. **Join sanity check** — Before joining tables, verify key overlap
6. **Trend before segment** — See the overall trend before slicing by segment

```sql
-- Quick dataset sanity check
SELECT
  COUNT(*) AS total_rows,
  COUNT(DISTINCT user_id) AS unique_users,
  MIN(created_at) AS earliest,
  MAX(created_at) AS latest,
  COUNT(*) FILTER (WHERE user_id IS NULL) AS null_user_ids
FROM your_table;
```

---

## Communicating Findings

### Insight vs. observation

| Observation | Insight |
|-------------|---------|
| "Retention dropped from 40% to 28% in March" | "Retention dropped in March cohort, matching the new onboarding flow we launched — activation rate also fell from 65% to 44%" |
| "Mobile users have lower conversion" | "Mobile users convert 40% less than desktop, but they're 60% of traffic — fixing the mobile checkout is the highest-leverage conversion opportunity" |

### Finding structure

```
1. What we measured
2. What we found (the number)
3. Why it matters (the "so what")
4. What to do about it (the recommendation)
5. What to measure next
```

---

## Visualization Recommendations

| Data Type | Best Chart |
|-----------|-----------|
| Trend over time | Line chart |
| Part of whole | Pie (max 5 slices) or stacked bar |
| Comparison (few items) | Bar chart |
| Comparison (many items) | Horizontal bar chart |
| Distribution | Histogram or box plot |
| Correlation | Scatter plot |
| Cohort retention | Heatmap table |
| Funnel steps | Funnel chart or bar |

**Rules:**
- Start y-axis at 0 for bar charts
- Always label units (%, $, count)
- One chart = one insight
- Highlight the key data point

---

## Common Mistakes

- **Confusing correlation and causation** — Two things moving together doesn't mean one causes the other
- **Cherry-picking time ranges** — Show the full period, not just the good part
- **Ignoring sample size** — A 50% conversion rate from 2 users is meaningless
- **Averaging averages** — Use medians for skewed distributions (revenue, support time)
- **Not segmenting** — Overall metrics hide the real story inside segments

---

## Related Skills

- **saas-metrics** — Specific SaaS metric definitions and benchmarks
- **analytics-tracking** — Setting up the tracking that feeds this analysis
- **ab-test-setup** — Designing experiments to test hypotheses from analysis
