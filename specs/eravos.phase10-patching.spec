# ============================================================
# ERAVOS PHASE 10 — PATCHING (make wiring the tools together work)
# spec_id:      eravos.phase10-patching
# version:      1.0.0
# author:       James Brooks
# status:       canonical
# conforms_to:  ERAVOS.kernel.spec + amendments 3.1, 3.2 ; follows eravos.phase9-tracks
# created_at:   2026-09-27
# pack:         3.20.0-alpha.1 (P9 + P10 ship together)
# ============================================================
#
# Intent (James, 2026-09-27, screenshot of 3.19-alpha-2 "Make a song for her"):
#   "i also cant wire the tools together. i liked the bass drop builder. continue"
#
# Evidence (Chromium, real pointer drags on every out-dot of that canvas):
#   drag mechanics work — 13 of 16 out-dots light compatible inputs; a release on a lit dot registers a kernel wire.
#   The failure is what there is to connect to, and how hard the dots are to hit:

gaps:
  W-01: every audio out-dot (drums, wobble, sample, drop FX, drop vocal) lights exactly ONE input: Clip Maker.
        The only audio inputs in the whole pack are channel, sidechain, clip-maker, contrast-analyser.
        Ten FX organisms are specced (eravos.organism.fx-*) and none were built → nothing to patch a sound into.
  W-02: Master FX has no input dot — the destination every sound actually reaches is invisible on the canvas.
  W-03: dots are 13 px in world space; at the zoom a full canvas needs (≈0.45) they are ≈6 px on screen and the
        release must land exactly on one → "can't wire". Inputs cannot start a drag.
  W-04: no confirmation when a wire is made (a correct wire and a missed drop look the same).

resolution:
  W-01 → build five FX to their canonical specs (P8.1 STD.fx shell, already in sdk-music):
         eravos.fx-echo (Tape Echo) · eravos.fx-filter (Filter) · eravos.fx-moddelay (Mod Delay) ·
         eravos.fx-destroyer (Destroyer) · eravos.fx-phaser (Phaser)
         declared deviations (not stubs — features left out and stated in the organism's blurb/spec header):
           filter: LFO shapes sine/tri/saw/square (S&H deferred) ; destroyer: crusher via AudioWorklet with
           WaveShaper-quantize fallback (downsample needs the worklet; fallback raises a notice)
         still unbuilt (next phase): fx-eq, fx-dynamics, fx-glitch, fx-pitch, fx-box
  W-02 → master-fx 2.x gains mfx.hook.audio_in (port 'in' = master bus input). Wiring into it is explicit
         master routing; unwired outs still default to master (unchanged).
  W-03 → wire-system (skeleton, domain-free):
         rails scale with 1/zoom (clamped 1..2.6) so dots stay ≥ 13 px on screen ; 26 px hit halo ;
         release anywhere over a window body = first compatible input on that window ;
         drag may start from an INPUT dot (reverse: lights compatible outputs) ;
         dot positions measured from the rendered rect (correct under rail scaling)
  W-04 → toast "A → B connected" on success; fault toast unchanged on refusal.

exit_criteria:
  - each FX: STD.fx null test (mix 0 → output == input), non-silent wet, spec numeric test where cheap
    (echo 1/8 @120 → repeat at 0.25 s ± 1 sample ; filter LP 1 kHz 24 dB ≈ −24 dB @ 2 kHz ;
     destroyer bits 1 → two-level output ; phaser feedback 0.9 bounded ; moddelay chorus L≠R)
  - wiring an instrument into an FX reroutes it off master; unwiring restores master
  - master-fx exposes an audio input; wire synth → master is accepted
  - UI (Chromium): at zoom 0.45 a drag from Wobble Bass out released over the Tape Echo window body wires it
  - recipe Future Bass: pluck → Tape Echo wired by the recipe

# ------------------------------------------------------------
# audit fixes (3.20.0-alpha.2) — two "flaky tests" were real bugs
# ------------------------------------------------------------
audit:
  A-01 reese-bass width: start phases were fully random → at width 1 stereo correlation swung −0.71…+0.66 note to note
       (worst notes nearly phase-inverted: they lose level summed to mono, e.g. club systems).
       fix: golden-ratio phase spread, right side offset 0.2 period, ±3 % jitter → measured −0.21…+0.28 (40 notes).
       test: 20 notes all within (−0.35, 0.5).
  A-02 midi-mapper recall race: the remembered controller was recalled from IndexedDB asynchronously on mount and
       replaced any mappings made (or restored from a workspace) before it resolved — guard was only "no pads learned".
       fix: recall only onto a blank mapper (no pads, no mappings, not mid-learn).
       test: forces the race; fails against the old guard (mutation-checked), passes with the fix. Reproduced 2/40 before, 0/40 after.
