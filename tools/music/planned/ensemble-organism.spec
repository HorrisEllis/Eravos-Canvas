# spec_id: eravos.ensemble-organism · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (synthwave_retro) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.ensemble-organism ; label: Ensemble Organism ; domain: music ; family: synthwave_retro
  lineage: 1970s string machines and bucket-brigade chorus/ensemble units, tape doubling
  family_from: late-1970s–80s analog and FM polysynths, film and game scores; revived as synthwave, outrun, darksynth, coldwave, vaporwave
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  ensemble-core · bbd-line · delay-line · lfo · stereo-tools · saturator-tape
adds (behaviour only this tool has):
  - 3-phase ensemble LFO sets
  - voice-count 2–12 with per-line character
  - BBD clock noise and companding as controls
modes: chorus · ensemble · flanger · doubler
engines_0_1_0 (the original list, kept verbatim; each is covered by the components above or by adds):
  modulated-delay-lines · multi-voice-chorus · phase-offset-modulation · stereo-movement · detuning · bbd-modeling
ports: TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)
params: TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Divide-Down Strings — string-machine shimmer from three-phase ensemble
  - Twin-Bucket Width — classic two-mode BBD chorus width
  - Tape Choir — tape-doubled lines with wow for a slurred choir
  - Shimmer Strings — fast ensemble shimmer over a bright high shelf
  - Warped Cassette — chorus that wanders off pitch like a stretched tape
  - Glass Ensemble — many clean lines, crystalline and wide
  - Wide Analog — subtle stereo motion for basses and keys
  - Dream Machine — slow deep ensemble for ambient chords
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

# ---- ADDENDUM 2026-11-13 — the depth audit (ports, params, signal_dag, decisions, open gaps); everything above kept verbatim
# His words (2026-11-13): "the next set of high leverage tools" (13:53:40Z) · "Push. The. Next tool." — Ensemble Organism is the next one
# on docs/eco-graph.md that stands on built parts only (6 of 6). Its UI is shown to him first (tools/music/planned/ensemble-organism.ui.md).
not_mod_delay: Mod Delay is one modulated line (chorus / flanger). Ensemble Organism is MANY lines (2–12) through a bucket-brigade chip,
  moving in phase sets — the string machine, the Juno, the Dimension, the tape choir. Different role; the novelty gate checks it.
signal_dag (in → out, each a component; nothing re-implemented):
  in → saturator-tape (Drive: the tape / preamp in front; mix 0 = bypassed)
     → bbd-line (the chip: Chip stages, Age → hiss + bleed, compander) — the character every line shares, as on the hardware
     → ensemble-core A (lines 1…⌈n/2⌉) ∥ ensemble-core B (the rest; its LFOs offset by Set offset) — 2–12 lines, max 8 a core
     → delay-line (Doubler: one copy bent like tape, its wow from its own mod; in Flanger its feedback is the flange)
     → stereo-tools (Width, Bass mono below Hz) → out
  lfo (Rate · Shape · Sync) drives both cores' sweep and is the tool's Motion output (wire the ensemble's motion into anything)
modes (data, not code — each sets the structure; every number stays his):
  Chorus   2 lines, inverted (the Juno way), shimmer 0, doubler off, feedback 0
  Ensemble 3 lines a set, 120° apart (the string machine way), shimmer on (LFO 2 fast and shallow)
  Flanger  1 line a set, short (0.5–5 ms), delay-line feedback on — the jet
  Doubler  delay-line on (12–40 ms, wow), the cores shallow — one more player
  Machine (a starting point inside a mode, data from ensemble-core ENSEMBLE_MODES): juno I · juno II · juno I+II · string machine · dimension
ports:
  in   audio_in (stereo; the chip sums to the lines' input as the hardware does)
  out  audio_out (stereo)
  in   transport_in (Sync: the sweep on the beat)
  in   mod: every knob (the SDK's knob.<key>) — Depth, Rate, Lines, Width, Mix, Drive, Age … ; Bloom (gate: held = blooming)
  out  mod: Motion (the sweep, −1…1) · Bloom (0…1, the swell as it moves)
params (face ★; the rest under More depth ▸; ranges are the components' full ranges):
  MODE      mode ★ chorus|ensemble|flanger|doubler · machine juno I|juno II|juno I+II|string machine|dimension          — ensemble-core
  LINES     lines ★ 2–12 · spread ★ 0–1 (L/R) · sets even|3-phase|pairs (how the lines' LFOs are grouped) · setOffset 0–1 cycle    — ensemble-core
  MOTION    rate ★ 0.02–12 Hz · depth ★ 0–6 ms · shimmer ★ 0–1 ms (LFO 2) · shimmerRate 2–12 Hz · shape sine|triangle|smooth random
            · sync free|1/4|1/2|1 bar|2 bars · base 0.5–30 ms                                                                       — lfo, ensemble-core
  BUCKET    chip ★ 512|1024|2048|4096 stages · age ★ 0–1 (hiss −110…−60 dB + bleed −120…−70 dB together) · compand on|off       — bbd-line
  DOUBLER   dblTime 8–60 ms · dblWow 0–1 · feedback −0.95…0.95 (Flanger only)                                                        — delay-line
  TAPE      drive ★ 0–1 · bias 0–1 · bump 0–6 dB                                                                                      — saturator-tape
  OUT       width ★ 0–2 · bassMono 20–400 Hz · mix ★ 0–1 · level 0–1                                                                  — stereo-tools
  BLOOM     (the primary) held: depth × (1 + Bloom amount), all 12 lines, width 2, over Bloom time; let go: back · bloomAmt 0–2 · bloomTime 0.05–4 s
decisions (2026-11-13, mine, shown with the preview; his yes or no decides):
  D1 2–12 lines as two ensemble-cores (8 max each) — no new component; the second core's sweep offset by Set offset
  D2 one bbd-line in front of the cores, shared (the hardware's one chip per channel), not one per line — 12 chips would be 12× the cost for a
     difference only measurable as hiss; per-line character comes from each line's phase and depth (the spec's "per-line character")
  D3 the primary action is BLOOM (hold to swell, as a player would push an ensemble), not a bypass
  D4 Flanger is kept beside Mod Delay's: here it runs through the chip (dark, hissing, compand) — a different sound, measured by the gate
open_gaps: per-line BBD (D2) · MIDI-learn of Bloom is the usual Bind, nothing new · the cost per line is measured at build (build/perf.mjs)

# ---- dag (generated by build/spec-dag.mjs — the map; re-run after changing assembles or a component spec; nothing above is touched)
dag:
  components: 6 it stands on · 6 of 6 built (✓)
  layer 0: bbd-line ✓ · delay-line ✓ · ensemble-core ✓ · lfo ✓ · saturator-tape ✓ · stereo-tools ✓
  tool: eravos.ensemble-organism ← ensemble-core + bbd-line + delay-line + lfo + stereo-tools + saturator-tape
  build order: bbd-line ✓ → delay-line ✓ → ensemble-core ✓ → lfo ✓ → saturator-tape ✓ → stereo-tools ✓ → ensemble-organism
  shared with: bbd-line 2 · delay-line 15 · ensemble-core 5 · lfo 28 · saturator-tape 4 · stereo-tools 17  (other tools on each)
  signal_dag check: every node is one of its components ✓
