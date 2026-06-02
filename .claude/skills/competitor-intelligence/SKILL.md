---
name: competitor-intelligence
description: Research, track, and analyze competitors across LinkedIn, social media, job boards, and the web. Use when the user mentions "competitor research", "competitive intelligence", "what is competitor X doing", "monitor competitors", "competitive landscape", "hiring patterns", "competitor analysis", or "SWOT analysis".
metadata:
  version: 1.0.0
  source: anysiteio/agent-skills competitor-intelligence (adapted, tool-agnostic)
---

# Competitor Intelligence Skill

Track competitor activities, analyze hiring patterns, monitor content strategies, and benchmark market positioning. Turn public information into strategic advantage.

---

## Before Starting

1. **Target competitors** — Direct, indirect, or both?
2. **Intelligence goal** — Landscape mapping, deep dive on one competitor, hiring signals, or content benchmarking?
3. **Frequency** — One-time research or ongoing monitoring?
4. **Output format** — Summary, comparison matrix, or SWOT?

---

## Intelligence Sources (no paid tools required)

| Source | What It Reveals |
|--------|----------------|
| LinkedIn (company page) | Team size, growth rate, department breakdown, recent posts |
| LinkedIn (job listings) | Strategic priorities, expansion areas, tech stack |
| LinkedIn (employee search) | Leadership team, key hires, org structure |
| Twitter/X | Positioning, messaging, launch timing, community |
| Company website | Pricing, product positioning, target customer, case studies |
| G2 / Capterra / Trustpilot | Customer sentiment, complaints, strengths |
| Crunchbase | Funding, investors, founding team, revenue range |
| Y Combinator | For startup competitors — batch, team size, description |
| SEC EDGAR | For public companies — revenue, customers, risks |
| Reddit / HN / Indie Hackers | Authentic customer opinions, product feedback |
| YouTube | Content strategy, demo quality, thought leadership |
| Blog / RSS | Publishing cadence, content themes, SEO strategy |
| GitHub | Open source activity, tech stack, engineering culture |

---

## Workflows

### 1. Comprehensive Competitor Profile

**Goal:** Full picture of one competitor

**Steps:**

1. **Company overview**
   - Size, founding year, HQ, funding stage
   - LinkedIn: employee count, 6-month growth %
   - Crunchbase: funding rounds, investors

2. **Leadership team**
   - LinkedIn: search for C-suite and VP-level titles
   - Note: recent hires, departures, backgrounds

3. **Product & positioning**
   - Website: homepage, pricing page, features page, case studies
   - What problem they claim to solve
   - Who they target (ICP)
   - What differentiators they lead with

4. **Hiring velocity**
   - LinkedIn job listings: open positions by department
   - Growth signals: engineering = building; sales = scaling; ops = maturing
   - Repeat postings = retention problem

5. **Content strategy**
   - LinkedIn: posting frequency, themes, engagement rates
   - Blog: publishing cadence, topics, SEO keywords
   - YouTube: upload frequency, video types, view counts

6. **Customer sentiment**
   - G2/Capterra: star ratings, common complaints, praised features
   - Reddit/HN: authentic unprompted opinions
   - App Store reviews (if mobile)

7. **Output: Competitor profile**

```markdown
## [Competitor Name] — Profile

**Founded:** / **HQ:** / **Funding:** / **Size:**

### Positioning
- Target customer:
- Core problem they solve:
- Key differentiators:
- Pricing model:

### Team & Growth
- Employee count (LinkedIn):
- 6-month growth:
- Key recent hires:
- Open positions (top departments):

### Product
- Core features:
- Strengths (from reviews):
- Common complaints:

### Content & Marketing
- Posting frequency:
- Content themes:
- Top performing content:

### Competitive threat level: High / Medium / Low
**Why:** [reason]
```

---

### 2. Competitive Landscape Mapping

**Goal:** Map 5-20 competitors in your space

**Steps:**

1. **Identify competitors**
   - LinkedIn company search by industry + keywords
   - G2 category competitors
   - "Best [your category] software" Google search
   - ProductHunt alternatives to your product

2. **Categorize**
   - Direct: same problem, same customer, same solution type
   - Indirect: same problem, different approach
   - Potential: adjacent space, could expand

3. **Size and benchmark each**
   - Employee count + growth rate (LinkedIn)
   - Funding stage (Crunchbase)
   - Customer reviews count and rating (G2)

4. **Output: Landscape matrix**

| Competitor | Type | Size | Funding | G2 Rating | Target Customer | Price Point |
|------------|------|------|---------|-----------|----------------|-------------|

---

### 3. Hiring Velocity Analysis

**Goal:** Decode competitor strategy through hiring patterns

**What hiring reveals:**
- New engineering roles → building new product features
- Sales hiring in new geography → market expansion
- Data/ML roles → AI investment
- Customer success surge → post-sales problems
- Multiple re-posts of same role → retention problem

**Steps:**
1. Search LinkedIn Jobs for competitor company name
2. Group open positions by department
3. Note locations — geographic expansion signal
4. Track over time (screenshot monthly)

---

### 4. Content Strategy Benchmarking

**Goal:** Understand what content is working for competitors

| Platform | Metrics to Track |
|----------|-----------------|
| LinkedIn | Posts/week, avg engagement, content type (text/video/article) |
| Blog | Posts/month, avg word count, topic clusters, estimated traffic |
| YouTube | Videos/month, avg views, content types (demo/tutorial/thought leadership) |
| Twitter | Tweets/day, follower growth, top-performing threads |

**Output:** Content benchmarking table + gap analysis (what they cover that you don't, and vice versa)

---

## SWOT Framework

Run this after gathering intelligence on a specific competitor:

| | Helpful | Harmful |
|--|---------|---------|
| **Internal** | **Strengths** (what they do well) | **Weaknesses** (customer complaints, gaps) |
| **External** | **Opportunities** (where you can outflank them) | **Threats** (where they could hurt you) |

**Sources for each quadrant:**
- Strengths: G2 reviews (what users praise), LinkedIn growth
- Weaknesses: G2 complaints, Reddit discussions, support forum issues
- Opportunities: Underserved segments, pricing gaps, geographic gaps
- Threats: Job postings (what they're building), funding (war chest)

---

## Win/Loss Intelligence

After losing a deal to a competitor, capture:

```markdown
## Win/Loss Record

**Date:**
**Competitor:**
**Deal size:**
**Outcome:** Won / Lost

**Why we lost (from customer):**
**Their key advantage cited:**
**Our key disadvantage cited:**
**Price comparison:**
**Feature gap:**

**Intelligence gathered:**
- [Visit competitor website for pricing/feature updates]
- [Check their recent G2 reviews for messaging clues]
- [Note any new case studies in our vertical]
```

---

## Ongoing Monitoring Setup

Set up alerts to stay current without manual checking:

- **Google Alerts** — competitor name + product name
- **LinkedIn notifications** — follow competitor company page
- **G2 email alerts** — new reviews for competitors
- **RSS feed** — competitor blog (use Feedly or similar)
- **Twitter lists** — founders + key employees

Review weekly. Log significant moves (funding, launches, hires, pricing changes) in a competitive intelligence log.

---

## Related Skills

- **competitor-alternatives** — Build public-facing comparison pages from this intelligence
- **market-research** — Broader market context
- **sales-enablement** — Build battle cards from this intelligence
- **cold-email** — Outreach targeting competitor customers
