# spec_id: eravos.contrast-engine · version 0.1.0 · status planned:contrast-engine.spec (v2: moves, rivalry, Tap-Map) · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (rhythm_and_contrast) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.contrast-engine ; label: Contrast Engine ; domain: music ; family: rhythm_and_contrast
  lineage: rhythm that fights the grid and snaps back: complextro chops, half-time switches, dembow, footwork
  family_from: drum machines (1980s on), breakbeat culture, UK garage, jungle, footwork, dembow, techno, polyrhythm traditions worldwide
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  pattern-store · polymeter-cycle · probability-gate · spectral-features · onset-detector · energy-curve · seed-registry
adds (behaviour only this tool has):
  - the contrast-engine.spec grammar: DISPLACE · CROSS · SYNCOPATE · HEMIOLA · METRIC MOD · SWITCH · GAP · FLIP · STUTTER · REGISTER · CALL/ANSWER · SNAP-BACK
  - contrast score per bar vs target curve
  - silence as an instrument
modes: director · rivalry · tap-map
engines_0_1_0 (the original list, kept verbatim; each is covered by the components above or by adds):
  density-analysis · spectral-contrast · dynamic-contrast · rhythmic-contrast · harmonic-contrast · silence-and-interruption
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Drop Contrast — everything-at-once drop after a starved build
  - Minimal Tension — two elements, maximum push-pull
  - Maximum Density — switch every 16th between sources
  - Sparse Impact — single hits after long gaps
  - Dynamic Collapse — full mix collapsing to one sound
  - Rhythmic Interruption — gaps that cut riffs mid-phrase
  - Silence as Instrument — silences placed like notes
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

# ============================================================
# ORIGINAL SPEC (kept verbatim — the detail; the generated entry above widens it, per the index: "planned:<spec> … that spec stays the detail")
# ============================================================
# spec_id: eravos.organism.contrast-engine · version 2.0.0 · phase P39 (was P38 v1) · status planned · category arrange
# R7 "tranki by skrillex, look into how it was made, the way it fights the rhythm, i want tools for that."
# v2 supersedes v1 (same intent, kept: SWITCH · GAP · FLIP · STUTTER · score · GENERATE) and adds the rhythm-fighting
# grammar, the snap-back, rivalry, and Tap-Map.
#
# SOURCES & HONESTY: "Tranki" (Skrillex with Tracey, TAICHU, ANITA B QUEEN; album SOMA, track 9) has no published
# production breakdown, and ERAVOS (Claude) cannot listen to audio. Nothing here claims to describe that record. What
# is specced is the documented TECHNIQUE vocabulary of rhythm that fights the grid in bass music, house, dancehall,
# reggaeton/dembow, UKG and footwork — plus TAP-MAP (invention I4), which lets the user show ERAVOS the exact moments he
# means by tapping along, without any audio being captured. A3: no melody, lyric, sample or rhythm transcription of a
# record is shipped; Tap-Map data stays the user's own performance.

identity:
  id: eravos.contrast-engine ; label: Contrast ; icon: ⚡ ; accent: "#ff1744"
  comp_intent: Make rhythm that fights the beat on purpose — and then lands back on it — across ANY tools on the canvas,
    with a score that says how hard it is fighting and a curve that says when.
  novelty: a step DIRECTOR over other tools (it plays no sound itself) + a rhythm-fighting grammar + measured contrast +
    the snap-back as a first-class object.

## The grammar — MOVES (each a lane; every move targets one or more tools/parts on the canvas)
  rhythm that fights:
    DISPLACE    shift a part's pattern by n 16ths against the grid (the riff starts "late" — accents fall off the beat)
    CROSS       play a part in 3 against 4 (or 3:2, 5:4, 7:8): dotted-8th / dotted-quarter cycles over a straight kick —
                the classic "3-3-2" (tresillo) and "3-3-3-3-4" (16-step cross) grids, user-editable
    SYNCOPATE   move chosen hits to the 16th before the beat (anticipation) or after (lay-back), per lane, by amount
    HEMIOLA     regroup bar accents (6/8 feel inside 4/4) for N bars
    METRIC MOD  the hats/percussion switch to triplets (or quintuplets) while the kick stays straight — the bar "slips"
    DEMBOW/RIDDIM SKELETONS  editable skeleton grids (one-drop, steppers, dembow 3+3+2, dancehall, UKG skip, footwork 160
                triplet kick) as the "grid it fights" or the "rebel" — skeletons are generic genre grids, not songs
  contrast that hits:
    SWITCH      which source plays this step from a list (the complextro chop) · GAP (hard silence, tails killed, 1/32–1 bar)
    FLIP        half-time ↔ double-time for N steps (drum map re-mapped) · STUTTER (retrigger 1/8→1/64, accelerating)
    REGISTER    jump a part ±1–2 octaves for a step/phrase (density + register contrast at once — the drop switch)
    CALL/ANSWER two parts alternate phrases; the answer is generated from the call's rhythm (inverted/displaced)
  return:
    SNAP-BACK   the defining move: after F bars of fighting, everything re-aligns on a chosen downbeat (usually bar 4/8's
                "1") with a hit (all parts + crash + sub) — the release that makes the fight feel intentional. Every
                fight has a snap-back unless the user removes it on purpose (then the score shows "unresolved").
