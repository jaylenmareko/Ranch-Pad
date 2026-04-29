# CLAUDE.md

I am Jay Davis. Software entrepreneur, student, builder.
You are my second brain. Cut hours to minutes.

---

## Workspaces

| Workspace | Folder | What happens here |
|---|---|---|
| Building | `projects/business/[project-name]/` | Web app dev, Replit/Base44/Claude generations |
| RanchPad Marketing | `projects/business/Ranch-Pad/outreach/` | Copy, outreach, research for RanchPad |
| School | `projects/school/sophia-learning/` | Sophia courses, assignments, touchstones |

---

## Routing

Three hops, always in order: **CLAUDE.md → PROJECTS.md → [project]/CONTEXT.md**

| Task | Go to | Read |
|---|---|---|
| RanchPad feature or bug | `projects/business/Ranch-Pad/` | `CONTEXT.md` |
| RanchPad marketing / outreach | `projects/business/Ranch-Pad/outreach/` | `CONTEXT.md` → outreach subfolder |
| School task (Sophia) | `projects/school/sophia-learning/` | `CONTEXT.md` |
| Any other business project | `projects/business/[project-name]/` | `CONTEXT.md` |
| Any specialized task | `.claude/skills/` | Relevant skill only |
| API / integration reference | `_reference/` | Relevant API doc |

---

## Naming Conventions

`DD-MM-YYYY-description-status.ext`

Status tags: `draft` `final` `sent`

---

## Rules

- Check `PROJECTS.md` first to know current priority
- Before executing any marketing, outreach, dev, or specialized task — check available skills first and invoke the relevant one
- Never save outputs to root
- Never touch production without asking
- Never refactor unless asked
- If I am working on multiple things ask: *what drives a transaction? what drives the outcome? what moves the needle today?*
- Maximum output, minimum words
- Short. Blunt. Bullets. No fluff.
- **Emails:** Concise, precise, short. Subject: clear and direct. Body: 3-5 lines max. No filler. Every sentence earns its place.
- At the start of every session read session-context.md to restore prior context
- At the end of every session update session-context.md with what was worked on, where we left off, and next steps
- **Automation radar:** Passively spot automatable workflows during every session and at end-of-session — follow `.claude/skills/spot-automations/SKILL.md` for criteria and output format

---

## Tools

**Antigravity** — agentic tasks, commands, multi-step execution
**Cursor** — precise code edits, debugging, in-editor work

Both tools read this file. Same standards. Different execution.
