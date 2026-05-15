import mido
from mido import MidiFile, MidiTrack, Message, MetaMessage

mid = MidiFile(type=1, ticks_per_beat=480)

tempo = mido.bpm2tempo(118)
beats_per_chord = 4
ticks_per_chord = beats_per_chord * 480

# Chord definitions (MIDI note numbers)
chords = {
    "Am": [57, 60, 64],   # A3, C4, E4
    "F":  [53, 57, 60],   # F3, A3, C4
    "G":  [55, 59, 62],   # G3, B3, D4
    "E":  [52, 56, 59],   # E3, G#3, B3
    "Dm": [50, 53, 57],   # D3, F3, A3
}

# Thriller verse progression (4 bars x 4 repeats = 16 bars)
progression = ["Am", "F", "G", "Am"] * 4

# Tempo track
tempo_track = MidiTrack()
mid.tracks.append(tempo_track)
tempo_track.append(MetaMessage("set_tempo", tempo=tempo, time=0))
tempo_track.append(MetaMessage("track_name", name="Tempo", time=0))

# Chord track
chord_track = MidiTrack()
mid.tracks.append(chord_track)
chord_track.append(MetaMessage("track_name", name="Thriller - Chords", time=0))

velocity = 80

for chord_name in progression:
    notes = chords[chord_name]

    # Note-on for all notes at once (time=0 for simultaneous)
    for i, note in enumerate(notes):
        chord_track.append(Message("note_on", note=note, velocity=velocity, time=0))

    # Hold for ticks_per_chord, then note-off
    for i, note in enumerate(notes):
        chord_track.append(Message("note_off", note=note, velocity=0,
                                   time=ticks_per_chord if i == 0 else 0))

output_path = "thriller_chords.mid"
mid.save(output_path)
print(f"Saved: {output_path}")
print(f"Progression: {' -> '.join(progression[:4])} (x4)")
print(f"Tempo: 118 BPM | Key: A minor | {len(progression)} bars total")
