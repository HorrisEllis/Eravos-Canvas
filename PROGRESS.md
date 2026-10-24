# ERAVOS — progress log

Where things stand, so work can be picked up in any session. Newest first.

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
