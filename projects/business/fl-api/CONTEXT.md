# FL API

## What
A Claude-powered API that generates MIDI patterns and loads them directly into FL Studio.
Prompt in → music out.

## Status
Early build — Phase 1 in progress.

## Stack
- Python
- Anthropic SDK (claude-sonnet-4-6)
- mido (MIDI generation)
- FastAPI (Phase 3)
- FL Studio Python scripting API
- loopMIDI (virtual MIDI port, Windows)

## Phases
- [ ] Phase 1 — CLI: prompt → .mid file output
- [ ] Phase 2 — FL script: auto-loads .mid into FL channel
- [ ] Phase 3 — FastAPI + UI: text box → FL plays it live

## Monetization
- API subscriptions (developers)
- Producer-facing app (FL Studio users)
- B2B licensing

## Files
- `projects/music/` — generated MIDI output files
- `projects/business/fl-api/` — product code
- `C:/Users/Jaylen.Davis/Documents/Image-Line/FL Studio/Settings/Hardware/ClaudeController/` — FL script (wrong path)
- `C:/Users/Jaylen.Davis/OneDrive - Southwestern College/Documents/Image-Line/FL Studio/Settings/Hardware/ClaudeController/device_ClaudeController.py` — FL script (correct path)

## Keys
- ANTHROPIC_API_KEY in root `.env`
