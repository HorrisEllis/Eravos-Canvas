# ERAVOS — progress log

Where things stand, so work can be picked up in any session. Newest first.

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
