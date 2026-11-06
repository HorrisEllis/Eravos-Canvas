# Proof of competency: James Brooks — ERAVOS

> James, 2026-11-05: "I want you to record, with proof and provenance a ledger with timestamps. Anything that proves competency that
> I can add to a resume or portfolio."

This is the portfolio record for **ERAVOS** (`HorrisEllis/Eravos-Canvas`), the companion to the NEXUS record
(`HorrisEllis/Nexus` → `docs/PROOF-OF-COMPETENCY.md`, `docs/JAMES-BROOKS.md`).

**Credit, stated plainly.** ERAVOS is James Brooks's product. The vision, the architecture, the rules, the direction and every call
about what is right are his. The code was written with an AI coder (Claude, in Claude Code sessions) working to his direction. Each
entry below says which part is which. **Nothing here is claimed without a pointer a stranger can check**: a commit, a pull request,
a release, or a command to run.

**Provenance.** Timestamps are the merge commits' own times on `main` (Pacific time, as git recorded them). Quotes are his words from
the session that did the work, dated. Commit hashes are the full merge commits on `main`.

---

## Check it in five minutes

```bash
git clone https://github.com/HorrisEllis/Eravos-Canvas && cd Eravos-Canvas
```
```bash
git log --oneline | wc -l          # commits
```
```bash
node tests/components.mjs          # shared sound components, proved bit for bit against the code they replaced
```
```bash
node tests/no-toys.mjs             # every instrument synthesises live: no shipped recordings
```
```bash
node build/validate.mjs            # every tool, pack and suite manifest against its schema
```
The release (installer + portable build, built on GitHub's Windows runners): https://github.com/HorrisEllis/Eravos-Canvas/releases/tag/v0.1.0

## The work, in numbers you can check (2026-11-05)

| What | Number | How to check |
|---|---|---|
| Commits since the first, 2026-10-15 07:47 −0700 | 266 | `git rev-list --count main` |
| Pull requests merged | 70 | `git log main --merges --oneline \| grep -c "Merge pull request"` |
| Days with commits | 18 | `git log main --format=%ad --date=short \| sort -u \| wc -l` |
| Working tools (music, agents, coding, image, video) | 69 | `find tools -name tool.json \| wc -l` |
| Suites (systems of tools) | 9 | `ls tools/music/suites` |
| Factory sound packs · presets in the tools' menus · patterns | 139 · 734 · 3,288 | counted in the running app (2026-11-05) |
| Specs (the work written before it is built) | 488 | `find specs tools -name '*.spec' \| wc -l` |
| Automated test cases (in-page suites + tool tests) | 904 | `grep -ho "\bit('" tests/*.test.js tools/*/tools/*/*/*.test.js \| wc -l` |
| Code | 52,488 lines of JavaScript | `git ls-files '*.js' '*.mjs' \| xargs cat \| wc -l` |
| Releases | v0.1.0 (Windows installer + portable) | the releases page |

## Resume / portfolio lines (each backed by the entries below)

- **Founder and architect of ERAVOS**, a modular music production environment for Windows: a canvas of 69 live instruments, effects and
  generators that wire together, with 9 suites, 139 sound packs and 3,288 patterns. 266 commits, 70 merged pull requests in three weeks.
- **Defined a component architecture** ("systems all the way down": component → tool → suite → project, joined by wires, never
  boxes) and the rule that every refactor proves *no change in sound*: a null-render harness that subtracts before/after audio renders
  (pass under −60 dB), used to extract shared DSP components with residuals of −87.6 to −94.2 dB across 38 presets.
- **Set quality rules enforced by automation**, not review: instruments must synthesise live ("No toys" — a CI guard rejects shipped
  recordings), no third-party browser-automation dependency (a CI guard), every manifest schema-validated.
- **Shipped a Windows product**: one-run installer, NSIS setup exe, auto-updater against GitHub Releases, user library kept outside the
  program folder, release built by CI on Windows runners.
- **Directs AI-assisted engineering at scale**: writes the specs and makes the calls; AI coders implement against them with tests, a
  ledger, and a written record of every decision in his words.

---

## Ledger (newest first)

Each entry: **when** (merge time on `main`) · **his words** (the ask, dated) · **his call** · **built** (by the AI coder to his
direction) · **proof** (what was measured or tested) · **check** (where a stranger looks).

### 2026-11-06 · A synth assembled from proved parts — Retro DCO
- **His words (2026-11-06):** "Retro poly is buggy. I love it though. Like I want more synthwave." · "Which components, like what overlap
  can we focus on to speed this up?" · "Do it." · "1, 2" · "Build it."
- **His call:** the shared parts first by overlap, the UI shown as a preview, then built; the new tool beside Retro Poly until he has heard it.
- **Built:** a polyphonic synth whose whole sound is one AudioWorklet made from eleven components' own tested code, sixteen voice cards
  with seeded per-voice character, a voice allocator, two filter models, the bucket-brigade chorus, and twelve presets kept as data.
- **Proof:** the shared tool contract 4/4 and seven of its own measured checks (pitch within 5 cents, both filters and every voice mode
  clean, stereo chorus, voice stealing, key release, loudness matched to Retro Poly within 2 dB and under full scale at its loudest).
- **Check:** `node tests/run.mjs P139` · `node tests/run.mjs retro-dco`

### 2026-11-06 · The Juno chorus, modelled and proved — bbd-line, ensemble-core
- **His words (2026-11-06):** "1, 2" (release, then the synthwave parts).
- **His call:** the parts the synthwave tools share first, then Retro DCO, its UI shown before it is built.
- **Built:** a bucket-brigade delay model (compander, clock-tracking anti-alias and reconstruction filters, sample-and-hold, hiss inside
  the line, clock bleed) and a multi-tap ensemble with known machines kept as data.
- **Proof:** 20 + 20 measured checks — delay equal to the set time by phase, bandwidth following the clock, compander unity ±0.6 dB with
  the hiss > 20 dB lower in silence, pitch wobble equal to 2π·rate·depth·f within 12 %; a filter corner corrected by measurement.
- **Check:** `node tools/music/components/bbd-line/bbd-line.test.mjs` · `node tools/music/components/ensemble-core/ensemble-core.test.mjs`
### 2026-11-06 · A string, a tine and a tube, proved on their own — karplus-string, modal-resonator, saturator-tube
- **His words:** "yes" (2026-11-06, to Piano).
- **His call:** Piano built bottom up — its missing components first, each proving its own numbers (Axioms 2, 8).
- **Built:** a physical string whose tuning is exact by construction (every filter's phase delay in the loop worked out and taken off), with
  stiffness that stretches the partials like a real piano; a bank of resonant modes exact in frequency, level and decay; a tube-style saturator
  whose asymmetry gives even harmonics, with its DC offset blocked.
- **Proof:** 66 measured checks (loop delay = sr / f0 to 1e-6 samples; < 0.5 cent measured; 12th partial of A4 sharp by a piano's 10–30 cents
  at some stretch; 60 dB decay on time; drive 0 = the signal exactly; no DC); `node tests/components.mjs` all pass.
- **Check:** `node tests/components.mjs karplus-string` · `modal-resonator` · `saturator-tube`

### 2026-11-06 · Tape Memory — a lofi tape effect built from its parts
- **His words:** "i also want to be able to make lofi" (2026-11-05) · "Lofi tools: UI previews first." · "yes" (2026-11-06).
- **His call:** spec and UI preview approved first; the tool built from its seven components, each already proven.
- **Built:** an effect that puts the whole sound on worn tape — four machines, wear and copies of copies, wow, flutter, varispeed, hiss,
  crackle, dropouts, tape stop — wired from shared parts with every timed value an audio parameter, its approved face, two packs, and a
  place over the whole mix in the Lofi setup.
- **Proof:** 8 in-app tests measuring the audio (latency, pitch, level, pitch movement, varispeed, silence vs. dust, tape stop, dropouts, every
  preset under full scale); the design check clean on all six rules; played in the app with no faults.
- **Check:** `node tests/run.mjs "Tape Memory"` · Start › SETUPS › Lofi

### 2026-11-06 · The parts of worn tape, proved on their own — random-source, tape-transport, bitcrusher, saturator-tape
- **His words:** "i also want to be able to make lofi" (2026-11-05) · "yes" (2026-11-06, to Tape Memory).
- **His call:** Tape Memory built bottom up — its missing components first, each proving its own numbers (Axioms 2, 8).
- **Built:** four shared signal parts, each a plain kernel tested in node and run unchanged as an AudioWorklet: seeded randomness with four
  distributions and Poisson events; a tape transport whose lag drives a delay line (stops, spin-ups, rewinds); a bitcrusher with anti-alias,
  jitter and dither; a tape saturator with emphasis, bias, hysteresis, head bump and gap loss.
- **Proof:** 62 measured checks (statistics within tolerance, timing to the sample, filters to the dB, harmonics, transparency < −90 dB
  when clean, bounded under abuse); `node tests/components.mjs` all pass.
- **Check:** `node tests/components.mjs random-source` · `tape-transport` · `bitcrusher` · `saturator-tape`

### 2026-11-06 08:14 −0800 · A song file in layers, and a workshop for any object — .erv, the Workshop — PR #112
- **His words (2026-11-06, UTC):** "Can we use yaml to save songs like a psd file. Like so it has layers? Like it saves what’s on the canvas?"
  (09:23:29) · "The pattern and note editor are the same." (13:28:34) · "Absolutely not. Like I’m talking a full workshop. Editing one note
  completely like it’s in the center of a work surface or operating table or like photosyop" (13:38:50) · "Agnostic. I was thinking it could be
  the beginning of photo manipulation tools. If possible." (14:09:18) · "Nice. That's exactly it. And then the PSD style YAML, maybe ERV as an
  extension for that." (15:55:01)
- **His call:** the format's name (.erv) and its shape (PSD-style layers, YAML); one editor for notes and patterns; a first editor preview
  rejected and redirected to an agnostic workshop, which he approved.
- **Built:** .erv — the whole canvas as one readable YAML file in layers (canvas view, a Tools group with one layer per tool, wires, each
  domain's state, files), open in part, drop to open, safe parsing (no code from a file); the Workshop's spec (W1–W4) and approved preview;
  pattern-store, seed-registry and scale-key components; his brainstorm mapped verbatim with timestamps.
- **Proof:** `tests/p120-erv.test.js` 3/3 (round trip exact, a layer off is left out with its wires, a hand edit opens as edited, a broken file
  names its line and column); pattern-store 29 checks (a Timeline clip round-trips bit for bit), seed-registry 12 (equal to the SDK's
  generator output for output), scale-key equal to MusicTheory on 45,540 inputs; CI green on the merge.
- **Check:** `node tests/run.mjs P120` · `node tests/components.mjs` · `docs/previews/workshop-note.png`, `workshop-photo.png`

### 2026-11-06 · Lofi, made of parts — the Lofi setup
- **His words:** "i also want to be able to make lofi" (2026-11-05) · "nope look at the claude.md" · "yes" · "suites are tools and its
  components." (2026-11-06).
- **His call:** lofi as parts, not one tool — corrected by him against his own Axioms; specs and previews first; then "yes".
- **Built:** a setup of eleven existing tools wired into a lofi system with four knobs and three scenes and its own tempo; jazz voicings and
  six jazz progressions added to the shared progression part and the chord tool without changing a single existing chord; a boom bap
  rhythm; eight packs of settings, data only; a generic way for a setup to carry its domain's steps without the host knowing them.
- **Proof:** a new in-app test (builds with every part and wire and no faults, sets 82 BPM; every preset and macro target real and in
  range; jazz chords and the boom bap where they should be); the default chord voicing proved identical to the old rule for every degree
  and tension; 14,884 component checks; 244 manifests valid; played in the app with no faults.
- **Check:** `node tests/run.mjs P132` · `node tools/music/components/progression/progression.test.mjs` · Start › SETUPS › Lofi

### 2026-11-06 · Automation you point at anything — Bind on the lane
- **His words (2026-11-06):** "“Automate this”: an empty lane with a bind button to bind a tool or component, or interaction object?" · "yes".
- **His call:** the plan shown in words, then "yes"; the window shown as a screenshot.
- **Built:** an automation lane that exists before it is bound (draw first), its own Bind that catches the next control touched on anything on
  the canvas — tools, components, interaction objects — a list to pick from, Rebind that keeps the drawn shape, Unbind, saved and loaded as
  it was; the XY Pad's position made into two controls so a hand on it binds and a lane can move it.
- **Proof:** a new in-app test (3 cases: an empty lane drives nothing and binds on a touch; the XY Pad binds and is moved by a lane;
  rebind / unbind / pick / save–load); the existing Bind test, the Automation tool's own tests (8/8), the XY Pad's, canvas/content boundary.
- **Check:** `node tests/run.mjs P131` · `node tests/run.mjs Automation`

### 2026-11-06 · A delay and noise, proved on their own — delay-line, osc-noise
- **His words (2026-11-06):** "Next." (continuing "Which components, like what overlap can we focus on to speed this up?")
- **His call:** the next shared parts by overlap, from the dependency graph.
- **Built:** a delay line (to 20 s, tempo sync, tape-style pitch bend or digital cross-fade, filtered and saturated feedback, freeze,
  modulation) and a noise source (six colours, tilt, stereo width, reproducible seeds), each an AudioWorklet of its tested kernel.
- **Proof:** 19 + 32 measured checks — fractional delay exact to < −80 dB, freeze held to 0.01 dB over 9 s, noise slopes 0 / −3 / −6 dB per
  octave by Welch's method, tilt equal to its transfer function; a defect found by the tests (a "fully open" loop filter still darkened
  echoes) fixed before merging.
- **Check:** `node tools/music/components/delay-line/delay-line.test.mjs` · `node tools/music/components/osc-noise/osc-noise.test.mjs`

### 2026-11-06 · Shared synth parts, proved on their own — unison-stack, filter-ladder
- **His words (2026-11-06):** "I want more synthwave. Is there more coming?" · "Which components, like what overlap can we focus on to speed
  this up?" · "Do it."
- **His call:** build the parts the most synthwave tools share first (by overlap, from the dependency graph), then the tools on them.
- **Built:** a unison stack (1–16 voices, three detune curves, equal-power spread, blend, reproducible seeded phase) matching Supersaw's
  layout exactly; a transistor-ladder filter (zero-delay feedback, saturation inside the loop, bass compensation, five taps) whose
  AudioWorklet is the tested kernel text.
- **Proof:** 95 + 36 measured checks — the ladder's −12.04 dB at cutoff, slopes, bandpass equal to its formula, self-oscillation bounded for
  20 s near its cutoff, 148 ns per stereo sample; every component test passes.
- **Check:** `node tools/music/components/unison-stack/unison-stack.test.mjs` · `node tools/music/components/filter-ladder/filter-ladder.test.mjs`

### 2026-11-06 01:53 −0800 · An instrument from proved parts, the map first, and an evidence register — PR #103
- **His words (2026-11-06, UTC):** "Can you when picking empty canvas have every tool empty of presets?" (06:28:35) · "Suites are tools with
  each component wired in." (07:06:21) · "Move along the piano to change the keys, each key needs to play its relative note." (07:06:21) ·
  "Map, spec first / Each tool needs a spec with a dag. / Make the swarm oscillator first. Since you were ready to." (07:27:37) · "Also ideas,
  choices and direction. All of me and what’s proof of competence and ownership, I want logged to a compotenxe and log. Timestamped and what
  came from it. The date and quotes exactly." (07:27:37)
- **His call:** the axioms (parts not monoliths, a suite = a tool and its components, every key its own note, spec and DAG first, nothing lost,
  everything mapped, evidence never rewritten); the 7 genre suites moved to Start › Setups; Swarm Oscillator first.
- **Built:** a blank Empty canvas; every piano key its own note; Automation Bind; suites as a tool and its components, setups, save what is
  wired as a suite, Components and Suites tabs; a DAG in every tool spec (226); Swarm Oscillator on six new components (osc-va,
  osc-wavetable, oscillator-population, env-adsr, lfo, stereo-tools) in one worklet made of their tested code; the axioms in CLAUDE.md; the
  append-only competence register with a CI check.
- **Proof:** Swarm 10/10 and design check clean; the components' own checks (polyBLEP saw aliasing −25 dB against −9.6 for a naive saw;
  Kuramoto coherence free 0.29, locked 0.99, chaotic 0.08); P116–P119 green; a tampered register entry fails `build/competence.mjs --check`.
- **Check:** `node tests/run.mjs "Swarm Oscillator"` · `node tests/components.mjs` · `node build/spec-dag.mjs` · `node build/competence.mjs --check`

### 2026-11-05 · A piano roll you can work in — piano roll easier, Timeline right-click, Clip look, Canvas zoom
- **His words (2026-11-05):** "make it easier" · "i dont like the fill options, replace it with pattern selection. also easier to manipulate
  notes, like size and moving" · "remove the split button from the timeline?, and let me select where and right click" · "like the song
  recorder, where theyre like clips".
- **His call:** each change shown to him as screenshots before merging; the new looks are options with today's look the default.
- **Built:** a one-row toolbar with the rest folded away; a pattern picker that writes a track's patterns into a clip in the song's key;
  bigger, visible note handles that keep where you grabbed; right-click menus on a selected stretch, a clip and a spot, with a one-step
  "delete what is in it" in the engine; notes drawn like recorder clips with a waveform; canvas-style zoom of time and pitch together.
- **Proof:** three new in-app tests (7 checks of behaviour, including real pointer drags and right-clicks); Timeline 86/86, piano roll
  35/35, canvas/content boundary 10/10; the full suite on main beforehand 1,379/1,382 with the cause of each failure named.
- **Check:** `node tests/run.mjs P113` · `P114` · `P115`

### 2026-11-05 · Settings as a real page — PR #88
- **His words (2026-11-05):** "also need a actual settings built not a drop down".
- **His call:** saw every tab as screenshots, then "MERGE AND push".
- **Built:** one Settings page in the look of the tool pages, a tab per section, where each part of the app contributes its own section
  (the host its look and updates, the music domain its colours and sound) — so the host stays free of domain words; the dropdown left
  with actions only.
- **Proof:** a new in-app test opens every tab and checks its controls, that a broken section cannot break the page, Esc and Ctrl+,;
  three older tests moved from the dropdown to the page; canvas/content boundary 10/10; design check no worse.
- **Check:** `node tests/run.mjs P110` · https://github.com/HorrisEllis/Eravos-Canvas/pull/88

### 2026-11-05 · A timeline you can draw on, and that scales — PR #87
- **His words (2026-11-05):** "can you start with the timeline? make it easier and the drawing more smooth and connects to each other" ·
  "also split the timeline. maybe. it doesn't scale well, also i want them to be seperate or an option to be seperate" · "oh and make it
  borderless".
- **His call:** the piano roll as its own window (chosen from three options shown as layouts), borderless, as an option with today's
  layout the default; before/after screenshots seen, then "merge and push and release".
- **Built:** a pitch-path component (monotone cubic through a drawn line, jitter removed, reduced to ≤ 48 points) so one drawn stroke
  is one note that glides along the line — in the editor and in the sound, by the same function; the piano roll filling its width; a
  borderless panel window in the canvas host that any tool can use, and the Timeline's roll in it as an option.
- **Proof:** a drawn wave went from 11 cornered notes to 1 note within 0.09 semitones of the line (largest slope jump 99 → 3.4); the
  grid for a 2-bar clip 448 → 1,131 px; 4 new in-app tests and 214 component checks pass; Timeline 84/84, piano roll 27/27, bends 16/16,
  canvas/content boundary 10/10; design check no worse.
- **Check:** `node tests/run.mjs P108` · `node tests/run.mjs P109` · `node tools/music/components/pitch-path/pitch-path.test.mjs` ·
  https://github.com/HorrisEllis/Eravos-Canvas/pull/87

### 2026-11-05 · A design system that enforces itself — PR #83
- **His words (2026-11-05):** "i dont like the tint. everything but the colors should be what they are. make them darker even. like black" ·
  "the buttons in the tape echo look bad. the color i mean. bad gradient" · "i want consistency across all of them. and a template or
  schema for a design guide or philospophy to maintain consistency."
- **His call:** surfaces black and neutral, colours untouched; every tool consistent; a written philosophy, and a way to keep it.
- **Built:** a design guide (philosophy + rules, each tied to his words), a template every new tool's UI is written in before it is
  built, and an automated design check that opens all 69 tools and measures six rules, with a baseline that can only improve, on every
  pull request. Black surfaces enforced at runtime (stylesheets, inline styles, drawn displays). Dusk gradients rebuilt from each tool's
  own colour family. The kit gained a small size; tools moved off their own inline sizes and onto one primary action each.
- **Proof:** tools passing every rule 45 → 52 of 69; surfaces, kit sizes, label collisions, primaries and colour families at zero breaks
  across all tools; tinted surfaces 1,000+ → 0; full in-app suite 1,367 / 1,371 (the four failures exist on main before this work).
- **Check:** `node tests/design-check.mjs` · `docs/design-check.md` · `docs/DESIGN-GUIDE.md` · https://github.com/HorrisEllis/Eravos-Canvas/pull/83

### 2026-11-05 · Beat colour, and phase 1's first component — PR #82
- **His words (2026-11-05):** "i like the reactive but its still not what i want for the changing setting, like i want them to be the same
  color and change to the beat" · "that looks nice as hell. can you start on the phases." · "start bottom up, then the highest leverage.
  use a dependancy graph"
- **His call:** the look stays; the reactive colours gain a mode where everything is one colour that moves on the beat. The next phases are
  built bottom up, highest leverage first, from a dependency graph.
- **Built:** Reactive colours › Beat (one shared colour from the theme's own accents, stepping on the transport's beat as it is heard,
  every beat / 2 beats / bar). The dependency graph read from the specs (`build/eco-graph.mjs`): of 107 components, filter-svf carries
  the most planned tools (35), so it came first — a zero-delay-feedback state-variable filter (Simper's method), 9 responses, 12/24/36 dB,
  running as an AudioWorklet that is the same code the tests measure.
- **Proof:** `tests/p102-beat-colour.test.js` (one colour across tools and page, steps on the beat, "every bar" waits for the bar, surfaces
  and greys untouched, each tool's colour back when switched off). filter-svf: 29 measured checks — −3.01 dB at the cutoff, 12/24/36 dB
  per octave within 1.2 dB, notch deeper than −60 dB, bell and shelves on target, 20 s of self-oscillation under audio-rate sweeps
  bounded, decays to exact zero, nothing allocated in the audio loop; the worklet equals the tested kernel in the real engine (< −60 dB);
  193 ns per stereo sample (≈ 0.9 % of a core).
- **Check:** `node tools/music/components/filter-svf/filter-svf.test.mjs` · `node build/eco-graph.mjs` · `node tests/run.mjs P102` ·
  https://github.com/HorrisEllis/Eravos-Canvas/pull/82

### 2026-11-05 · Tool pages, cleaned up — PR #81
- **His words (2026-11-05):** "the ui is how i want it. except it the tool pages look horrible." Then, on the before/after: "that looks nice as hell."
- **His call:** the canvas look stays; only the tool page changes; he sees it before it merges.
- **Built:** a fixed-size page with an opaque backdrop, a compact header, no scroll boxes inside it, preset names in full with actions on
  hover, the controls as aligned cards, inputs and outputs in words; knobs as wide as their labels (89 colliding labels → 17).
- **Check:** merge `00c0fc8685dca479bc33d05406e8e837254d898c` · https://github.com/HorrisEllis/Eravos-Canvas/pull/81

### 2026-11-04 19:32 −0800 · Looking Glass replaces Electron, written in Emerge — PR #78
- **His words (2026-11-05):** "I want to replace electron with this. Emerge rebuild the canvas." · on the core's language: "All Emerge" ·
  "I'm building bottom up. Emerge needs to get finished to the point of being able to have you code with it. I am trying to reduce as much friction."
- **His call:** the UI host (Looking Glass, his own design: UI as typed data, layers, motion as data) replaces Chromium/Electron and is
  written in his own language, Emerge; Emerge is finished first.
- **Built:** the road measured against Emerge's own build plan (Emerge at `f023240`): native language → Windows target (a PE writer
  already produces a runnable .exe) → calling Windows (multi-DLL imports, callbacks, COM) → Looking Glass phase 1 → the canvas.
- **Check:** `docs/eravos-v2-emerge-looking-glass.md` · merge `618e6998aa34fe4946edfb947b4f378d08590e93` · https://github.com/HorrisEllis/Eravos-Canvas/pull/78

### 2026-11-04 19:27 −0800 · One "mouth" for two instruments, proved unchanged — PR #77
- **His words (2026-11-05):** "I was thinking of having tool groups as suites. Like how each system has its components. I don't want
  this to become a rigid, project of boxes. I want it fluid and dynamic, deep and professional."
- **His call:** systems all the way down — the same mechanism (wires) at every scale; the design rules F1–F5 written from it.
- **Built:** a duplicate finder over every tool's code (`build/duplicates.mjs`: ~9 % of tool code repeated another tool); the first
  component it pointed to, `filter-formant` (the vowel filter Wobble Bass and Wub Filter each carried — the copies had drifted apart by
  three vowels and 2 dB); a fix so recording one tool's baseline no longer wipes the others.
- **Proof:** 5,220 bit-identical checks against both original copies, mutation-checked (two deliberately planted errors both caught);
  null render Wobble Bass **38/38 PASS, residual −87.6 … −94.2 dB**; Wub Filter 8/8 PASS (7 presets that never render the same twice are
  reported as unproven, not passed); in-app suites Wobble 39/39, Wub 59/59, Wobble suite 2/2.
- **Check:** `node tools/music/components/filter-formant/filter-formant.test.mjs` · `specs/eravos.suites.spec` (ADDENDUM 2026-11-05) ·
  merge `96fc3accdf6839a6af82eb4a24b4f891c28aa062` · https://github.com/HorrisEllis/Eravos-Canvas/pull/77

### 2026-11-04 19:11 −0800 · "No toys": every instrument synthesises live, enforced — PR #76
- **His words (2026-11-05):** "It's not a toy replaying sounds" · "I want it to stay that way. No toys."
- **His call:** a product rule — instruments make their sound live, presets are settings, nothing outside the user's control.
- **Built:** the audit (ERAVOS ships no recordings; the buffers synths use are generated in code) and `tests/no-toys.mjs`, run in the
  release build: it fails on shipped audio files, audio baked into code, or any non-sampler tool loading recorded audio.
- **Proof:** passes on `main`; a planted `decodeAudioData` in Wobble Bass makes it fail and name the file.
- **Check:** `node tests/no-toys.mjs` · merge `50fc0f1da74c3b9704cf764350424c0d858190d0` · https://github.com/HorrisEllis/Eravos-Canvas/pull/76

### 2026-11-04 19:02 −0800 · The music ecosystem specified — PR #75
- **His words (in the spec, 2026-11-03):** "All parts that can be used by other tools should be tools … Packs for each tool. Each is novel.
  All tools have the full range of sound. Nothing is outside of the user's control. Then we need optimization. I want to make something
  better than Ableton."
- **His call:** the ecosystem's shape — components first, tools as assemblies, packs that must pass a novelty test, phases 0–7.
- **Built:** the bundle merged: the ecosystem index, object model, temporal model, timeline depth, canvas family, product vision;
  113 tool specs and 104 component specs (694 planned packs); three hand-written specs kept verbatim under their new entries.
- **Check:** `specs/eravos.music-ecosystem.spec` · merge `d00e8e6201804cc94d3816cedcd37bd928e0596a` · https://github.com/HorrisEllis/Eravos-Canvas/pull/75

### 2026-11-03 22:51 −0800 · First release, built by CI — PR #74
- **His words (2026-11-04):** "merge and push. release."
- **Built:** a release workflow that a manual run can publish from (tag + release from the app's version).
- **Proof:** release **v0.1.0**, published 2026-11-04 06:56 UTC by GitHub Actions run 41788365407 on a Windows runner:
  `ERAVOS-Setup-0.1.0.exe` (125 MB, sha256 `0e33f245…ec82b93`) and `ERAVOS_0.1.0.zip` (165 MB, sha256 `88cf3bb9…14df80f`).
- **Check:** https://github.com/HorrisEllis/Eravos-Canvas/releases/tag/v0.1.0 · merge `6c772fb053c57d4e312ae5d4b968a48456608f29`

### 2026-11-03 22:41 −0800 · A ledger and the migration plan — PR #73
- **His words (2026-11-04):** "i want to replace all the js with emerge and looking glass to make a full bottom up fully integrated program
  for eravos to beat ableton." · "note a ledger for completed work in a claude.md"
- **Built:** `CLAUDE.md` (direction, rules, a ledger of completed work with proof); the bottom-up migration plan.
- **Check:** `CLAUDE.md` · merge `de65f73aca469c226043fb4816ab840a822f99c8` · https://github.com/HorrisEllis/Eravos-Canvas/pull/73

### 2026-11-03 22:39 −0800 · Delete for good; Playwright removed — PR #72
- **His words (2026-11-04):** "i want to be able to delete packs, patterns" · "I don't need them brought back. some of them suck and i want
  to clean them up. some of them dont sound good, or are blown." · "remove playwright from eravos. thats what clearglass was for."
- **Built:** delete for any pack, preset, kit or pattern (shipped ones too), remembered across restarts; the in-house page driver
  (Clear Glass) gained an app mode, so the last third-party automation dependency went.
- **Proof:** `tests/p100-delete.test.js` 3/3; related suites green; `tests/no-playwright.mjs` with zero exceptions.
- **Check:** merge `6366e962a4f901c80a981d93fcc33dc678175695` · https://github.com/HorrisEllis/Eravos-Canvas/pull/72

### 2026-11-03 22:21 −0800 · Installs to the system in one run; a user library — PR #71
- **His words (2026-11-04):** "make the installer for installing to the system. also the projects should save to the downloads folder.
  same with the packs and tools. like documents/eravos" · "this is on windows, one run install."
- **Built:** `Install ERAVOS.bat` (elevates, builds, installs to Program Files, shortcuts, Settings › Apps, uninstaller); an NSIS
  `ERAVOS-Setup.exe`; the library in `Documents\ERAVOS` (projects, exports, packs, tools); the updater runs the new Setup.
- **Proof:** the installer compiles (makensis 3.09); the scripts pass PowerShell's parser; the library move exercised against a stubbed
  app. Then built for real by CI in v0.1.0.
- **Check:** merge `1e0ec6bdb8641d346c069c0db4f1d13188969d4d` · https://github.com/HorrisEllis/Eravos-Canvas/pull/71

### 2026-11-03 22:14 −0800 · The first shared components and the null-render harness — PR #70
- **His direction (the phase 0 rule):** extract shared parts "with no change in sound".
- **Built:** `wave-table`, `note-release`, `progression` components; the null-render harness.
- **Proof:** `node tests/components.mjs` — 14,000+ checks equal to the originals (progression alone: 13,826).
- **Check:** merge `f4fdd85305ec6ea8623508c269fd39005e9a194f` · https://github.com/HorrisEllis/Eravos-Canvas/pull/70

---

## Before this ledger: every merged pull request, 2026-10-15 → 2026-11-03

The detail of each (his words, what was decided, what was measured) is in `PROGRESS.md` (53 "Done" entries) and in each commit.
Times are the merge commits' (Pacific).

| Merged | PR | Merge | What |
|---|---|---|---|
| 2026-10-15 14:40 | #2 | 9851125 | Regenerate specs after the canvas/tools split |
| 2026-10-15 15:18 | #3 | 3d49909 | ERAVOS.exe: the exe folder has the project's layout |
| 2026-10-15 20:39 | #5 | 4a67786 | Wubs: wobble bass as four separate tools, each with its own pack |
| 2026-10-15 21:09 | #7 | 6e8c5ff | Wobble Bass 3.1: the sub-audio low end fixed, growl grit, dancehall presets |
| 2026-10-16 03:30 | #8 | bdbd9b4 | Wub & Reese songbook (9 genres, 91 songs) + Song Engine golden test fixed |
| 2026-10-16 13:57 | #11 | 191afb3 | Pad Forge 1.1: chords stop clipping, real stereo |
| 2026-10-17 03:21 | #13 | b7911bb | Measure every tool's output; fix the timing the engine hid |
| 2026-10-18 05:58 | #17 | 2d0dd70 | Wobble Bass 3.4: FM growl and squash |
| 2026-10-18 09:08 | #18 | 5e857ef | Wobble Bass 3.5: every control on the window, perform pad, rate glide |
| 2026-10-18 11:42 | #19 | 66b8a2c | Tool pages, Destroyer 2.0, links & mods, synthesis tools |
| 2026-10-18 21:05 | #21 | 54259f7 | ERAVOS Glass + COS (the host), a precise piano roll |
| 2026-10-19 02:17 | #22 | 96460d4 | MIDI on a fresh install, exe/web parity |
| 2026-10-23 04:42 | #28 | 61d7824 | Per-note settings, automation lanes, deep drops |
| 2026-10-23 06:19 | #30 | fed0ea1 | Oscillating curves, a Pitch lane, the Sketch tool |
| 2026-10-23 06:59 | #31 | 45bbad3 | Dynamic UI: curved note blocks, sound-reactive colours, note inspector |
| 2026-10-23 10:45 | #34 | a1fcadd | Arp 2.0: every move adjustable |
| 2026-10-23 16:44 | #37 | 4246dc1 | Heavy Drops suite; a page for every suite |
| 2026-10-24 01:12 | #42 | 27c9f56 | Floor Falls songs; right-click context menu |
| 2026-10-24 15:34 | #45 | 64e3d99 | Patterns page: genre families, quick picks |
| 2026-10-30 21:25 | #51 | 9d828b3 | Bassline, Bass Forge and Drum Forge the Groove way |
| 2026-10-31 05:18 | #55 | 75dbe72 | Specs: packs are full sound packs across tools; tool depth |
| 2026-10-31 20:29 | #56 | 9f44aad | Wobble Bass 4.0: full depth, step 1 |
| 2026-10-31 21:53 | #57 | 217b653 | Wobble Bass 4.1: wavetable, comb filters, mono below |
| 2026-11-01 00:00 | #59 | 82ccf83 | Spec: the components rule, project-wide |
| 2026-11-01 08:57 | #62 | 82d9e4a | Themes, a dependency graph; every pattern novel |
| 2026-11-01 11:04 | #64 | 2b9bcb3 | Every tool's colours react, measured tool by tool |
| 2026-11-01 15:45 | #66 | 182e446 | Looking Glass: the Electron-replacement map |
| 2026-11-03 14:23 | #69 | 1d5e0a7 | Installer + update service (3.99), the Field theme (3.98–3.100) |

The full list: `git log main --merges --format='%ad %h %s' --date=iso`.

## How this record is kept

- Every finished piece of work adds one entry here (newest first) and one line to `CLAUDE.md`'s ledger, with: the merge time, his words
  with their date, his call, what was built and by whom, the proof (numbers measured, tests run), and where to check.
- A claim without a pointer is not added. Numbers are re-counted when the table above is updated, with the command that counts them.

---

## 2026-11-06 — the evidence register (added; nothing above is changed)

> His words (2026-11-06T07:27:37Z): "Also ideas, choices and direction. All of me and what’s proof of competence and ownership, I want logged to a compotenxe and log. Timestamped and what came from it. The date and quotes exactly."

From this date every contribution is also logged, one entry each, in **`docs/competence/register.jsonl`** (append-only) → `docs/competence/REGISTER.md` (by ideas · choices and direction · competence · ownership and provenance · outcomes) and `docs/competence/LOG.md` (by time). Each entry: his exact words (checked word for word against their source), the time to the millisecond from the session transcript, who it came from (his / the AI coder's / outside), what came of it, the evidence, and its level — proposed · demonstrated · independently verified, never one score. `node build/competence.mjs --check` fails if an entry already merged is changed or a quote is not exact; it runs on every pull request. The merge of this work will be logged there as its own entry.
