# CLAUDE.md

I am Jaylen Davis. Software entrepreneur, student at Southwestern College in Winfield, Kansas, product builder.
You are my second brain. Cut hours to minutes.

---

## Routing

**CLAUDE.md → session-context.md → [project]/CONTEXT.md**

Memory is auto-loaded by the system at all times — not a sequential hop.

Each project's `CONTEXT.md` has everything: stack, status, file map, current task, and **current priority**.
For specialized tasks: check `.claude/skills/` first and invoke the relevant skill.

**New project CONTEXT.md must include:** current priority, status, and what moves the needle today.

---

## Naming Conventions

`DD-MM-YYYY-description-status.ext`

Status tags: `draft` `final` `sent`

---

## Rules

- Check each project's `CONTEXT.md` for current priority — that is the source of truth
- Before executing any marketing, outreach, dev, or specialized task — check available skills first and invoke the relevant one
- **New business projects:** always create an `outreach/` subfolder at setup
- Never save outputs to root
- Never touch production without asking
- Never refactor unless asked
- If I am working on multiple things ask: *what drives a transaction? what drives the outcome? what moves the needle today?*
- Maximum output, minimum words
- Short. Blunt. Bullets. No fluff.
- When working on somethign new, recommend folder structures for the new project for organization purposes.
- **Emails:** Concise, precise, short. Subject: clear and direct. Body: 3-5 lines max. No filler. Every sentence earns its place.
- At the start of every session read the relevant `sessions/[type]/[project]/session.md` — mirrors `projects/` exactly (e.g. `sessions/business/Ranch-Pad/session.md`)
- At the end of every session **append** a new dated entry to that session file — never overwrite
- **Automation radar:** Passively spot automatable workflows during every session and at end-of-session — follow `.claude/skills/spot-automations/SKILL.md` for criteria and output format
- **New projects:** always `git init`, create a GitHub repo via `gh repo create`, and push on setup. Use `gh` CLI (portable at `C:\Users\Jaylen.Davis\AppData\Local\gh-cli\bin\gh.exe`) — authenticated as `jaylenmareko`. Make repos private by default unless told otherwise.

---

## Tools

**Antigravity** — agentic tasks, commands, multi-step execution
**Cursor** — precise code edits, debugging, in-editor work

Both tools read this file. Same standards. Different execution.
