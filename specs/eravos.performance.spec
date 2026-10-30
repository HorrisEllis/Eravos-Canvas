# ============================================================
# ERAVOS PERFORMANCE — measured (gate P · P11.5)
# spec_id:      eravos.performance
# measured_at:  2026-10-10T15:00:51.836Z  ·  regenerate: node build/perf.mjs
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

## ADDENDUM 2026-10-23 (3.62, map specs/eravos.phase62-map.spec P62.2) — a silent tool sleeps
His words: "can you optimize performance?"
Measured on this machine (Xeon 2.1 GHz, 2 cores, Chromium headless; offline, cost = render time ÷ audio time on one core). Reproduce:
node build/perf-idle.mjs.
1. REJECTED (nothing shipped for it): Pad Forge, Gothic Organ and Coven stop a stolen voice without disconnecting it. With chords sent
   while rendering (the way the transport sends them), cost per second is flat from 8 s to 32 s: Pad Forge 49.8 → 45.7 %, Organ
   33.5 → 33.7 %, Coven 22.0 → 20.8 %, Xen Synth 27.4 → 25.8 %. Chrome drops finished nodes itself. (A first probe that scheduled every
   chord up front showed ×4 growth; that was the probe, not the tools.)
2. FOUND: a tool playing NOTHING keeps rendering its reverb, chorus LFOs and worklets. Silent, awake → with its audio out unplugged:
     Gothic Organ 18.8 % → −0.5 %   Pad Forge 15.3 % → −0.5 %   Embodiment Lab 8.2 % → 0.1 %   Bass Forge 6.1 % → −0.1 %
     Wobble Bass 5.8 % → −0.9 %     Retro Poly 2.0 % → −0.1 %   all 24 instruments 61.7 % → 1.6 %   (negative = within noise)
   Pad Forge playing, by part (8 s of 4-note chords every 0.3 s): default 51.2 % · reverb Size 1 s instead of 6 s 31.3 % · Shimmer 0
   45.3 % · Space 0 45.1 % (the convolver keeps running with nothing in it). Its reverb is its biggest cost while it plays.
3. SHIPPED — sleep (tools/music/core/sdk-music.js): a tool that says when it is silent (ctx.sleepWhen) is unplugged at its output after
   its whole tail (port.tail + 0.5 s; Pad Forge 14 s, Organ 7.5 s) and plugged back in by any note, MIDI note or audition before it
   sounds. On: Pad Forge (no voices, held chords count), Gothic Organ (no voices, no pedal), Wobble Bass (no note, release over).
   tests/p62-sleep.test.js: each sleeps only after its tail and the note after sleep sounds within 3 dB of the first; Hold never sleeps.
   A whole song (Heavy Drops "For Her, Heavy", seed 5908, first 40 s): 42.1 → 36.4 % in one run, 40.6 → 38.0 % in another: a 6–14 %
   cut (Wobble Bass and Pad Forge asleep while silent). The big saving is a canvas of tools that are not all playing.
   Real-time contexts sleep on their own (checked every 250 ms); offline renders stay awake unless K.audio.sleepOffline is set.
Open: Embodiment Lab is a drone (needs its own "stopped" state); effects need a "no input" test; Pad Forge's reverb while playing
(a cheaper IR at the same sound) is the next cost by this table.

## ADDENDUM 2026-10-30 (3.76) — the UI thread
His words: "It's also laggy." Reproduce: GLASS_CHROMIUM=<chrome> node build/perf-ui.mjs [full,calm,off]
  full (3.73 reactive colours): 15.3 fps · 91/92 frames > 33 ms · RecalcStyle 5.11 s · Layout 0.94 s
  calm (3.76 default):          55.3 fps · 26 slow · RecalcStyle 0.16 s
  off:                          56.7 fps · 21 slow · RecalcStyle 0.14 s
Rule from this: nothing writes a fast-changing custom property on <html>; per-frame visuals move opacity/transform only.
Next: @property { inherits: false } for --tool-level/--lvl so Full is cheaper; Pad Forge reverb → FDN (cost grows with IR length).
