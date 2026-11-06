# ERAVOS — progress log

Where things stand, so work can be picked up in any session. Newest first.

## Done — 3.141 ERAVOS Update.exe: the updater as its own program; the card never traps you (2026-11-06)
Asked (with screenshots of the card stuck on "Starting ERAVOS Update…"): "it never closes, or does anything else to update." Then: "why
not make it another exe?"
- Cause: Restart now went ERAVOS → a hidden PowerShell → Start-Process -Verb RunAs. If that one step failed (the -Command quoted through
  Node and PowerShell twice; a blocked or declined prompt) nothing was logged, the helper never ran, and the card waited.
- ERAVOS Update.exe (packaging/windows/eravos-update.nsi, built by make-exe.ps1 beside ERAVOS.exe; the zip and the Setup carry it): started
  as you (an ordinary program, its own window); writes the started signal (ERAVOS closes); waits for ERAVOS to close; asks Windows for admin
  itself (ExecShellWait runas) for the silent Setup into the same folder; checks the installed version (the uninstall entry, 64-bit
  view); writes update.log and update-result.json; starts ERAVOS again as you. On a failure its window stays up with the reason.
- The PowerShell path stays as the fallback (a portable copy, or no exe): -EncodedCommand (nothing to quote), its failure written to a
  file and shown at once. The Starting card counts seconds and after 8 s offers Run the installer myself (the Setup opened with Windows'
  own prompt, then ERAVOS closes) and Cancel.
- Proof: desktop/test/updater.mjs — a launch failure is told at once (303 ms), Cancel ends the wait, the manual install opens the Setup
  and closes ERAVOS; the release run's new step packaging/windows/test-update-exe.mjs — the whole chain on Windows with the real built
  exe and Setup: started in 0.9 s, ERAVOS closed, Setup ran, version 0.2.14 confirmed installed, into a folder with a space in its path
  (run 42292948065, 25 s). The first run found the version read in the wrong registry view (fixed).
- His 0.2.14 has the old updater: 0.2.15 is installed by hand once; every update after goes through the exe.

