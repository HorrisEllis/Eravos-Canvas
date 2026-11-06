# spec_id: eravos.tape-memory · version 0.1.0 · status new · template eravos.tool/1
# generated from eravos.music-ecosystem.spec v0.2.0 §4 (synthwave_retro) — that file stays the index; this file is the tool's own spec
identity:
  id: eravos.tape-memory ; label: Tape Memory ; domain: music ; family: synthwave_retro
  lineage: cassette and VHS degradation, the vaporwave and lo-fi signature
  family_from: late-1970s–80s analog and FM polysynths, film and game scores; revived as synthwave, outrun, darksynth, coldwave, vaporwave
assembles (components, tools/music/components/<id>/ — never re-implemented here):
  saturator-tape · delay-line · filter-svf · osc-noise · bitcrusher · random-source · tape-transport
adds (behaviour only this tool has):
  - wear amount driving wow, flutter, dropouts, head misalignment and hiss together
  - dropout events as triggers
  - generation count (copy-of-a-copy)
modes: cassette · vhs · reel · dictaphone
ports (written 2026-11-06; 0.1.0 said, verbatim: "TO WRITE in the depth audit — typed in/out per §5 tool_contract; every assembled component reachable by wiring (Open as components)"):
  in:  audio_in (stereo — anything wired in) · transport_in (Wow on the beat, Tape stop timed to the bar) ·
       mod_in wear (±1 added to Wear) · mod_in speed (±0.5 added to Speed) · every other control: knob.<key> (automatic)
  out: audio_out (stereo) · mod_out dropout (0…1 while a dropout is happening — duck or gate something on it) · curve.out (automatic)
params (written 2026-11-06; 0.1.0 said, verbatim: "TO WRITE in the depth audit — every component control exposed, full range (eravos.tool-depth.spec), each a modulation destination"):
  WEAR    mode [cassette, vhs, reel, dictaphone] def cassette · wear 0..1 def 0.35 (moves wow, flutter, dust, the top end together) ·
          generation 1..8 def 2 (copies of copies: each softer, duller, noisier)
  MOTION  wow 0..1 def 0.3 · flutter 0..1 def 0.2 · speed 0.5..1.5 × def 1 (pitch and time together)
  MOTION+ wowRate 0.05..4 Hz def 0.6 · flutterRate 3..25 Hz def 9 · stereoWow 0..1 def 0.2 (L/R drift) · wowSync [free, 1 bar, 2 bars, 1/2]
  DUST    hiss 0..1 def 0.25 · crackle 0..1 def 0.2 · dropouts 0..1 def 0.1
  DUST+   crackleSize 0..1 def 0.4 · dropLen 0.01..0.5 s def 0.08 · hissTone 0..1 def 0.5
  TONE    lowCut 20..400 Hz def 60 · highCut 1500..18000 Hz def 7000 · drive 0..1 def 0.35 (tape saturation)
  TAPE+   head 0..1 def 0 (VHS tracking: the top drops out in waves)
  DIGITAL bits 4..16 def 16 · rate 4000..48000 Hz def 48000
  STOP    stopTime 0.1..4 s def 0.8 · Tape stop (a press: slows to a stop; again: spins up)
  OUT     mix 0..1 def 1 · level 0..1 def 0.8
  face (13): mode · wear generation · wow flutter speed · hiss crackle dropouts · lowCut highCut drive · mix level — the rest behind More
  depth ▸ (UI: tape-memory.ui.md, preview docs/previews/tape-memory.preview.js)
signal_dag (stereo, one chain):
  in → saturator-tape (drive, its head bump and soft top) → bitcrusher (bits, rate; transparent at 16 / 48 k)
  random-source (smoothed: wow at wowRate, flutter at flutterRate, L/R offset by stereoWow) + speed + tape stop ramp → tape-transport
  tape-transport (the read head's position: speed × (1 + wow + flutter), the stop ramp) → delay-line (modulated read, ≥ 4 ms base — the pitch moves)
  delay-line → filter-svf (highpass lowCut) → filter-svf (lowpass highCut, lowered per copy and by Wear; VHS: head tilt sweeps it)
  osc-noise (hiss: coloured by hissTone, louder per copy) → sum
  random-source (crackle: sparse impulses, size = crackleSize) → filter-svf (bandpass, the click's body) → sum
  random-source (dropouts: events, length dropLen) → gain dip on the tape path → dropout out
  sum → mix with the dry in → level → out
  wear → each of wow, flutter, hiss, crackle, dropouts, highCut (scaled together, before their own knobs)
  generation → repeated wear on the copy: highCut lower, hiss higher, wow summed with a new random phase per copy
decisions (2026-11-06):
  - a tool made of its components wired (Axiom 3): open as components gives the same chain, each part its own window
  - the dust is made live (osc-noise, random-source) — never a recording (No toys)
  - not Tape Echo: Tape Echo has wow, flutter and saturation on its echoes; Tape Memory is the tape itself on the whole sound, with no echo
  - Copies is a number, not a convolution: each copy re-applies the chain's wear with its own random phase (cheap, every copy different)
  - one primary: Tape stop (DESIGN-GUIDE K3)
open gaps (none hidden):
  - four components to build first, each proving its own numbers: saturator-tape · bitcrusher · random-source · tape-transport
  - packs: the six planned pack names, ≥ 6 presets each, not written yet
  - his yes on the UI preview (tape-memory.ui.md)
packs (names unique across the ecosystem; ≥ 6 presets each; novelty test §6):
  - Third Generation Dub — a copy of a copy: soft, dull, wobbly
  - Mall Ghost — slowed, warbled, glossy-dead mall music tone
  - Tracking Error — VHS head misalignment dropping the top out in waves
  - Pocket Recorder — narrow band, hiss, motor whine
  - Sunbleached Reel — warm gentle wow, rounded transients
  - Chewed Tape — severe dropouts and pitch crumples on cue
acceptance:
  - the tool contract (TH.toolContract): spawns clean · every shipped preset loads in range · save → load is exact · closing leaves no subscribers, ports or wires · Stop all is obeyed
  - open-as-components: the wired components render the same as the tool (≤ −60 dB difference)
  - novelty: every preset's nearest neighbour in this tool ≥ 0.15, pack centroids ≥ 0.25 apart (§6)
  - p42 audio survey: timing to the sample, pitch to the cent, never over full scale
  - cpu per instance and per voice measured (build/perf.mjs) and inside §8 budgets
  - depth audit written above; open gaps listed, none hidden

# dependencies: run node build/planned-deps.mjs once the hooks line is written (generated block, not by hand)

# ---- dag (generated by build/spec-dag.mjs — the map; re-run after changing assembles or a component spec; nothing above is touched)
dag:
  components: 7 it stands on · 7 of 7 built (✓)
  layer 0: bitcrusher ✓ · delay-line ✓ · filter-svf ✓ · osc-noise ✓ · random-source ✓ · saturator-tape ✓ · tape-transport ✓
  tool: eravos.tape-memory ← saturator-tape + delay-line + filter-svf + osc-noise + bitcrusher + random-source + tape-transport
  build order: bitcrusher ✓ → delay-line ✓ → filter-svf ✓ → osc-noise ✓ → random-source ✓ → saturator-tape ✓ → tape-transport ✓ → tape-memory
  shared with: bitcrusher 3 · delay-line 15 · filter-svf 41 · osc-noise 7 · random-source 6 · saturator-tape 4 · tape-transport 1  (other tools on each)
  signal_dag check: every node is one of its components ✓
