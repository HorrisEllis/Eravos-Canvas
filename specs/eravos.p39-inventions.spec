# spec_id: eravos.p39.inventions · version 1.0.0 · phase P39 · status MAPPED (spec only, by request) 
# R12 "invent something no one has ever seen" · "spec inventions around the constraint"
# THE CONSTRAINTS (the inventions are built AROUND them, not despite them):
#   C1 the browser: Web Audio nodes + AudioWorklet, no VST plugins, no native oscillator hard sync, no file system without
#      asking → everything must be synthesis or the user's own sounds
#   C2 the user is a beginner who wants a pro's ceiling (A1) · C3 technique, never copies (A3) · C4 one tool per tool
#   C5 ERAVOS cannot hear taste — only measure → it must make the user's ear FAST, not replace it
# Honesty: "never seen" is a claim no one can prove. Each item says what is new about it and what it is related to.

I1 FOLD-AS-SYNC (C1) — hard sync without sync: a fold stage whose drive tracks the pitch ratio of a slave oscillator gives
   the sync "tear" from native nodes; a worklet phase-reset version is the reference. Ship both, measured against each
   other. Related: wavefolding in analogue synths. New: driving fold depth from a virtual sync ratio. (P38 S3)
I2 ONE DRAWING, TWO TIME SCALES — the Wobble shape editor's drawing, played at audio rate, IS a wavetable cycle; the same
   curve can be the wobble (seconds) and the tone (milliseconds) at once, linked or not. (P38 S3)
I3 GRID-OWNED MOTION — BUILT for Wobble (3.38): the bar grid, not the note, owns a motion's phase. Generalised: any
   tool's movement can be owned by a rate roll (LFO Pro), so motion is composed like drums.
I4 TAP-MAP — show ERAVOS the rhythm you mean by tapping along to any song, capturing only your taps (no audio). Turns
   "I can't describe it" into data, legally (C3, C5). Related: tap tempo, MIDI recording. New: using a listener's taps
   against a reference as a target for a rhythm-fighting generator. (contrast-engine v2)
I5 THE HURT DIAL — one control on her-song and every Song Engine song: "how much it aches" 0..1, mapped (measurably) to
   harmonic tension, register (higher = more fragile), space (reverb, silence), pulse (heartbeat half-time ↔ dancing),
   and the resolution of the last chord. Related: Feeling Engine (planned) — this is its one-knob face (A1).
I6 CONTRAST GENOME + FARTHEST-POINT SONGS — songs as feature vectors, a set generated to maximise the minimum distance
   between any two (specs/eravos.p39-contrast-songs.spec). Related: diversity sampling in ML. New in a music tool: the
   song library's GOAL is coverage of the space, and every song states its distance to its nearest neighbour.
I7 RHYTHM RIVALRY + SNAP-BACK — two roles (grid / rebel), a generator that fights, and the snap-back as a scheduled
   object with a measurable "unresolved" state. (contrast-engine v2)
I8 FEEL LINES — the Timeline/Sequencer draw where the music actually pushes and pulls (measured micro-timing and accent
   centroid per beat) as a second, bendy grid over the straight one; drag a feel line to push a whole section late/early.
I9 THE CANVAS EXPLAINS ITSELF — every visible control can answer "why are you here?" from the dependency graph (which
   tool needs it, for what), and leaves when nothing does (specs/eravos.p39-canvas-shrink.spec). For a beginner the UI
   is a map of what is going on.
I10 BREATHING TEMPO — a tempo curve driven by a breath cycle (Embodiment Lab/Breath): ± 1–3 % over 4–8 bars, every tool
   follows (sample-accurate). Music that inhales. Related: rubato, tempo automation. New: a physiological cycle as the
   song's clock source, opt-in.
I11 PRESET GENETICS PER TOOL — BREED any tool's presets (sounds-in-settings §M2) with a visible family tree. Related:
   genetic patch generators. New: one generic breeder for every tool, gated by the level/diversity checks.
I12 TWO DEPTHS, ONE WINDOW — a depth slider on every window: the 3–6 controls that matter most (chosen per tool, ordered by
   measured audible effect) ↔ everything. The beginner and the pro use the SAME tool; nothing is hidden, only folded.
I13 MATCH A SOUND (C1 turned around) — no VSTs, so ERAVOS fits a sound with its OWN tools: drop a sound, it renders
   candidate params of a chosen tool offline, compares spectra/envelopes, and climbs toward the match → a preset you can
   edit. Related: synth parameter estimation research (sound matching). New in a DAW-like canvas: works for every tool
   through its config schema alone.
I14 THE NOTE TO HER — a song can carry words (a note, a date, why) that show while it plays and travel inside the export's
   metadata. Small, and the reason the rest exists.
order to explore: I12 + I9 (beginner relief, small) → I4 + I7 (the Contrast Engine) → I6 (the songs) → I13 + I11 (sound
  making) → I5 + I10 (feeling) → I1 + I2 + I8 (the Wub Lab voice and the grid).