## Done — 3.140 Retro DCO and Tape Memory in the Odd Couples set (2026-11-06)
Asked: "Continue". P43 listed both as without an Odd Couples pack or a part (Swarm's was done in #122 by the other session, the same way).
- Retro DCO: Steppers Juno Cards (a part in Synthwave Steppers) · Chapel Ladder Pad (a part in Hanging Tree Dub). Tape Memory: Steppers
  Cassette (on the Cards) · Hanging Tree Copy (on the Ladder). Each preset = a factory preset + the knobs for its job; the same entries in
  build/odd-couples.mjs so a regeneration writes them.
- Proof: P43 6/6 (was 4/6; every genre writes without a fault); 252 manifests valid. Not re-measured: the two songs' levels (build/gain-stage.mjs).

## Done — 3.139 Retro DCO, the tool (2026-11-06)
Asked: "Build it." (after the UI preview). tools/music/tools/genre-instruments/retro-dco/ — the approved face, playing.
- Decision A for now: a new tool beside Retro Poly; Retro Poly is untouched. B (Retro Poly rebuilt on it) waits for his ear: Retro Poly's
  presets draw random drift, so a null render cannot prove "no change".
- Engine: ONE AudioWorklet from the components' own kernel text — osc-va (saw + pulse, × unison-stack, hard sync), osc-sub, osc-noise,
  random-source (each card's drift), filter-svf 24 dB or filter-ladder (drive in the loop, full bass compensation), env-adsr ×2, lfo
  (+ delay fade) and the PWM LFO, filter-svf HPF, bbd-line → ensemble-core (Juno I / II / I+II from ENSEMBLE_MODES). 16 voice cards, each
  with seeded offsets (pitch, cutoff, envelope times). voice-allocator decides which card plays which note (poly / mono / legato; unison =
  one card, many voices); steal policy is a control. Every control is an AudioParam (live). Arp and Hold as Retro Poly's.
- voice-allocator gained: a note-off booked ahead (a sequenced note's length) still counts as sounding until then (3 checks; 28 total).
- Loudness measured against Retro Poly: the default preset within 0.2 dB; the loudest it can do (six notes, every source full, ladder full
  drive and resonance, level 1.5, I+II) peaks 0.70. Found while measuring: an edit's comment had swallowed the output-gain loop.
- Packs: Factory, 12 presets (Outrun Lead, Chorus Glass Poly, Five-Voice Brass Swell, Voice-Card Motion, VHS Dreams, Arcade Pulse, Analog
  Machine Bass, Coldwave Lead, Neon Noir Stab, Sync Sweep, Sub Growl, String Machine). The eight planned packs (≥ 6 each) are open.
- Icons: Retro DCO moon-star; Tape Memory had none (the other session's) — cassette-tape.
- Proof: retro-dco 4/4 (contract) + P139 7/7 (chord + silence after release; A3 = 220 Hz within 5 cents; every voice mode and both filters;
  chorus off = mono, I spreads; cards steal without sticking; key-up releases; every knob to its far end; loudness); P63 11/11, P45 12/12,
  P130 4/4, boundary 10/10; design check: a clean new tool (55/72 pass every rule).

## Done — 3.138 The last two Retro DCO parts: osc-sub, voice-allocator (2026-11-06)
Asked: "1, 2" (the synthwave parts, then the Retro DCO preview).
- osc-sub: the sub oscillator — 0 / −1 / −2 octaves; sine, triangle, square (polyBLEP), rounded square (tanh 2 of a sine: a square's
  weight without its fizz); reset per note (phase 0, rising), align to a kick; phase kept through glides.
- voice-allocator: which voice plays which note (logic, no audio) — poly / mono (last-note priority) / legato (glide without retrigger);
  steal a releasing voice first, then oldest / quietest / same-note / lowest / highest; release timing; budget.
- Proof: osc-sub 31 checks (exact octaves, harmonic laws per shape, polyBLEP aliases 13.5 dB under a naive square at 3.7 kHz, 42 ns);
  voice-allocator 25 checks (every policy, mono / legato, a 20,000-event random performance never puts two held notes on one voice).
  Found while proving: the rounded square at tanh 4 was nearly a square (7th −25.7 dB) — tanh 2 sits between triangle and square.
- Retro DCO: all 11 of its components are built. Next: its UI preview, shown to him before it is built.

## Done — 3.137 The Juno chorus parts: bbd-line, ensemble-core (2026-11-06)
Asked: "1, 2" (release 0.2.13; then the synthwave parts and the Retro DCO preview). random-source and saturator-tape were built by the other
session (3.134) — so this step is the chorus pair.
- bbd-line: the bucket-brigade chip — 2:1 compander, anti-alias and reconstruction 4-pole low-passes at clock/3, sample-and-hold at the
  clock (= stages / 2·time, so the bandwidth falls as the delay grows), hiss inside the line (it breathes with the playing), clock bleed.
- ensemble-core: 1–8 taps on one line, LFO phases spread k/taps (2 = inverted, the Juno way; 3 = 120°, string machines), a second fast LFO,
  sine / triangle, spread, mix; the machines as data (juno I, II, I+II, string machine, dimension).
- Proof: bbd-line 20 checks (delay = time by phase at 15 Hz; clock law; bandwidth vs clock and stages; alias rejection; compander round
  trip ±0.6 dB; hiss > 20 dB lower in silence; bleed at the clock; seeded; a chorus sweep without clicks; 233 ns); ensemble-core 20 checks
  (taps average to base at every moment; pitch wobble = 2π·rate·depth·f; triangle plateaus; stereo; machines bounded; 195 ns).
  Found while proving: the anti-alias corner at 0.45·clock kept too much above half the clock; clock/3 (the margin BBD designs keep).
- Retro DCO now stands on 9 of its 11 components; left: osc-sub, voice-allocator.
## Done — 3.136 Piano's three components (2026-11-06)
His "yes" to Piano → bottom up: the three parts it lacked, each NEW code proving its own numbers.
- modal-resonator: a bank of two-pole modes (≤ 64); a unit impulse rings at exactly g · rⁿ · sin((n+1)w) — frequency, decay (T60) and level
  exact; modes over 0.45 × rate skipped; scale(k) for a new note; MODAL_SHAPES beam (tine, reed) · bar · body (soundboard) as data. 11 checks.
- karplus-string: delay → Thiran fraction → four stiffness allpasses (stretch) → one-pole damping (bright) → loss. Tuning exact: the loop's
  phase delay at f0 is sr / f0 to 1e-6 samples (worked out) and < 0.5 cent measured at 55–1760 Hz; stretch puts the 12th partial of A4 up to
  ~20+ cents sharp (a piano's 10–30), t60 on time (30 dB a second at 2 s), stable always (loss never above 1). 41 checks.
- saturator-tube: a triode-like curve (tanh up, harder down by 1 + 3·bias: even harmonics from the asymmetry, none at bias 0), a 5 Hz DC
  blocker on what the tube adds (the dry signal untouched by it), tilt about 1 kHz, faded in over 6 dB (drive 0 = the signal exactly). 14 checks.
- Specs: status built; loaded in tools/music/index.js; the planned specs' DAGs regenerated (piano, pluck forge, drum foundry …).

## Done — 3.135 Tape Memory, the tool (2026-11-06)
His "yes" to the spec and the UI preview. tools/music/tools/effects/tape-memory/ (scaffolded by build/new-tool.mjs).
- Engine: in → saturator-tape → bitcrusher → delay-line L / R (time = 15 ms + the transport's lag + wow + flutter; R + drift) → svf high-pass →
  svf low-pass (copies and wear lower it; VHS head tilt sweeps its detune) → dropout gain → + hiss (osc-noise pink, tilt) + crackle (osc-noise
  crackle → svf band-pass) → out; five random-sources (wow, flutter, drift, head, dropout events → the dropout port); tape-transport (Speed,
  Tape stop on its curve). Machines set character (top end, wow / flutter, hiss, bump, low floor). Wear and Copies scale it together.
  The shell delays the dry 15 ms; settings before the sound starts land at once, while it plays glide 20 ms; the saturator is trimmed as
  drive comes in (a peak at the very start came from defaults gliding to a preset — found by measuring, not by more trim).
- UI: the approved preview's face (Out = the shell's outGain). Tape stop the primary; More depth folded; dims say why.
- Packs: factory (Lofi Cassette + one per planned pack name — the ≥ 6 per pack not met, listed open) · lofi (the setup's three scenes).
- The Lofi setup: Destroyer and Sidechain → Tape Memory → out; DUST also moves Wear.
- Tests: tape-memory.test.js 8/8 (contract 4; clean = 15 ms late, pitch and level kept; wow moves pitch; speed 0.8 → 352 Hz; silence stays
  silence, hiss and crackle add theirs; tape stop; dropouts; every preset under full scale). Design check clean (D1–D6 0). P132 P119 boundary
  no-toys green; 247 manifests valid. Played in the app (the Lofi setup): no faults, −7 dB RMS, peaks −1.6 dB.

## Done — 3.134 Tape Memory's four components (2026-11-06)
His "yes" to Tape Memory → bottom up: the four parts it lacked, each NEW code proving its own numbers, the worklet = the kernel text.
- random-source: rate / smooth (S&H … cosine glide), dist uniform · gaussian (σ ⅓, clipped) · beta (Marsaglia–Tsang) · histogram (≤ 32 bins),
  seed (sample-exact repeat), depth / offset / unipolar; ch1 Poisson events (density, eventLen). Also MusicParts.rng(seed). 18 checks.
- tape-transport: ch0 speed (varispeed 20 ms glide × motor), ch1 lag = ∫(1 − speed) clamped 0…maxLag; stop / start on one motor position
  (continuous), curve both ways, rewind −2×. 18 checks.
- bitcrusher: mid-tread 1–24 bits (24 = untouched), hold on a fractional phase, 4-pole Butterworth anti-alias at 0.45 × rate, seeded jitter,
  TPDF dither, mix. 13 checks.
- saturator-tape: +6 dB high-shelf pre-emphasis and its exact inverse (numerator / denominator swapped), tanh with bias and a lagging
  magnetisation (hysteresis), faded in over 6 dB (drive 0 = the signal exactly), level kept near full scale, head bump, gap loss, out, mix. 13 checks.
- Specs: the four "inputs / outputs / limits" lines written (the TO WRITE quoted), status built with the proof. Tape Memory's DAG: 7 of 7.

## Done — 3.133 .erv; the Workshop approved; the Pattern Editor's components (2026-11-06)
His words: "Can we use yaml to save songs like a psd file…" (09:23:29Z) · "The pattern and note editor are the same." (13:28:34Z) · "First."
(13:30:25Z) · "Absolutely not. Like I’m talking a full workshop…" (13:38:50Z) · "Agnostic. I was thinking it could be the beginning of photo
manipulation tools. If possible." (14:09:18Z) · "Nice. That's exactly it. And then the PSD style YAML, maybe ERV as an extension for that." (15:55:01Z)
- Pattern Editor spec + components: pattern-store (nesting, flatten, grow, versions, diff; a clip round-trips bit for bit), seed-registry
  (named seeds, reroll history; equal to dsp.mulberry32), scale-key (equal to MusicTheory on 45,540 inputs). Its preview was REJECTED.
- The Workshop (specs/eravos.workshop.spec): one object on a work surface — layers, tools, properties, history, zoom path — agnostic:
  music's note first, an image domain (photo manipulation) second. Preview approved ("exactly it"). Not built yet: W1 next.
- .erv (specs/eravos.erv-format.spec, canvas/runtime/erv.js): Workspace.snapshot ↔ layered YAML (js-yaml 4.1.0 vendored, CORE schema,
  noCompatMode so `on:`/`y:` read plainly); the kernel's intake hands a dropped .erv over as text; Start › Save as .erv · Open .erv… (the
  layers first, switch any off; a tool left out takes its wires). "Your audio" became "Your files" (the canvas says no domain word).
  P120 3/3. Open: "locked" kept in the file, not enforced; a sidecar folder for big audio; Workshop objects as layers inside tools.
## Done — 3.132 the Lofi setup (2026-11-06)
Asked: "i also want to be able to make lofi" → "nope look at the claude.md" → specs → "yes" · "suites are tools and its components."
- Lofi is a SETUP (Axiom 3), not a tool or a suite: tools/music/suites/lofi/suite.json — Groove (boom bap) → Drum Machine (Lo-fi Dust) →
  Destroyer (12-bit); Chords (jazz) → Retro Poly (Lofi Keys) → Filter (Lofi Low) → Echo (Lofi Warm Echo) → Sidechain; Bassline → Deep
  Sub → Sidechain. 82 BPM (steps: a setup may carry its domain's recipe steps; suites.js passes them through). Macros DUST WARMTH SWING PUMP;
  scenes Study / Rainy / Late Night.
- Chords: Voicing [tension (today's rule, unchanged), 7th, 9th, rootless 9]; TENSION dims with a jazz voicing. components/progression:
  JAZZ_PROGRESSIONS (six) + ALL_PROGRESSIONS (the five, then the six) — the five untouched; Chords and Bassline offer ALL.
- Groove: "boom bap" style (kick 1 and the and-of-2, snare 2 and 4, softer offbeat hats, ghosts); the five styles unchanged.
- Lofi packs (data only): Groove, Chords, Bassline, Retro Poly, Filter, Deep Sub, Echo, Sidechain. build/tool-kit.mjs regenerated the
  pack schemas (also XY Pad's posX/posY from 3.131 and Retro Poly's Hold from 3.130, which were stale).
- Played in the app: no faults; −7…−10 dB RMS; the master compressor pulls 3–5 dB (open: the parts' levels could come down).
- Tests: p132 3/3; P119 now 8 setups (and "the last step opens the suite"); Chords 12/12; Bassline 16/16; Groove; Echo; Filter; Sidechain;
  Deep Sub; Retro Poly; Drum Machine; Destroyer; P63 11/11; P14 142/142; boundary 10/10; design check no worse.

## Done — 3.131 Bind on the lane (2026-11-06)
Asked: "“Automate this”: an empty lane with a bind button to bind a tool or component, or interaction object?" → plan shown → "yes".
- Automation: ＋ Add lane (ui:lane_add with no target) = an unbound lane — drawn, drives nothing, never "target gone". Each lane: ⊕ Bind
  (ui:lane_bind {id}) → the next control touched anywhere on the canvas; "or pick ▾" (ui:lane_bind_to); right-click › Unbind (ui:lane_unbind).
  A lane with nothing drawn starts at the control's value; a drawn shape is kept; one control, one lane. The old ui:bind still works (P118).
- XY Pad: posX / posY (group PAD) — a hand on the pad publishes them (hook xy.hook.touch_out, ≤ 60/s), anything moving them moves the puck.
- Open: keyboard pitch bend / mod wheel are not controls yet; components' own windows only where Open as components exists.
- tests/p131-bind-on-the-lane.test.js 3/3; P118, Automation 8/8, XY Pad, boundary green. Specs: macro-automation + xy-pad ADDENDUM 2026-11-06.

## Done — 3.130 A key let go stops; Retro Poly Hold (2026-11-06)
Asked: "Retro poly plays a key like your holding it. How do I turn that off. Same with the midi, options to make it hold or single note?"
- Cause: the on-screen keyboard (ui-music Keyboard and the tools' own) plays a key as a 30-second note and sends "let go" on key-up. Seven
  tools only let go of a note that had no end booked, so key-up did nothing and the note held for 30 s: Retro Poly, Coven, Organ, Pad
  Forge, Syn Osc, Syn Partials (and the shared note-release component). Each now brings a booked end forward. Retro Poly mono: the voice a
  legato note takes over now belongs to the new note (letting that key go stopped nothing before).
- Retro Poly › Hold (header, beside Mono; off by default): keys and MIDI you let go keep sounding; the next key you press lets them go
  (the same key alone just stops it). Timeline and sequencer notes keep their own lengths. Single note = Mono (already there).
- Proof: tests/p130-note-hold.test.js 4/4 — on-screen key, MIDI poly and mono, Hold, and every tool with a keyboard (15) silent 3 s after
  letting go (7 failed before). Retro Poly 12/12, Coven 13/13, Organ 43/43, Pad Forge 12/12, Syn Osc 4/4, Syn Partials 4/4, P53 88/88,
  boundary 10/10; null render Syn Osc 11/11 PASS (the others' presets are random-seeded: unproven, 0 FAIL).
- Open: Wobble Bass sounds before any note in an offline headless render (−4 dB, no key pressed) — left out of the P130 guard, to look at.

## Done — 3.129 Shared components: delay-line, osc-noise (2026-11-06)
Asked: "Next." (after 3.128: next by overlap, delay-line and osc-noise).
- delay-line (15 planned tools: echoes, dub, shimmer, tape memory, choruses …): up to 20 s or tempo sync, Hermite fractional read, TAPE
  (time changes glide, the pitch bends) or DIGITAL (time changes cross-fade, no pitch), feedback to 1.2 through low cut / damp / drive,
  freeze, mix, an LFO for chorus and flutter; an AudioWorklet from the same kernel text.
- osc-noise (7 planned tools, retro-dco among them): white, pink, brown, velvet, crackle, band-limited; tilt; stereo width; seeded.
- Proof: delay-line 19 checks (fractional delay exact to < −80 dB, freeze holds 9 s to 0.01 dB, tape bends / digital keeps 1000 Hz with
  no click, 151 ns per stereo sample); osc-noise 32 checks (spectra measured by Welch's method: 0 / −3 / −6 dB per octave, tilt equal to
  its own transfer function, seeds reproducible, 143 ns). Found while proving: a loop filter left "fully open" still darkened every
  echo, so the ends of damp and low cut now mean off. `node tests/components.mjs` all pass; 21 tool DAGs regenerated.
- Next, by overlap: ensemble-core / bbd-line (the Juno chorus), saturator-tape, random-source; then Retro DCO on them, UI shown first.

## Done — 3.128 Shared components for the synthwave tools: unison-stack, filter-ladder (2026-11-06)
Asked: "Retro poly is buggy. I love it though. Like I want more synthwave. Is there more coming?" · "Which components, like what overlap can
we focus on to speed this up?" · "Do it." (after: merge the other branch, then unison-stack and filter-ladder).
- The other branch (claude/empty-canvas-blank-tools: Swarm Oscillator, spec DAGs, axioms, competence register) merged (PR #103); the
  Swarm Oscillator's missing drawn icon added (orbit).
- unison-stack (11 planned tools: retro-dco, supersaw-cathedral, hoover-engine, pad-forge …): 1–16 voices of any source — detune curve
  (linear, exp, supersaw), spread (equal-power pan), blend, phase (free, reset, seeded random — no Math.random). Its layout is Supersaw's own,
  voice for voice (the test writes Supersaw's arithmetic out and compares), so moving Supersaw onto it can null-render later.
- filter-ladder (lead-glide, poly-filter-matrix, retro-dco — Retro Poly's rebuild): 4 ZDF one-poles in a loop solved in the same sample,
  tanh drive inside the loop, bass compensation, LP24 / LP12 / BP12 / HP12 / HP24 taps; an AudioWorklet from the same kernel text.
- Proof: unison-stack 95 checks; filter-ladder 36 checks (−12.04 dB at the cutoff, 24 / 12 dB per octave, the bandpass equal to theory,
  resonance peak at the cutoff, 1/(1+k) bass loss and its compensation, drive harmonics, self-oscillation bounded 20 s at ~800 Hz, audio-rate
  cutoff FM bounded, 148 ns per stereo sample); `node tests/components.mjs` all pass; specs' inputs/outputs written, 16 tool DAGs regenerated.
- Next, by overlap: delay-line + osc-noise (3 synthwave tools each), then ensemble-core / bbd-line (the Juno chorus), saturator-tape,
  random-source; then Retro DCO on them, its UI shown first.

## Done — 3.127 Swarm Oscillator; spec DAGs; axioms; the competence register (2026-11-06)
Asked (07:27:37Z): "Map, spec first / Each tool needs a spec with a dag. / Make the swarm oscillator first. Since you were ready to. /
Update the specs so nothing is lost. / And then Add those axioms to a claude.md. / Also ideas, choices and direction. All of me and what’s
proof of competence and ownership, I want logged to a compotenxe and log. Timestamped and what came from it. The date and quotes exactly."
- Spec DAG: build/spec-dag.mjs → every tool spec (built and planned, 226) ends with its components layer by layer, build order, sharing;
  built tools: in it now / comes out of it / planned. A hand-written signal_dag: is checked against the components.
- Swarm Oscillator: the spec written first (ports, params, signal DAG, decisions, open gaps); six components built as new code, each with its
  own node test; the tool runs one AudioWorklet built from their kernel text. Found: messages to a worklet arrive after an offline render
  has run past them (silence) — every timed thing is now an AudioParam (settings k-rate, 8 voice slots, Lock on beat a count); the tables go
  in at construction. Headroom: output gain 0.17 × level (an 8-note chord on every preset at full level stays under full scale). More depth
  used [hidden], which .uk-panel's display overrode — now display toggled. Tests 10/10; design check clean.
- Specs: session map (every message verbatim, curly apostrophes and all, with its time), addenda to suites / components / macro-automation.
- CLAUDE.md › Axioms (11), each with his exact words and time.
- docs/competence/: register.jsonl (23 entries: 20 his, 2 the AI coder's discoveries, 1 the pasted reply as outside input) → REGISTER.md,
  LOG.md; --check runs in CI against the target branch.
- Open: packs ≥ 6 per pack for Swarm; LFO tempo sync; guards for "no monoliths" and "adjusted while playing"; Components on the suite page.

## Done — 3.125 / 3.126 Piano keys, Automation Bind, suites rework (2026-11-06)
Asked: "Move along the piano to change the keys, each key needs to play its relative note. Also the automation tool needs to have a
bind button … similar to the midi mapper. … can you clear out suites and make them the tool and its components wired together? But
also the ability to create them?" — then: the 7 genre suites → Start From; create from "setups on the screen. Like what’s wired
together … Across domains. Make sure you’re mapping all of what I’ve said."
- Keyboard (every tool): with the key lock on, a key outside the key snapped to a neighbour — a slide repeated or skipped notes.
  Every key plays itself; out-of-key keys stay shaded. P117.
- Automation › ⊕ Bind: then touch any knob, switch or choice on any tool → a lane; one touch, then it lets go; again cancels. P118.
- Suites: kind "suite" (default) = a tool and its components wired (Wub Lab, Synthesis Lab); kind "setup" = the 7 systems of whole
  tools, now Start › SETUPS cards (recipe op "suite": opens its window, builds, starter scene — as before). Suites.list() = suites only.
- Your own suites: right-click a window › Save what is wired here as a suite… — the wired group (any domain), its wires, its settings as
  the scene "As saved"; kept in localStorage (eravos.userSuites); Delete on its page.
- Tool page: Suites tab (Open as suite · a part of · setups) and Components tab (domain-contributed via ToolPage.addTab: in it now /
  comes out of it / planned, from build/components-map.mjs → tools/music/data/components-map.js); the old "Suite" tab is "Setup".
- docs/HIS-WORDS-MAP.md: all 19 things he said this session, each done / rule / open. DESIGN-GUIDE W7 (power without overwhelm), W8.
- Open: a guard for "no monoliths" (no tool names another's preset or builds in a mod); a guard for "adjusted while playing" (hold a
  note, move every knob); Components on the suite page; a UI tab; a domain-free suite window for a second domain.

## Done — 3.124 Empty canvas: every tool starts blank, no preset (2026-11-06)
Asked: "Can you when picking empty canvas have every tool empty of presets?"
- Start › Empty canvas (and Browse every tool) turns on a blank start: every tool added opens on its own plain settings — no preset
  loaded (27 tools had a default preset). Picking a preset from the tool's list works as before. Kept across restarts.
- Any other start (a recipe, a mode, installing a domain) turns it off: tools open on their default preset as before.
- Saved tools (projects, autosave, undo, duplicate) keep their state; previews (ephemeral) still load their preset.
- `canvas/runtime/organism-factory.js` (OrganismFactory.blankStart), `canvas/index.html`. Proof: `tests/p116-blank-start.test.js` 2/2;
  P21 P71 P73 P76 P100 green, boundary 10/10. P70 (1, Timeline split label) and p16-ui fail on main too.

## Done — 3.123 Restart now waits until ERAVOS Update really runs · v0.2.10 (2026-11-06)
Asked: "The update helper doesn't work. I hit restart and it closes eravos and does nothing after."
- apply() closed ERAVOS 0.3 s after spawning a hidden PowerShell that, for a Setup install, must itself start an elevated PowerShell
  (the admin prompt). Now the helper writes update-started.txt first thing; ERAVOS waits up to 90 s for it, then closes. No signal →
  ERAVOS stays open, says why, and the update stays ready. The card shows "Starting ERAVOS Update…" (and asks to say Yes to Windows).
- The release check passes -Started and fails without the signal. updater.mjs all passed; P99 2/2.
- Note: his installed build has the old helper — v0.2.10 is installed by hand once.

## Done — 3.122 Suites on the Timeline · slide across keys · zoomed-out draws less · 3 px borders · v0.2.9 (2026-11-06)
Asked: "some tools can't be added to the timeline. Like the suites … dragging down the piano keys for tools. Like lazy loading. Zooming
out decreases resolution … the button border width … a couple of pixels wider". Per-tool skins: a preview first (not built).
- suite-hub: note_in + note_out; a note goes to its member voices (parts not notes: false, not mods, that take notes). It forwarded
  nothing at first: a tool may only send through a declared out hook (RUNTIME_002). MIDI forwarding left out (no midi_out: held keys
  would not sustain).
- UI.Keyboard: pointermove while held plays each key reached (the one before lets go).
- UI.loop: inside #world, under 60 % zoom ≤ 24 fps, under 35 % ≤ 8 (docked windows not).
- Borders 3 px on every button/switch; box-sizing border-box and a :where margin −1.5 px keep every footprint (P23 caught the rows wrapping).
- Tests P122, P122b. Full 1400/1403 (P82, rim, P70: main's).

## Done — 3.121 WASD · middle-drag works on Windows · Graphics levels · v0.2.8 (2026-11-06)
Asked: "wasd to navigate. Hold middle mouse and drag to move. Having major performance issues. Like with bassline or arp. Maybe add a
graphic settings for low end hardware."
- WASD pan while held (rAF, 700 px/s, Shift 1800), not while typing or when a tool used the key (defaultPrevented).
- Middle drag already panned, but a middle press on Windows starts Chromium's autoscroll: stopped at mousedown.
- Graphics (root data-gfx, Settings › Canvas & graphics): Balanced = UI.loop ≤ 30 fps, no backdrop blur; Low = ≤ 15 fps, canvases and
  the glass layer at 1×, no blur/shadows/filters/transitions/animations, no reactive glow layer, colour writes ¼, the Field still.
  Profiled (5 tools playing, CDP CPU profile): busy 35.5 % → 22.5 %. Most of the work was the browser drawing, not ERAVOS's scripts.
- Tests p121 2/2. Full 1396/1399 (P82, rim, P70: main's).

## Done — 3.120 Sections · select by pitch / loudness · quantize you can change · the release check fixed (2026-11-06)
- The release blocker, found: ERAVOS Update worked all along (run 11: closed → backed up → new files in → result + log written →
  ERAVOS started). The check read the result 3 s later — by then the started ERAVOS had moved the test's folders into its library
  (Documents\ERAVOS, the 3.110 migration). Fixed in the check: -NoStart, and the work folder outside the app as in the real app.
- Sections (timeline-depth.spec resolution levels): the stretch from a marker to the next. Right-click it on the marker lane: Select,
  Loop, Duplicate (copy right after; the rest moves on), Delete (out, gap closed) — clips, markers and automation points move with it.
- Notes menu: select every note of this pitch / about this loud.
- Quantize is non-destructive: a note keeps where it was played (qs); another strength works from there; "Back to the original timing";
  a hand move makes the new place the played one.
- p112 13/13; desktop/test/updater.mjs passes. Full 1395/1399: P82, rim, P70 (main's), P74b (flaky).

## Done — 3.118–3.119 The release check says why · Sketch plays as you draw (2026-11-06)
- 3.118 Releases v0.2.4–v0.2.7 were never published: the release workflow's ERAVOS Update check (3.111) found no update-result.json, and
  it runs before the upload. Its log now shows a parse check, the helper's output and folders. Run 10: helper exit 0, no output, no log
  — it stops before its first step. 3.119: the helper now prints its arguments and every step (Write-Host), so the next run says where.
- 3.119 Sketch plays the line while you draw it: each semitone it crosses (≤ ~16/s). (Click / paint / drag already did, since 3.115 —
  not yet in his installed build, which is v0.2.3 because the releases above were blocked.)
- p112 10/10. Full 1391/1396: P82, rim, P70 (main's), P102 (order), P74b (flaky).

## Done — 3.116–3.117 Edit note in the menu · event depth: chance, ratchet, nudge · v0.2.7 (2026-11-05)
Asked: "also editing a note has a whole editor? note editor?" · "then all the timeline improvements and phases next".
- 3.116 notes menu › ✎ Edit note… opens the note editor.
- 3.117 timeline-depth.spec "Clip depth", first step: per note pr (chance 5–100 %), rt (ratchet 2–8 hits, velocity eases), mt (nudge
  ±50 % of a step). Chance is a hash of clip id, note and pass — no Math.random: a song plays the same way every time. Defaults are not
  stored, so every song from before plays exactly as it did. Drawn: paler by chance, ratchet ticks. Note editor: Chance · Ratchet ·
  Nudge (their own row).
- Fixed: 3.115 dropped the selection line before the Bend tool's end drag (dive/rise did nothing); the point zone is the middle fifth.
- Tests p112 9/9 (stored only when not default; editor has them; ratchet ×4 = 4 even hits; nudge +50 % = half a step; chance ≈ half of 16
  passes, identical when replayed). 1392/1395: P82, rim, P70 (main's).

## Done — 3.115 Hear what you draw · points on a note · zoom in further · v0.2.6 (2026-11-05)
Asked: "I want sound playing when I draw notes. I also want to be able to manipulate notes. The size, also the edges. Make it thinner, or
wider, edit the shape completely." His answers: thinner/wider = "Zoom in for more precision"; shape = "Points on the note".
- A lane with no instrument was silent: the Timeline's own preview voice (saw + sine an octave down, soft low-pass, live) plays then,
  following a note's bend. A note dragged to a new pitch sounds there.
- Points (Bend tool, one note selected): drawn on its pitch line; click the middle third adds one and drags it; drag a point (between
  its neighbours; ends stay at the ends; 0.05 st steps, Shift whole); double-click removes. A bend becomes a 'path' when edited.
- Zoom: PPS_MAX 96 → 480 (2XL, 4XL, 8XL), rows 40 → 120 px (2XL, 4XL).
- Tests p112 7/7 (points, preview voice). 1388/1393: P82, rim, P70 (main's), P102 (passes alone ×2: order-dependent).

## Done — 3.113 piano roll easier · 3.114 Timeline right-click · 3.115 Clip look + Canvas zoom (2026-11-05)
Asked: "make it easier" → "yes, and i dont like the fill options, replace it with pattern selection. also easier to manipulate notes,
like size and moving" · "also remove the split button from the timeline?, and let me select where and right click" · "what about a
canvas mode with a zoom in so it can be smaller or thinner wave forms?" → "im saying the piano roll … like the song recorder, where theyre
like clips". Each shown as screenshots first; "merge and push".
- 3.113: one row (tool, clip, bars, note tools, Grid, Scale lock, Zoom, Lane, Pattern, More, ⧉, ⛶, ×); More ▾ (kept as rollMore): Length,
  Click adds, Sketch makes, Rows, Quantize Q ≈ ⟷ ⏎, Clip look, Canvas zoom, Clear. Pattern = PatternLibrary.forTool, repeated to the clip,
  in the key, Ctrl+Z undoes; the chord Fill row gone (engine clip_fill kept). Sizing: ends grab 6–12 px, short notes' right half sizes,
  grips drawn (the side you would grab lit), the grab offset kept, Ctrl+←/→ sizes by a grid step (Shift: bar).
- 3.114: ✂ Split button gone (S and menus split). Right-click a selected stretch: Split here · Loop this stretch · Delete what is in it
  (engine clip_clear_at: cut at the edges, remove inside, one step) · Clear the selection; a clip: Edit notes · Split here · Duplicate ·
  Delete; a spot: Split here · New clip / pattern block here. A right press no longer starts a selection.
- 3.115: Clip look (rollClips): see-through note, outline, a waveform inside (denser = higher, taller = louder), its name. Canvas zoom
  (rollCanvasZoom): wheel zooms time + pitch around the pointer (rows 4–40 px, time never past filling the roll), Alt+wheel velocity,
  Shift+wheel scroll, middle-drag pans.
- P84 counts only button-style cards (Material cards share the style). Full suite on main before this: 1379/1382 (P84 fixed; P82 ×2 known).

## Done — 3.113–3.114 Ctrl-click, curves for a selection, art 404s fixed, Ctrl+A, bigger menus, tool borders, more Settings · v0.2.5 (2026-11-05)
Asked: "Holding control selects each node when left clicking" · curves · connect edges from selecting them · "that needs to be fixed,
the art svg … the context menu for the timeline is way smaller, expand it … the cut in half button …, split at playhead button,
duplicate buttons need to go, also control a needs to work again, also the settings menu is still gone. a lot missing … can you make a
colored border around each tool, including the piano … merge, push and release".
- art.svg: a relative url() in a window's --art resolves against canvas/runtime/eravos.css → /canvas/tools/…/art.svg 404 per window,
  every paint (754 in his console). Now an absolute URL. Measured: 0 misses spawning tools in Dusk.
- Piano roll: Ctrl-click toggles a note (Ctrl-drag still copies); Ctrl+A anywhere in the roll; menu › curve (dive, deep drop, rise, glide
  in, vibrato, flat) for every selected note; J = Connect edges.
- Timeline: In half / Split at playhead / Duplicate buttons gone (still in the right-click menu). Context menus: 14 px, 38 px rows.
- Coloured border on every tool and on a tool's own windows (outline in --acc): Settings › Canvas (on). Snap windows (on).
  Settings › Keys (shortcuts + search; the music side adds its own) and Library (the app).
- Tests: p112 5/5. 1387/1391: P82, the rim, P70's Timeline menu (fail on main too) and P74b (flaky).

## Done — 3.112 Connect edges in the piano roll's menu · the piano roll as a proper window of its own (2026-11-05)
Asked: "I want to be able to select notes and right click and have a connect edges in the context menu. Also make the piano roll
popout its own window. It's badly impl[e]mented."
- Right-click with notes selected opens the notes' menu: ⌒ Connect edges · ⟷ Close the gaps (legato) · Q Quantize · ≈ Humanize ·
  ⧉ Duplicate · × Delete. With nothing selected, right-click still erases the note under it.
- Connect edges: the selected notes become ONE note that glides through each of their pitches (a 'path' bend, like a Sketch line).
  Where notes touch, a short slide over the edge; across a gap, the slide fills it. In a chord, the top note carries the line.
- The roll's own window (on by default now; ⧉ Back inside puts it under the tracks):
  - What was wrong: it opened over the Timeline's tracks (pushed up to fit the screen); an 18 px strip whose controls showed only on
    hover, so it didn't read as a window; it didn't snap; the Timeline kept the height the roll had used.
  - Now: always-visible title bar in the tool's colour; snaps to the windows near it (Alt: free); opens UNDER the Timeline, never
    over it; the view moves (keeping the Timeline's title bar on screen first, then the roll shorter down to 360 px) to show it; the
    Timeline shrinks to its lanes while the roll is out and gets its height back when it returns; 1180 × 560 to start.
- Tests p112 (menu → Connect edges, the path through each pitch, the window under the Timeline with a title bar); p109 and p76 follow the
  new default. 1379/1382: the 3 failing are main's own (they fail on main alone: theme cards, p82 glass, a rim).

## Done — 3.111 Updates in the background, with ERAVOS Update to put them in place (2026-11-05)
Asked: "fix the update tool. It needs to run in the background? Like maybe an update tool. It closes the canvas and then doesn't apply
the update".
- Why it failed (3.99): it closed ERAVOS first, then a hidden script waited only for the main process. Electron's helper processes keep
  the files locked a moment longer, so it stopped half way, with no restart and no log. It was also written without a BOM, which
  Windows PowerShell misreads.
- Now: Update downloads (streamed, with progress) and unpacks in the background while ERAVOS stays open → "ready" → Restart now · When
  I close ERAVOS. desktop/apply-update.ps1 (ERAVOS Update, its own process, ASCII-only): waits for every ERAVOS process from the
  folder (ends them after 60 s), backs up the app, robocopy with retries for locked files, restores the backup on any failure, writes
  update.log + update-result.json, always starts ERAVOS again. The next start tells you: applied, or failed with Open the log / Try again.
- Never updates a git checkout in place (it opens the release page there).
- Tests: desktop/test/updater.mjs (node: check, streamed download with progress, never closes before ready, results read once and
  tidied), p99 (the card through every state), packaging/windows/test-update.ps1 (the release workflow runs ERAVOS Update on the built
  app on Windows: new files in, your projects untouched). Not run here: Windows-only steps (no PowerShell on this machine).
- 1355/1355; updater.mjs all passed.
- Merged with main's Setup updates (3.99 → Program Files): a Setup install downloads the new ERAVOS-Setup in the background and
  ERAVOS Update runs it silently (admin once); ERAVOS restarts through Explorer, as you.

## Done — 3.110 ⚙ Settings is a page, not a dropdown (2026-11-05)
Asked: "also need a actual settings built not a drop down". Screenshots of every tab shown; "MERGE AND push".
- canvas/runtime/app-settings.js → window.AppSettings: addSection({ id, label, order, sub, make(close) }), open(id), close(), toggle().
  The page reuses the tool-page look (tp-overlay / tp-page / tp-nav tabs). Entry: ⚙ Settings in the toolbar beside ⋯ Options, and Ctrl+,.
- Sections: Look (Themes.panel — theme, buttons, material; canvas) · Reactive colours (ReactPanel.build, app scope; music) · Sound (Hear
  by place; music) · About & updates (version from the app, Check for updates, releases; canvas). A section that throws shows a line, not
  a broken page.
- ⋯ Options keeps only actions: Undo, Redo, Dependencies, Stop all, Ports, Fit all, Tidy up, Clear canvas.
- Tests: tests/p110-settings.test.js 2/2; P77 (reactive panel), P91 (themes), P99 (updates) now drive the page; boundary 10/10.

## Done — 3.108 Sketch draws smooth and connected; 3.109 the piano roll fills its width, and its own borderless window (2026-11-05)
Asked: "can you start with the timeline? make it easier and the drawing more smooth and connects to each other" · "also split the
timeline. maybe. it doesn't scale well, also i want them to be seperate or an option to be seperate" → chose "Piano roll its own window"
→ "oh and make it borderless". Before/after shown; "merge and push and release".
- 3.108: component pitch-path (MusicParts.pathAt — monotone cubic, Fritsch–Carlson; smoothLine — local line fit, so stroke ends have no
  hook; simplifyPath ≤ 48 points within 0.08 st). Sketch › curves: one stroke = one note, b = { shape: 'path', path }; engine cleanB keeps
  ≤ 64 points; sdk-music bendNote plays the path (48–256 ramps). Fixed: a path starting and ending at 0 was played flat. A drawn wave:
  11 notes with corners → 1 note, worst 0.09 st from the line, largest slope jump 99 → 3.4.
- 3.109: the roll's notes fill its width (2-bar clip 448 → 1,131 px) until a zoom is picked by hand. VIEW › Piano roll in its own window
  (default off) / the roll's ⧉ Own window: one borderless panel (canvas: CanvasWM.openPanel — no frame, a slim strip whose controls show
  on hover, corner sizing, expand, opens on screen, goes with its owner); × closes the clip; off / Timeline closed puts it back.
- Tests: tests/p108-sketch-path.test.js 2/2, tests/p109-roll-window.test.js 2/2; Timeline 84/84, piano 27/27, bend 16/16, P20 33/33,
  boundary 10/10, P103 3/3; design check 52/69, none worse. Note: a test driving a canvas drag through CDP must send button 'left' on
  moves, or Chrome drops the capture (it looked like the drag ending at once).

## Done — 3.106 reactive colours no longer compound; 3.107 Material; dice gone (2026-11-05)
Asked: "also the canvas reactive colors keep compounding errors. test it. maybe white border around tool ui. can you remove the dice icon.
what about adding more texture to the tools? like how the retro poly" · "always show me or add more themes before change."
- Measured: every colour of 5 tools snapshotted, the reactive colours driven 300 frames per mode with redraws, switched off, compared
  as drawn (each colour painted on one pixel, ±3): 221 of 2,714 did not come back.
- Causes, fixed: (1) switching mode / off (zero()) never put back the palette a sounding window had lit on itself (lightSheets: --amber
  for the plug, --rcs-*); the next lighting took the lit value as its base, so colours crept further with every change. (2) BlackSurfaces
  darkened an already neutral colour again on every pass. (3) dark borders, outlines, shadows and the reactive engine's own colour copies
  were neutralised only after a reactive cycle (now from the start / never for its copies).
- After: synthetic 0 visible; the real playback path (the song loaded, every mode, stop, off) 0 of 3,017. tests/p106-reactive-drift.test.js
  fails on the old code (the plug's amber crept; darkening twice) and passes now.
- Dice: 🎲 gone from Groove, Bass Gen, Acid Synth (Reseed), EDM Lab (Reseed), Arp (Random), Wobble Bass (Tear), Songs (Another like it),
  the random-preset menu, a library card (≋).
- Themes › MATERIAL: None (default — the look as it is) · Grain · Brushed · Carbon: neutral texture on windows, cards and tool pages. The
  Themes panel's BUTTONS row had no styles at all — now styled like the theme cards (MATERIAL beside it).

## Done — 3.104–3.105 consistency: the design guide, the design check, gradients in the tool's family (2026-11-05)
Asked: "the buttons in the tape echo look bad. the color i mean. bad gradient" · "i want consistency across all of them. and a template
or schema for a design guide or philospophy to maintain consistency."
- Dusk --dk2…4: the accent turned +9° / +18° / −14° in OKLCH (was the accent mixed with fixed pink / orange / violet → mud on green).
- docs/DESIGN-GUIDE.md (philosophy; rules S1–S4, C1–C5, K1–K5, W1–W4, N1–N2), docs/templates/TOOL-UI.md (the new-tool UI write-up).
- tests/design-check.mjs: every tool on the served build; D1–D6; tests/design-baseline.json can only improve; docs/design-check.md.
  .github/workflows/checks.yml runs it (and components, no-toys, no-playwright) on every PR.
- Fixed to the rules: kit `sm` size (Timeline, Sequencer lane controls), Tape Echo's Clear/Throw at kit size, one primary per window
  (MIDI Map, Clip Maker, Lyrics → Rhythm, Session), MIDI Map / piano-roll separator / Session progress on tokens and the accent family,
  BlackSurfaces reads `background` shorthands with variables and treats the old blue-grey #223044 as a surface (chroma ≤ 36).
- Tool page In / out words now come from the music domain (ToolPage.ioWords) — the page stays domain-free (boundary test 10/10).
- 45 → 52 of 69 tools pass every rule. D4 (119 one-off buttons, nearly all play surfaces) waits for a kit Pad part.

## Done — 3.103 Black surfaces (2026-11-05)
Asked: "i dont like the tint. everything but the colors should be what they are. make them darker even. like black".
- Surface tokens neutral near-black in every theme (--bg #000 … --panel2 #0f0f0f, lines #1c1c1c/#282828, text greys neutral);
  --react-surface 0 (surfaces never lean); the Dusk sky overlay (.wm-dusk) off; button/toggle fills black (Field keeps clear buttons).
- canvas/runtime/black-surfaces.js: a surface = dark (max channel ≤ 80) and barely coloured (channels within 26) → neutral grey × 0.72.
  Applied to every stylesheet's backgrounds as it loads (same-origin: the app and the web build; file:// pages cannot read sheets),
  to inline backgrounds tools write (ui-kit hook), and to 2D-canvas fills/strokes/gradient stops inside windows and tool pages.
  Colours (bright, or dark but clearly coloured) are untouched. With Light over the tools on, drawings are left to the reactive colours.
- Measured (served build, every tool spawned): elements with a tinted dark background 1,000+ → 30. P103 3/3; P91 and P83 updated
  (they asserted the tint he asked to remove).

## Done — 3.102 Beat colour; phase 1 starts with filter-svf; tool pages; the dependency graph (2026-11-05)
Asked: "the ui is how i want it. except it the tool pages look horrible" · "that looks nice as hell. can you start on the phases" ·
"Everything turns the same colour and changes on the beat, built into the reactive colours you already have, with no restyle".
- Tool pages (PR #81): fixed size, compact head, no nested scroll, packs/controls/in-out readable; knob labels as wide as the knob needs.
- build/eco-graph.mjs → docs/eco-graph.md: the phases' dependency graph from the specs. filter-svf 35 · lfo 24 · pattern-store 23 · osc-va 20.
- components/filter-svf 1.0.0: Simper ZDF SVF kernel (modes LP HP BP notch peak bell low/high shelf all-pass; 1–3 stages), AudioWorklet
  'eravos-svf' built from the kernel's own text; MusicParts.svf(ac). Not used by any tool yet — its own canvas window waits for his OK.
- Reactive colours › Beat (sound-css.js 3.102): one colour (the theme's accents in turn) for every colour that IS a colour, stepped by
  transport:tick at the time it is heard; Changes on every beat / 2 beats / bar; Amount = the flash. Known leftover: colours a tool
  hard-codes outside the reactive variables (Wobble Bass's "Keep in range" button) keep their own.
- Tests: P101 2/2, P102 1/1, P77 updated for the new mode (7/7); P82's two failures exist on main before this change.
- Next: lfo (24 tools) as a component — extracted from the LFO tool, nulling — then osc-va, waveshaper, env-adsr.

## Done — P0.4 duplicate finder; P0.5 filter-formant (one mouth for Wobble Bass and Wub Filter) (2026-11-05)
Asked: "Begin. I was thinking of having tool groups as suites. Like how each system has its components … fluid and dynamic, deep and professional".
- build/duplicates.mjs: tokenises every tool's code (names/numbers normalised), finds windows shared across tools, grows them into
  blocks, splits code vs settings (repeated knob groups mark repeated parts) → docs/duplicates.md. ~9 % of tool code repeats.
- components/filter-formant: MusicParts.VOWELS (one table: OO OH AH EH EE UH AE IH ER YOI) · vowels(over) · formantBands · formantMorph ·
  formantSet. Wobble Bass and Wub Filter both use it. The copies had drifted (UH IH ER only in Wobble Bass, YOI only in Wub Filter, AE's
  third band −14 vs −12 dB). Wub Filter keeps its AE as an override so nothing it played changes — which AE is right is his call.
- Proof: filter-formant.test.mjs 5,220 checks (same graph, same connection order, same values for every vowel pair × shift × Q;
  mutation-checked: a Q law off by 1 % and a misrouted morph both fail it). Null render: Wobble Bass 38/38 PASS (−87.6 … −94.2 dB),
  Wub Filter 8/8 PASS (7 presets render differently from themselves even unchanged: unproven, listed). In-page: Wobble 39/39,
  Wub 59/59, P94 suite 2/2. tests/null-render.mjs: --record <tool> keeps every other tool's baseline (it used to wipe them).
- specs/eravos.suites.spec ADDENDUM 2026-11-05: systems all the way down, fluid not boxes (F1–F5).
- Next: Coven's vowels (its own 6-vowel table, gains not per band) · the grit shaper (Wobble Bass ⇄ Wub Sub) · the FM operator
  (Syn Osc ⇄ Wobble Bass) · Wub Osc ⇄ Wub Sub voice code · then Wobble Bass "Open as components".

## Done — delete packs, presets and patterns for good; Playwright gone (2026-11-04)
Asked: "i want to be able to delete packs, patterns" · "I don't need them brought back. some of them suck … dont sound good, or are blown"
· "remove playwright from eravos. thats what clearglass was for".
- ContentPacks.discard(id) / discardItem(id, tool, kind, name) (discardPreset): shipped packs and single items too, kept in
  localStorage `eravos.contentpacks.deleted.v1` (the app's .appdata, in the library) — a deleted pack is refused when it registers again.
  🗑 on every pack and × on every preset in ⚙ Packs & presets; 🗑 on packs and items (presets, kits …) on the tool page.
- PatternLibrary.discard(p) by content signature (ids move), `eravos.patterns.deleted.v1`; 🗑 on every pattern card (takes its curved twin).
- tests/p100-delete.test.js (3/3). P21 24/24 · P71 10/10 · P73 11/11 · P76 4/4 · P74 8/8 (its "completely different" audio check is
  flaky both before and after this change).
- host/driver/glass.js app mode: electron.launch({ executablePath, args, env }) → firstWindow() → page; dialogs (pg.on('dialog')).
  desktop/test/bare.mjs + skel.mjs and build/sound-audit.mjs use the driver; tests/no-playwright.mjs has no exceptions left.
- Open (asked, not done): songs as a rhythm-exploring tool only; per-tool patterns with presets, depth, curves and per-note editing.

## Done — install to the system in one run; your library is Documents\ERAVOS (2026-11-04)
Asked: "make the installer for installing to the system. also the projects should save to the … folder. same with the packs and
tools. like documents/eravos" · "this is on windows, one run install … make it a batch".
- **Install ERAVOS.bat** = one run: elevates, builds from the checkout (make-exe.ps1 -NoSetup), copies to Program Files\ERAVOS,
  all-users Start menu + desktop shortcuts, HKLM Settings › Apps entry (uninstall.ps1), starts ERAVOS un-elevated (via Explorer).
  Outside a checkout: the release's ERAVOS-Setup exe, else its zip. Tidies the old %LOCALAPPDATA% per-user copy.
- **ERAVOS-Setup-<version>.exe** (packaging/windows/eravos.nsi, NSIS): made by make-exe.ps1 when NSIS is present; release.yml installs
  NSIS and attaches it next to the zip. Compiles with makensis 3.09 here (not run on Windows here).
- **Library** (desktop/main.js): Documents\ERAVOS\{projects, exports, packs, tools, drop, .appdata}. Downloads route: *.pack.json →
  packs, other .json → projects, the rest → exports. packs\*.zip and tools\*.zip load every start. Old folders beside the exe or in
  %LOCALAPPDATA%\Programs\ERAVOS (and "ERAVOS Library") move in once, only into empty folders. ERAVOS_LIBRARY or a `portable` file override.
- **Updater**: an installed copy downloads the new Setup and runs it /S elevated; a Program Files copy without one swaps the zip elevated.
- Not run on Windows here: the scripts parse (PowerShell 7 parser), the library move was exercised with a stubbed Electron.

## Done — P0.3 note-release and progression (2026-11-04)
Asked: "Boring shit first I guess" → the repeated bookkeeping. Two more components, five + three tools rewired, nothing in sound changed.
- tools/music/components/note-release/: `MusicParts.releaseHeld` (wobble-bass = wub-osc = wub-sub, one held note) and `releaseVoices`
  (syn-osc = syn-partials, a voice pool). 102 checks: the recorded AudioParam calls equal the five original noteOff()s, with and without
  cancelAndHoldAtTime, for held / other / no note, t undefined..9.25, three release times.
- tools/music/components/progression/: `PROGRESSIONS` (the five), `pickProgressions`, `degreeAt` — the table and lookup that bass-gen,
  chord-gen and edm-lab each carried (EDM Lab offers four of the five, so it takes `pickProgressions` and its menu is unchanged).
  13,826 checks: every progression × bars 0–255 × chordBars {1,2,4} as number and string equals the originals.
- `node tests/components.mjs` runs every component's node test (+ the null-render maths); release.yml runs it before building.
- Loader order: tools/music/index.js loads the three components before any tool. Tool versions unchanged.
- Null render (needs the browser, not run here): same method as P0.1 — the originals of the eight engine files + index.js, `--record`,
  then these, check. Expect every preset of wobble-bass, wub-osc, wub-sub, syn-osc, syn-partials, bass-gen, chord-gen, edm-lab to PASS.
- Next: the scan was crude. A proper duplicate finder (normalised token windows across ALL engine/ui files) before P0.4, then pick the
  biggest identical blocks, not the ones that happened to be named alike.

## Done — P0.2 survey: there is no SVF to extract; phaseWave joined wave-table (2026-11-04)
Asked: "Yes" (to P0.2 filter-svf). The survey (tools/music/tools/**/*.engine.js) found NO state-variable filter code: every filter is a
native BiquadFilterNode (125 createBiquadFilter calls); fx-filter and wub-filter each cascade two for 12/24 dB, but with different Q
laws (fx-filter's 3.37 RCA fix) and different wiring, so there is nothing identical to move "with no change in sound". The spec's
filter-svf (12/24/36 dB, key-track, env/velocity inputs, stable to self-oscillation) is NEW DSP: it belongs to phase 1 as a build with
its own tests, not a phase 0 extraction. Same likely for osc-va (polyBLEP/minBLEP) — check before promising it.
- What IS duplicated, byte for byte (crude scan of engine files, so a floor, not a census): phaseWave (fx-moddelay = fx-phaser) → now
  MusicParts.phaseWave in components/wave-table (83 checks, bit-identical to the original). Still to do: noteOff in wobble-bass = wub-osc
  = wub-sub (318 chars, closes over each tool's voices — needs a voice-table part first), noteOff in syn-osc = syn-partials, ownDegree
  in bass-gen = chord-gen.
- Next: P0.3 the voice table (noteOn/noteOff bookkeeping the wub tools and syn tools repeat) — look at all of them before cutting.

## Done — P0.1 the first component: wave-table (2026-11-04)
Asked: "Okay next". The LFO and Wub Rate each carried the same makeWave(); it is now ONE component, tools/music/components/wave-table/
(wave-table.js · .spec · .test.mjs), loaded by tools/music/index.js before any tool (it also lands in the core pack of desktop/packs.mjs,
which reads that list). `MusicParts.periodicWave(ac, fn, { phase, harmonics })`.
- Each tool keeps what is its own: the LFO its 33 harmonics and degrees, Wub Rate its 40 and a fractional phase; their shape functions
  differ on purpose (sine vs −cos) and stay in the tools. Same arithmetic, same order → no change in sound.
- PROVED in plain node (73 checks): the component's re/im/dc equal the two original inline functions bit for bit for 6 shapes × 7 LFO
  phases and 5 Wub Rate phases. `node tools/music/components/wave-table/wave-table.test.mjs` (also in release.yml).
- NOT yet proved at the audio level (no browser here): to run the null render, copy lfo.engine.js, wub-rate.engine.js and
  tools/music/index.js from your ORIGINAL Eravos-Canvas-main.zip over this tree, `node tests/null-render.mjs --record`, put these three
  files back, then `node tests/null-render.mjs`. Expect every eravos.lfo / eravos.wub-rate preset PASS. Tool versions unchanged.
- Left alone on purpose: eravos.wobble-bass (Lanczos-windowed, 64 harmonics) and eravos.bass-forge compute their waves differently;
  merging them would change sound, so each waits for its own null proof (listed in wave-table.spec `not_used_by_yet`).
- Next: P0.2 filter-svf (find every tool that carries its own state-variable filter first), then osc-va.

## Done — Phase 0 start: the null-render harness (2026-11-04)
Asked: "What first?" → "Do it". The ecosystem plan (eravos.music-ecosystem, phase 0) moves shared parts into components with no change in
sound, each move proved by null renders. That proof needed a tool; this is it.
- `node tests/null-render.mjs --record` (BEFORE a change) renders every music tool × preset with a seeded stimulus (Math.random seeded
  in the page; effects get a fixed saw + noise; instruments a fixed note/chord run; drums their four pads; beat tools one bar), twice,
  and keeps it in tests/null-baseline/ (gitignored). `node tests/null-render.mjs` (AFTER) subtracts: PASS under −60 dB re the baseline
  RMS (`--db -70` stricter). Length change, NaN, a missing baseline all FAIL. Renders that differ from themselves are UNSTABLE and are
  listed, never passed; tools it cannot stimulate (drop, sampler, one-shots, containers, clip) are listed as NOT COVERED.
- The maths is tests/null-render-core.mjs, checked in plain node without a browser: `node tests/null-render-core.test.mjs` → 17 checks
  (round trip at −50 dBFS, 0.2 % gain = −54 dB fails, 0.05 % = −66 dB passes, a one-sample shift fails, NaN, silence, unstable).
- NOT YET RUN against the real tools: the build sandbox had no Chromium/Electron. First run on your machine: `--record` on this commit,
  read the UNSTABLE / NOT COVERED lists, then start extraction (LFO first, then filter-svf, osc-va).
- IN THE INSTALL (same day, "Add it to the install"): `Null Render.bat` (record / check menu) beside Start ERAVOS; both builders ship
  `tests/` (860 KB; `null-baseline/` and `out/` are never shipped) and make-exe.ps1 now ships `host/` too (the driver lives there;
  desktop/build.mjs already did). host/driver/glass.js finds Edge/Chrome on Windows and Chrome/Edge on macOS when there is no
  Electron beside it. release.yml runs `node tests/null-render-core.test.mjs` before building. README has a Null Render section.
  NOT TESTED on Windows (no Windows/browser here): the Edge path through the Chromium engine of host/driver/glass.js is the part to
  watch on first run — if it fails, set GLASS_CHROMIUM to a Chrome/Edge .exe and send the message.
- Next: P0.1 LFO → tools/music/components/lfo/ (spec, test, null-proven), then filter-svf, osc-va; perf gate in CI after.

## Done — 3.100 The Field flows (2026-11-03)
Asked: "can you have the gradient like slowly moving slowly with that theme?"
- The Field's colours travel along it, one pass in 48 s, then back (a mirrored run: no seam). Still when reduced motion is asked.
- Positions are measured only when something moves; the flow just recolours from them ~10×/s: 1.0 ms a step for 339 accents.
- p91 checks it. 1355/1355.

## Done — 3.99 An installer, and an update service that checks GitHub and asks with a toast (2026-11-03)
Asked: "an installer for eravos with an update service to check GitHub for updates with a toast asking to update it".
- Install ERAVOS.bat → packaging/windows/install.ps1: the newest GitHub release (or the local dist build) into
  %LOCALAPPDATA%\Programs\ERAVOS, no admin; Start menu + desktop shortcuts; Settings › Apps entry; uninstall.ps1 (asks before deleting
  your work). Your folders (projects, exports, drop, packs, .appdata) are never replaced.
- desktop/updater.js: GitHub's latest release at start + every 6 h; newer than the app → the page's toast (canvas/runtime/updates.js):
  Update now · What's new · Later (remembered per version); ⋯ Options › Check for updates. Update now downloads ERAVOS_<v>.zip, waits
  for ERAVOS to close, swaps the app files (not yours) and restarts it. No zip or not Windows → the release page.
- .github/workflows/release.yml: a tag vX.Y.Z (matching desktop/package.json) builds the Windows zip and attaches it to the release.
  make-exe.ps1 gained -NoStart and ships updater.js and uninstall.ps1.
- Not run here: the PowerShell scripts and the workflow need Windows/GitHub (this machine is Linux) — the page side is tested (p99).
  No release has a zip yet: the first one appears when a v0.2.0 tag is pushed. 1355/1355.

## Done — 3.98 The Field theme: clear buttons, one gradient under the canvas seen only through the accents (2026-11-03)
Asked: "a layer above the canvas is a gradient that's invisible except for where the accents are … if you drag the tools around, it
changes the colors in relation to where it's at" · "I want this a theme. Like they're clear" · "The canvas gradient is stationary so
moving the tool shows the gradient" · "I want changing to sync them all, and change with the sounds" · "darker so it contrasts".
- Themes → Field: deep black surfaces; buttons are clear (a border and a label only).
- canvas/runtime/colour-field.js: one gradient (violet → magenta → rose → ember → gold) pinned to the canvas. Every accent takes the
  colours under its left, middle and right; a window's drawn colour is the one under its middle. Measured: dragging the Wobble Bass
  took it from rose (#ff714f) to gold (#ffb749).
- Synced: the reactive colours turn and light the whole field at once (--snd-hn, --snd-lv), in both ways of drawing; Off keeps it still.
- A CSS fixed background cannot do this: inside the canvas's transform it is measured from each element (tested).
- Tests p91 (Field) and p82 follow. 1353/1353.
- Next asked: an installer for ERAVOS with an update service that checks GitHub and asks with a toast.

## Done — 3.97 A window's glow stays behind the windows in front of it (2026-11-03)
Asked: "the border should not be showing above tools that are above them". The reactive glow on each window's edge is drawn on one GPU
layer over the whole page, so a lower window's edge was drawn straight through the window in front of it (and under the dock).
- GlassLayer: a light has a z and a clip; a layer's cover() names what sits in front. Lights are drawn back to front and what covers each
  is cut out of it. The washes are drawn behind.
- Reactive colours: each window's glow has its window's z and stays inside the canvas; every window is a cover.
- Test in p82. 1352/1352.

## Done — 3.96 Buttons: less round, a reactive border, reactive labels — everywhere (2026-11-03)
Asked: "The buttons are horrible looking. Less round and the border" · "All the colors are meant to be reactive. The UIs. The tools. The
button contents and their border. The tool pages."
- Dusk buttons, segments and fields are soft rectangles (10 px, 8 px fields) instead of pills, with a visible gradient border.
- The border, the label and the icon come from the reactive accent: --dk2…4 now lean 40–45 % on --acc (were 18–25 %), the label is the
  accent mixed into the text. In a window it is the window's own accent; outside (toolbar, tool pages) the page's.
- Glass mode (the default way of drawing) no longer stops the page accents: before, the toolbar and tool pages never moved. The glass
  layer still owns the surfaces. Measured while the suite plays: toolbar text and the Wobble Bass button text change every 0.45 s.
- p82 and p91 follow. 1351/1351.

## Done — 3.93–3.95 The roll opens on your notes · knobs turn from anywhere · the Wobble Bass Suite, all wired · windows fit what they hold (2026-11-03)
Asked: "editing per note on the timeline isn't working" · "they all need to be able to adjust knobs and dials, in real time, also on
the sequencer, the knobs need to work" · "i like the wobble bass … maybe make it a suite. with all of the enhancements you did" · "all the
pieces of the wobble base wire together." · "Also the sizing".
- 3.93 The Timeline's piano roll opens centred on its notes and is never a sliver (min 320 px); it keeps them in view until you scroll.
- 3.94 A knob drags from anywhere on it (ring, value, name). Before, only the ring listened, so a grab on the value or a few pixels off an
  18 px lane knob did nothing. Measured in the Sequencer: Lane volume 1 → 0.96, Evolve 0 → 0.04, Swing 0 → 0.22, each live. The lane's
  evolve knob is named "Evolve".
- 3.95 Wobble Bass Suite (tools/music/suites/wobble-suite): Groove → Drum Forge (Dubstep · Heavy) and → Bassline; Chords → Bassline; one
  Bassline line plays the Wobble Bass, a Bass Forge growl and a Sub Engine. Wub Rate opens the wobble and pumps the growl; an Envelope
  opens the FM; a slow LFO bends the wobble rate; Destroyer + squash inside the growl. 12 parts, 10 wires, 5 scenes, macros WOBBLE ·
  GROWL · GRIT · WEIGHT. Test p94.
- 3.95 Sizing: a window opens big enough for its content, up to 1400 × 1200, whatever the screen shows. It used to stop at the visible
  canvas, so with the dock open every tall tool came out about 600 px tall and scrolling (Wobble Bass 588 for 1131 of content).
- 1351/1351.

## Done — 3.92 Your songs back in Songs · every pattern novel · the Patterns tool list fixed (2026-11-01)
Asked (on screenshots of the Patterns page and the old Songs cards "Floor Falls Out", "Sub Dive City"): "this looks bad. can you recover
those? those are my rythme. can you make sure all the patterns are novel. also fix the catagories".
- Songs: the page is back as it was before 3.86 — every song on its shelf (Heavy Drops 9, Floor Falls …), the map and ▶ Preview, Write,
  Make it yours — with 📖 My songs holding what you saved and now also what you export (marked saved / exported). The blocks stay in Patterns.
- Novel: a pattern whose hits are 85 % another's (same tool and kind, same steps and pitches) is not kept — 5 269 → 3 288 in the library;
  drums 865 → 185. A line's curved twin (3.74, "· curved") is no longer a card of its own: 〰 on the line's card turns it on — the page
  shows 1 959 ideas. Found on the way: ids were given before the pass and again after it, so a twin could carry a kept line's id (fixed).
- Categories: the tool list named tools not yet loaded by their id ("eravos.drum-forge"); it asks the catalogue now — names, icons, and
  each tool in its group (Drums · Bass · Keys & pads · Leads · More).
- Tests: p42, p44, p19 back to the songs page; p58 gets its strip test back; p86 and p73 follow; p91 new (themes, reset, prune, graph).
  The test page measures in the Studio look (themes are tested in p91). 1344/1344.

## Done — 3.91 Themes (Dusk · Studio · Midnight) · beautiful buttons · a dependency graph · Clear takes the dependencies too (2026-11-01)
Asked: "the colors inside the tools … look at the buttons, looks bad. please make those themes. and hook into the reactive. make all the
buttons beautiful. make a themes section in the settings. make a dependancy graph. also when clearing the canvas should remove all
dependancies."
- Themes (canvas/runtime/themes.js, ⋯ Options → Theme): Dusk (default: sunset, round pill buttons, the tool's painting in its title
  bar), Studio (the device look as it was), Midnight (calm graphite). Each sets how far reactive colours may tint surfaces.
- Dependencies (canvas/runtime/dep-graph.js, ⋯ Options → Dependencies): domains → modes → parts built → tools, wires as arcs; parts
  nothing needs drawn faded; Remove what nothing needs (Expansion.prune) · Clear everything.
- Clear canvas now also takes away what the tools brought: Expansion records what each unit adds (slot elements, keys) — teardown,
  reset, prune, graph. Measured: 8 toolbar parts and 1 mode built → 0 and 0 after Clear; only Start and Add left.
- Also merged PR #61 (3.86–3.88) into main.
## Done — 3.90 🎧 Hear by place (2026-11-01)
His words: "what about a setting to play tools in proximity also zooming out makes it quiter."
- ⋯ Options › 🎧 Hear by place (off by default, remembered). On, the canvas is a room you look into: a tool that makes sound is full in
  the middle of the view, fades smoothly to a whisper (−22 dB) well off screen, and pans with where its window sits (up to 60 %); zooming
  out quietens every one (≈ −6 dB at 50 %, −10 dB at 25 %). Effects are left alone (they pass on what feeds them, already placed).
- How: core/proximity.js moves a PLACE stage (a gain and a balance before each source's trim), built only the first time it is on
  (core/audio.js audio.placeStage) — off, no tool gets an extra node. Window rectangles read ~12×/s, all reads before any write.
- Caught on the way (tests/p42, her voice 0.04 dB under its floor): a StereoPanner at centre is −3 dB per side on a mono tool. The
  balance is the mixer strip's (unity at centre) and the stage is lazy.
- Tests: tests/p90-hear-by-place.test.js (2). P14, P21, P42, P62 pass.

## Done — 3.89b ✎ A pattern opens in the piano roll (2026-11-01)
His words: "the per note editing with the timeline, why not utilize that for the patterns. it also doesn't seem to work. per notes."
- Patterns › ✎ Edit notes (every card with notes): the pattern goes on the Timeline, the Timeline comes forward and the clip opens in its
  piano roll — click a note there for its own knobs, bend and curves. Timeline view.openClip(id); PatternLibrary.edit(p).
- "doesn't seem to work", checked in the real app on Dubstep #77: playback applies a note's own knob (Supersaw cutoff 7000 → 300 for that
  note only, then back); clicking a note opens its editor (Start, Length, Pitch, Velocity, Bend, then the tool's knobs). Not yet found
  what failed for him: the editor sits in a short strip under the grid and the tool's knobs are below its fold. Asked.
- Tests: p76 +1 (Edit notes opens that clip in the piano roll; a note carries its own knob).

## Done — 3.89 The flood behind the problems log, fixed at its cause (2026-11-01)
His words, on a screenshot: "this needs a way to close it. its stuck right now" — a wall of "That item doesn't exist any more" ·
MUTATION_001 readParam: reese-bass-3-k07 not found. (The other session's 3.87 made the log close and fold repeats; this is why it filled.)
- Closing a tool removed its param reader, then rolled back its changes, then removed its record. The rollback wakes listeners (the
  Timeline lists every knob of its tracks' tools): in between, the tool looked present but could not be read — one fault per knob, per
  listener. The kernel now rolls back first; the reader and the record go together.
- tests/kernel.test.js: a listener woken by the rollback reads the closing tool — fails on the old order, passes now.

## Done — 3.88 A painting for every tool: the ＋ Add cards and the tool pages (2026-11-01)
Asked: "make more artwork like this. for each thumbnail" · "what about the catalogs and tool pages" · "first the cards".
- 69 tools, each a small animated painting of what it does (build/tool-art.py): an anvil and sparks for the forges, a storm for the
  Destroyer, ripples for the echoes, aurora curtains for the filters, a rising moon for the subs, a cathedral for the organs, a synthwave
  sun for Retro Poly, standing stones for the drums, a campfire for Groove, a waterfall over a cliff for the Drop Builder … each lit in its
  own accent, under a sky (night, dusk, sunset, dawn, aurora, violet), with Bob Ross mountains and pines. Still for reduced motion.
- tools/<domain>/tools/<cat>/<tool>/art.svg, tool.json files.art (schema), carried by the catalogue; ＋ Add's card leads with it, the
  tool page's header shows it in place of the icon tile. thumb.png stays (the side preview shows the tool's real display).
- Also: merged main (3.82–3.85, the other session) — Patterns by tool kept, song blocks kept; this branch's 3.82/3.83 renamed 3.86/3.87.

## Done — 3.87 Problems panel closes · sunset gradients (DUSK) in every window (2026-11-01)
Asked: "this needs to be able to close" (the problems log, a wall of one entry) · "can you make the ui more like that also? like
with the wobble base. like have the colors more a gradient animated, beautiful, like love the sunset one".
- Problems: a header (count, Clear, × / Esc / click outside); the same problem again is one line ×N. Found: the Timeline read every
  setting of a removed tool on each refresh, one fault each — the kernel now says a missing reader once per reader and tool.
- DUSK: every accent flows slowly from the tool's own colour into sunset rose, amber and violet (window edge and title, chosen options,
  primary buttons, toggles, faders, each knob's arc); spectra and the 3.79 tools' displays draw in a moving sunset (UI.dusk); a
  screen-blended dusk light over each window (.wm-dusk). Mixed from --acc, so reactive colours still move it; still for reduced motion.

## Done — 3.86 Songs in blocks (Patterns) · Songs = your saved and exported songs · a painting on every Start tile (2026-10-31)
Asked: "i want the songs broken into patterns, and moved to the patterns menu, piece by piece, sorted by instrument, like blocks, or
units, then the songs library is for saved or export songs" · "can you make the rest of it like that" (the Start screen's paintings).
- Patterns: all 308 named songs taken apart — each instrument, each section a block (≈ 5 300 patterns). Instrument chips; sections by
  instrument by default; "Sections: song" with ▶ Whole song on each song. Blocks say their song.
- Songs: only yours — saved and exported (Export now keeps the song there too), with a way to the built-in songs' blocks.
- Start: 13 paintings (starry nights, Bob Ross mountains, RPG camp, observatory, alchemist tower, treasure chest …) on every tile.
- Tests: p82 new; six older tests moved to the new layout (the catalogue they clicked through is now in Patterns).
Specs: pattern-library and themes addenda.

## Done — 3.85 🧩 The Patterns page by tool (2026-11-01)
His words, on a screenshot of the page: "can you clean up the pattern ui, sort it by tool instead? its overwhelming."
- The tools down the left (grouped Drums · Bass · Keys & pads · Leads · More, each with its count, plus Every tool). Pick one: only its
  patterns, by kind (Kind chips show only the kinds it has), a line on the kind you pick, one genre menu (its genres only).
- Opens on one tool — the one with the most patterns the first time, then the one you last picked — not the 2190-pattern wall.
- Quick picks, genre families, BPM, sort, sections, fold all and clear fold away under ⚙ More filters (remembered). Nothing removed.
- Cards on a tool's view say the preset, not the tool's name again.
- Tests: p76 (+1: opens on one tool, rail, only its patterns, filters folded); p71, p73 open Every tool first (they test that view).

## Done — 3.84 〰 Changing follows the sound, only the sound (2026-11-01)
His words: "the colors for the knobs, sliders all the colors of each tool ui is supposed to be reactive, also the changing setting is
supposed to change the color based on the sound."
- Found: the tools' own colours already react since 3.83 (another session; seen here: knobs, keys, panels, displays). Changing did not
  follow the sound: (1) a clock in it — a ±40° sine drift app-wide and ±45° per window, moving with nothing changing (tests/p84: the same
  sound read 100 times drifted −68° → −16°); (2) each tool's brightness came from the byte spectrum, whose floor counts every empty bin,
  so every tool read "bright": a low and a high note on Supersaw sat 24° apart.
- Now: no clock. Each tool's turn is where its sound sits, weighted by energy, on the ear's scale (128 Hz → −150°, 4 kHz → +150°), plus
  a kick on each hit; steps of 6°. Supersaw: a low note amber (−150°), a middle note cyan (−6°), a high note pink (+144°).
- Measured (build/perf-ui.mjs): GPU layer Changing 25.5 → 34.2 fps (6° steps repeat colours more), Static 43.3.
- Tests: tests/p84-changing-follows-sound.test.js (fails on the old code, passes now). P77, P83, P82, P73, P58 pass.

## Mapped — packs are full sound packs; tools get full depth (2026-10-31)
His words: "no it should be a pack. like full packs, are packs of sounds for tools. like tools should should have more power, like
wobble bass, full range of depth in all aspects." Packs: one pack of sounds across every tool it fits (genre-packs.spec, first section
reinstated, third addendum). Power: specs/eravos.tool-depth.spec, Wobble Bass audited first (source, filter, wobble, growl, drive,
envelope, stereo, output). Nothing built.

## Mapped — packs as DLC (2026-10-31)
His words: "i want sound packs to be like dlc in a way. each pack adds new sounds or capabilities." specs/eravos.genre-packs.spec
addendum: a DLC must add new sounds (measured apart) or new tools; presets only ride along. On disk tools/<domain>/packs/<id>/ with
dlc.json, sounds/, tools/, content/; a Packs store page with art, numbers, a demo and Install / Uninstall. Phases DLC1–DLC4, Synthwave
first (its drum sounds + new Gated Reverb, FM Keys, Ensemble Chorus). Nothing built.

## Mapped — themes, honestly · genre packs across tools (2026-10-26)
His words: "okay, what happened to theme? also all the packs were supposed to be additive, like synthwave in relation to the tools.
like find all tools for it. bass tools. synthesis. etc". Theme: P69.1 was never built, and the look kit (5697b50, 95614cb, merged in
PR #48) changed the default look directly, against the theme rule. specs/eravos.themes.spec addendum: three themes (Classic = the look
before the kit, Studio = the kit, v10), default his call. Packs: specs/eravos.genre-packs.spec: a genre pack is one id adding to every
tool that fits, with a page listing its tools by category, its sounds, patterns, songs, suites, the missing tools, and Build the rig.

## Done — 3.82 🔮 Step 2: a Looking Glass layer inside the canvas · reactive colours drawn on it (2026-10-31)
His words: "What about this for the canvas?" (the Looking Glass bundle, SPEC v0.3) · "what would that do?" · "move to main. get to step 2".
Map: specs/eravos.2026-10-22-brainstorm.map.spec, addendum 2026-10-31 (A2b). Step 1 (SISO the canvas) stays mapped: step 2 does not need it.
- **canvas/runtime/glass-layer.js** (domain-free), Looking Glass's model in the browser: elements as typed data ('wash', 'glow' on a page
  element), variables any prop can bind to, layers made on first use and removed when empty, values that ease every display frame, and a
  motion budget (at rest it clears once and stops asking for frames). Two renderers on the same data: a 2D canvas (default) and WebGPU in
  WGSL — the shader language of wgpu, so the shader carries into the native Looking Glass.
- **Reactive colours › Draw with: GPU layer (default) · Page** (3.80 as it was). On the layer the mix tints the canvas and every sounding
  window glows in its own colour; nothing on the page is written while it plays (tests/p82 watches every style change).
- **Measured** (build/perf-ui.mjs, Dubstep #77 playing, 8 windows; this run): Page 19 fps (style recalc 4.05 s) · GPU layer Static 52 fps
  (0.16 s) · Changing 44.8 · Off 54.8. Before 3.82, main measured Static 6.8 fps.
- **What it taught** (measure, don't guess): a 'screen' blend made the browser re-blend the whole page every frame (13 fps) → normal
  blending. A blur drawn every frame cost ~20 fps → each glow is drawn once into a cached sprite and stamped. WebGPU: this test machine's
  software GPU never shows a WebGPU canvas (not even a plain red clear), so it is not verified here: the 2D canvas is the default and
  "try WebGPU" in the panel switches (remembered) — for his machine with a real graphics card.
- Trade-off, his to weigh: the GPU layer lights windows and the canvas, not each colour inside a tool (a pad's own colour, a knob's
  accent) the way Page does. That needs step A2 (tool faces as typed data).
- Mistakes on the way, caught by tests: a comment inserted mid-line swallowed the rest of a test line; a header inserted inside an
  existing comment broke a test file. Both fixed before commit.
- Tests: tests/p82-glass-layer.test.js (4). P77, P73, P58 set Draw with: Page (they test the page way). P48, P76, boundary pass.
## Done — 3.81 The featured songs' pictures: small paintings, not emoji (2026-10-31)
Asked: "the icons look cheap and childish. make them beautiful and creative, rpg, starry night, bob ross, star gazin".
tools/music/data/featured-art.js (window.FeaturedArt, SVG, loaded before recipes.js): "Make a song for her" — a starry night with Van
Gogh swirls, a heart in the stars, a haloed crescent moon, layered mountains with snow caps and happy little trees, two on a hill with a
telescope; "Future Bass song" — dawn over a still lake, the last stars, the music as an aurora, the sun's path on the water, reeds on
the shore. Unframed, soft corners (a gilded frame was tried and taken off — asked). Start is a round pill in the dawn colours. Stars twinkle, the swirls and aurora flow, the lake shimmers (still for
reduced motion). A featured recipe may now carry `art` (an SVG string); the Start screen shows it in place of the icon. The two cards
stack one per row unless the screen is wide enough for both.

## Done — 3.80 Reactive colours on every surface · the featured songs in Vagal's colours (2026-10-31)
Asked: "the themes aren't working … i love what's in the menu, but nothing in the actual theme changes, and it's supposed to be all the
colors in the canvas, tools, ui, anywhere" · "remake those pink sections" (Vagal colours).
- Found: the modes worked, but only on accents and on a tool's own sound; the Emerge canvas in the screenshot was silent (no clip in its
  Sample Player), so nothing moved. Now the surfaces react with the mix too: background, canvas grid, panels, every tool's chassis and
  wells, lines and dim text lean toward the mode's colour of the moment, each by its own share, and come back exactly in silence / Off.
  The canvas dots got a token (--grid, same colour). Test in p77. Spec: eravos.themes addendum.
- Start: the two featured song cards rebuilt in Vagal's violet in the device look — side by side, icon in a well, a Start pill, a
  breathing glow that also follows the sound.

## Done — 3.79 Bassline, Bass Forge and Drum Forge the Groove way (2026-10-31)
Asked: "bassline. bass forge, then drum forge" — map T1, T4, T3 (specs/eravos.quality-and-tools-map.spec). Each: perform: true (Motion +
Perform tabs), its window rebuilt in the look kit, deeper controls on its page, defaults that sound / play exactly as before (tested).
- Bassline 1.1: slides with a chance, ghost notes, octave jumps, movement (the fifth, a step toward the next chord), humanize, accent,
  follow, seed; a 16-step lane (level, octave, slide per step) on its Steps tab; the window's LINE screen draws the last two bars as played.
- Bass Forge 1.1: talk (velocity → how far the LFO moves), velocity → brightness, LFO start phase, free-running LFO; the LFO is a mod out;
  the window's TALK: a live trace of the LFO and six stage faders with meters lit by what the LFO does now; Sound rack and Match tab
  (the reference against the forge, measure by measure, and the distance per try).
- Drum Forge 1.1: per pad a drawn pitch drop (drag start / end / bend), noise and click lengths, its own filter; the kit's velocity → tone;
  pad edits held to their ranges (they were not); Layers and Mix (a strip per pad) tabs; knobs made once and set to the chosen pad.
- Found and fixed on the way: Bass Forge restarted its LFO when the start phase was set (now only a free LFO does); the drum pad filter
  is chained after the velocity low-pass (a test holds both on).
Tests: bass-gen 6, bass-forge 6, drum-forge 5 new. Specs: an addendum in each tool's .spec; the map marks T1, T3, T4 built.

## Mapped — what is left of the motion / look / reactive / sound-quality line (2026-10-30)
His words: "merge and push, then map the rest. make sure you update and add addendums to the specs." Map: specs/eravos.quality-and-tools-map.spec
(no release number — IDs that take the next free number when built, since the two sessions' numbers collide): Q sound quality (Q1 Wub
Filter intermodulation · Q2 CPU of Pad Forge, Gothic Organ, Xen, Partials, Coven, Morph Osc, Retro Poly · Q3 tails · Q4 Channel DC · Q5 the
sound audit as a test gate · Q6 the borderline p74b test · Q7 the Core zip URL) · T the other eleven tools the Groove way (Bassline, Chords,
Drum Forge, Bass Forge, FX Box, Drop Builder, Sidechain, EQ, Breath, Embodiment, Recursive Spectra, Automation) · R reactive leftovers ·
P packaging · D his decisions. Spec addenda: motion, tool-pages, themes, pack.format, performance, p42-tool-audio, pattern-library, codecs,
songbook-genres, phasemap. tests/p77: the per-tool Changing test plays a clap (bright and loud) — it was flaky with a quiet hat.

## Done — 3.78 Merge of 3.77 reactive modes with 3.76 · the same look at 2.3× the frame rate (2026-10-30)
His words: "merge and push." (main-37 zip = GitHub main 789bced, byte for byte.) Both sessions had rebuilt reactive colours. Kept: 3.77's
Off · Static · Changing · Custom and its panel (his request, newer). Dropped: 3.76's Calm / Full modes and glow layer.
- **Still laggy, measured** (build/perf-ui.mjs, Dubstep #77 playing, 8 windows): 3.77 Static 15.5 fps, Changing 13.2 fps, Off 57.8.
  Every write of a colour variable restyles what is under it; three kinds were written 30×/s (page palette, window level, element colours).
  Removing any ONE left it slow; all three made 55 fps.
- **Now, same look**: the sound is still read 30×/s, colours are written on one frame per 80 ms; a value is written only when it moves a
  visible step (5 %); the page palette at most 10×/s; every window read before any is written. Static 35.8 fps · Changing 34.2 · Off 55.3.
  Outside the loop (liveAcc, restoreAcc, setMode, silence) writes are never skipped.
- Mistake on the way, caught by tests/p77: a comment placed mid-line silenced every element's colour inside windows. Fixed before commit.
- Tests: P77, P58, P73, P48, P76, P23, P71, boundary pass.

## Done — 3.77 Destroyer 2.1 · Reactive colours: modes, a real panel, per tool · a sound audit of every tool (2026-10-30)
His words: "DESTROYER needs refinement. its too deep … sounds like a blown speaker. also needs performance optimization" · "the inside of the
tools are supposed to react … have options for the reactive color, like changing, the way it is now lets call it static, and a way to
customize. also the option needs to work, it does nothing, when trying to disable" · "that panel, do it right this time" · "can you run tests
like that on all of them" · "give each tool the ability to adjust it … in the settings for each tool" · "the changing syncs all colors".
- **Destroyer 2.1**, measured with a loud 50 Hz + a quiet 1 kHz (what the bass does to the music): default −1.6 → −49 dB; presets −6 → −30,
  −14 → −63, −3 → −28 … The sub went through the shaper; now Low keep is on by default (100 Hz) and Tight 40 Hz, and every shipped preset
  keeps the sub clean except Total Destruction. The sub is as deep as dry. Stages that change nothing are out of the path (the crusher and
  its filters at 16 bits, the crossover with Low keep off, flat shelves): ~11 % less work. Its scope draws in the live colour and rests in
  silence.
- **Reactive colours**: Off · Static · Changing · Custom + Amount + your three colours (low end, top, hits) and palettes. Off was undone by
  an older layer (UI.alive, 6 tools) that never asked — it obeys now. Every colour inside a window reacts (any inline colour: a pad's --pc,
  a strip's colour …), drawn displays too. Changing is per tool: each turns by ITS own spectrum, hits and drift (a sub and drums no longer
  move together). The panel (core/react-panel.js): mode cards with live previews of the real colour code, a wide Amount, swatches and
  palettes; in ⋯ Options and in every tool's ⚙ settings (Follow the app, or its own — saved with the tool, it wins over the app's, even Off).
- **Sound audit** (build/sound-audit.mjs → docs/sound-audit.md): all 45 sound tools — effects: intermodulation, level change, DC, peak,
  CPU; instruments: peak, DC, energy under hearing, release tail, CPU. Fixed from it: Supersaw and Morph Osc clipped on a chord (+2.5 / +3
  dBFS) → a shared headroom stage (unity under −3 dBFS); Xen Synth (−0.2 dB: almost all its energy under 20 Hz) and Reese (−11 dB) → Keep in
  range; the same switch on Wobble Bass, Bass Forge, Wub Sub, Wub Osc. Still flagged, next: heavy CPU (Pad Forge, Xen,
  Gothic Organ, Partials, Coven, Morph Osc), long release tails (Pad Forge, Gothic Organ, Xen), Wub Filter intermodulation, Channel DC.
- Tests: Destroyer (3), p77 reactive modes (6), Wobble Bass / Reese keep-in-range.

## Done — 3.76 Deep Sub: the sub you can hear · one tool = one complete zip (2026-10-30)
His words: "push and commit and then give me the replacement. you know each tool is supposed to be bundled with its dag, tool file,
ui and packs, anything that tool uses and has, is its own zip."
- **Measured:** Deep Sub plays Octave −2 by default; on the notes the songs write its fundamental sat at 8–25 Hz in 53 of the 54 genres
  that use it, and its own Floor (24 Hz high-pass) cut that out — only the phantom harmonics were heard.
- **Deep Sub 1.1, Keep in range** (on by default): a note that would land under the floor is lifted by whole octaves to 30–60 Hz. Same note
  names, same line; off = 1.0 exactly. A1 in a song now sounds at 55 Hz (was 13.75 Hz, filtered away).
- **One tool = one zip, everything in it** (desktop/packs.mjs): the whole tool folder (tool.json, engine, ui, styles, spec, tests, every
  pack + its schema, pictures) and dag.json — the tool as a node: needs (core pack, units, tools, permissions), hooks in/out, works-with,
  load order, packs, every file with role + SHA-256. Only the engine/ui/packs scripts run on install; the rest travels with it.
  `node desktop/packs.mjs --tool eravos.sub-engine --out <dir>` builds just that tool. Checked: a bare canvas + Core zip + Deep Sub zip
  installs with no fault (v1.1.0, 14 presets, A1 → 55 Hz).
- Found, not fixed: installing the Core zip raises "Failed to construct 'URL'" from one core script evaluated from a blob (pre-existing).
## Done — 3.77b ♪ patterns sorted by genre · Mapped — notes: first song, his language's tools, mutation (2026-10-30)
His words: "Just need you to take notes." · "Can we have them sorted by genre." · "I have a coding language made, and would love a full tool
set for it." · "what if they could mutate?" · "My first song I made with it."
- **Done**: the ♪ patterns panel lists A–Z by genre with headings, and a genre picker. tests/p76 (extended).
- **Notes** (specs/eravos.2026-10-30-notes.map.spec): his first song "Today's going to ripple." measured (≈143.6 BPM, A minor, −12 LUFS,
  build → drop → floor-falls break → build → drop, twice); a tool set for his language (waiting on: which language, its grammar);
  mutation as interactive evolution on patterns (the kernel's ledger + constraints already exist). Nothing else built.

## Done — 3.76 ♪ Patterns per tool on the Timeline · Calm reactive colours (2026-10-30)
His words: "I need patterns per tool for the timeline. I want it to be easier to make and understand music … I get overwhelmed by too much
information or clutter. It's also laggy. I don't know why the ui keeps changing. It used to be nicer."
- **♪ patterns** on every instrument track (first after M · S): what fits that track's tool, one kind at a time with one line on what the
  kind is, five patterns (genres take turns), ▶ hear (off the canvas), ＋ add (after this track's last clip, in the song's key), ↻ five others.
  A tool with none of its own gets the kinds it can play, from other tools, and says so. PatternLibrary.forTool · send({ lane }).
- **The lag, measured** (build/perf-ui.mjs: Dubstep #77 playing, 8 windows, headless Chromium, 2 cores):
  reactive colours as they were: 15 fps, 91 of 92 frames slow, style recalc 5.08 s · off: 57 fps, 0.14 s.
  Cause: the palette and --snd-* written on <html> 30× a second restyle every element; window visibility read after style writes.
- **Superseded by 3.78** (Calm / Full removed in the merge; 3.77's modes kept, made faster). Was: ⋯ Options › Reactive colours cycles off · calm (default) · full. Calm: one glow layer per sounding window, moved by opacity only
  (compositor) = 55 fps. Full = the 3.73 look, unchanged (reads batched before writes). SoundCSS.set(true) still means full.
- **"The ui keeps changing"**: the colours pulsed with the music (calm stops that), and ~600 colours in CSS + ~1000 in tool JS are
  hard-coded, so restyles leak. Theme previews (7 looks × first screen, canvas, ＋ Add, tool page) rendered from the real app for his pick.
- Tests: tests/p76-patterns-per-tool.test.js (2); P23, P48, P58, P71, P73, boundary pass.

## Mapped — 3.75 Voice · Audio in/out · Suites as control surface · Genres that contrast EDM (2026-10-25)
His words: "t-pain like full autotune … production quality" · "Suites are supposed to be like the main control panel" · "no each
tool is sovereign" · "tools for voice. including settings for audio input and output like ableton or fruity loops but better" ·
"expanding to other genres … contrast edm" · "each part of a tool should be broken into it's capabilities or components and connect
to the control surface" · "update the specs. phase it all". Spec: specs/eravos.phase75-map.spec, phased 3.75 → 3.9x:
A (AudioIO, Options › Audio, Mic In / Audio Out) → V (Pitch Track, Scale Snap, Voice Shift → Autotune suite; De-esser, Rider,
Doubler, Space → Voice suite) → S (suite Panel as a synth face, macros on the Timeline) → C (existing tools into components) →
G (Keys, Guitar, Ensemble, Kits as components → genres that contrast EDM). Nothing built yet.

## Done — 3.74b 🥁 Drum packs that ADD their own sounds · Synthwave, the full range (2026-10-25)
His words: "also each pack for the dumpad needs to be completely different sounds. every pack needs to be additive." · "yes like there is
supposed to be full range of synthwave sounds and tools". Map: specs/eravos.phase74b-map.spec (numbered 3.74b because the other session's 3.75 map reserves 3.75–3.86).
- **Why, measured** on main: 13 packs, 51 kits, 816 pads, but only 51 distinct sounds, and 48 of them sat in 3 or more packs. A pack could
  only re-tune the Drum Machine's fixed models; 11 packs owned no sound of their own.
- **Now** a pack adds sounds as data (core/drum-recipes.js): layers of tone, noise, FM, metal, hand-claps and chords, with pitch drops and a
  GATED tail. The Drum Machine plays them next to its own models; another pack can never overwrite one. Old kits play exactly as before.
- **Synthwave** (data/drum-packs/synthwave.js): 22 sounds of its own — LinnDrum kick, snare, clap, hat · DMX kick, snare, open hat, cowbell ·
  Simmons kick, snare and the "pew" tom · the GATED-reverb snare, clap and crash · Syndrum · tambourine · cabasa · claves · the orchestra
  hit · a synth stab · a pulse bass hit. 4 kits: Neon Gated · Night Drive Simmons · DMX Outrun · Chrome Ballroom.
- **"Completely different" is a number**: each sound is rendered and fingerprinted (loudness over time + spectrum). Every Synthwave sound
  is at least 6 dB per feature from every other sound in the machine (the built-in models get as close as 3.2 to each other). On the first
  render 10 of 22 were too close; they were redesigned until all passed.
- **The tools**, inventoried (not built): synthwave has Retro Poly, Supersaw, Arp, Chords, Tape Echo, Mod Delay chorus, Phaser, a gate.
  Missing: a gated-reverb effect, FM keys (DX7 piano and bells), brass stabs, a vocoder, a standalone ensemble chorus. Your call on order.
- **Next** (P74b.3): the other 12 packs, one at a time, each with its own sounds under the same test.
- Tests: tests/p74b-drum-packs.test.js (4).

## Done — 3.74 📈 Curves in every genre (2026-10-25)
His words: "why doesn't the pattern library have more curves? like floor falls."
- **Why, measured** on main: the library is generated from the Song Engine, and only 3 of its 85 genres write curves (Heavy Drops, Arp &
  Motion, Floor Falls). That gave 16 curve patterns, and only 28 of 1253 note patterns bent or oscillated (4 genres).
- **Now** the library adds the curves itself, with Floor Falls Out's moves (data/curve-patterns.js, PatternLibrary.addTransform). Your
  songs are unchanged.
  - **"· curved" versions** of every bass, wobble and lead line:
    - a slide in from a 4th above;
    - a dive at each phrase's end (never under ~18 Hz);
    - wobbles get a rate per note and the speed-up into the turn (1/8 → 1/32);
    - leads glide into leaps and bloom a vibrato.
  - **Curve shapes** for every tool a genre plays: Riser +7 · Freefall −12 · Ripples · Filter opens · Filter closes, then rips open ·
    Depth swing (where the tool has those knobs).
  - Library: 1273 → 1967 patterns · curve patterns 16 → 79 · curved lines 28 → 659 · from 4 genres → all 85.
- Also: the P72 chain renders took ~22 s on main (64e3d99, before this change too), over the 20 s test limit; they get 60 s, noted in the
  test.
- Tests: tests/p74-curves-everywhere.test.js (4).

## Done — 3.73 🧩 Patterns page: families that fold, quick picks, sections (2026-10-24)
His words, on the page: "needs to be able to collapse tge catogaries. curves, deep drops. make it powerful." The ~90-genre wall is now 13
families, folded (caret opens one; the name picks the whole family); quick picks 🕳 Deep drops · 📈 Curves · 🔺 Tension · ⛓ Build → Drop ·
★ Favourites; types and genres multi-pick (shift-click adds); search words narrow; BPM range; sort; results in folding sections (by type,
family or genre) with "Show more"; folds, open families and favourites persist. Style unchanged. Spec: eravos.pattern-library.spec
(addendum 3.73). Tests: tests/p73-patterns-page.test.js.

## Done — 3.72 🔺 Tension & 💥 drops in the Pattern Library: build → pause → huge drop (2026-10-24)
His words: "curves, depth, deep bass, huge drop, contrast and a lot of tensnio'". The coder's reading (to confirm: it could also mean one
song): what the library gives next, measured on the render of each chain.
- **🔺 Tension** (8 patterns): a snare roll that speeds up from a whisper (1/4 → 1/64) · a kick that thins out to nothing · both
  together · a sub that rises out of the floor from bar 5 · a wobble that speeds up · a riser lead that climbs and bends up · curves: a
  riser (+12) and a filter that closes, then rips open on the last beat. Every build stops dead half a beat before the pause.
- **💥 Drops**:
  - the sub slams down from an octave above;
  - wobble hits, with a rate per note and a dive at the turn;
  - Raven Drop's Reese + sub stack;
  - half-time drums with the crash on the one;
  - the Wobble's depth swinging.
  - Every sub plays its real note (Octave 0, level 0.45), and no dive goes under ~18 Hz.
- **⛓ Build → Drop** (4 chains, one card each, one click to the Timeline, each part on its own track): 8 bars of tension → the pause (a
  Floor Falls move) → 4 bars of huge drop. The pause's dive is a pure sine (per-note Phantom 0, Drive 0, Click 0), so everything above
  the sub stops.
  - Measured on each chain: the build rises +5.5 dB. Contrast, pause against drop above 150 Hz: 24.4–32.3 dB. The drop's 30–60 Hz
    share: 9–11 %.
  - Honest: overall, the drop is no louder than the end of the build (the master limiter caps both near −9.5 dB). The drop's size is the
    contrast and the low end.
- Measuring it taught the design:
  - The first version had a 1.2 dB build and a 1 dB "pause" (a full-level sub dive is as loud as a drop). The build now starts quiet, the
    sub comes in halfway, and the pause is a hole above the sub.
  - The method is in tests/p72-tension-drops.test.js (its thresholds guard it).
- Library: types 🔺 Tension and ⛓ Build → Drop; PatternLibrary.addSource(fn) (a data file adds hand-made patterns).

## Done — 3.71 🧩 Pattern Library, first slice (2026-10-24, specs/eravos.pattern-library.spec addendum)
His words: "what about instead of so much songs, we have a pattern library" (10-23 too: "what about instead of so many songs, we have a
pattern library?"), then "continue". Decided by his axioms: the 8 Floor Falls songs are not put on the shelf, and their moves are the
library's first patterns (the songs' data is kept, §0.3).
- **Patterns** (toolbar → Patterns): 1256 of them from 85 genres, all generated from the Song Engine, so a new genre adds its own.
  - Types: Drums 344 · Bass 239 · Wobble 90 · Chords 190 · Lead 364 · Arp 2 · Drops 6 · Fills 8 · Curves 13.
  - A Drop is the bass in the pause. Floor Falls' four are named: The floor falls · Stairs down · Freefall · Rises from the floor.
  - A pattern keeps the timeline's own notes (bends, oscillation, per-note knobs such as the Wobble's rate), written relative to the
    key. That is the coder's amendment to the spec's step format, which could not hold them.
- **The page**: type chips × genre chips, search, a drawing on every card (notes, bends, curves).
  - ▶ renders it off the canvas (nothing changes on your canvas) and plays it.
  - → Timeline adds it to the track that plays that kind of tool (or a new track with the tool, its preset and settings), after what is
    already there, in your song's key. A curve lands under that track.
- Not yet (open): Send to the Sequencer / Wub Rate / Arp, Euclid, pattern packs + "Mine", "Open as patterns" on a song, drag a card onto a
  window. The genre chips are the 85 Song Engine genres until P69.2 (8 genres → subgenres) lands.
- Tests: tests/p71-pattern-library.test.js (5): ≥ 300 patterns · every type · the four drops and their bends · → Timeline (track, key, after,
  curve) · ▶ renders sound without touching the canvas · the page filters.
## Done — 3.73 Living UI · square pads · fluid · patterns that curve (2026-10-24)
His words: "make the accents, fonts, all of the accents use the event variable driven ui when sound plays. Like in the tools, the
ui, etc. Square pads. Make the ui completely dynamic and fluid. Also the patterns. Why do barely any of them curve?"
- **Why they didn't curve:** of 183 464 notes the 85 genres wrote, 0 had a per-note curve and 218 a bend — per-note curves came
  later and nothing wrote them. The Song Engine now plays every melodic part with movement chosen by role and section (bass:
  growl / talk / open / wobble deepens, a dive with a bend at the end of a drop; chords: swells and plucks, a chord moving as one;
  leads: glide-in bends and plucks) as Bézier arcs on the tool's own filter / drive / wobble knobs, centred on its preset. Now
  36 908 curved notes and 5 060 bends, in all 85 genres; drums stay straight. Seeded apart: the notes are identical (the old
  golden hashes match with curve: false); a genre or part can opt out.
- **Sound everywhere:** one level per place (--lvl: the mix, or a window's own sound — a window with no sound follows the tools
  it plays, else the mix); accent text glows, labels/values warm toward the accent, LCDs flare, panel edges and drawn displays
  light. Window meters follow peaks (a drum hit shows), up fast, down slow.
- **Square pads:** Drum Machine, Drum Forge, FX Box, Glitch, Dub Station.
- **Fluid:** values set from outside glide (presets sweep the knobs); keys, strips and faders ease; tabs and pages slide in; new
  windows fade in; sections reflow to their room (container queries). Reduced motion keeps the reflow, drops the movement.
- Tests: p73 (every genre curves, the notes unchanged, curves in range; square pads; knobs glide; Groove lights with its drums).

## Done — 3.72 The look kit (pro-plugin) · tool pages as devices · Groove in it (2026-10-24)
His words on the 3.71 Groove: "looks horrible … cheap"; on the tool pages: "tabs … load the default tab with the content and have
the tabs horizontal"; "the tool page to be the pink button, and the add to canvas under it"; on a mock-up: "that's way better.
Continue that."
- Look kit (canvas/runtime: ui-kit.js + eravos.css, same controls and class names, same sizes — only the drawing changed, so
  every tool has it): knobs with a shaded cap and pointer inside a glowing value ring, a moving knob's swing as a violet outer arc;
  lit segmented strips; LED toggles; machined buttons, the primary lit; recessed fields and LCD numbers; metal fader caps;
  drawn displays as recessed screens; windows and sections as a chassis with inset panels and mono caps headings.
- Tool / suite page: the device look; tabs in one row along the top (the Controls table shared the .tp-tab name — its width:100%
  had stacked them); Panel opens with the tool live even before it is on the canvas (a windowless sketch; Add to canvas keeps
  what you set); a tool adds its own tabs; Add to canvas is the pink key. + Add: the pink button opens the page, Add under it.
- Groove: the window is the pattern screen + style strip + a knob bank (ENERGY large) + loop/fill strips; its page adds Feel (a
  mixer strip per drum: LED mute/solo, level fader, hit meter, chance, pad; evolve), Motion (slots, drawn shape tiles, a lit rate
  strip, a live scope, depth/phase) and Perform (an XY pad with a trail, four coloured macro cards, Learn).

## Done — 3.71 Motion + Perform (shared) · Groove 1.1, the pilot (2026-10-24)
His words: "Bass and drums forge. Fix box. Drop builder. Breath. Eq. Side chain. Embodyment. Recursive spectra. Automation.
Baseline. Chords. Groove. All need more dynamic control and a better ui." — dynamic = movement over time, variation and feel,
performance controls, deeper sound controls, "all the above while not cluttering or making it overwhelming". One tool first.
- **Shared, opt-in (`perform: true`)** — core/motion.js + core/motion-ui.js:
  - MOTION: any knob moves on its own — sine, triangle, saw down/up, square, random, smooth random, steps (draw 2–16 bars), follow
    the mix — rate in bars/beats synced to the song position, depth (± half its range), phase. No windows, no wires. Right-click
    a knob: move it right there, or put it on a macro. The knob keeps its own value; the movement is drawn around it.
  - PERFORM: four macro knobs (real knobs: MIDI learn, automation lanes, presets, knob inputs), each turning any knobs by its own
    amount (chips, drag the %; or Learn: turn a knob and it joins as far as you turned it); an XY pad plays two macros.
  - Window: tabs (a .uk-seg) so the main view stays clean — the tool's own tabs, then Motion and Perform.
- **Groove 1.1**: Play (the painting; click a row name to mute, Alt-click solo) · Feel (humanize, accent, rolls, fill every N,
  evolve every N, 1- or 2-bar loop; per row mute / solo / level / chance / pad) · Motion · Perform. All neutral by default — the
  same notes as 1.0.
- Tests: p71-motion (shapes, opt-in, a synced sine on ENERGY, macros, the window), Groove 1.1 (defaults identical, rows, humanize,
  accent, rolls, fill, evolve, loop).
- Next, after his OK on Groove: the same for Bass Forge, Drum Forge, FX Box, Drop Builder, Breath, EQ, Sidechain, Embodiment,
  Recursive Spectra, Automation, Bassline, Chords.

## Done — 3.70 Floor Falls songs · right-click menu · his #5901 session optimized (2026-10-24, map specs/eravos.phase70-map.spec)
His words: "i mean it sounds good to me, but any optimization the better." · "also more songs like floor falls out. like the part after
24. bass drops, curves. describe it" · "more floor falls out and raven drop. curves and deep bass drops," · "also right clikc on the canvas
for context menu. tool dependant context menu" · "merge that branch" (claude/nice-dirac-t64qeo → main, fast-forward, 45dd40c).
- **Found, measured:** every Heavy Drops song's sub is pitched where nobody can hear it.
  - Sub Engine presets play Octave −2, and the genre writes the sub at octave 1, so the fundamental lands at 8.7–23 Hz, under the
    tool's own 24 Hz floor.
  - In his #5901 session a third of the sub's energy sat under 20 Hz, and only the Phantom overtones were heard.
  - Heavy Drops is NOT changed (his song; offered). His session is optimized as a copy:
    - Sub Octave 0, level 0.20, and the Wub Lab chain removed (it gets no notes; null-tested: the mix measures the same without it).
    - In the drop: energy under 20 Hz −8.4 → −29.2 dB, the real sub (30–60 Hz) −4.7 → −2.3 dB, the master's clipper 0.07 → 0.06 %.
- **🕳 Floor Falls (deep drops)**: 8 songs on the 💥 Heavy Drops shelf.
  - Built like Floor Falls Out after bar 24: the pause, then the half-time drop with a wobble rate per note, slides, a speed-up into
    each turn, and the swinging Wobble depth curve.
  - Drop 2 is Raven Drop's: the Reese "Her Drop" talks, its filter opens every phrase (a curve), and a slow pitch ripple runs on it
    ("Ripples", after his song).
  - The sub plays its real note, and no dive goes under ~18 Hz.
  - A move per song in the pause: falls · stairs (four steps down) · freefall (Pitch curves bend the Wobble, the Reese and the pad down
    together) · rises (out of the floor into the hit).
  - His own dark Supersaw pad from his fix of #5901.
  - Pause-to-drop measured against Floor Falls Out: under 20 Hz 6.4 % → 0.9–3.0 %, 1.4–2.4 dB fuller, the clipper no busier (drop 2
    with the Reese: 0.17 %).
  - Song Engine: cx.seed and curves(…, { key, prog, bpm, seed }), so a genre can pick a move per song.
- **Right-click menu** (canvas/runtime/context-menu.js, domain-free):
  - On the canvas: ＋ Add a tool here (it lands where you clicked), ⊞ Tidy, ⤢ Show everything, ↶ ↷ (with what they undo), ■ Stop all.
  - On a window: the tool's own items first, then its presets, ⧉ Duplicate (same settings), 📖 page, ⚙ settings, ⤢ expand, fold,
    × close.
  - Music tools add ▶ Hear it, ■ let go / quiet, 🎲 a random preset.
  - The timeline adds, over a clip: ✂ Split here, ✂ In half, ⧉ Repeat, 🎹 Edit its notes, 🗑 Delete; plus ✂ Split at the frame,
    ⛶ full screen, ⤢ Fit, ⤓ WAV / MIDI.
  - Knobs keep "Move with", curve and marker lanes keep right-click-to-delete, and text fields keep the browser's menu.
- Tests: tests/p70-floor-falls.test.js (5) · tests/p70-context-menu.test.js (4).
- To confirm: "maybe? bass synthesis modulation synthewave" — read as tool categories in ＋ Add (Bass exists since the merged branch;
  Synthwave would gather Retro Poly and the 80s tools). Not built.

## Done — 3.69 Reactive colours that react · suites in the app's own look · Bun Dem wobbles gone (2026-10-24)
- **Reactive colours** (⋯ Options → ◐ Reactive colours): they were measuring the sound fine but only drew a faint ring and a 10 %
  haze, in a violet/teal hue sweep. Now the accent colours themselves move: the app's palette (cyan, green, pink, violet, amber, red)
  lights with the mix and flashes on each hit; each tool's own accent (its window, knobs, buttons, the tool page) lights with that
  tool's own sound, and knob arcs / on-buttons glow with it. Every colour keeps its hue (no rainbow) and returns exactly in silence.
- **Suites restyled to match the app**: 3.64's soft look (16 px corners, glass blur, gradients, pills) taken out of the suite window,
  the tool/suite pages and the icon tiles — app tokens, 6 px corners, 1 px lines, buttons and tabs that are .uk-btn / .uk-seg.
- **Wobble Bass**: the nine "Bun Dem …" presets removed (songs that listed one use their other choices).
- Tests: p58 accent colours (hue kept, lit while playing, restored in silence); wobble tests use a plain growl patch.
## Mapped next — 3.69 (specs/eravos.phase69-map.spec)
P69.1 a v10 theme you pick in ⋯ Options (current look stays default and frozen) → P69.2 songs by genre + subgenre →
P69.3 Pattern Library → P69.4 Scope + Phase Space → P69.5 Clip Maker 2.0 → P69.6 GPU particle field → P69.7 voice analyser +
live transcription. Specs: eravos.themes, eravos.songbook-genres, eravos.pattern-library, eravos.migration-components.
Fonts for v10 (Orbitron, Share Tech Mono, Rajdhani, OFL) are fetched as @fontsource 5.3.0 at build time of P69.1.
Done this round: 3.48.4 tool and suite pages are tabs.

## Done — 3.68 Export tags & cover (2026-10-24)
His words: "The export have a meta data editor option and have it autofilled. Option to upload cover image."
- Song Recorder → 🏷 Tags: title, artist, album, genre, year, BPM, key, comment, and a cover. Every field is filled in for you
  (grey): the song's name, or the song the Songbook just wrote, its genre, this year, the BPM, the key, "Made with ERAVOS".
  Type to change one; clear it to go back to auto. The artist is typed once and remembered on this computer (never in a save).
- Cover: upload a PNG or JPEG, or let it draw one from the song (1000 px, a ring of the export's own waveform, title, BPM, key).
- Written into MP3 (ID3v2.3, UTF-16, front cover), WAV (LIST/INFO + id3 chunk), FLAC (Vorbis comment + PICTURE) and AIFF
  (NAME/AUTH/ANNO + ID3). Exports, stems and Save to Songs all carry them; Opus says it carries none. The audio is untouched
  (WAV and FLAC decode bit-identical with and without tags).
- Tests (p68-export-tags: 7): each format read back byte by byte, autofill and overrides, the remembered artist, covers.

## Done — 3.67 Bézier handles on per-note curves (2026-10-24)
- A point may carry the handle of the segment that ends at it: [t, value, [hx 0…1, handle value]] — that segment is the quadratic
  Bézier through its ends (an arc, an ease in or out); no handle = a straight line, as before. Played by the SDK exactly as drawn,
  and bent in the knob's own picture: log on a frequency knob (an arc on cutoff is a clean arc to the ear, not a jump then a plateau).
- Editor: a ◇ in each segment — drag to bend, double-click or right-click to straighten; new shapes ease in, ease out, arc.
- Cutting a note through a curved segment turns it into short straight pieces (values kept). Behaviours keep handles (saved in the
  knob's picture, scaled by intensity; reversed, a handle moves to its mirrored segment).
- Tests (timeline.test.js, per-note curves: 21): playback on a bowed segment (6 of 8 at the middle), log bending on cutoff
  (~3.2 kHz halfway 100 Hz → 8 kHz), cleaning, cutting, the editor's handle, behaviours with handles.

## Done — 3.66 Wub Rate speed controls · Squash (2026-10-24)
His words: "Wub Seq and a multiband squash" (the Wobble Bass gaps). Found on the way: Wub Rate already IS the step sequencer of wobble
rates (16 steps of rates, off, hold) — so no second tool; what it lacked from the Wobble Bass was the speed control.
- **Wub Rate 1.1**: Rate bend ×¼…×4 (smooth, as the oscillator's detune — never restarts), Rate glide (a step's new rate swoops in
  and the wobble glides on instead of restarting — the speed-up into a drop), and a rate input (wubrate.hook.mod_rate: an Envelope,
  LFO or curve pushes the speed ±2 octaves). All off by default. Tests: ×2 = 8 Hz, glide carries on where a jump restarts from shut,
  an LFO held high speeds it up.
- **Squash** (eravos.fx-squash, new): three-band OTT-style squash for any sound — Linkwitz–Riley 24 dB/oct split (flat ±1 dB at
  Squash 0), each band into a soft limiter with makeup, zero latency; Lows clean (default) and Mono lows; per-band amount and level,
  crossovers, mix. 7 factory presets + 2 Odd Couples; used in an Odd Couples song; an optional part of Wub Lab (after the mouth)
  and Heavy Drops (in the growl, after the Destroyer). Tests: the quiet/loud gap shrinks ≥ 8 dB with the loud part within 6 dB,
  lows clean keep a 45 Hz sub exact, mono lows put a left-only sub in both sides, flat at 0, an impulse on time, mix 0 = input.
  Found while testing: a 12 dB/oct split leaked a tenth of a sub into the stereo mids, and Web Audio takes lowpass/highpass Q in dB.

## Done — 3.65 Per-note curves and reusable note behaviours (2026-10-24)
His words: "Let each note carry time-varying filter, drive and wobble-depth curves. Keep those curves attached when notes move, resize
or duplicate. Save curve combinations as reusable behaviours, with stretch, reverse and intensity scaling. Add live audio feedback while
dragging" · "make the initial feature explicitly monophonic-focused" · "A curve must not leave a shared knob at its final value or
accidentally restore an older value over a newer note." · "Keep the synth engines untouched" (they are: all of it is the timeline + SDK).
- **Data**: a note's `c = { knob: [[t 0…1, value], …] }` beside `p` and `b` (timeline cleanC: number knobs, 8 knobs, 64 points). Stored
  over the note's length, so moving, copying and resizing keep it (resizing stretches it); a cut note keeps its part (cropC).
- **Playback** (sdk-music noteCurves, MONOPHONIC by design): the knob follows the curve on the audio clock (a 12 ms chained step), with
  the per-note ownership rules: the newer note wins, the older curve stops writing and never restores over it, the note's end hands
  the knob back to the automation's value or the tool's own, Stop all clears it. A knob in both p and c follows the curve.
- **Editor**: the note inspector's 〽 Curves — pick a knob (filter, drive, wobble first), draw points (click adds and drags,
  double-click / right-click removes) or a shape (open, close, late open, swell, dip, pump); a frequency knob is drawn log and its
  shapes resampled so they sound as drawn; you hear the note with its curves while shaping. Blocks show their curve.
- **◈ Behaviours**: a note's curves (by ROLE — filter / drive / wobble / knob:<key> — in the knob's own 0…1 picture) and bend, saved
  with the project; six built-in (Floor Dive, Filter Opens Late, Growl Build, Wobble Deepens, Talk, Glide In + Open). Apply to a note
  or the whole selection, stretched to each note, with Intensity (around the knob's own setting) and Reverse; a role this tool lacks
  is skipped and said.
- Not yet: Bézier handles (next), behaviours shared across projects, true per-voice curves (would mean changing each synth).
- Tests: timeline.test.js "per-note curves" (16): cleaning, sending, cropping; values over time, note end, automation hand-back,
  overlap, interruption, Stop all, ranges; the rendered audio matching the knob held still at each end; the editor; behaviours.

## Done — 3.64 Drawn icons everywhere · EDM Lab is the suite only · a refined look (2026-10-24)
His words: "Replace all those icons with high quality ones. No all in one EDM lab. Only the suite. And make them enterprise grade. Beautiful
ui and icons."
- **Icons**: every emoji icon is now a drawn line icon (Lucide, ISC — LICENSES/lucide.txt; Feather-derived ones MIT). canvas/runtime/icons.js
  (window.Icons, domain-free: add · map · svg · html · label · node · tile · decorate); each domain says which icon each tool, suite,
  category and mode shows in tools/<d>/icons.json; `node build/icons.mjs <lucide-static/icons>` writes the generated sets (committed).
  Drawn: window title bars, ＋ Add (cards, the rail, the detail, mode cards), tool and suite pages, the suite window, the mods rack, links,
  the top bar (data-ic). Anything with no drawing falls back to its emoji. Inside the tools' own panels, emoji labels stay for now.
- **EDM Lab = the suite**: the all-in-one is hidden (descriptor and tool.json `hidden`, a schema field) — not in ＋ Add, not a partner, not
  the suite's allInOne; two Odd Couples songs no longer open it. It still loads for saved canvases that have one.
- **The look**: suite cards show the suite's icon tile and the icons of the tools it is made of; pages have a glass backdrop above the dock,
  an icon tile header, icon buttons and quiet rows; the suite window has a segmented tab bar, a lit macro plate and part cards with tiles.
  The top bar shows icon-only secondary buttons below 1800 px so it fits (it was clipping at 1600).
- Tests: tests/p63-suite-page.test.js (every tool, suite and category drawn; ＋ Add has no all-in-one; title bar, pages and suite window draw).

## Done — 3.63b The rest of the suites · every suite a control panel (2026-10-23)
His words: "Where are the rest of the suites. Synthesis tool for each suite". The 3.48 map named seven suites; four were never built.
- **Synthwave** (Groove → gated drums → Dynamics · Chords → Supersaw → Phaser · Chords → Arp → Retro Poly → Juno chorus → dotted Echo),
  **Gothic** (Chords → Gothic Organ, Coven → Haunt, Pad Forge · organ and choir share one Echo · an optional stomp),
  **Sound System** (one-drop Groove → drums · Chords → Bassline → reggae sub · Sample → Filter → Dub Station → Sidechain → Echo),
  **Xen** (Ratio Lattice → its notes and tuning → Xen Synth · Recursive Spectra hears the same notes and sends its spectrum to the voice).
  Each: 4 macros on its panel, 5 scenes. Heavy Drops is the drop rig the map named.
- **Every suite window is a control panel now**: Wub Lab (WUB · VOWEL · FM · GRIT) and Synthesis Lab (MORPH · FM · SHAPE · MOTION) had none.
- Tests (tests/p63-suite-page.test.js): every macro names a part's real number knob; each new suite builds whole, every wire on, every macro
  moves its knobs end to end, and it sounds through the suite with nothing played by hand.

## Done — 3.63 Heavy Drops suite · a page for every suite · a click in ＋ Add opens the page (2026-10-23)
His words: "i like the drops, the wobble and sub. especially between 26 - 41" · "Make a page for the suite like the rest. Have it open the page
by default" · "It opens the tool page but for a suite. I'm saying all tools. Like open the tool page when you click on them."
- **Heavy Drops suite** (tools/music/suites/heavy-drops): the Floor Falls Out sound as a system. Groove → Pads; Chords → Bassline → Wobble
  Bass AND Sub Engine; a Destroyer in the wobble's growl slot; the Drop Builder. Extras: Wub Osc screech, Pad Forge. Macros WOBBLE · WEIGHT ·
  GRIT · SPACE. Scenes: Floor Falls Out (starter), Half-time Growl, Head Shaker, Tearout, Sub Quake.
- **A page for every suite** (ToolPage.openSuite): every part (▶ its preset, ＋ just that one, 📘 its own page, ✓ when it is on), scenes,
  macros, how it is wired (live on/off once a suite window is open), ＋ Build the whole suite. A suite window's 📘 or name opens it.
- **＋ Add: a click opens the page** of the tool (or of the suite). ← Back returns to the menu where you were. Enter still adds; Space opens
  the page from the keyboard. Tests: tests/p63-suite-page.test.js; tests/fresh-profile.mjs follows the new click.

## Done — 3.62 The adjustment works · sleep · repeat · split lanes · the whole timeline full screen · Arp & Motion songs (2026-10-23)
His words: "can you optimize performance? also what do you think? especially about the timeline additions?" · "also the adjustment doesn't
work. also adding a way to split the lanes. make it easier to repeat patterns, control a in full screen, add songs that use the automation,
arp, etc" · "make sure your on the mian branch". Map: specs/eravos.phase62-map.spec (readings R1–R5, the ones to confirm marked).
- **The adjustment** (two bugs, each reproduced by a test before the fix):
  - Note knobs edited the wrong note. Turn a note's Start or Pitch past its neighbour, then any knob: the neighbour was overwritten (one note
    doubled, one lost). The roll held the note by its position, and the engine re-sorts notes on every save.
  - The clip inspector's knobs and bars field were rebuilt after their first step, so the drag stopped.
  - Also: the rename / "split at" dialog and the knob menu opened BEHIND the piano roll's full screen. They are on top now.
- **Performance, measured** (specs/eravos.performance.spec addendum; `node build/perf-idle.mjs`):
  - A silent tool kept costing: Gothic Organ 18.8 % of a core while playing nothing, Pad Forge 15.3 %, Wobble Bass 5.8 %; all 24
    instruments 61.7 %. Unplugged: ≈ 0.
  - Now those three **sleep** after their whole tail, and any note wakes them before it sounds (tests/p62-sleep.test.js: the note after
    sleep is within 3 dB of the first). A whole song: 6–14 % less.
  - My first guess (stolen voices left connected) was measured and was WRONG. Nothing was shipped for it.
- **Repeat patterns**: ⟳ Repeat every (1 beat … 8 bars) on a note clip. Stretch the clip and the pattern keeps going; edit the first bars
  and every repeat follows. ⧉ Repeat ×… lays copies end to end. MIDI export and Split write the repeats out.
- **Split at a frame** (his correction, later the same day: "im saying you select a frame in the timine and clit split to cut a pattern in
  half"): drag across empty space in a track, or Shift+drag over the clips, then ✂ Split (or S). Every clip in the frame is cut at its
  edges. A click without a drag is one cut line. The inspector has ✂ In half.
- **Split lanes** (my first reading of "split the lanes", kept as an extra): ✂ in an instrument lane's header: one lane per drum pad, low / high notes (where they part), or at a note you name.
  The new lanes play the same tool until you pick another.
- **⛶ the whole timeline full screen**: tracks, curve lanes, transport, inspector and piano roll. Esc to leave. (The roll's own ⛶ shows
  only the notes.)
- **🪜 Arp & Motion songbook** (6 songs, Songs → 🪜 Arp & Motion):
  - The Arp plays a pluck. Its chords repeat (one turn written).
  - Curve lanes climb through every build: Arp octaves 1 → 3, gate staccato → legato, rate 1/8 → 1/16, the pluck's filter opens, the
    pad bends up an octave into the drop.
  - The lead glides in and blooms a vibrato.
- Tests: full suite 1129/1132 → the 3 failures fixed (2 were mine: a CSS comment naming a domain word, and a preset check that did not
  allow a part with no preset), plus the gate suites run separately 37/37. The remaining crash is "stop contract" (renderer crash in this
  sandbox, on main too: see 3.50).
- Open: R1/R2/R4 are readings to confirm. Arp curves land up to one look-ahead late (O3). Sleep is next for Embodiment Lab and the effects
  (O4). The timeline is "a challenge to use": still yours to name what gets in the way (P52.6).

## Catch-up — 3.53 … 3.61 were built without a PROGRESS entry (found 2026-10-23, drift §12.5)
His words as the code carries them (file of each quote in brackets). Nothing here is reconstructed beyond what those comments say.
- 3.53 "a way to full screen the notes screen, its cramped" · "what if we can do different configurations per note, wobble, depth,
  oscillation, giving full range and depth to the timeline" → per-note knobs, automation lanes, ⏺ record knobs (timeline.test.js)
- 3.56 "curve the notes in the timeline: the pitch, smoother transitions, bigger and deeper drops; adjust per note" → curved notes, 〰 Bend
- 3.57 "use the curve for modularity and oscillations … interconnected when connected" + "draw on the piano roll and have it turn to
  notes" → oscillation, Pitch lane, curve out → bend in, ✍ Sketch (timeline.test.js)
- 3.58 "click a note and edit it completely" · "this is all supposed to be dynamic … I want the UI to stay clean and organized" → the note
  inspector beside the notes, edges connect, ⊞ Tidy up (timeline.pianoroll.js, tests/p58-dynamic.test.js)
- 3.59 "Can you make songs with a heavy bass drop" → 💥 Heavy Drops; the roll is the tool's editor (heavy-drops-songbook.js, pianoroll)
- 3.61 "make arp more adjustable. i love it" → Arp 2.0 (arp.engine.js, PR #34)

## Done — 3.51 Deep bass (2026-10-22)
His words: "can you do more for deep bass?"
- Pitch now reaches −36 st (three octaves down) on Wobble Bass, Reese Bass, Wub Osc and Wub Sub; Octave goes to −4 on Reese, Wub Osc, Wub Sub.
- Reese Bass: **Sub oct** (0 / −1 / −2, default −1 = as before) and **Sub harmonics** (0..1, default 0): overtones above the clean sub so a
  very deep note is heard on laptop speakers / phones / headphones. Presets: Deep Reese, Sub Floor Reese.
- Wub Sub: **Harmonics** (0..1, default 0) — same idea; preset "Deep Sub (heard on small speakers)". Raise Low-pass to ~3× the note.
- Pack schemas regenerated (build/tool-kit.mjs) so presets can use the new keys. Defaults unchanged: every old preset loads identically.
- Note: a note under ~30 Hz is mostly felt, not heard, on small speakers — that is what Harmonics is for.

## Done — 3.50 Pitch knob (2026-10-22)
His words: "everything is so high pitch. i want to be able to turn the pitch up and down in the wobble and reese bass, and wub tools."
- Wobble Bass, Reese Bass, Wub Osc and Wub Sub each get **Pitch** (`transpose`, −24…+24 semitones, 0.1 steps; default 0 = unchanged).
  It retunes a held note live. Wobble's sub and FM modulator ride on it; Wub Sub has its own (set it to match Wub Osc).
- Reese Bass also gets **Octave** (−3…+2, default 0 = the old "a bass octave under the key"). Presets load identically.
- Tests: Pitch/Octave cases added to each tool's `.test.js`. (`stop contract` crashes the renderer in the sandbox on the original too.)

## Done (merged to main)
- **ERAVOS Glass + ERAVOS COS** (3.47): `host/` brings in Nexus Clear Glass and COS, rebuilt for ERAVOS with no Nexus
  dependency. Nested compartments (canvas › domain › tool) with birth gates; the canvas driven through an event stream and command door;
  ERAVOS.exe runs Glass inside the app. Spec `specs/eravos.host.spec`, tests `node tests/host.test.mjs`.
  The desktop wiring is not yet run in Electron.
- **Tool pages** (3.46): 📘 on every window and in ＋ Add. Each page has the tool's suite (load all of it, or one tool at a time),
  the mods per slot, the tools it plays with, its sound packs, every control and its inputs/outputs.
  Files: `canvas/runtime/tool-page.js`, `specs/eravos.tool-pages.spec`, `tests/p45-tool-page.test.js`.
- **Wobble Bass 3.6**: a `growl` mod slot (wub layer only; the sub stays clean). 3.5 added rate bend/glide, FM, squash,
  a rebuilt UI and the Bun Dem matched presets.
- Destroyer 2.0 · Links & Mods · synthesis tools (Morph Osc, Envelope, Partials, Granular) · Songs by category.

## In progress — 3.49 (specs/eravos.phase49-map.spec)
2026-10-22, his words: "Motion core: any knob can be moved by an LFO or envelope. Windows that grow (keyboards up to 88 keys) not just paino.
each ;arge tool rebuilt as parts if it can be used by another suite or tool"
- P49.1 BUILT: every knob of every sound tool can be moved. Right-click → Move with LFO / Envelope / Wub Rate / XY Pad / Macro (or one already
  on the canvas). The knob shows where it is now; its saved value stays yours. tests/p49-motion.test.js.
- P49.3 audit BUILT: 62 tools measured at 520 and 1400 px (specs/eravos.growth.spec): 15 grow (the keyboards), 47 stretch.
- P49.4a BUILT: Arp (a part: notes or a Chords in → any instrument). P49.4b BUILT: Wobble Bass → "As parts: Wub Lab" on its page.
- Fixed: the Bassline could play the old root on a chord change (a tick-order race, shipped in 3.48).
- Next: P49.2 glide/morph → growth per tool (Sequencer, Drum Machine, Mixer, Wub Rate, Groove…) → P49.4c Gothic Organ as parts.

## In progress — 3.48 (specs/eravos.phase48-map.spec)
2026-10-21, his words: "make it so the tools expand when resized ... the full range of piano keys" · "like how there is 4 wub tools, but no
primay system ... they all connect to the suite, but can be mixed and matched" · "not playright. isn't clearglass in this project".
- P48.0 BUILT: tests run on Clear Glass's driver (host/driver/), Playwright gone from every script (tests/no-playwright.mjs guards it).
- P48.7 BUILT: keyboards grow with their window, up to all 88 keys (one change in UI.Keyboard → 15 tools). tests/p48-grow.test.js.
- P48.5a+b BUILT: suites as systems. A suite window (🧰 Suite, ＋ Add › Suites › Wub Lab / Synthesis Lab) is the system its parts connect
  to. Build it whole, add parts one by one, load scenes, mix in parts of other suites. Membership is read from the wires.
  canvas/runtime/suites.js, tools/music/tools/suites/suite/, tools/music/suites/*. tests/p48-suites.test.js + host suite commands.
- Later the same day, his words: "the suite should be like a synthesis tool of the respective tools. Like the edm lab needs rebuilt. like a
  control panel of the respective tools ... anything form a tool that other tools can use need to be decomposed, and grouped by the tool suite"
  P48.8 BUILT: the suite window opens on PANEL. Macros on top, then every part's controls inside it. Fold the part windows away.
  P48.9 BUILT: build/decompose-audit.mjs → specs/eravos.decomposition.spec (every tool's parts, what already does each job, the gaps).
  P48.10 BUILT: EDM Lab is a suite: Groove, Chords and Bassline (new parts) play Pads, Pad Forge and Reese Bass. ENERGY/TENSION/SWING.
  The old one stays as "EDM Lab (all-in-one)". Fixed from his screenshot: "nullnull" in ＋ Add, and suites hidden on a fresh profile.
  Next gap from the audit: an arpeggiator (inside Retro Poly and Ratio Lattice).
- Next: P48.5c (suite page tabs Packs/Mods/Controls, "Part of" on tool pages, COS suite gates, five more suites), then P48.2 motion.

P48.1 piano roll precision: BUILT (exact placement, paint/split/erase, both-edge stretch, grids, zoom, ruler,
multi-select, copy/paste, nudge, quantize/humanize/legato, velocity lane, per-note knobs, step input). Next: P48.2 → P48.2 motion core (any knob can move) → P48.3 macros + perform pad + Destroyer 2.1 →
P48.4 Retro Poly · Gothic Organ · Dub Station → P48.5 suites as systems (own page, six tabs, scenes) → P48.6 polish.
Specs: eravos.suites.spec, eravos.motion.spec, timeline.spec § 3.48, and § 3.48 in each static tool's spec.

## In progress — Skrillex "Quest For Fire" (basement set clip, about 2:08)
The section was analysed from the user's clip. The audio stays out of the repo. The Wobble Bass was then matched against it by an
offline search. Lower cost = closer.

**A: 125–133.5 s (about 2:08): a fast wobble over a sub.** E1 sub (about 41 Hz) sliding to D♯/F; 1/16 movement at about 150 BPM, plus 1/8;
dark spectrum. Match cost 8.27 (default preset 19.2).
```json
{"div":"1/16","lfoShape":"sawdown","filterMode":"lowpass","vowelA":"AE","vowelB":"OH","formantShift":0.408,"cutoff":630.7,
 "depth":3.04,"res":17.5,"fmIndex":0.97,"fmRatio":"1","fmWub":0.14,"drive":0.1,"shaper":0.71,"gritMode":"hard","squash":0.95,
 "osc2":0.13,"sub":1,"spread":33,"width":0.66,"noise":0.08,"vibrato":105,"lfoPhase":0.09}
```
**B: 134.5–146 s (about 2:14): the "high wobble", no sub.** Pitched around B3 (245 Hz); energy at 126 Hz and 400 Hz–5 kHz; 1/8 and 1/8t.
Match cost 10.17 (default preset 28.0).
```json
{"div":"1/8t","lfoShape":"square","filterMode":"lowpass","vowelA":"ER","vowelB":"AE","formantShift":-2.53,"cutoff":1193,
 "depth":3.2,"res":17.2,"fmIndex":4.08,"fmRatio":"0.5","fmWub":0.13,"drive":0.17,"shaper":0.52,"gritMode":"fold","squash":0.66,
 "osc2":0.23,"sub":0.75,"spread":10.6,"width":0.17,"noise":0.17,"vibrato":0.3,"lfoPhase":0.61}
```
**Next:** add both as Wobble Bass factory presets ("Quest · 1/16 over E1 (2:08)", "Quest · High Wobble (2:14)"), with every
other key at its default plus rateBend 1 and rateGlide 0. Run `node tests/tool-audio.mjs wobble`, then the full `node tests/run.mjs`.

## Ideas parked
- Ollama as a DJ turning knobs live (the user pinned this). The door is ready: POST /glass/cmd canvas.state / canvas.set.
- A Sound Match tool (the offline matcher as a tool) · LFO/Envelope able to reach any knob · more suites (Granular, Partials, Wub Filter).
