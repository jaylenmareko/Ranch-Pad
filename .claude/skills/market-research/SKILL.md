---
name: market-research
description: Validate market opportunities, size markets, run customer discovery, and synthesize competitive landscapes. Use when the user mentions "market research", "validate idea", "customer discovery", "TAM SAM SOM", "market size", "is there a market for", "who is the customer", "market opportunity", or "product validation".
metadata:
  version: 1.0.0
---

# Market Research Skill

Validate before building. Find the signal in the noise — size the market, understand the customer, and know the competition before committing resources.

---

## Before Starting

Ask what stage they're at:
1. **Idea stage** — Does this problem exist? Who has it?
2. **Pre-build** — Is this market big enough? Who are we building for?
3. **Post-launch** — Why aren't people buying? What are we missing?

---

## Market Sizing

### Bottom-Up (preferred)

```
SAM = # of addressable customers × ACV (annual contract value)
TAM = SAM ÷ realistic market share ceiling
SOM = SAM × realistic capture % in 3-5 years
```

**Example for RanchPad:**
- US ranches with 200+ head cattle: ~50,000
- Willing to pay $100/mo for ranch management software: ~30%
- SAM = 15,000 × $1,200/yr = $18M
- SOM year 3 = 500 customers = $600K ARR

### Top-Down (sanity check only)
Use industry reports as a ceiling, not a target. Never lead with top-down in a pitch or business case.

### Market sizing questions to answer:
- How many potential customers exist today?
- What do they currently pay for the problem you're solving (direct + indirect)?
- What % would realistically switch/buy?
- What's the realistic ACV?

---

## Customer Discovery

### The 5 Mom Test Questions

These questions can't be answered with "yes/no" — they force real answers:

1. "Tell me about how you currently handle [the problem]."
2. "What's the hardest part about [the problem]?"
3. "When's the last time [the problem] happened? Walk me through it."
4. "What have you tried to fix it? What happened?"
5. "How much did that cost you — time, money, frustration?"

**What to listen for:**
- Specific stories (signal) vs. hypotheticals ("I would probably...")
- Pain described in dollar or time terms
- Existing workarounds (proves the problem is real)
- Emotional language ("it drives me crazy", "we lose sleep over this")

### What NOT to ask:
- "Would you use this?" → Yes means nothing
- "How much would you pay?" → Hypothetical pricing is unreliable
- "Do you think other people have this problem?" → Irrelevant

### Interview output template:
```
Interviewee: [role, company size, segment]
Problem confirmed: Y/N
Current solution: [what they do today]
Pain level (1-10): 
Key quote: 
Willingness to pay signal: [what they said, not what they'd hypothetically pay]
Follow-up: Y/N
```

### How many interviews:
- 5-10 interviews per segment to find patterns
- Stop when you hear the same things repeatedly (saturation)
- Interview both buyers and users — they often have different pain

---

## Jobs-to-be-Done (JTBD) Framework

Customers don't buy products — they hire them to do a job.

**The JTBD statement:**
```
When [situation], I want to [motivation], so I can [outcome].
```

**Example:**
"When I'm checking cattle health at 5am, I want to quickly see which animals need attention, so I can spend less time on paperwork and more time in the field."

**Functional, emotional, and social jobs:**
- Functional: What task needs to get done?
- Emotional: How do they want to feel while doing it?
- Social: How do they want to be perceived?

---

## Competitive Landscape

### Competitor matrix:

| Competitor | Target customer | Pricing | Key strength | Key weakness | Why we win |
|------------|----------------|---------|-------------|-------------|-----------|

### Competitor categories:
- **Direct** — Same problem, same customer, same solution type
- **Indirect** — Same problem, different approach (e.g., spreadsheets, pen+paper)
- **Status quo** — "Do nothing" is always a competitor

### Positioning gaps:
- Where on the 2x2 is the white space?
- What do customers say about competitors that reveals unmet needs?
- Where does every competitor have the same weakness?

---

## Validation Methods by Stage

| Stage | Method | Time | Cost | Signal Quality |
|-------|--------|------|------|---------------|
| Idea | Customer interviews | 1-2 weeks | $0 | High |
| Pre-build | Landing page + waitlist | 1 week | Low | Medium |
| Pre-build | Fake door test | 1 week | Low | High |
| Pre-build | Letter of Intent (LOI) | 2-4 weeks | $0 | Very High |
| MVP | Concierge MVP | Ongoing | Time | Very High |
| Post-launch | Cohort retention | 60+ days | $0 | Very High |

**Strongest signal:** Someone pays (money) or commits (LOI, contract). Everything else is opinion.

---

## Survey Design

Use surveys only after interviews reveal patterns to quantify.

**Good survey questions:**
- Multiple choice with real options (not "other")
- Ranking (forces trade-offs)
- Frequency questions ("How often do you...")
- Behavioral questions ("In the last month, how many times did you...")

**Bad survey questions:**
- "Would you use X?" → Leading, hypothetical
- "How important is feature Y?" → Everything is important in surveys
- Open-ended questions to a cold audience → Low response quality

**Distribution:** Target your ICP specifically. A survey sent to your Twitter followers is not market research.

---

## Research Synthesis

After interviews and surveys:

1. **Cluster** — Group quotes and observations by theme
2. **Rank** — Which pain points came up most? Most intensely?
3. **Validate** — Do patterns match across segments?
4. **Decide** — What does this tell you to build/not build first?

**Output format:**
```
Top 3 validated pain points:
1. [pain] — mentioned by X/Y interviewees, severity: high/medium/low
2. [pain] — ...
3. [pain] — ...

ICP definition: [role] at [company type/size] who [context]

Market size estimate: $X SAM, $Y SOM in 3 years

Recommendation: Build / Don't build / Pivot because [specific reason]
```

---

## Related Skills

- **competitor-alternatives** — For building public-facing comparison content
- **pm-framework** — Turn research into a PRD
- **investor-pitch** — Turn research into a market slide
- **saas-metrics** — Validate unit economics assumptions
