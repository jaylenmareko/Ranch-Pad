"""
Keystroke timing recorder for TypingDNA pattern reset.
Type the phrase exactly: The full moon illuminates the night sky
Press Enter when done.
"""

import time
from pynput import keyboard

TARGET = "The full moon illuminates the night sky"

events = []       # list of (char, timestamp_ms)
typed = []        # characters typed so far
listening = True

print("=" * 55)
print("Keystroke Timing Recorder")
print("=" * 55)
print(f"\nPhrase: {TARGET}\n")
print("Start typing when ready. Press Enter when done.\n")

def on_press(key):
    global listening
    now = time.perf_counter() * 1000  # milliseconds

    try:
        ch = key.char
        if ch is not None:
            events.append((ch, now))
            typed.append(ch)
    except AttributeError:
        if key == keyboard.Key.space:
            events.append((' ', now))
            typed.append(' ')
        elif key == keyboard.Key.enter:
            listening = False
            return False  # stop listener
        elif key == keyboard.Key.backspace:
            events.append(('<BS>', now))
            typed.append('<BS>')

with keyboard.Listener(on_press=on_press) as listener:
    listener.join()

print("\n" + "=" * 55)
print("RAW TYPED:", ''.join(c if c != '<BS>' else '' for c in typed))
print("=" * 55)

# Filter out backspaces for clean analysis
# Replay typed with backspace logic
clean = []
for c in typed:
    if c == '<BS>':
        if clean:
            clean.pop()
    else:
        clean.append(c)

print(f"CLEAN TEXT: {''.join(clean)}")
print(f"TARGET:     {TARGET}")
print()

# Build delay list between consecutive events (skip backspace events)
# Use only the events that contributed to the final clean string
# Simplest: compute delays from raw events in order
delays = []
spaces = []
for i in range(1, len(events)):
    delay = events[i][1] - events[i-1][1]
    char = events[i][0]
    prev = events[i-1][0]
    delays.append((prev, char, delay))
    if char == ' ':
        spaces.append(delay)

print(f"{'#':<4} {'FROM':<6} {'TO':<6} {'DELAY (ms)':>12}")
print("-" * 32)
for i, (frm, to, d) in enumerate(delays):
    frm_display = 'SPC' if frm == ' ' else ('<BS>' if frm == '<BS>' else repr(frm))
    to_display  = 'SPC' if to  == ' ' else ('<BS>' if to  == '<BS>' else repr(to))
    print(f"{i+1:<4} {frm_display:<6} {to_display:<6} {d:>12.1f}")

print()
all_ms = [d for _, _, d in delays]
if all_ms:
    print(f"Average delay (all keys):        {sum(all_ms)/len(all_ms):>8.1f} ms")
if spaces:
    print(f"Average delay AT spacebar:       {sum(spaces)/len(spaces):>8.1f} ms")

# Delay after the last typed character
if len(events) >= 2:
    last_delay = events[-1][1] - events[-2][1]
    print(f"Delay after last character:      {last_delay:>8.1f} ms")

print()
print("Copy these delays to use in Playwright pressSequentially with custom timing.")
print("=" * 55)
