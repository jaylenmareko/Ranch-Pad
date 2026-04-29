# Spot Automations Skill

Identify workflows worth automating and surface them to Jay with a build suggestion.

---

## When to Invoke

- Passively during any session when a pattern is noticed
- Explicitly at end-of-session before updating session-context.md

---

## Automation Criteria

### Automate if ALL of these are true:
- Done **2+ times** (or clearly will be repeated)
- Takes **5+ minutes** manually
- Has **multiple ordered steps** that must happen the same way each time
- **High error risk** if done manually (wrong file, missed step, wrong format)

### Do NOT automate if ANY of these are true:
- One-off task (won't happen again)
- Faster to just do it than build it
- Requires judgment or context that changes every time
- Copy-paste or single action takes under 60 seconds
- Output needs human review before anything happens next

---

## How to Surface

When a workflow meets the criteria, say:

> **Automation spotted:** [what it is] — [why it qualifies] — suggest building [what to build]

Keep it to 2 lines max. Don't interrupt the current task — surface it at a natural pause or end of session.

---

## End-of-Session Scan

Before updating session-context.md, review the session and output:

**Automation candidates from this session:**
- [ ] [workflow name] — [one line: what it is + why it qualifies]

If none found, skip the section entirely. Don't force it.

---

## Where Workflow Files Live

- Project-specific → `projects/business/[project-name]/workflows/[name].md`
- General/cross-project → `.claude/workflows/[name].md`

Only create workflow files when Jay confirms he wants to build it.

---

## Workflow File Format

When Jay confirms, create `[workflow-name].md` in the correct location using this structure:

```
# [Workflow Name]

## What It Does
[One sentence.]

## Trigger
[What starts it — manual, scheduled, event-based.]

## Steps
1. [Step one]
2. [Step two]
3. ...

## Tools / Dependencies
- [Tool, script, API, or service needed]

## Estimated Time Saved
[X minutes per run / X times per week]

## Status
[ ] Not built  [ ] In progress  [ ] Done
```
