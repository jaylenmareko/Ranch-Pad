import os
import sys
import json
import re
import mido
from mido import MidiFile, MidiTrack, Message, MetaMessage
from anthropic import Anthropic
from dotenv import load_dotenv
from datetime import datetime

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../../.env"))

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../../music/output")
PRESETS_DIR = os.path.join(os.path.dirname(__file__), "presets")
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(PRESETS_DIR, exist_ok=True)

SYSTEM_PROMPT = """You are a MIDI music composer. When given a prompt, respond ONLY with valid JSON in this exact format:

{
  "title": "short-filename-safe-title",
  "tempo": 120,
  "tracks": [
    {
      "name": "track name",
      "channel": 0,
      "notes": [
        {"note": 60, "velocity": 80, "time": 0, "duration": 480},
        {"note": 64, "velocity": 75, "time": 480, "duration": 480}
      ]
    }
  ]
}

Rules:
- note: MIDI note number (0-127). Middle C = 60.
- velocity: volume 0-127
- time: position in ticks from start (480 ticks = 1 beat)
- duration: length in ticks (480 = 1 beat, 240 = half beat, 960 = 2 beats)
- tempo: BPM
- Multiple tracks allowed (melody, chords, bass)
- NO explanation, ONLY JSON."""


def load_preset(name):
    path = os.path.join(PRESETS_DIR, f"{name.lower().replace(' ', '-')}.json")
    if not os.path.exists(path):
        return None
    with open(path) as f:
        return json.load(f)


def save_preset(name, prompt, tempo, style_notes):
    preset = {
        "name": name,
        "created": datetime.now().strftime("%d-%m-%Y"),
        "prompt": prompt,
        "tempo": tempo,
        "style_notes": style_notes
    }
    path = os.path.join(PRESETS_DIR, f"{name.lower().replace(' ', '-')}.json")
    with open(path, "w") as f:
        json.dump(preset, f, indent=2)
    print(f"Preset saved: {name}")
    return preset


def list_presets():
    files = [f for f in os.listdir(PRESETS_DIR) if f.endswith(".json")]
    if not files:
        print("No presets saved yet.")
        return
    print("\nYour presets:")
    for f in files:
        with open(os.path.join(PRESETS_DIR, f)) as fp:
            p = json.load(fp)
        print(f"  [{p['name']}] — {p['style_notes']} | {p['tempo']} BPM | saved {p['created']}")


def build_prompt(user_input):
    lower = user_input.lower()
    if not lower.startswith("use preset:"):
        return user_input

    rest = user_input[len("use preset:"):].strip()

    # Split on " but " to separate preset name from override
    if " but " in rest.lower():
        idx = rest.lower().index(" but ")
        preset_name = rest[:idx].strip()
        override = rest[idx + 5:].strip()
    else:
        preset_name = rest.strip()
        override = ""

    preset = load_preset(preset_name)
    if preset:
        base = f"Style reference: {preset['style_notes']}. Original prompt: {preset['prompt']}."
        if override:
            base += f" Now apply this change: {override}"
        print(f"Using preset: {preset['name']}")
        return base
    else:
        print(f"Preset '{preset_name}' not found.")
        return user_input


def extract_json(raw):
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
    if match:
        return match.group(1)
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        return match.group()
    return None


def generate_midi(prompt):
    final_prompt = build_prompt(prompt)
    print(f"\nGenerating: {prompt}")

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"{final_prompt}. Keep it to a 2-bar loop (3840 ticks max). Max 20 notes per track."}]
    )

    raw = response.content[0].text.strip()
    json_str = extract_json(raw)

    if not json_str:
        print("Error: Claude didn't return valid JSON")
        print(raw)
        return None

    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        print(raw)
        return None

    mid = MidiFile(type=1, ticks_per_beat=480)
    tempo = mido.bpm2tempo(data.get("tempo", 120))

    tempo_track = MidiTrack()
    mid.tracks.append(tempo_track)
    tempo_track.append(MetaMessage("set_tempo", tempo=tempo, time=0))

    for track_data in data["tracks"]:
        track = MidiTrack()
        mid.tracks.append(track)
        track.append(MetaMessage("track_name", name=track_data["name"], time=0))

        channel = track_data.get("channel", 0)
        notes = sorted(track_data["notes"], key=lambda n: n["time"])

        events = []
        for n in notes:
            t = n["time"]
            dur = n["duration"]
            events.append((t, "note_on", n["note"], n["velocity"], channel))
            events.append((t + dur, "note_off", n["note"], 0, channel))

        events.sort(key=lambda e: e[0])
        current_tick = 0
        for event in events:
            delta = event[0] - current_tick
            current_tick = event[0]
            track.append(Message(event[1], note=event[2], velocity=event[3], channel=event[4], time=delta))

    title = data.get("title", "output").replace(" ", "-")
    timestamp = datetime.now().strftime("%d-%m-%Y-%H%M%S")
    filename = f"{timestamp}-{title}.mid"
    filepath = os.path.join(OUTPUT_DIR, filename)
    mid.save(filepath)

    print(f"Saved: {filepath}")
    print(f"Tempo: {data.get('tempo', 120)} BPM | Tracks: {len(data['tracks'])}")
    return {"filepath": filepath, "tempo": data.get("tempo", 120), "prompt": prompt}


def main():
    print("FL API - MIDI Generator")
    print("Commands: 'presets' | 'save <name>' after generating | 'use preset: <name>' | 'quit'\n")

    last_result = None

    while True:
        user_input = input("Prompt: ").strip()
        if not user_input:
            continue
        if user_input.lower() in ("quit", "exit", "q"):
            break

        if user_input.lower() == "presets":
            list_presets()
            continue

        if user_input.lower().startswith("save "):
            if not last_result:
                print("Nothing to save yet — generate a pattern first.")
                continue
            preset_name = user_input[5:].strip()
            style_notes = input("Describe this style (for your reference): ").strip()
            save_preset(preset_name, last_result["prompt"], last_result["tempo"], style_notes)
            continue

        last_result = generate_midi(user_input)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        generate_midi(" ".join(sys.argv[1:]))
    else:
        main()
