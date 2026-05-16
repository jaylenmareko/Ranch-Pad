"""
Always-on voice listener for Claude.

Listens to your mic continuously. When you speak and stop, it transcribes
using Google Speech (free, no API key), filters noise, sends to Claude API,
and speaks the response back.

Usage:
    python voice.py                         # listens for any project context
    python voice.py --project Ranch-Pad     # loads project context into Claude
    python voice.py --project pjroutes

Ctrl+C to stop.
"""

import anthropic
import argparse
import os
import sys
import speech_recognition as sr
import pyttsx3
from pathlib import Path

ROOT      = Path(__file__).parent.parent.parent
CLAUDE_MD = ROOT / "CLAUDE.md"

PROJECT_TYPES = {
    "Ranch-Pad":       "business",
    "pjroutes":        "business",
    "wagyu-wellness":  "business",
    "TopicLaunch":     "business",
    "sophia-learning": "school",
}

# Phrases too short or noisy to be real commands
NOISE = {
    "", "you", "the", "a", "uh", "um", "hmm", "hm", "oh", "okay", "ok",
    "yeah", "yes", "no", "huh", "what", "so", "hey", "hi", "hello",
}

# Minimum word count to send to Claude
MIN_WORDS = 3


def load(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def build_system(project: str | None) -> str:
    base = load(CLAUDE_MD)
    ctx  = ""
    if project:
        ptype = PROJECT_TYPES.get(project, "business")
        ctx_path = ROOT / "projects" / ptype / project / "CONTEXT.md"
        ctx = load(ctx_path)

    return (
        "You are Claude, Jaylen Davis's AI assistant. "
        "He is talking to you via voice — so respond conversationally. "
        "Keep responses short (2-4 sentences max) unless he asks for detail. "
        "No markdown, no bullet points — plain spoken language only.\n\n"
        + (f"--- CLAUDE.md ---\n{base}\n\n" if base else "")
        + (f"--- {project}/CONTEXT.md ---\n{ctx}" if ctx else "")
    )


def speak(engine: pyttsx3.Engine, text: str):
    # Strip any markdown that slipped through
    clean = text.replace("**", "").replace("*", "").replace("`", "").replace("#", "")
    engine.say(clean)
    engine.runAndWait()


def is_noise(text: str) -> bool:
    words = text.lower().strip().split()
    if len(words) < MIN_WORDS:
        return True
    if all(w in NOISE for w in words):
        return True
    return False


def run(project: str | None):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        sys.exit("[voice] ANTHROPIC_API_KEY not set.")

    client  = anthropic.Anthropic(api_key=api_key)
    system  = build_system(project)
    history = []  # keeps conversation context across turns

    # TTS engine
    engine = pyttsx3.init()
    engine.setProperty("rate", 175)   # words per minute
    engine.setProperty("volume", 1.0)

    # Pick a better voice if available
    voices = engine.getProperty("voices")
    for v in voices:
        if "zira" in v.name.lower() or "david" in v.name.lower():
            engine.setProperty("voice", v.id)
            break

    # Mic setup
    recognizer = sr.Recognizer()
    recognizer.energy_threshold        = 300   # adjust if too sensitive
    recognizer.dynamic_energy_threshold = True
    recognizer.pause_threshold         = 1.2   # seconds of silence = end of phrase

    mic = sr.Microphone()

    print("[voice] Calibrating microphone...")
    with mic as source:
        recognizer.adjust_for_ambient_noise(source, duration=2)

    ctx_label = f" ({project})" if project else ""
    print(f"[voice] Listening{ctx_label}... Speak naturally. Ctrl+C to stop.\n")
    speak(engine, f"Ready. I'm listening{', ' + project + ' context loaded' if project else ''}.")

    while True:
        try:
            with mic as source:
                audio = recognizer.listen(source, timeout=None, phrase_time_limit=30)

            print("[voice] Transcribing...", end=" ", flush=True)
            try:
                text = recognizer.recognize_google(audio)
            except sr.UnknownValueError:
                print("(unclear)")
                continue
            except sr.RequestError as e:
                print(f"(Google Speech error: {e})")
                continue

            print(f'"{text}"')

            if is_noise(text):
                print("  → filtered (too short/noise)")
                continue

            # Send to Claude
            history.append({"role": "user", "content": text})

            resp = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=256,
                system=system,
                messages=history,
            )
            reply = resp.content[0].text.strip()
            history.append({"role": "assistant", "content": reply})

            # Keep history from growing too large
            if len(history) > 20:
                history = history[-20:]

            print(f"Claude: {reply}\n")
            speak(engine, reply)

        except KeyboardInterrupt:
            print("\n[voice] Stopped.")
            speak(engine, "Shutting down.")
            break
        except Exception as e:
            print(f"[voice] Error: {e}")
            continue


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", default=None, help="Load a project's context")
    args = parser.parse_args()
    run(args.project)
