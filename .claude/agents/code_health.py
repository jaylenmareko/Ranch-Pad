"""
Code health module — PJRoutes only.

Flow:
  1. Read key source files + recent git changes
  2. Check live site is responding
  3. Run npm run build
  4. Ask Claude to find bugs + propose fixes
  5. Apply fixes to files
  6. Run npm run build again to verify
  7. Write summary to pending/
  8. Email user at j7beatss@gmail.com
"""

import anthropic
import json
import os
import requests
import subprocess
from datetime import date
from pathlib import Path

ROOT      = Path(__file__).parent.parent.parent
PJROUTES  = ROOT / "projects/business/pjroutes"
PENDING   = Path(__file__).parent / "pending"
USER_EMAIL = "j7beatss@gmail.com"

# Key consumer-facing files to audit
AUDIT_FILES = [
    "app/page.tsx",
    "app/flights/page.tsx",
    "app/book/[id]/page.tsx",
    "app/api/confirm-booking/route.ts",
    "app/api/create-payment-intent/route.ts",
    "app/api/operator-submit/route.ts",
    "lib/stripe.ts",
    "lib/resend.ts",
    "middleware.ts",
]


def _read_files() -> str:
    parts = []
    for rel in AUDIT_FILES:
        path = PJROUTES / rel
        if path.exists():
            content = path.read_text(encoding="utf-8")[:3000]  # cap per file
            parts.append(f"=== {rel} ===\n{content}")
    return "\n\n".join(parts)


def _recent_git_diff() -> str:
    try:
        result = subprocess.run(
            ["git", "diff", "HEAD~3", "--", "*.ts", "*.tsx"],
            cwd=str(PJROUTES),
            capture_output=True, text=True, timeout=15
        )
        diff = result.stdout[:4000]
        return f"=== Recent git changes ===\n{diff}" if diff else ""
    except Exception:
        return ""


def _check_live_site() -> str:
    try:
        resp = requests.get("https://pjroutes.com", timeout=10)
        if resp.status_code == 200:
            return "Live site: UP (200 OK)"
        return f"Live site: WARNING — status {resp.status_code}"
    except Exception as e:
        return f"Live site: DOWN — {e}"


def _run_build() -> tuple[bool, str]:
    try:
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd=str(PJROUTES),
            capture_output=True, text=True, timeout=120
        )
        success = result.returncode == 0
        output  = (result.stdout + result.stderr)[-3000:]
        return success, output
    except Exception as e:
        return False, str(e)


def _send_notification(summary: str, pending_path: Path, resend_key: str):
    body = (
        f"PJRoutes agent found issues — {date.today()}\n\n"
        f"{summary}\n\n"
        f"Proposed fixes written to: {pending_path}\n\n"
        "To push: python .claude/agents/agent.py --project pjroutes --approve\n"
        "To reject: delete the pending file."
    )
    try:
        requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {resend_key}", "Content-Type": "application/json"},
            json={
                "from": "PJRoutes Agent <support@pjroutes.com>",
                "to":   [USER_EMAIL],
                "subject": f"[PJRoutes Agent] Code review — {date.today()}",
                "text": body,
            },
            timeout=10,
        )
    except Exception:
        pass  # notification failure shouldn't stop the run


def _apply_fixes(fixes: list[dict]) -> list[str]:
    applied = []
    for fix in fixes:
        file_path = PJROUTES / fix.get("file", "")
        new_content = fix.get("content")
        if file_path.exists() and new_content:
            file_path.write_text(new_content, encoding="utf-8")
            applied.append(fix["file"])
    return applied


