# spec_id: eravos.p42.tool-audio · version 1.0.0 · phase P42 · status BUILT (timing + voice priority) · MAPPED (levels, packs, songs)
# "test each output. make sure its as precise as you can, considering you have no ears" · "the bass drop tool must make her
#  voice or clip a priority when it comes to the other sounds" · "each tool has to add packs, and new songs" (desktop exe)

## The instrument (what a test can know without ears)
tests/audio-measure.js → window.AudioMeasure: scan (NaN/Inf, samples at full scale, peak, RMS, DC) · pitch (YIN + parabolic) ·
  onsets (2 ms energy flux, refined to the first sample over 10 % of the local peak) · gridError · modRate (envelope DFT) ·
  correlation. The instrument is tested FIRST (tests/audio-measure.test.mjs, plain node, 33 checks): pitch within 1 cent on
  sine/saw/square A0…A5 and a ±12-cent unison; a deliberate +30-cent tone reads +30; clicks on a 16th grid found within
  0.05 ms and a 3-ms-late hit reads 3 ms late; wobble rate within 1 % at 1/4 … 1/16 and triplets; NaN/clip/DC/correlation.

## The survey (tests/tool-audio.mjs — every music tool × every preset, offline, the tool's raw output port)
drivers: instruments (one held note, transport running) · drums (8 hits at exact times, each measured against its request) ·
  effects (110 Hz saw burst in) · sampler / clip (an A3 saw loaded) · Drop Builder (fired at bar 1: impact vs DROP beat 1) ·
  beat tools (2 bars at 128) · containers (Timeline, Song Recorder) are measured through the 189 song renders.
Stop all is pressed when the render clock reaches 2.0 s (OfflineAudioContext.suspend) with the note still held.
verdicts: FAIL = NaN · silent · over full scale · still sounding 0.45 s after Stop · > 1 ms off time · late first sample
  (> 16 samples) · missing hits ; WARN = DC > 1 % · peak > −0.3 dBFS · > 10 cents off (clarity ≥ 0.8; xenharmonic tools exempt)
  · L/R correlation < −0.3.
first full run (before 3.39): 54 tools · 410 presets · 249 OK · 34 WARN · 127 FAIL. Triage: most FAILs were the survey
  driving the tool wrong (drums need notes 36–51, worklet tools need ctx.ready, samplers need a sample, arps need the
  transport) — fixed in the survey, not the tools. What remained is below.

## Found and fixed (3.39) — the engine delays audio and nothing accounted for it
measured in Chromium (= the exe's Electron 44): WaveShaper oversample 2x = 128 samples, 4x = 192 (at 44.1 and 48 kHz);
  DynamicsCompressor = 6.000 ms look-ahead. dsp.OS_SAMPLES / dsp.osLatency(ac, mode); tests/p42-timing.test.js re-measures
  the table on every run, so an engine change shows up as a failing test, not as drift.
  · Sub Engine: note 128 samples late; its pure band (2x) and phantom harmonics (4x) 64 samples apart; click 192 ahead of
    the body → all three aligned at 192, notes start 192 early (ctx.latency).
  · Gothic Organ with Amp drive: 128 late → ctx.latency follows the drive (no shaper when drive is 0).
  · Embodiment Lab: 419 samples late (2x ceiling + compressor look-ahead) → ctx.latency.
  · Reese: the shaped stack reached the gate 192 samples after it opened (the old note for the first 4 ms) and sat 192
    behind the clean sub → pre-shaper events scheduled 192 early, the sub delayed 192, the gate on time.
  · Reese (older than 3.39): each stacked voice got its "start phase" by DELAYING its start by that fraction of a period —
    up to 18 ms at A1: right voices always 10.6 ms late, the left one up to 17.6 ms when the ±3 % jitter wrapped below 0.
    In 8 renders of one note the old engine was silent past 10 ms in 6. Voices now start EARLY by the rest of the period
    (behind the closed gate): exact phase at t, sound from the first millisecond, 8 of 8 (p42-timing).
  · Wobble Bass 3.2: mid-layer pitch 384 samples late at the gate, filter wobble 192 behind the grid → pitch scheduled 384
    early, LFO restarted 192 early (volume-wub path delayed 192), gate on time; the LFO log keeps the HEARD time. The clean
    sub is untouched: low end within ±1.3 dB of 3.1 at 53 of 54 preset×note points (one 3.7 dB, Screech at A2+2).
  · Pads: driven 3.0 voices 2.7 ms late (flams against clean voices) → start 128 early; the classic kick's body went
    through a 2x shaper AFTER its punch envelope opened (the body arrived 2.7 ms into the decay) → body starts 128 early.
  · Drum Forge: driven slots 128 late → start early.
  · FX Echo: the shaper sits in the feedback loop: every pass 128 samples longer than the set time — repeat 8 was 18.75 ms
    late at 1/8, 120 BPM → input pre-delayed by the loop latency, the line shortened by it: no drift (< 0.2 ms over 8).
  · FX Destroyer / FX Filter / Wub Filter (STD.fx): a blended dry (0 < mix) arrived 2.7–4 ms before the wet → comb filter
    (notches at 375 Hz, 1.1 kHz …). fxShell now routes the dry through a delay equal to fx.setLatency(…) whenever the wet is
    audible; at mix 0 / bypass the direct dry is used, so the mix-0 null test stays exact. FX Pitch already reported its
    window latency; it is now aligned too.
  · the music SDK: ctx.latency (seconds) — notes to a tool start that much early (clamped to now for live input).

## Her voice on top (Drop Builder 3.1) — see tools/music/tools/arrange/bass-drop-builder/bass-drop-builder.spec § 3.1
master chain: … duck → vduck → comp ; priority → comp. K.audio.duckUnder(buffer, segments, {depthDb}) / duckUnderReset.
tests/p42-voice-priority.test.js: 9 ± 0.6 dB under each word, back between words and after, never ducks her.

## Gain staging (3.41) — build/gain-stage.mjs
the survey measures each preset's OWN output (one note; a triad for chord tools — Pad Forge, Supersaw, Retro Poly, Organ,
  Coven, Xen Synth — the way songs play them). 93 presets peaked over 0 dBFS (worst: Wub Filter Screech Reso +10.4, Inverted
  Mouth +7.1, Classic LP Wub +5.5 — resonance gain on a −6 dBFS saw; Supersaw Chord Stab +5.3, Wide Pad +4.9; Pad Forge
  Celestial Glass +4.2; Pads Riddim Steel +4.3; Drop Builder impact +1.6). Each was turned DOWN on its own output knob
  (level / volume / outGain / trim; EDM Lab: its three levels; Drop Builder: impact + crash) to peak at −1.5 dBFS — never up,
  only presets measured over full scale; −1.5 leaves 0.5 dB for velocity 1.0 over the measured 0.9. The full list with old →
  new values is the script's output (run it with --dry). Effect on mixes: chords and drum kits come down 1.5–7 dB, basses
  mostly unchanged — older songs lean more on the bass. One commit: revert it to get the old levels back.
