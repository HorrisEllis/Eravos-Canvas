# eravos.phase74b-map.spec — 3.74b: drum packs that ADD sounds, each completely its own · Synthwave first (mapped BEFORE building · 2026-10-25)

## His words (2026-10-25, verbatim)
  "also each pack for the dumpad needs to be completely different sounds. every pack needs to be additive." · asked whether "additive" meant
  (a) every pack adds new sounds, nothing replaced or repeated, or (b) additive synthesis: "yes like there is supposed to be full range of
  synthwave sounds and tools". Read as (a), with a genre pack carrying the FULL RANGE of that genre's drum sounds. TO CONFIRM where marked.

## What the code shows (measured on main 55275ec)
  K1 13 kit packs, 51 kits, 816 pads — but only 51 distinct sounds (voice:model), and 48 of them sit in 3 or more packs; 11 packs own no sound
     of their own. A pack can only pick from the Drum Machine's fixed models (kick 9, snare 9, hat 5, clap · open hat · 808 · tom · crash ·
     perc 4 each, rim · shaker · cowbell 1) and re-tune them.
  K2 A model is a real synthesis function M[voice][name](dst, t, p, vel) inside pads.engine.js; the UI lists the names the engine reports
     (stateExtra.models). Nothing lets a pack add one.
  K3 Synthwave today: the "80s" pack (2 kits) and Retro Machines (4) — built from the same shared models.

## Decisions (by his axioms; his to overturn)
  D-74b.1 ADDITIVE: tools/music/core/drum-recipes.js (DrumRecipes) — a pack registers named sounds as DATA (layers of tone · noise · FM ·
         metal partials · bursts, with pitch and amp envelopes, a gated tail), tagged with the pack. The Drum Machine plays them through a
         recipe interpreter built from its own oscillators and envelopes, next to its built-in models; nothing is replaced, every old kit
         plays exactly as before.
  D-74b.2 COMPLETELY DIFFERENT is MEASURED, not named: every pad is rendered offline and fingerprinted (pitch, brightness, decay, noise vs
         tone). A pack's sounds must each be far from every other pack's sounds; a test fails on a near-duplicate.
  D-74b.3 SYNTHWAVE FIRST (his example): the full range — Linn and DMX kicks and snares, the gated-reverb snare, Simmons toms (the pitch-
         swept "pew"), 80s claps, Linn hats, tambourine, cowbell, claves, an orchestra hit — in several kits. Then the other 12 packs,
         one at a time.
  D-74b.4 "and tools" (his "full range of synthwave sounds and tools"): inventoried, not built this phase — what exists (Retro Poly, Arp,
         Supersaw, Tape Echo, Phaser, Chorus? …) and the gaps (a gated reverb effect, an ensemble/Juno chorus …) go to a list for him.

## Phases                                                                                                   status
  P74b.1 DrumRecipes registry + the interpreter in the Drum Machine + fingerprinting test kit                 done
        depends_on: []
        files: tools/music/core/drum-recipes.js (new) · tools/music/index.js · tools/music/tools/drums-and-rhythm/pads/pads.engine.js
  P74b.2 SYNTHWAVE pack: its own sounds (≥ 16) and kits (≥ 3), all measured apart from every other pack           done
        depends_on: [P74b.1]
        files: tools/music/data/drum-packs/synthwave.js (new) · tests/p74b-drum-packs.test.js
  P74b.3 the other 12 packs, each its own sounds                                                               open
        depends_on: [P74b.2]
  P74b.4 synthwave tools: inventory + gaps for him                                                              done (list below)

## ADDENDUM 2026-10-25 — P74b.1, P74b.2 and P74b.4 built (3.74b)
- P74b.1: pads.engine.js asks MD(voice, model) = its own MODELS, else DrumRecipes.defaults; recipeVoice(rc, …) plays a recipe from its
  layers (tone · noise · fm · metal · burst · stack, hold = the gated tail). Tune shifts every pitch and filter, Decay stretches every
  envelope against the recipe's own decay, Sweep scales the pitch drops (24 = as written), Body leans tone ↔ noise, Snap scales the clicks.
  Built-in models take the same path as before (a recipe is only used when M has no graph of that name), so old kits are unchanged.
- P74b.2: data/drum-packs/synthwave.js — 22 sounds (kick linn · dmx · simmons; snare gated · linn · simmons · dmx; clap linn · gated;
  rim electro; hat linn; openhat dmx; crash gated; tom simmons · syndrum; perc tambourine · claves · orch-hit · stab; shaker cabasa;
  cowbell dmx; 808 pulse) and 4 kits (Neon Gated · Night Drive Simmons · DMX Outrun · Chrome Ballroom), every pad a Synthwave sound.
- D-74b.2 measured: fingerprint = loudness in 7 windows (0–1.6 s) + 9 octave bands for the attack (43 ms) and the body (to 300 ms), in dB;
  distance = RMS dB difference per feature. The built-in models' own nearest pairs run 3.2 (snare classic ↔ 909) to 17.6 dB. The bar for
  a pack sound is 6 dB from EVERY built-in and every other pack sound, stricter than the built-ins hold among themselves. First render:
  10 of 22 were under it (Linn hat ≈ classic hat 3.4, tambourine ≈ classic open hat 2.9 …); redesigned until all pass. Nearest now:
  6.3 dB (Linn hat ↔ cabasa). tests/p74b-drum-packs.test.js.
- P74b.4, his "and tools" — what synthwave has today, and the gaps (not built; his to order):
    HAVE  Retro Poly (PWM + saw + sub, analog drift, 24 dB filter, BBD chorus I/II, unison, glide, arp) · Supersaw · Arp · Chords ·
          Tape Echo · Mod Delay (chorus / flanger) · Phaser · Dynamics (gate with hold) · the master reverb send · LFO · Automation.
    GAPS  1 a GATED REVERB effect (a room into a gate keyed by the dry hit — today the reverb is a kernel send, so the gate cannot sit
          after it) · 2 an FM keys tool (DX7 electric piano, bells, "Lately bass") · 3 a polysynth BRASS / Jupiter stab preset family ·
          4 a vocoder / talkbox · 5 a standalone ENSEMBLE chorus (the Juno chorus lives only inside Retro Poly).
- P74b.3 (the other 12 packs) stays open: each pack gets the same treatment, one at a time, measured by the same test.

## ADDENDUM 2026-10-26 — renumbered 3.75 → 3.74b
Built under 3.75 while another session mapped a different 3.75 (Voice · Audio in/out · Suites · Genres, specs/eravos.phase75-map.spec,
reserving 3.75–3.86), which reached main first. Two contracts cannot share a number, so this map is 3.74b, and nothing in theirs is
changed. Phase ids P75.x → P74b.x, decisions D-75.x → D-74b.x, test tests/p74b-drum-packs.test.js. Their phase G ("Kits as components")
touches drum kits: the DrumRecipes registry here is the substrate it can stand on.