def run_code_health(client: anthropic.Anthropic) -> str:
    RESEND_KEY = "re_4LmPWRn9_NLhTMktvHQApomEukwcxefHk"
    lines = ["**Code Health — PJRoutes**"]

    # 1. Live check
    live_status = _check_live_site()
    lines.append(f"- {live_status}")

    # 2. Build check
    build_ok, build_output = _run_build()
    lines.append(f"- Build: {'PASS' if build_ok else 'FAIL'}")
    if not build_ok:
        lines.append(f"```\n{build_output[-1000:]}\n```")

    # 3. Read source + recent diff
    source = _read_files()
    diff   = _recent_git_diff()

    # 4. Ask Claude to audit
    audit_prompt = f"""You are auditing the PJRoutes Next.js app for bugs and consumer-facing issues.

Review the following source files and recent git changes. Identify:
- Broken or missing error handling in API routes
- UI bugs that would affect a passenger or operator
- Missing env var checks
- Any payment or booking flow issues

{source}

{diff}

Build output:
{build_output[-1000:]}

Respond in this JSON format (valid JSON only, no markdown wrapper):
{{
  "issues": [
    {{"severity": "high|medium|low", "file": "relative/path", "description": "what is wrong"}},
    ...
  ],
  "fixes": [
    {{"file": "relative/path", "content": "full corrected file content"}},
    ...
  ],
  "summary": "2-3 sentence plain English summary of what was found and fixed"
}}

Only include fixes you are confident about. Do not fix what isn't broken.
If nothing needs fixing, return empty issues and fixes arrays."""

    try:
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            messages=[{"role": "user", "content": audit_prompt}]
        )
        raw = resp.content[0].text.strip()

        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = "\n".join(raw.split("\n")[1:])
        if raw.endswith("```"):
            raw = "\n".join(raw.split("\n")[:-1])

        audit = json.loads(raw)
    except Exception as e:
        lines.append(f"- Audit failed: {e}")
        return "\n".join(lines)

    issues  = audit.get("issues", [])
    fixes   = audit.get("fixes", [])
    summary = audit.get("summary", "")

    if not issues:
        lines.append("- No issues found.")
        return "\n".join(lines)

    # Log issues
    lines.append(f"- Issues found: {len(issues)}")
    for issue in issues:
        lines.append(f"  [{issue['severity'].upper()}] {issue['file']}: {issue['description']}")

    if not fixes:
        return "\n".join(lines)

    # Apply fixes
    applied = _apply_fixes(fixes)
    lines.append(f"- Fixes applied locally: {', '.join(applied)}")

    # Re-run build to verify
    build_ok2, _ = _run_build()
    lines.append(f"- Build after fixes: {'PASS' if build_ok2 else 'FAIL — review manually'}")

    # Write pending summary
    PENDING.mkdir(exist_ok=True)
    pending_file = PENDING / f"pjroutes-{date.today()}.md"
    pending_file.write_text(
        f"# PJRoutes Pending Changes — {date.today()}\n\n"
        f"## Summary\n{summary}\n\n"
        f"## Issues\n" +
        "\n".join(f"- [{i['severity'].upper()}] `{i['file']}`: {i['description']}" for i in issues) +
        f"\n\n## Files Modified\n" +
        "\n".join(f"- `{f}`" for f in applied) +
        "\n\n## To push\n```\npython .claude/agents/agent.py --project pjroutes --approve\n```\n"
        "## To reject\nDelete this file.\n"
    )

    # Notify
    _send_notification("\n".join(lines), pending_file, RESEND_KEY)
    lines.append(f"- Notification sent to {USER_EMAIL}")
    lines.append(f"- Pending file: {pending_file}")

    return "\n".join(lines)


def approve_and_push() -> str:
    pending_files = list(PENDING.glob("pjroutes-*.md"))
    if not pending_files:
        return "No pending PJRoutes changes to push."

    try:
        subprocess.run(["git", "add", "-A"], cwd=str(PJROUTES), check=True)
        subprocess.run(
            ["git", "commit", "-m", f"agent: code health fixes {date.today()}"],
            cwd=str(PJROUTES), check=True
        )
        subprocess.run(["git", "push"], cwd=str(PJROUTES), check=True)
        for f in pending_files:
            f.unlink()
        return "Pushed to GitHub. Vercel will deploy automatically."
    except subprocess.CalledProcessError as e:
        return f"Push failed: {e}"