## RIVALRY mode (invention I7)
  two roles: the GRID (straight, the body: kick/sub) and the REBEL (bass, vocal chops, perc, stabs). GENERATE writes the
  rebel to maximise syncopation against the grid while keeping a dance constraint: the downbeat of every N bars is shared
  (snap-back), and onset density stays inside a band. Knobs: fight (0–1) · snap every (1/2/4/8 bars) · density band ·
  seed. Same seed → same rebel. Every generated move is an ordinary editable step.
## TAP-MAP (invention I4) — "show me the moment you mean"
  play any song you love in your own player; press TAP-MAP, set the BPM (TAP or type), tap the rhythm you feel on pads /
  keys / Space for a few bars. ERAVOS records ONLY your taps (time, velocity), quantises them against the grid and shows:
  where you pushed against the beat, where you left gaps, where you snapped back. One click turns that into a Contrast
  target curve + rebel skeleton you then make your own. Nothing of the record is captured — it is your performance.
## Measurement (A4) — the contrast score per bar (0–100), shown as a curve over the song
  components: syncopation index (weighted off-beat onsets, Longuet-Higgins & Lee style metric weights) · cross-rhythm
  ratio present · grid displacement · Δ onset density · Δ register · Δ spectral centroid · Δ loudness · silence ratio ·
  source-switch rate. TARGET curve drawn by the user; GENERATE fills moves to hit it (seeded, editable).
config: sources[] ; lanes[] {move, targets, steps, params} ; target curve ; rivalry {fight, snapEvery, band, seed} ;
  tapmaps[] ; quantize ; intensity
hooks: STD.transport_in ; control_out (to tools: mute, retrigger, pitch, rate, preset, param) ; note_out ; data_out score ;
  STD.note_in (Tap-Map from pads/MIDI)
ui: score curve over bars (target vs actual) · move lanes like the Sequencer (shared readable grid, sequencer.spec §V) ·
  a "fight ↔ snap" ribbon above them · source palette (drag tools in) · TAP-MAP button
packs: factory ≥ 30 — Complextro Chop · Half-Time Slam · Grid Fight 3:4 · Tresillo Rebel · Dembow Pressure · One-Drop
  Displace · UKG Skip Fight · Footwork Triplet Storm · Stop-Start · Dancehall Drop Switch · Call & Response · Machine-Gun
  Stutter Fill · Metric Slip · Hemiola Lift · Snap-Back Every 8 …
tests:
  - GAP 1/8 → output < −80 dB for exactly the gap ± 1 ms, no click > −50 dB at the edges
  - CROSS 3:4 places hits every 3 16ths for the stated span; SNAP-BACK aligns all targets on the chosen downbeat ± 1 sample
  - FLIP half-time maps the snare from beats 2/4 to beat 3 and back after N steps
  - RIVALRY: same seed → identical rebel; fight 0 → rebel = grid; fight 1 → syncopation index ≥ threshold and every Nth
    downbeat still shared
  - TAP-MAP stores taps only (no audio buffer is ever created) ; generated target error |actual − target| ≤ 15 per bar

# ---- dependencies (generated by build/planned-deps.mjs from the hooks line above — do not edit by hand)
dependencies:   # planned: what this tool will need once built
  mode: music   # Music Production
  toolbar_units: [music.engine, music.transport, music.tempo]   # ui expansion when added: Audio engine · Transport · Tempo
  services:
    - audio: Audio engine — shares the audio clock
    - clock: Master clock & tempo — locks to the beat
  inputs:
    - coneng.hook.transport_in (transport:tick|transport:play|transport:stop) — ambient broadcast
  outputs:
    - coneng.hook.control_out (modulation · port out)
    - coneng.hook.note_out (note:trigger)
    - coneng.hook.score_out (dataflow · port score)
  works_with: [eravos.pads, eravos.embodiment-lab, eravos.coven, eravos.organ, eravos.retro-poly, eravos.bass-forge, eravos.drum-forge, eravos.fx-box]

# ---- dag (generated by build/spec-dag.mjs — the map; re-run after changing assembles or a component spec; nothing above is touched)
dag:
  components: 7 it stands on · 0 of 7 built (✓)
  layer 0: energy-curve · onset-detector · pattern-store · polymeter-cycle · probability-gate · seed-registry · spectral-features
  tool: eravos.contrast-engine ← pattern-store + polymeter-cycle + probability-gate + spectral-features + onset-detector + energy-curve + seed-registry
  build order: energy-curve → onset-detector → pattern-store → polymeter-cycle → probability-gate → seed-registry → spectral-features → contrast-engine
  shared with: energy-curve 8 · onset-detector 12 · pattern-store 23 · polymeter-cycle 2 · probability-gate 9 · seed-registry 12 · spectral-features 14  (other tools on each)