order: build/odd-couples.mjs rewrites the Odd Couples packs — run gain-stage.mjs after it.

## Knobs and the wheel (3.41, canvas/runtime/ui-kit.js)
found by tests/p39-settings-wheel.mjs after the new packs moved the layout: while scrolling a ⚙ Settings panel, a knob that
  slid under the cursor took the wheel — scrolling stopped and the knob turned (FX Dynamics gate release, FX EQ low shelf,
  Retro Poly decay, Supersaw sustain changed on their own). A wheel gesture (events < 300 ms apart) now belongs to where it
  STARTED: scrolling keeps scrolling; a gesture that starts on a knob still turns it. The test now also fails if scrolling
  changes any setting, and checks that a knob still turns.

## The catalog and the build scripts (3.41)
since the catalog merge a fresh profile installs no tools; 11 build/test scripts opened the canvas as a fresh profile and got
  none (tool-kit wrote 0 pack schemas; p39-no-prompt crashed). They set ERAVOS_CATALOG_ALL like tests/run.html.
tests/p16-ui.mjs had failed since 3.34 (it looked for Song Engine cards on the start screen): it now checks every genre is in
  📖 Songs, writes the song through the Songs page, and that every control in a tool window is reachable with the wheel.

## Open (measured, not yet changed) — the user decides
  · Wobble sub alignment → Wobble Bass 3.3 "Sub in phase" (TONE, OFF by default): the user A/Bs it. Measured: aligning the clean sub to the mid layer evens the low end across notes (Classic Wub spread
    5.7 → 2.4 dB, Half-time 5.6 → 1.9) but moves average low end per preset (Classic/Half-time/Monstercat −3…−4 dB,
    Screech/Fold +4 dB). The mid layer is high-passed 85 Hz (2nd order) against a 140 Hz low-passed sub: an overlapping
    2nd-order pair is ~180° apart in the overlap. A Linkwitz–Riley 4 crossover was tried at 90 / 110 Hz: no clear win
    (Fold Growl spread 9.3 / 5.4 dB). Not changed.
  · vibrato on Wobble lands 192 samples behind its filter wobble (oscillator detune passes both shapers).
  · effect latency on a track (2.7–4 ms) is not compensated across the mixer (no plugin delay compensation between tracks).


# ADDENDUM 3.76–3.77 (2026-10-30) — the sound audit (his: "can you run tests like that on all of them")
#   build/sound-audit.mjs, every sound tool at default settings. EFFECTS: a loud 50 Hz + a quiet 1 kHz → intermodulation (sidebands
#   ±50/100 Hz under the 1 kHz; ≤ −20 dB clean — the blown-speaker test), level change (−18 dBFS 220 Hz in vs out), DC, peak, NaN.
#   INSTRUMENTS: A1, A3, A5 and a C chord → peak, DC, energy under 20 Hz (0.7 Hz bins), tail 2 s after release, NaN. BY_DESIGN notes: Clip
#   Maker, Breath, Embodiment Lab, Recursive Spectra, Squash.
#   Found and fixed: Destroyer (the sub went through the shaper: −1.6 → −49 dB) · Deep Sub (fundamental 8–25 Hz under its own 24 Hz floor) ·
#   Supersaw / Morph Osc (+2.5 / +3 dBFS on a chord → dsp.headroom: unity under −3 dBFS) · Xen Synth (−0.2 dB of its energy under 20 Hz) and
#   Reese (−11 dB) → keepRange (dsp.keepRange: lifted by octaves; subs ≥ 30 Hz, notes ≥ 25 Hz), also on Wobble Bass, Bass Forge, Wub Sub,
#   Wub Osc (borderline). Still flagged → eravos.quality-and-tools-map.spec: Wub Filter intermodulation −4.2 dB · Channel DC −0.015 · long tails
#   (Pad Forge, Gothic Organ, Xen Synth) · CPU.
