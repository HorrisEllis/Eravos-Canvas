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
