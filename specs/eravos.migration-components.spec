# spec_id: eravos.migration-components · version 1.0.0 · phase P69 · status mapped (not built)
# "if anything in here is useful, migrate and remove as much friction as possible." — five component zips
# (2026-10-24): ALK · ase-persistent-scanner · resonance-app · resonance-engine v5.1.0 · rheon-voice. Read in the
# scratchpad; nothing copied into the repo yet. Verdict per part, by what ERAVOS (a music canvas) can actually use.

## Friction rules for anything migrated
  plain scripts in the ERAVOS shape (an engine + ui + spec + tests per tool, or a domain core file) — no ES-module
  imports, no build step, no server, no external API keys · works in the web build and the exe alike · every port keeps
  its source credit in a comment · WebGL2 paths fall back to 2D canvas (never a blank tool)

## MIGRATE
  M1 ALK cfr/alk-gl.js (885 lines, WebGL2 ping-pong particle field, particles read their neighbours)
     → the GPU engine of the Particle Field visual (tools/music/tools/visuals/particle-field): far more particles,
       field behaviour; driven by the song (level, low, high, pulse — the --snd-* values the UI already computes).
  M2 ALK trajectory/trajectory-recorder.js + field-portrait.js (+ the idea of attractor-landscape.js)
     → a new visual, PHASE SPACE: the sound as a moving point in 3D (x = brightness, y = level, z = pitch/low end),
       a trail, the shape a section leaves — v10's "3D trajectory" view made real. Its emotion/person model is NOT taken.
  M3 rheon-voice js/audio-engine.js — snapshot(): pitch, amplitude, zero-crossings, spectral centroid, loudness,
       spectral flux, pitch stability; oscilloscope drawn downsampled; ResizeObserver-sized canvases
     → a shared voice analyser in the music core: Clip Maker shows the pitch and voiced parts of a take; Lyric Rhythm
       and the vocal tools can read pitch; the oscilloscope code replaces hand-sized scopes where they blur.
  M4 rheon-voice live transcription (the browser's SpeechRecognition, with its fallbacks)
     → Lyric Rhythm: "speak or sing the words" — the transcript arrives as the lyric, timed to the beat. Offline-safe:
       the button only shows where the browser offers speech recognition.

## SKIP (not music, or cannot run)
  ase-persistent-scanner — an authorship fingerprint for text (who wrote a passage). Nothing a song canvas uses.
  resonance-app v4.1 — a text "resonance" app with its own engine and persistence. No music use.
  resonance-engine v5.1.0 — text and lyric gap analysis; its own notes say it cannot run: gap-field.js
    (LyricFieldAnalyzer, SequenceFieldAnalyzer) is missing from every zip. Revisit only if that file turns up — then it
    could annotate lyrics inside Lyric Rhythm.
  ALK kernel / siso / jaa / mesh / video / text / behavior / expression / signal — face, body and behaviour analytics,
    a video codec and its own runtime. ERAVOS already has its own event core (host/siso.js) and kernel. Not taken.
  rheon-voice codec-engines.js / analysis-engine / LLM mirror / server — speech analytics (friction, drift, sentiment)
    and an API relay. Not music; the API relay would need keys. Not taken.

## Acceptance (per migrated part)
  M1 the Particle Field runs on WebGL2 with ≥ 10× the particles at 60 fps on a mid laptop and falls back to 2D
  M2 Phase Space draws a stable shape for a held note and a moving one for a wobble (tests on rendered audio)
  M3 Clip Maker shows a pitch line on a sung take; analyser values tested on synthetic tones (440 Hz → 440 ± 2)
  M4 Lyric Rhythm takes a transcript (tested with a stubbed SpeechRecognition)
