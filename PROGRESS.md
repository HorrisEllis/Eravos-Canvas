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

## In progress — 3.48 (specs/eravos.phase48-map.spec)
P48.1 piano roll precision: BUILT (exact placement, paint/split/erase, both-edge stretch, grids, zoom, ruler,
multi-select, copy/paste, nudge, quantize/humanize/legato, velocity lane, typed values, step input). Next: P48.2 → P48.2 motion core (any knob can move) → P48.3 macros + perform pad + Destroyer 2.1 →
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
