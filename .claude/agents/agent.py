"""
Autonomous agent — runs daily per project.

Usage:
    python agent.py --project Ranch-Pad             # single run
    python agent.py --project pjroutes              # single run (includes code health)
    python agent.py --project pjroutes --approve    # push pending code changes
    python agent.py --project Ranch-Pad --loop      # run continuously every hour
    python agent.py --project Ranch-Pad --task "specific task"
    python agent.py --project Ranch-Pad --scout     # force skill scout this run
    python agent.py --scout-only                    # just run skill scout, no project phases
"""

import anthropic
import argparse
import os
import sys
import time
from datetime import datetime
from pathlib import Path

# Force UTF-8 output so web search results (em-dashes, bullets, etc.) don't crash on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).parent))
from research       import get_market_intel
from outreach       import run_outreach
from code_health    import run_code_health, approve_and_push
from skill_scout    import scout_and_install
from world_briefing import get_world_briefing

ROOT      = Path(__file__).parent.parent.parent  # DoWhatever/
CLAUDE_MD = ROOT / "CLAUDE.md"

PROJECT_TYPES = {
    "Ranch-Pad":       "business",
    "pjroutes":        "business",
    "wagyu-wellness":  "business",
    "TopicLaunch":     "business",
    "sophia-learning": "school",
    "music":           "music",
    "yt-summaries":    "research",
}


def load(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else f"[Not found: {path}]"


def find_context(project: str) -> Path:
    ptype = PROJECT_TYPES.get(project, "business")
    return ROOT / "projects" / ptype / project / "CONTEXT.md"


def find_session(project: str) -> Path:
    ptype = PROJECT_TYPES.get(project, "business")
    path  = ROOT / "sessions" / ptype / project / "session.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def append_session(session_path: Path, content: str):
    ts    = datetime.now().strftime("%Y-%m-%d %H:%M")
    entry = f"\n---\n\n## {ts} [AUTO]\n\n{content}\n"
    with open(session_path, "a", encoding="utf-8") as f:
        f.write(entry)
    print(f"\n[agent] Session log updated: {session_path}")


def _should_scout_today() -> bool:
    """Run skill scout on Mondays (weekday 0) so it's weekly without extra config."""
    return datetime.now().weekday() == 0


def run(project: str, task: str | None, approve: bool, force_scout: bool = False):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        sys.exit("[agent] ANTHROPIC_API_KEY not set.")

    # ── Approve mode ──────────────────────────────────────────────────────────
    if approve:
        if project != "pjroutes":
            print("--approve is only for pjroutes (hosted on Vercel/GitHub).")
            return
        result = approve_and_push()
        print(result)
        return

    client = anthropic.Anthropic(api_key=api_key)

    print(f"\n[agent] Project : {project}")
    print(f"[agent] Task    : {task or 'full auto run'}")
    print("─" * 50)

    sections = []

    # ── Phase 0: Skill Scout (Mondays or forced) ──────────────────────────────
    if force_scout or _should_scout_today():
        label = "forced" if force_scout else "Monday"
        print(f"\n[0/5] Skill Scout ({label})...")
        scout_result = scout_and_install(client, dry_run=False)
        sections.append(scout_result)
        print(scout_result)
    else:
        print("\n[0/5] Skill Scout — skipped (runs Mondays; use --scout to force)")

    # ── Phase 1: World Briefing (every day) ───────────────────────────────────
    print("\n[1/5] World briefing (markets, news, LinkedIn, opportunities)...")
    briefing_world = get_world_briefing(client)
    sections.append(briefing_world)
    print(briefing_world)

    # 65s pause so the world briefing's token usage clears the per-minute rate limit window
    print("\n[rate] Waiting 65s for rate limit window to reset...")
    time.sleep(65)

    # ── Phase 2: Market research ──────────────────────────────────────────────
    print("\n[2/5] Market research...")
    intel = get_market_intel(project, client)
    if intel:
        sections.append(intel)
        print(intel)

    # ── Phase 3: Code health (PJRoutes only) ─────────────────────────────────
    if project == "pjroutes":
        print("\n[3/5] Code health check...")
        health = run_code_health(client)
        sections.append(health)
        print(health)
    else:
        print("\n[3/5] Code health — skipped (Ranch-Pad is on Replit)")

    # ── Phase 4: Outreach ─────────────────────────────────────────────────────
    print("\n[4/5] Outreach...")
    outreach_result = run_outreach(project)
    sections.append(outreach_result)
    print(outreach_result)

    # ── Phase 5: Daily briefing ───────────────────────────────────────────────
    print("\n[5/5] Generating briefing...")
    context_md   = load(find_context(project))
    session_path = find_session(project)
    session_tail = load(session_path)[-2000:]

    run_summary = "\n\n".join(sections)
    prompt = (
        f"Today's agent run for {project}:\n\n{run_summary}\n\n"
        + (f"Additional task: {task}\n\n" if task else "")
        + "Summarize what was done and what Jaylen should action today. 5 bullets max. No fluff."
    )

    resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system=f"You are an autonomous agent for Jaylen Davis. Short, direct, bullets only.\n\n{load(CLAUDE_MD)}\n\n{context_md}\n\nRecent session:\n{session_tail}",
        messages=[{"role": "user", "content": prompt}]
    )
    briefing = resp.content[0].text
    print("\n" + briefing)

    # ── Append to session log ─────────────────────────────────────────────────
    append_session(session_path, run_summary + "\n\n**Briefing**\n" + briefing)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--project",    default=None,  help="Project to run (required unless --scout-only)")
    parser.add_argument("--task",       default=None)
    parser.add_argument("--approve",    action="store_true")
    parser.add_argument("--loop",       action="store_true", help="Run continuously every hour")
    parser.add_argument("--interval",   type=int, default=3600, help="Loop interval in seconds (default: 3600)")
    parser.add_argument("--scout",      action="store_true", help="Force skill scout this run")
    parser.add_argument("--scout-only", action="store_true", help="Only run skill scout, skip project phases")
    parser.add_argument("--dry-run",    action="store_true", help="Scout in dry-run mode (no installs)")
    args = parser.parse_args()

    # Scout-only mode — no project required
    if args.scout_only:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        client  = anthropic.Anthropic(api_key=api_key) if api_key else None
        print(scout_and_install(client, dry_run=args.dry_run))
        sys.exit(0)

    if not args.project:
        parser.error("--project is required (or use --scout-only)")

    if args.loop:
        print(f"[agent] Loop mode — running every {args.interval // 60} min. Ctrl+C to stop.")
        while True:
            try:
                run(args.project, args.task, args.approve, force_scout=args.scout)
            except Exception as e:
                print(f"[agent] Run failed: {e} — retrying next interval")
            print(f"\n[agent] Sleeping {args.interval // 60} min...\n")
            time.sleep(args.interval)
    else:
        run(args.project, args.task, args.approve, force_scout=args.scout)
