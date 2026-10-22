# ERAVOS — progress log

Where things stand, so work can be picked up in any session. Newest first.

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
