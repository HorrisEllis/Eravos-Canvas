# ============================================================
# ERAVOS PERFORMANCE — measured (gate P · P11.5)
# spec_id:      eravos.performance
# measured_at:  2026-10-10T15:00:51.836Z  ·  regenerate: node tools/perf.mjs
# machine:      Intel(R) Xeon(R) Processor @ 2.10GHz · 2 logical cores · Chromium headless
# method:       4 s offline render per case; cost = render time ÷ audio time on ONE core (100 % = a full core in real
#               time). Offline is a proxy for the audio thread: same graph, no deadline. Empty-universe baseline subtracted.
# ============================================================

ceilings (enforced in code):
  notes per tool:      32 sounding at once (sdk-music onNote) — extra notes skipped and counted, never silent (RUNTIME_005, logged)
  polyphonic voices:   each synth steals its own oldest voice (supersaw 8, retro-poly 6, organ 6, pad-forge 8, coven 8, xen 8, sampler 8)
  redraws:             windows off-screen, folded or hidden draw nothing; reduced-motion caps displays at 8 fps

scene_20_tools:    86.2 %   (10 instruments playing chords + 10 effects/mixers)  faster than real time
song_engine_drop:  22.7 %   (Dubstep #77 from bar 33 — the full song graph)
baseline_empty:     3.5 %

per_tool (heaviest first):
  Pad Forge            instrument  36.0 %
  Gothic Organ         instrument  28.2 %
  Xen Synth            instrument  22.3 %
  Supersaw             instrument  17.0 %
  Coven                instrument  16.5 %
  Curve                instrument  12.2 %
  Wobble Bass          instrument   7.2 %
  Recursive Spectra    instrument   6.9 %
  Bass Forge           instrument   6.0 %
  Phaser               effect       5.0 %
  Retro Poly           instrument   4.4 %
  Haunt                effect       3.7 %
  Reese Bass           instrument   3.7 %
  Dub Station          effect       2.1 %
  EQ                   effect       2.0 %
  Mod Delay            effect       1.9 %
  Destroyer            effect       1.8 %
  Tape Echo            effect       1.8 %
  Deep Sub             instrument   1.5 %
  Channel              effect       1.4 %
  Drum Forge           instrument   1.0 %
  Acid Synth           instrument   1.0 %
  Filter               effect       0.9 %
  Master               effect       0.9 %
  Pitch                effect       0.9 %
  Dynamics             effect       0.8 %
  Glitch               effect       0.6 %
  Sample               instrument   0.4 %
  Drum Machine         instrument   0.2 %
  FX Box               instrument   0.0 %
  Dummy                effect      -0.3 %
  Sidechain            effect      -0.4 %

budget:
  per tool:  ≤ 10 % of a core while playing (tests/p17 guards the 20-tool scene; this file records the rest)
  over budget here: Pad Forge 36.0 %, Gothic Organ 28.2 %, Xen Synth 22.3 %, Supersaw 17.0 %, Coven 16.5 %, Curve 12.2 %
