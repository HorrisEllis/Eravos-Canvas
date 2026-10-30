# eravos.phase74e-map.spec — 3.74e+: everything still open from this session's work (3.68 … 3.74d), mapped after building it (2026-10-30)
# Numbering: this track continues the letter suffixes (3.74e, 3.74f …) because specs/eravos.phase75-map.spec reserves 3.75–3.86 for VOICE ·
# AUDIO IO · SUITES · COMPONENTS. A phase takes the next free letter when it is built; the IDs below (Q, T, R, P, D) never change.

## His words this stretch (verbatim, the ones that leave work open)
  "Bass and drums forge. Fix box. Drop builder. Breath. Eq. Side chain. Embodyment. Recursive spectra. Automation. Baseline. Chords. Groove.
   All need more dynamic control and a better ui." — dynamic = movement over time, variation and feel, performance controls, deeper sound
   controls, "all the above while not cluttering or making it overwhelming"; "One tool first, then all". Groove is done (3.71b–3.72b) and he
   approved the look ("that's way better. Continue that.").
  "can you run tests like that on all of them" (the Destroyer measurements) — run (3.74d, docs/sound-audit.md); what it still flags is Q.
  "each tool is supposed to be bundled with its dag, tool file, ui and packs … its own zip" — built (3.74c); what is left is P.

## What the code shows (main + this branch, 2026-10-30)
  K1 Shared layers exist and are opt-in: Motion + Perform (perform: true · core/motion.js, motion-ui.js), the page tabs (view.pageTab,
     UIKit.pageTabsFor), the look kit (UIKit — every tool already has it), reactive colours per tool (_react on every music tool).
  K2 The sound audit flags (default settings): Wub Filter intermodulation −4.2 dB · Channel DC −0.015 · tails 2 s after release: Pad Forge
     −41, Gothic Organ −32, Xen Synth −49 dBFS · CPU (ms per second of sound, one instance): Pad Forge ~220, Gothic Organ ~145, Xen ~135,
     Partials ~115, Coven ~97, Morph Osc ~90, Retro Poly ~68.
  K3 A test is borderline: tests/p74b "COMPLETELY DIFFERENT" fails ~1 run in 2 at exactly 6.0 dB on a different pair each time (3.74b).
  K4 Installing the Core zip raises "Failed to construct 'URL': Invalid URL" (a core script reads its own URL; from a blob it has none).

## Q — sound quality (the audit, then the audit as a gate)
  Q1 Wub Filter: the blown-speaker test at −4.2 dB. Same method as Destroyer: find what puts the 50 Hz through a nonlinearity (drive / its
     resonance), keep the sub clean or level-match it; target ≤ −20 dB, its talking unchanged. Measure before/after; a test.
  Q2 CPU, in order of weight: Pad Forge (its reverb — eravos.performance.spec already names a cheaper IR), Gothic Organ, Xen Synth, Partials,
     Coven, Morph Osc, Retro Poly. Per tool: profile the render, take out what does nothing (as Destroyer 2.1), voice-steal earlier, share
     per-voice nodes. Target ≤ 60 ms per second of sound each; the sound fingerprint unchanged (render compared before/after).
  Q3 Tails: listen and decide per tool — a pad's or an organ's long release and reverb can be the sound (then a BY_DESIGN note), a note that
     never ends is a bug (then a fix). Xen Synth −49 dBFS after 2 s is likely its partial decay; Gothic Organ −32 its room.
  Q4 Channel: DC −0.015 at default — find the asymmetric stage; a 5 Hz DC block after it.
  Q5 The audit as a GATE: tests/p74e-audit.test.js runs a fast version (1 s renders) over every sound tool and fails on: NaN, peak > +0.5 dBFS,
     DC > 0.01, effect intermodulation > −20 dB, instrument energy under 20 Hz > −20 dB — with the BY_DESIGN list. New tools can't regress.
  Q6 Fix the borderline p74b fingerprint test (K3): measure the distances over 20 runs; either the renders are not deterministic (seed them)
     or 6 dB is the line two real sounds sit on (then the sound that is too close is redesigned — never the threshold lowered).
  Q7 The Core zip's "Invalid URL" (K4): the script must not assume a file URL (document.currentScript is null for blob-evaluated code).

