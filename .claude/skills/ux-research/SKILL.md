---
name: ux-research
description: Plan and conduct UX research, user interviews, usability tests, and synthesize findings into actionable design recommendations. Use when the user mentions "user research", "usability test", "user interview", "UX research", "user feedback", "persona", "user journey", "pain points", "how users feel about", or "what do users want".
metadata:
  version: 1.0.0
  source: saeed-vayghan/gemini-agent-skills ux-researcher (adapted)
---

# UX Research Skill

Uncover deep user insights through mixed-methods research. Translate findings into actionable design recommendations that improve experience and drive outcomes.

---

## Before Starting

1. Define the research question — what decision does this research inform?
2. Identify user segments to study
3. Choose methodology (qualitative, quantitative, or mixed)
4. Set success criteria — what would a clear answer look like?

---

## Research Methods

### Qualitative

**User Interviews** — Best for: understanding motivations, mental models, context
- 45-60 min, semi-structured
- 5-8 participants per segment for pattern saturation
- Record with consent, take sparse notes during, synthesize after
- Use the Mom Test — ask about past behavior, not hypothetical future behavior

**Usability Testing** — Best for: finding friction in a specific flow
- Give tasks, not instructions ("Pay for your order" not "Click checkout")
- Think-aloud protocol — ask users to narrate
- Observe, don't assist — silence is data
- 5 users catches 85% of usability issues

**Contextual Inquiry** — Best for: understanding the real environment of use
- Observe users in their actual context (field, not lab)
- Critical for niche users (ranchers, operators, farmers)
- Ask "show me" not "tell me"

**Diary Studies** — Best for: longitudinal behavior, infrequent tasks
- Ask participants to log entries at defined moments
- Reveals what people actually do over time, not what they think they do

### Quantitative

**Surveys** — Best for: quantifying patterns found in qualitative research
- Use Likert scales, multiple choice, ranking
- Avoid leading questions
- 100+ responses for statistical validity

**Analytics** — Best for: behavioral patterns at scale
- Funnel analysis — where do users drop?
- Heatmaps — where do users look and click?
- Session recordings — what actually happens in a session?
- Retention cohorts — do users come back?

**A/B Testing** — Best for: validating a specific design change
- One variable at a time
- Minimum detectable effect → required sample size
- Run to statistical significance (p < 0.05), not just "looks better"

---

## Interview Guide Template

```markdown
## Research Question
[What decision does this inform?]

## Participant Profile
[Who we're interviewing and why]

## Warm-up (5 min)
- Tell me about your role and what a typical day looks like.
- How do you currently handle [problem area]?

## Core Questions (30-40 min)
- Walk me through the last time you [did the task we're studying].
- What was the hardest part of that process?
- What tools or workarounds do you use?
- What would make this dramatically better?
- If you could change one thing, what would it be?

## Wrap-up (5 min)
- Is there anything I didn't ask that you think is important?
- Who else should I talk to?
```

---

## Synthesis Framework

After collecting data, synthesize before designing.

### Affinity Mapping
1. Write each observation/quote on a sticky note (one idea per note)
2. Group notes into natural clusters
3. Name each cluster with an insight statement (not a category label)
4. Rank clusters by frequency and severity

### Insight vs. Observation

| Observation | Insight |
|-------------|---------|
| "Users click the wrong button" | Users don't distinguish save vs. submit because they look identical |
| "3/5 users abandoned the form" | Users abandon when they reach the payment screen without seeing a price summary |

Insights explain WHY. Observations only describe WHAT.

### Severity Rating (for usability issues)

| Rating | Description |
|--------|-------------|
| Critical | Prevents task completion |
| Serious | Causes significant delay or frustration |
| Moderate | Causes minor confusion, workaround exists |
| Minor | Cosmetic or low-impact |

---

## Persona Template

```markdown
## [Persona Name]

**Role:** [Job title / context]
**Demographics:** [Age range, location, tech comfort]

### Goals
- [Primary goal]
- [Secondary goal]

### Pain Points
- [Top pain 1]
- [Top pain 2]
- [Top pain 3]

### Behaviors
- [How they currently solve the problem]
- [Tools they use]
- [Frequency of the task]

### Quote
"[Representative quote from research]"

### What Success Looks Like
[Describe what a great experience would feel like for them]
```

---

## User Journey Map Template

```
Stage:       [Awareness] → [Consideration] → [Use] → [Advocacy]
Actions:     [What they do at each stage]
Touchpoints: [Where they interact with your product/team]
Emotions:    [How they feel — frustrated, confident, confused]
Pain points: [What breaks down at each stage]
Opportunities:[Where you can improve experience]
```

---

## Research Checklist

Before wrapping up any research:
- [ ] Sample size adequate for the method used
- [ ] Bias minimized (no leading questions, diverse participants)
- [ ] Insights are actionable (tied to a design decision)
- [ ] Data triangulated (at least 2 sources agree)
- [ ] Findings validated across multiple participants
- [ ] Recommendations prioritized by severity
- [ ] Stakeholders aligned on findings

---

## Communicating Findings

**Executive summary structure:**
1. Research question + method
2. Key findings (3-5 bullet insights, not observations)
3. Recommendations with priority rating
4. Open questions for next research cycle

**Show evidence:**
Every recommendation should link to at least one direct quote or observation. "Users said X" is not evidence. "5 of 7 participants struggled to find the save button, with 3 abandoning the task entirely" is evidence.

---

## Related Skills

- **pm-framework** — Turn research findings into a PRD
- **market-research** — Research the market before researching the product
- **onboarding-cro** — Apply UX research to improve onboarding flows
- **page-cro** — Apply findings to landing page optimization
