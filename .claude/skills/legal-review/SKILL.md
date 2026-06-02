---
name: legal-review
description: Review legal contracts, NDAs, employment agreements, SaaS terms, and M&A documents. Identifies unfavorable terms, suggests redlines, and compares to market standards. Use when the user mentions "review contract", "analyze agreement", "check this NDA", "terms of service", "legal review", or uploads/references any legal document.
metadata:
  version: 3.0.0
  source: evolsb/claude-legal-skill (adapted)
---

# Legal Review Skill

Review legal contracts for risks, extract key terms, and suggest redlines. Built on the CUAD dataset (41 risk categories), ContractEval benchmarks, and LegalBench.

> **Guardrail:** This is informational only — not legal advice. Recommend attorney review for material terms.

---

## Step 1: Pre-Review Checklist

Before analyzing content, verify document completeness:

- [ ] **Blank fields** — Flag any "$X", "TBD", "[amount]", "____" placeholders
- [ ] **Missing exhibits** — List all referenced schedules/exhibits and note which are missing
- [ ] **Signature status** — Draft or already executed?
- [ ] **All pages present** — Check for truncation or missing sections

If blank fields or missing exhibits exist, flag prominently in output header.

---

## Step 2: Identify Document Type & User Position

**Ask if unclear:** "Which party are you? (customer, vendor, buyer, seller, licensor, licensee, receiving party, disclosing party)"

This affects what's "risky":
- Customer reviewing vendor agreement → flag vendor-favorable terms
- Vendor reviewing own template → flag customer-favorable terms
- Buyer in M&A → flag seller-favorable terms
- Receiving party in NDA → flag disclosing party-favorable terms

**Assess power dynamic:**
- Startup vs. large enterprise? (limited negotiating leverage)
- Standard form vs. negotiated? (some terms non-negotiable)
- Regulated industry? (some terms legally required)

---

## Output Format

```markdown
# Contract Review: [Document Name]

**Document Type:** [type]
**Your Position:** [party]
**Counterparty:** [name]
**Risk Level:** 🔴 High / 🟡 Medium / 🟢 Low
**Document Status:** Draft / Executed

## Pre-Signing Alerts
- [blank fields, missing exhibits]

## Executive Summary
[2-3 sentences: overall risk, key issues]

## Key Terms
| Term | Value | Location |
|------|-------|----------|

## Red Flags (Quick Scan)
| Flag | Found | Location |
|------|-------|----------|

## Risk Analysis

### 🔴 Critical
[clause] → Issue → Market Standard → Redline suggestion

### 🟡 Important
[clause] → Issue → Negotiability

### 🟢 Reviewed & Acceptable
| Category | Status | Notes |

## Missing Provisions
| Provision | Priority | Why It Matters |

## Negotiation Priority
| # | Issue | Ask | Negotiability |
```

---

## Red Flags — Check These First

| Red Flag | Why It Matters |
|----------|----------------|
| Liability cap < 6 months | Inadequate protection |
| Uncapped indemnification | Unlimited exposure |
| "As-is" with no warranty | No recourse for defects |
| Unilateral suspension without notice | Service can vanish |
| Unilateral amendment rights | Terms can change anytime |
| No termination for convenience | Locked in |
| Perpetual obligations (non-competes, tails) | Indefinite exposure |
| Offshore jurisdiction (BVI, Cayman) | Expensive to enforce |
| Class action waiver + mandatory arbitration | Limited remedies |
| Asymmetric assignment rights | They can assign, you can't |

---

## Document Type Checklists

### NDA
| Check | Look For |
|-------|----------|
| Direction | One-way or mutual? |
| Definition scope | "All information" too broad? Standard exceptions? |
| Term | 2 years short, 3-5 typical, indefinite for trade secrets |
| Residuals clause | Can use general knowledge retained in memory? |
| Non-solicitation | Employees protected? |
| Return/destruction | Certification required? |

### SaaS / MSA
| Check | Look For |
|-------|----------|
| Liability cap | 12+ months = standard |
| Uptime SLA | 99.9% with credits = standard |
| Data ownership | Customer owns customer data? |
| Data export | Format, duration, cost on termination? |
| Price increases | Capped? Notice period? |
| Auto-renewal notice | 90+ days = good, <60 = risk |
| Subprocessors | Notice of changes? Approval rights? |

### M&A
| Check | Look For |
|-------|----------|
| Purchase price | Cash vs. stock vs. earnout mix? |
| Earnout mechanics | Measurement, discretion, audit rights |
| Escrow/holdback | Amount (10-15% typical), duration (12-18 mo) |
| Rep survival | 12-24 months general, longer for fundamental |
| Indemnification cap | 10-20% of purchase price typical |
| Non-compete | 2-3 years, geographic scope? |

---

## Market Standard Benchmarks

| Provision | Standard | Yellow Flag | Red Flag |
|-----------|----------|-------------|----------|
| Liability cap | 12 months' fees | 6-11 months | <6 months |
| Non-compete duration | 1-2 years | 3-4 years | 5+ years |
| Auto-renewal notice | 90+ days | 60-89 days | <60 days |
| Termination notice | Mutual, 60-90 days | One-sided, 30 days | Immediate |
| Indemnification | Mutual, capped | Asymmetric | Uncapped |
| Confidentiality (NDA) | 3 years general | 2 years | 5+ years |
| Fee tail (broker) | 12-18 months | 24 months | Perpetual |
| SLA uptime | 99.9% with credits | 99.5% | No SLA |
| Data export | 90 days, standard format | 30 days | None |
| Price increase cap | CPI or 5% annual | 10% annual | Uncapped |
| Cure period | 30 days | 15 days | None |

---

## Negotiability Guide

| Rating | Meaning |
|--------|---------|
| High | Usually accepted (mutual termination, cure periods, data export) |
| Medium | Depends on leverage (liability cap increase, price caps) |
| Low | Rarely changed (network rules, regulatory requirements) |
| None | Non-negotiable (card network mandates, banking regulations) |

---

## Related Skills

- **pricing-strategy** — For reviewing pricing terms and escalation clauses
- **cold-email** — For vendor/partner outreach after legal review
- **revops** — For contract workflow automation