## T — the other eleven tools, the Groove way (each: one release, screenshots before merge, his look)
  Every tool: perform: true (Motion + Perform tabs), its window rebuilt in the look kit (a screen, a knob bank with the main knob large, lit
  strips), a FEEL or DEPTH tab on its page for what is deeper, defaults that play exactly as before (old songs unchanged — tested).
  T1  Bassline (bass-gen) — feel: ghost notes, octave jumps, slides (with chance), note length, accent pattern, follow-the-kick strength.
  T2  Chords (chord-gen) — feel: voicing spread, inversions, strum (time between notes), rhythm patterns, humanize, chord-change anticipation.
  T3  Drum Forge — depth: per-layer envelopes (tone, noise, click), pitch-drop curve drawn, a layer's own filter; feel: velocity → tone.
  T4  Bass Forge — depth: the LFO bars per stage as faders with lit meters, the match result as a picture; feel: per-note talk amount.
  T5  FX Box — depth: per pad envelope (length, curve), pitch sweep drawn, stereo throw; square pads (done 3.73b) with a hit meter each.
  T6  Drop Builder — tension / build / pause / drop as a timeline strip you drag; each part's depth on its tab; a "drop size" macro set.
  T7  Sidechain — the drawn duck shape as the screen (exists), plus per-band ducking (low only / full), lookahead, a follow-the-kick meter.
  T8  EQ — dynamic EQ per band (threshold, range), a live spectrum behind the curve, mid/side per band, match-EQ from a clip.
  T9  Breath — the breath pattern drawn, its guide voice and bell as lit strips, a session timeline; Motion on pace.
  T10 Embodiment Lab — the body map as the screen, each feeling's parameters on a Depth tab; a stop state (performance.spec open item).
  T11 Recursive Spectra — the generation tree as the screen with zoom, per-generation level faders, freeze a generation.
  T12 Automation (macro-automation) — lanes as the screen with Bézier handles (as the piano roll's curves), shapes from Motion, record.
  Order: as he listed them minus Groove — T1 Bassline · T2 Chords · T3 Drum Forge · T4 Bass Forge · T5 FX Box · T6 Drop Builder ·
  T7 Sidechain · T8 EQ · T9 Breath · T10 Embodiment · T11 Recursive Spectra · T12 Automation. Each gets a tool-spec addendum when built.

## R — reactive colours, what is left
  R1 A tool with its own mode while the app is Off: its colours move, but the CSS glow (html:not(.snd-off) rules) does not — scope those
     rules to `.wm-win[data-react-own]` too.
  R2 Custom mode on drawn displays: canvases only brighten in Custom (Changing turns them with hue-rotate). A per-tool tint (the canvas reads
     its live colours, as Destroyer's scope does) — tool by tool, with T.
  R3 The Options panel test runs only on the full canvas page (the test page has no ⋯ Options): a test that mounts the panel directly.

## P — packaging
  P1 Release zips for EVERY tool from main with dag.json (desktop/packs.mjs) and attach them to the GitHub release (v0.1.1).
  P2 A standalone option (a tool zip that carries Core inside) — only if he wants it: much larger zips. TO CONFIRM.
  P3 v0.1.0: the GitHub release from the tag is still his one click (this session cannot push tags).

## D — decisions only he makes (left open, nothing built)
  D1 The remaining "Bun Dem" content (the Bun Dem Fire song, Wub Filter "Bun Dem Throat", the dancehall drum kit, the Dub Station preset):
     keep or remove (only the Wobble Bass presets were removed, 3.69).
  D2 3.75–3.86 (the other session's VOICE / AUDIO IO / SUITES / COMPONENTS) and this track: which first. Q1, Q5 and Q7 are small; T is large.

## Acceptance (per item)
  Q: the audit numbers before and after in the release notes; tests added (Q1, Q5, Q6). T: screenshots of the window and every page tab,
  his OK before the next tool; old songs render the same notes. R/P: tests. Every built item: a PROGRESS entry and a spec addendum.
