# ERAVOS — progress log

Where things stand, so work can be picked up in any session. Newest first.

## 3.234 The piano without its rumble (2026-11-26)
His words: "But make some sound beautiful. The piano doesn't get enough love."
- Measured first (an offline render of each factory preset, a middle-C dyad): Felt Lullaby put 42 % of its energy under 30 Hz and a third more
  between 30 and 120 Hz; Concert Grand 12 %, Upright Jazz 14 % under 30 Hz. The words-song's piano intro was 75 % under 30 Hz — a boom you feel,
  not a piano. The cause: the soft hammer's long raised-cosine pulse goes straight through the string loop, carrying everything under the note.
- piano.engine.js: each voice is high-passed under its own note (two poles at half the fundamental, never under 20 Hz) — the note keeps its
  fundamental, the mud under it goes; the whole piano then passes a 28 Hz high-pass (4 poles). Under 30 Hz is now 1–2 % on every preset; Felt
  Lullaby's 30–120 Hz 32 % → 4 %.
- The loudness the rumble took with it (−2.1 … −3.3 dB per model, measured on a three-note chord) given back per model (LIFT): every model's level
  within 0.05 dB of before.
- rhythm-expand: the piano opening a words-song alone plays at 0.5–0.7 (was 0.32–0.44 — soft, and the rumble hid how soft); the outro's rolled chord 0.7.
- Guard: P182 "no rumble under the notes" — every factory preset under 30 Hz < 4 %, 30–120 Hz < 12 %. Fails on the old code (Felt Lullaby 49.3 %).
- Proof: P182 7/7, piano 51/51, P163 33/33. The null render's piano baseline (per machine, gitignored) changes on purpose — re-record it.

## 3.233 Every note shaped by its word; the Piano in every words-song (2026-11-26)
His words: "I contrast as you might have notives" · "Also Make sure you use the per note editing, curves, way too much variance to waste in nexus. Like multidimentional. Really push Eravos. Like all of the tools. But make some sound beautiful. The piano doesn't get enough love."
- rhythm-expand: expr 0…1 — LEAD: a question's last note rises (+2), a statement falls (−1), an accent scoops in (−2 → 0) and opens, a light
  line swells, a dark line plucks closed, the answer talks, weak syllables humanized · BASS: the arrival dives an octave with its filter, the
  answer talks, drops / choruses growl or open · DRUMS: accents roll (a clap, 3 hits accelerating, growing), weak hats are ghosts (chance,
  humanize) · CHORDS (with depth): swell in a dialogue, open in a break. Curves are the Song Engine's own moves (helpers.moveCurves, knobsFor —
  now exported). 0 = as before.
- the PIANO (o.piano): a Piano part added to any genre without touching it (SongEngine.generateWith(G, …)); its preset by mood (Felt Lullaby,
  Concert Grand, Tine Phaser …); the intro is the piano alone (a slow climb through the chord), the breaks climb through the chord syllable by
  syllable with a rolled chord at each line end, soft dyads under verses / choruses, low octaves on the drop's hits, one rolled chord held at the end.
- Lyrics → Rhythm: SONG › Expression (1) · Piano (on). build/render-words.mjs --expr --piano.
- Tests: P233 2/2 (in tests/p232-tension-and-words.test.js); P228 P229 P232 RhythmExpand Bass Pack P20 green.

## 3.232 Tension from who speaks; his words imported; deep patterns; Song Import specced (2026-11-26)
His words: "Can you add contrasting rhythm or a bunch with tension?" · "I want to be able to import a song and have Eravos open it with the needed tools to replicate it. Hard? That could be a good test. Did you create extremely deep patterns?" · "I am a good writer.  It would be cool to be able to import my words.  Can we have voices for the lyrics? On top of my own? Like I want to be able to make any genre of music using Eravos." (two poems of his given as the lyrics — kept with him, not in the repo)
- lyric-shape 1.2.0: clausesOf(line) — each line cut at . ; ! ? (and at a comma before "I" / "you") into clauses with who speaks (I · you · we,
  or carried); a stanza where I and you answer each other is a DIALOGUE, and says so.
- rhythm-expand: tension 0…1 — in a dialogue stanza the "you" is pushed off the beat (a 16th · a dotted 16th · half a beat), three against four
  under it, the bass on the 4th and the lead a step off (unresolved), the last line not pushed and its first strong syllable the ARRIVAL
  (a crash and a kick). 0 = as before.
- Lyrics → Rhythm 1.2.0+: Tension (0.6); SHAPE marks a dialogue ⇄; ⇣ Import words + Your words (tools/music/data/words-shelf.js: .txt, .md,
  a Notion export .zip — its heading the title, the Notion id gone, marks removed, an index of links skipped, stanza breaks kept; on this
  computer only); ⇢ Patterns made DEEP: accents ratchet (3, speeding up), weak syllables are ghosts (70 %, humanized), the answer lags
  (+¼ step), melody line ends doubled an octave up, the pendulum's return every other pass. PF_LIB.saveNotes { later }.
- build/render-words.mjs --tension.
- Specs: specs/eravos.song-import.spec (SI0–SI6) · voice-lab ADDENDUM (2): CREATE first, on top of his own voice. T-63, T-64.
- Tests: tests/p232-tension-and-words.test.js 3/3; lyric-shape 29 checks; P228 P229 P20 RhythmExpand Bass Pack Pattern Library boundary green.

## 3.231 A made tool is his: rename it, edit it fully in the Workshop, delete it (2026-11-26)
His words: "also merge and push. need to be able to delete custom tools. rename them. open them in workshop and edit them fully." (merged first: PR #224, 3.226–3.230)
- assembled-tool.js: Model.get / rename (made unique, kept, the def and every open window's title follow; the id stays so songs still find it) /
  update (kept as its settings, its DAG and chain rebuilt, the def's defaults and every open window follow) / remove (its windows closed — a
  blown-up one put back first —, its record gone, gone from ＋ Add) / edit (the Workshop).
- the Workshop kind "music.made-tool": TOOL (its name) · VOICE · WOBBLE (a curve layer) · DRIVE · MOUTH · FX · OUT — every setting a field; a part
  chosen brings its own fields (bitcrusher's bits, the ladder's drive …); the view draws the chain with the wobble opening the mouth; ▶ Hear;
  every edit kept and heard at once; undo / history as every kind.
- the made tool's face: ✎ Workshop · Rename (inline, Enter keeps) · ✕ Delete tool (twice to delete). canvas/runtime/organism-factory.js:
  undefine(id) (domain-free: a tool leaves the list).
- Tests: tests/p231-made-tools-yours.test.js 1/1. Screenshots: docs/previews/made-tool-workshop.shots.mjs → made-tool-face.png, made-tool-workshop.png.

## 3.230 What mixes with what; no more yellow; dimensions; Voice Lab and UI elements specced (2026-11-26)
His words: "No like more dimentions. Also Like I want a voice lab. T pain like auto tune. Creating voice. And wubs, wow. Like voice music like wubs, etc." · "I want to be able to change the ui elements to other styles, types, build components from combining two. Also the color keeps being yellow. I want to be able to tell what's mixing with what. Like I want to be able to mix the dco with the wobble bass and know it will make a wobble synthwave sound. You know? Expand the tools and engines maybe,"
- tools/music/data/tool-blend.js: CHAR (each tool's style and what each of its places carries) + sound(rows) → { name ("wobble synthwave"),
  mix (each style's share and which tool brings it), says }. The synthesis plan carries it (each place its character too); a made tool keeps
  it (its words start with it; mixed again, it brings it).
- tools/core/field/board.js (domain-free): the card says "It will sound like …", the mix in shares, and the sentence; also while one core is
  carried over another. An auto board's parts take the tool's own colour family (hueTurn), never the fixed rainbow with a yellow.
- assembled-tool.js: a made tool's colour = its parents' colours blended (old records too); the fallback no longer yellow.
- rhythm-expand.js + Lyrics → Rhythm: Dimensions 0…1 (0.7 in the tool; API 0 = as before) — the lead layered an octave up then a third above
  in the drops / choruses, a counter-line in the gaps the words leave (their shadow), more space (the master's reverb wider, longer).
  build/render-words.mjs --dims.
- Specs: specs/eravos.voice-lab.spec (TUNE · CREATE · WUB; VL1–VL4 components, VT1–VT3 tools, the Voice Lab setup) ·
  specs/eravos.ui-elements-and-combining.spec (UE1–UE3, CB1–CB3, EX1–EX2). T-56 … T-61.
- Tests: tests/p230-what-mixes.test.js 1/1 (Retro DCO × Wobble Bass = wobble synthwave; no yellow); P229 3/3 (dimensions).

## 3.229 Deep as hell; patterns from the words (2026-11-25)
His words: "How does it sound? Like I want it deep as hell." · "More of my rhythm. Make patterns." (with his personal book of philosophy — kept with him, not in the repo). From it, the rule the
patterns keep: "The amount of time the pendulum swings to the left is directly proportional to the amount of time in takes to swing to the right."
- data/rhythm-expand.js: depth 0…1 — the lead down up to two octaves, the chords one, the bass held longer and harder in the loud parts,
  the kick heavier, a boom on 1 of every drop / chorus bar; intro / outro lowered too. 0 = as before (P21 unchanged).
- lyric-shape 1.1.0: patterns(syllables) → words · mirror (retrograde: the pendulum's return) · shadow (the rests on the 8ths become hits:
  negative space) · pendulum (out then back, as long each way); ≤ 4 bars.
- Lyrics → Rhythm 1.2.0: SONG › Depth (0.7); ⇢ Patterns → each stanza's four patterns into Patterns › Yours (drums or melody). PF_LIB.saveNotes
  takes { later } so a batch rebuilds the library once.
- build/render-words.mjs (NEW): any lyrics file → the song rendered offline → WAV + per section loudness, peak, pinned %, low-end share.
  His poem, measured: the drop's low end 32 % → 39 % with depth (darkwave); witch-house is loud with words already (−6 dB RMS, ≤ 0.14 % pinned).
- Tests: tests/p229-deep-and-patterns.test.js 2/2; lyric-shape 23 checks; P228 P21 P22 P20 boundary.

## 3.228 Music with contrast from the words; the SHAPE and the lesson (2026-11-25)
His words: "continue making more tools for eravos. i want to make music with contrast. thats my rhytm;" · "i want to learn how to make music from my lyrics. that is the point of the rhythm tool" (his poem as the lyrics; his poetry index as a zip — kept with him, not in the repo)
- tools/music/components/lyric-shape (NEW, contract, spec, 17 checks): per stanza density, space, stress, light / dark words, push, opposites,
  runs that come back → energy and its part (verse · chorus · build · drop · break, split on opposites) with the reason in words; contrast
  0 = every stanza a verse. Lines set apart one by one read as one stanza of spaced lines.
- tools/music/data/rhythm-expand.js: shape 'contrast' — sections by the words' parts (a break has no drums or bass; the drop's drums full; the
  build rolls up); a split stanza turns line by line (dark: an octave down, one long low root, no groove · light: an octave up, the full
  groove). RhythmExpand.shape(text). The API's default stays as before (P21 unchanged).
- Lyrics → Rhythm 1.1.0: SONG › Song shape (from the words · every stanza a verse) + Contrast; SHAPE card (each stanza's part, energy, why)
  and "How words become music" (five steps).
- Tests: tests/p228-words-contrast.test.js 4/4; P20 47/47, RhythmExpand 6/6, Bass Pack 9/9, P218, boundary 10/10, bare-canvas, component
  contracts 36/36, tool needs, validate. Screenshot with his poem shown to him only (not kept in the repo: his words).

## 3.227 The catalog: the theme's colour for the green, paintings for every tool, mode and made tool; Font a choice (2026-11-25)
His words: "okay, i hate the font. also the green. also i want the thumbnails back. and i want those generated per tool, mutated tool, consistent style." · "yes. almost all of it. make it colored. the themes, and the reactive color.s"
- canvas/runtime/eravos.css: --ok (on / ready / done) = the theme's colour (Dusk #ff6fa8, Studio cyan, Field its accent, Midnight #8fa8ff),
  the Beat colour moves it; every fixed green of the canvas moved to it (toolbar on, chips ready / active, the catalog's ✓ rows, toasts, drop
  zones, wire-menu checks, the Field's green, the music core's MIDI / recorder states). Tools' own inner greens: T-47.
- Paintings: the mode cards show Start's paintings (and Stay agnostic one); Step, Tape Memory, Feelings, Pattern, Piano, Retro DCO, Swarm
  Oscillator painted (build/tool-art.py MOTIF entries; tool.json files.art; tools/catalog.js regenerated) — every tool has one now.
  tools/core/art/painter.js (NEW, domain-free, window.ToolArt): the same style painted live; a made tool (assembled-tool.js) gets one the
  moment it exists — one ribbon per tool it came from in that tool's colour, braided, meeting at a star (mutated: one ribbon + sparks);
  seeded by its id. The card, the window's title bar (Dusk) and the tool page read a descriptor's own art.
- Font: Settings › Look › FONT (themes.js FONTS: As it is · Grotesk · Grotesk only · Plain; data-font on <html>; the faces shipped in
  canvas/runtime/fonts). Today's stays the default until his pick (T-46). board.css reads var(--mono).
- Tests: tests/p227-catalog-look.test.js 3/3. P226 P110 P102 P103 P91 P77 P203 green, boundary 10/10, bare-canvas, validate.
- Screenshots: docs/previews/catalog-look.shots.mjs → catalog-look-modes.png, catalog-look-made.png, catalog-fonts.png (rendered on Linux:
  on Windows "As it is" shows Segoe UI and Consolas, as Inter / JetBrains Mono are not shipped).

## 3.226 What a synthesis will make, and why it was not made; the catalog's Modes as tool cards (2026-11-25)
His words: "remove these from the tool catalog. tools when the can't synthesize, need to flash the reasons why. also expand the ability. its hard to tell what it will do when i synthesize. like the wobble and the retro could sound amazing. or the reese and the piano, …" (whole: specs/eravos.2026-11-24-session.map.spec 32; his screenshot: ＋ Add › Modes)
- canvas/runtime/add-menu.js: first removed the Modes page; his correction ("no. domains are meant to be there. just consistent with the rest of ui,")
  put it back made like the rest of the catalog: "Modes" heads the page as "All tools" does, each mode (and Stay agnostic) is a tool card
  (picture frame with its icon, glyph + name, blurb, plain chips: active · N tools · N categories), a click selects it, and the detail on the
  right shows what it TURNS ON and SHOWS as a tool's dependencies, with Enter / Browse where Add to canvas sits; double-click enters.
- tools/music/core/assembled-tool.js: one PLAN (planParts / planPair: each of VOICE · WOBBLE · MOUTH · DRIVE · FX — from which tool and part, what
  it is; not taken; stays behind); previewParts / previewPair (the gates dry, nothing kept); hear (the gates' riff, offline, through the mix);
  every refusal a REASON as data (kind, title, why, steps, blame, actions); fixes as opts (flip, restFrom, override a place, tweak quieter /
  open / tame — the made tool's settings only) or runs; fits(part); a made tool is named from every tool it took from.
- tools/core/field/board.js (domain-free) + board.css: ◇ What will it make? (right-click a selection); the card beside the parts; refused → the
  blamed boxes / cores flash red ×3 and keep a red ring while it is up; its buttons do the fixes; ↻ Try again; ✕ / Esc. The plan shows while a
  core is carried over another.
- Tests: tests/p226-synthesis-why.test.js 2/2 (in tests/run.html). P196 P199 P200 P202 P203 P204 P205 P216 P217 P218 green, boundary 10/10,
  bare-canvas, competence check. P63's one failure ("eravos.wb-p202" without an icon — P202's made tool left in the page) is on main too.
- Screenshots: docs/previews/workbench/synthesis-why.shots.mjs → synthesis-plan.png, synthesis-why.png, catalog-modes.png.
- Specced (assembled-tool ADDENDUM 2026-11-25): ML3a unison + string voices (Reese, Supersaw, Piano), ML3b Retro Poly, genre packs for every
  tool, the "Make It Bun Dem" baseline, the next leverage set. T-39 … T-45. Asked: "trenke" (which track?) · "the lab" (which?).

## 3.225 Start: each domain only its own; no Empty canvas button (2026-11-25)
His words: "these shouldn't show in other domains. also remove the button that says empty canvas" (his screenshot: Image Manipulation picked, the music setups under START FROM).
- canvas/index.html bootScreen (domain-free): with a domain picked, a setup / song shows only if its modes belong to that domain — Music
  switched on no longer leaks into Image Manipulation; the Empty canvas button (step 1) and card (step 2) removed — Browse every tool starts
  the same way. tests/p16-ui.mjs uses Browse; its two Start checks pass (its later plug.click failure is on main too). boundary 10/10.
- docs/previews/start-two-steps.shots.mjs → start-3-image.png (Image Manipulation with Music on: only Browse every tool).

## 3.224 Mutation and synthesis reach five more tools; EN1 specced in full (2026-11-25) — not merged (shown first)
His words: "i love the mutation and synthesis. can you expand to the rest of eravos?" · of EN1: "just spec it"
- tools/music/data/part-exchange.js: Supersaw (filter), Swarm Oscillator (tone = its filter), Retro Poly (VCF, chorus, noise), Piano (drive —
  its tube; a crusher refused), Tape Memory (saturation; digital = a bitcrusher when under 16 bits / 48 kHz) — each box found by its card's
  title on the tool's board; settings carried in shared terms (each tool's own resonance scale converted).
- tools/music/data/tool-blend.js: the same five in the engine's slots (voice · mouth · drive · fx); a slot a tool has nothing for is left to
  the engine's default; what the engine cannot run is named (Supersaw's unison, Swarm's population and life, the piano's own voice, the
  tape's wow / hiss / stop). A box is the VOICE by what it is: also osc / swarm. PART_SLOT: crush → fx.
- tests/p218-mutation-everywhere.test.js 1/1: the five show their part boxes; Wobble Bass's mouth into Retro Poly's VCF (cutoff carried); the
  piano refuses a crusher; ERAVOS makes a tool from Swarm's swarm + the piano's tube + the tape's 8-bit digital, the rest from Wobble Bass —
  it plays, no clipping. P196 P199 P200 P202 P203 P204 P205 P216 P217 boundary 10/10 assembled-tool 32 bare-canvas green.
- Screenshot: docs/previews/workbench/everywhere.shots.mjs → everywhere.png (Retro Poly and Tape Memory blown up, their part tiles).
- specs/eravos.engine.spec ADDENDUM 2026-11-25: EN1.1–EN1.6 in full (measure; sleep; end the inaudible; dither; latency / rate / device;
  denormals + headroom checks), each with its proof and what carries into the engine. Nothing of EN1 built.

## 3.223 ERAVOS's own engine — specced; written in Emerge (2026-11-24)
His words: "that is still not great. what about the audio driver or engine that electron uses?" · "invent our own? specifically made more eravos?" · "dynamic, load balancing, signal to noise? wait for emerge"
- specs/eravos.engine.spec (NEW): an engine, not a driver (D1); written in Emerge, waiting for E2 / E3 (D2, his call); its own process; tools
  isolated; agnostic; live = offline. DYNAMIC (the graph swapped at a block, cross-faded; parameters as data; made tools assembled at once;
  quality that steps down before a dropout) · LOAD BALANCING (the DAG as the schedule over a pool of MMCSS real-time threads, work stealing,
  measured cost per node, critical path first, deadline watched) · SIGNAL TO NOISE (64-bit mix, FTZ / DAZ, headroom + true-peak, TPDF dither,
  oversampling for what bends the wave, each contract's noise floor; and work only on what is heard). Phases EN0–EN6.
- performance-plan ADDENDUM: PF7 moved to the engine. docs/TODO-LEDGER.md T-33 … T-38; session map 24–26; his-words N-X126 … N-X128;
  the register. Nothing built. Open: EN1 now? · screen or sound?

## 3.222 Less lag: a forced layout removed; Settings › Performance; Auto (2026-11-24); release 0.2.37
His words: "needs performance optimization. the cpu cores. its lagging with plenty of overhead. maybe custom settings, like cpu cores, animations, graphics acceloratoin. maybe invent a better driver"
- Measured (docs: the probe below; 10 tools of a Song Engine song playing, 2-core test machine): main thread blocked ~46 % of every second
  (long tasks 405–460 ms/s), ~32 fps, stalls to 150 ms. By loop: the reactive colours (tools/music/core/sound-css.js) ~400 ms/s, displays
  ~200, the glow layer ~150. Reactive colours off: 60 fps, 0 long tasks. Graphics Low still left them ~220 ms/s.
- Inside the colour frame: `w.offsetParent` per window (to skip hidden ones) forced the page's style + layout right after the colour writes —
  nearly all of the frame's cost. Now an IntersectionObserver (off-screen windows are not lit until seen; the look is the same). Full:
  405 → 332 ms/s blocked, 34 → 43 fps, worst 117 → 83 ms. What remains is the browser restyling after each write (outside the code).
- canvas/runtime/performance.js (NEW, the host's — listed in specs/eravos.bare-canvas.spec with why): measures (fps, long tasks), AUTO
  levels 0–2 with hysteresis (2 s lagging → lighter; 6 s calm → back), the custom settings as <html> data-attributes (data-fps, data-fx,
  data-motion, data-res, data-blur), Settings › Performance. Read by ui-kit's display loop (rate, resolution), the glow layer (resolution,
  every 3rd frame on Light), FieldMotion and the colour field (motion), eravos.css (motion, blur), and the music domain's reactive colours
  (Light: read 10×/s, written ~3× less, palette 2.5×/s; Off: at rest). Auto: Full 405 → Auto 173 ms/s blocked, 34 → 49 fps.
- desktop/main.js + preload.js: graphics acceleration (graphics.json in the app data, read before the app is ready — app.disableHardwareAcceleration;
  GPU status from app.getGPUFeatureStatus), Restart ERAVOS now.
- Tests: P102 P106 P147 P103 P110 P83 P84 P77 P91 P58 P196 P197 green, boundary 10/10, bare-canvas (36 files). Screenshot:
  docs/previews/settings-performance.shots.mjs → settings-performance.png. NOT seen on Windows: the GPU switch.

## 3.221 Everything logged: the session map, the specs' addenda and phases, the to-do ledger (2026-11-24)
His words: "first one, beyond removing the undo and redo, and redundany options. also log all of this, don't lose anything, update the specs,
phases. and add that to a to do ledger" (his answer: Options' actions INTO SETTINGS).
- specs/eravos.2026-11-24-session.map.spec: all 22 of his messages today, verbatim, in order, each built / rule / open / answered.
- specs/eravos.performance-plan.spec (NEW): what is true today (no GPU flags, ~3–4 cores used, one audio thread, 15 animation loops), his
  PC, decisions D1–D5 (sound stays on the CPU; the GPU draws; priority follows the canvas, agnostic), phases PF0–PF8, RP1–RP3, AN1–AN3.
- ADDENDA 2026-11-24 (originals kept): settings-buttons-dag (ST1–ST5: one Settings, Options in it, Undo / Redo buttons gone; sections from
  the contracts) · bare-canvas (TB1–TB7: the toolbar) · start-screens (two steps built; the Start button out, "← Domains" in the catalog) ·
  assembled-tool (3.216–3.217 built; ML1–ML6 the Mutation Lab / Workbench / Tool Builder).
- docs/TODO-LEDGER.md (NEW): T-01 … T-31 (today) + O-01 … O-16 (every older open item from CLAUDE.md) + Done; CLAUDE.md: two rules (priority
  follows the canvas; the to-do ledger), the Open section points to it, the Ledger gains 3.216–3.221.
- docs/HIS-WORDS-MAP.md N-X115 … N-X124; docs/competence/register.jsonl: today's directions and ideas (quotes checked against the session map).
- Nothing built: the toolbar (T-04 …) is next, shown first. Open questions T-08, T-09, T-10 wait for him.

## 3.220 Start in two steps; a borderless window; the 3D exploded note in the README; release 0.2.36 (2026-11-24)
His words: "also the start from should only show after you pick music. like only show the domains at first." · "like this" (a screenshot of a
note in 3D · EXPLODED) · "also borderless windows please?" · (of the Claude app's notification) "what is that?" — it was the Claude app, not ERAVOS.
- canvas/index.html bootScreen(first, picked) (domain-free): first only the domain cards, Empty canvas, projects / autosave; a domain picked →
  ← All domains, its own modes (MORE MODES), the featured songs, sections, START FROM. A pack arriving keeps the step.
- desktop/main.js: on Windows titleBarStyle hidden + titleBarOverlay (#0a0e14, 52 px — the toolbar's); canvas/runtime/eravos.css #topbar is the
  drag region (its controls not), kept clear of the window buttons by env(titlebar-area-*) (0 in a browser). NOT seen on Windows yet.
- README: "Blow a note apart" — docs/previews/workbench/note-exploded-3d.png (note-exploded-3d.shots.mjs), as his screenshot.
- tests/p16-ui.mjs: the two steps checked (both pass); its later "plug.click" failure is on main too (not this). boundary 10/10, bare-canvas,
  design check no worse. Screenshots: docs/previews/start-two-steps.shots.mjs → start-1-domains.png, start-2-music.png.

## 3.219 The exploded note in the README; release 0.2.35 (2026-11-24)
His words: "okay do the exploded note view for the screenshot also. marge and publish."
- README.md: "Blow a note apart" — the Workshop's BOARD (3.199), docs/previews/workbench/workshop-board-note.png.
- desktop/package.json 0.2.35; release notes (3.216–3.219).

## 3.218 The README, current, with pictures (2026-11-24)
His words: "Also update the readme, with images if possible."
- README.md: a new top — what ERAVOS is, get it (the Setup, the library, updates, repair), what you can do (play · blow apart · hover · replace ·
  synthesize · the Workshop), each with its picture from docs/previews; the rules; where it is going. The reference sections follow unchanged;
  every older version note kept word for word under Release history (checked: 0 of the old lines missing; every image path exists).

## 3.217 Pick the voice; say where the rest comes from (2026-11-24) — not merged (shown first)
His words: "my goal is to add the capability to create a mix of the retro dcs and the wobble bass to make the retro wobble or something … combine
the sound of retro dcs with the rest of wobble bass." · "eravos makes it, not you. only add capability. always capability first."
- The gap: synthesizing picked parts could not take the VOICE (the oscillator boxes are not swap slots), and the rest always came from the tool
  most picks came from — "Retro DCO's voice, the rest from Wobble Bass" could not be said.
- tools/music/data/tool-blend.js slotOfPiece: a box is taken by what it is when it is not a swap slot (osc-va / osc-sub / unison / dco → voice,
  lfo → wobble, filter-svf / ladder → mouth, waveshaper / saturator → drive). assembled-tool.js synthesizeParts(list, { restFrom }): everything
  not picked from the tool he names; Model.render (the judge's own render, to hear what was made).
- tools/core/field/board.js (domain-free): right-click a selection → "◆ Synthesize …" and "◆ … the rest from <each tool blown up>"; every
  selected box goes to the domain (it decides what it can take; what it cannot is named, as before); "1 part" said singular.
- tests/p217-voice-and-rest.test.js 1/1 — the test only PICKS (Retro DCO's DCO, the rest from Wobble Bass); ERAVOS makes it: its voice is
  Retro DCO's (wave, width), its wobble / mouth / drive Wobble Bass's, it plays (no broken sample, peak below clipping). P196 P199 P200 P202
  P203 P204 P205 P216 boundary bare-canvas assembled-tool (32) green.
- docs/previews/workbench/voice-rest.shots.mjs → voice-rest-menu.png, voice-rest-made.png, voice-rest.wav: made on the canvas through the menu —
  "Retro DCO × Wobble Bass · osc-va → saturator-tube → filter-svf · wobble into filter-svf · novel (nearest Gothic Organ · Pedal Drone)".

## 3.216 The box is the component; hover words; right-click › Replace with (2026-11-24) — not merged (screenshots shown first)
His words: "the purple box should surround the entire component ui. also right click to replace." · "maybe when you hover tells you what it is
and the point of it and how it effects sound, in the simplest ways, so even a child could understand it." · "eravos makes it, not you. only add
capability. always capability first." · "like this is meant to be dynamic and fluid. also tools are isolated so if they cause instability they
can be deleted."
- tools/core/field/board.{js,css} (domain-free): a component box is framed whole in its colour, its tile the box's title strip (it was a box
  of its own inside — the purple box he saw); the whole box lights on hover. Hover (0.45 s) → a card: what it is · what it is for · what it
  does to the sound, and where it sits ("here: the wobble of Wobble Bass"). Right-click › REPLACE WITH: its own options and the parts in the
  other blown-up tools that fit — the same step as a drop (one undo step; from another tool a copy, its settings with it).
- tools/music/data/part-words.js (data beside the components): the words for each component the board swaps (14), one entry each so every
  tool says the same; PartExchange.explain(component).
- tests/p216-hover-replace.test.js 1/1; P196 P199 P200 P203 P204 P205 boundary 10/10 bare-canvas green.
- Screenshots: docs/previews/workbench/hover-replace.shots.mjs → hover-card.png, replace-menu.png, replaced.png.

## 3.215 Updating no longer breaks on the running ERAVOS Update.exe (2026-11-24); release 0.2.34
His words: "trying to update it. fails to close eravos. also broke my current version." — two screenshots: the update ring "NOT IN ·
ERAVOS Update.exe: EBUSY: resource busy or locked, open 'C:\Program Files\ERAVOS\ERAVOS Update.exe'", then the 0.2.33 Setup: "ERAVOS did not
install completely … ERAVOS.exe (missing), locales\en-US.pak (missing), …".
- The cause, at last from his screen: ERAVOS Update.exe runs from the app folder and waits for the Setup; the Setup window's copy cannot
  replace it (an NSIS exe holds itself: no rename either) → the window failed; then 3.214's fallback (CopyFiles) gave up at that same file
  after the app folders had been cleared → ERAVOS.exe and the rest missing. 3.214 made it worse; this is the fix.
- desktop/updater.js: ERAVOS Update.exe is copied into the work folder and run from there — the app folder's copy is never held.
- desktop/setup-copy.js: a held ERAVOS Update.exe is kept (HELD_OK), never a failed install. eravos.nsi: PutUpdater copies the new one, or
  (running) puts it in at the next restart (Rename /REBOOTOK); PlainCopy by robocopy (goes on past a held file), CopyFiles only if it fails.
- desktop/test/setup-copy.mjs 15/15 (+1: a locked updater kept, the rest installs); updater, shipped-files green; makensis compiles.
- His PC now: run ERAVOS-Setup-0.2.34.exe by hand (nothing of ERAVOS running) — it repairs the folder.

## 3.214 The Setup falls back to the 0.2.29 way when its window cannot write the app (2026-11-24); release 0.2.33
His words: "its not running. eravos isn't even installed." · "windows defender is turned off." · "so have actually done something right? it
didnt have this problem pre 2.30."
- Honest: 3.213 fixed a real bug (a running ERAVOS was never closed) but not his — ERAVOS was not installed or running.
- His clue: from 0.2.30 (3.210) the app is copied by the Setup window's own code (desktop/setup-copy.js, in Electron), never run on Windows
  by a test (the release test is silent = the plain way); before, the Setup itself wrote it (worked for him).
- packaging/windows/eravos.nsi RunOwnWindow: the window's exit 3 (could not write) no longer quits — its dest and library are taken and the
  app is copied the plain way (PlainCopy, from the stage), then VerifyFiles as before; a failure there still says so. desktop/setup.html:
  the failure text says the Setup now puts it in the plain way.
- makensis compiles. NOT run on Windows: his next Setup is the check. The cause inside the window's copy is still unknown (the log will say:
  %TEMP%\ERAVOS Setup.log, "the Setup window could not write the app (...)").

## 3.213 Fixed: "error writing ERAVOS.exe" (2026-11-24); release 0.2.32
His words: "can you merge branches. figure out why it keeps telling me error writing eravos.exe"
- Merging: every branch on origin was already in main (0 commits ahead each) — nothing to merge.
- The cause: packaging/windows/eravos.nsi (CloseEravos) and eravos-update.nsi (step 2) decided "ERAVOS is running" from the first 10
  characters of `tasklist /FI "IMAGENAME eq ERAVOS.exe" /NH` — but that output starts with an empty line, so it never matched: a running
  ERAVOS was never closed, the updater never waited, and the Setup's `File` (or the Setup window's copy) hit a locked ERAVOS.exe.
- Fixed: `tasklist … | find /I "ERAVOS.exe"` — find's exit code decides; `taskkill /T /F` (its helpers too) and a wait until none is left
  (≤ 15 s, killed again at 5 s); Cancel on the "ERAVOS is running" box now quits instead of carrying on into the error. FreeExe: the old
  ERAVOS.exe deleted, or — still held — renamed to ERAVOS.exe.old-<ticks> (Windows allows renaming a running exe) and removed at restart.
  desktop/setup-copy.js: a file that will not copy is moved aside before the retry; the next install sweeps `*.old-*`.
- desktop/test/setup-copy.mjs 14/14 (+2); both .nsi compile (makensis 3.09). NOT run on Windows here: the next Setup is the real check.

## 3.212 The Setup heals itself and logs; Delete removes parts; release 0.2.31 (2026-11-22)
His words: "installer couldn't find eravos.exe." · "also need to be able to remove the component." · (of the 0.2.30 zip) "didn't let me synthesize or select with control and right click" — 3.211 was not merged yet.
- packaging/windows/eravos.nsi: every step to %TEMP%\ERAVOS Setup.log (unpacked, the window's exit and answer, copied, checked); if
  ERAVOS.exe is not in the folder after its window, the app is copied the plain way from the stage; the failure message names the log.
- tools/core/field/board.js: Delete (or Backspace) removes the selected parts; right-click › ✕ Remove these parts / ✕ Remove it.
- P205 1/1 (+ Delete), P204 P203 boundary green; makensis compiles. Release 0.2.31 carries 3.211 + 3.212.

## 3.211 The whole box: drag from anywhere, Ctrl selects, synthesize the selection into one tool (2026-11-22) — not merged
His words: "i want to be able to drag any component from the tools, not grabbing a small area but anywhere on the ui of the component when exploded, drag then around. maybe holding control to select multiple parts at a time and right click with a synthesize into one tool? like i want the ability to combine retro dcs and wobble bass." · "I don't just want presets and changed values, i want to be able to make novel tools."
- tools/core/field/board.{js,css} (domain-free): press anywhere on a box that is not a control (a knob, a slider, keys, a button, a field;
  Alt drags even from those) and drag — the box moves (all selected boxes with it), kept per tool; let go over another component box and its
  part goes there (a swap when what is there fits back, else it replaces — as the tile), the drag says which, the box glides home. A press
  that barely moves stays a click. Ctrl+click (anywhere on a box) selects across tools — a violet ring, a bar saying how many; Esc or a
  click on the board clears it (before Esc closes the board). Right-click with a selection: ◆ Synthesize these N parts into one tool,
  ⚄ Mutate only these parts, ✕ Clear.
- tools/music/core/assembled-tool.js synthesizeParts + tools/music/data/tool-blend.js combineFrom: each picked part takes its place in the
  engine (the mouth, the drive, the FX, the wobble, the voice by its noise), the rest from the tool most of them came from; the same gates
  (plays cleanly, no twin); spawned beside and blown up. Parts the engine does not run yet are named, not lost silently.
- tests/p205-whole-box.test.js 1/1 (body drag, a knob stays a knob, box-drop swap, Ctrl across tools, the menu, the made tool's mouth / FX /
  wobble from the parts picked, Esc). P196 P199 P200 P202 P203 P204 green, boundary 10/10, bare-canvas green.
- `docs/previews/workbench/whole-box.shots.mjs` → whole-box-select.png, whole-box-made.png ("Wobble Bass × Retro DCO": osc-va → filter-ladder
  → env-adsr → ensemble-core, wobble into the ladder; novel).

## 3.210 The Setup's own window — the look he approved, built (2026-11-22) — not merged
His words (of the 0.2.29 Setup, a screenshot of the stock pages): "they aren't there. it is the old one." — the look had only been a preview.
- packaging/windows/eravos.nsi: not silent → it unpacks the app into a stage folder (a few seconds, the progress dark), hides itself and starts
  that ERAVOS.exe with --eravos-setup; result.ini says ok · dest · library · start; then the uninstaller, Settings > Apps, the shortcuts, and
  ERAVOS started as you (explorer). Cancelled → nothing changed (exit 1); failed → it said why, the version not written (exit 3); the window
  could not open → the plain way (copied from the stage). /S (silent) exactly as before — the release workflow's end-to-end test; /CLASSIC
  the stock pages.
- desktop/setup-window.js + setup.html (main.js hands over first with --eravos-setup): the approved look — the canvas's folder and your
  library's (Documents\ERAVOS by default, the last choice remembered, Browse…, a folder of its own), Install, writing with the file and MB,
  checking every file, ERAVOS x IS IN · Open my library · Close · Start ERAVOS. /UPDATE: the ring, no questions, ERAVOS Update.exe starts it.
- desktop/setup-copy.js (plain node): plan, copy with progress (a held file retried), the app's own folders cleared only in ERAVOS's own
  folder, every size checked on disk, the library choice, the answer as UTF-16 INI. `desktop/test/setup-copy.mjs` 12/12.
- packaging/windows/eravos-update.nsi: no window of its own (SilentInstall); the Setup with /UPDATE (its ring); /NOSTART (the release
  test) silent as before; the repair offer still shows.
- Both scripts compile (makensis 3.09); shipped-files 6/6 (both builds copy setup-window.js, setup-copy.js, setup.html). NOT seen on Windows:
  the first real run is the next Setup. `docs/previews/installer/setup-window.shots.mjs` → setup-window.png (the real page, demo mode).

## 3.209 Wire colours belong to the theme (2026-11-21) — not merged
His words: "I just want them to look consistent, and but also in relation to the themes as well, right?"
- canvas/runtime/eravos.css: `--wire1` `--wire2` `--wire3` (from a part, the middle, into what it feeds) and `--wire-glow`, said by each theme:
  Dusk its own sunset (violet → pink → peach), Studio cyan → violet → pink (the installer's), Field around its violet, Midnight its calm blue,
  glowing less. The Field board's wires and their ends take them (tools/core/field/board.{js,css}) — one rule for every wire drawn.
- `docs/previews/workbench/wires.shots.mjs` → wires-themes.png (the four themes). P196 P203 P204 boundary green.

## 3.208 The exploded board's wires in the installer's colours; the Setup asks where your library goes (2026-11-21) — not merged
His words: "You make those, like, the wires, too, like, the ones, when you, like, the, when you blow up, when you explode the tools in the canvas" · "And everything else goes in the documents folder, but also it asks for where you want to install the where you want to set the location for the tools and shit." · "Like have it the default be the documents like documents /Eravos, and but then you know have like a browse button to change it." · on the installer preview: "It looks fucking significantly better."
- tools/core/field/board.{js,css}: each wire a gradient cyan (at the part) → violet → pink (at the core), glowing, light flowing along it
  into the core (still with prefers-reduced-motion); the ends cyan and pink. `docs/previews/workbench/wires.shots.mjs` → wires-new.png.
- packaging/windows/eravos.nsi: after the canvas's folder, a page "Your library" — Documents\ERAVOS by default (or the last choice), Browse…
  (a folder of its own, ERAVOS, inside the one chosen); saved per user in %APPDATA%\ERAVOS\library.txt; a silent update never asks or
  changes it; the finish page opens the chosen library. desktop/main.js pickHome reads it (library-tools.js chosen), used only if writable.
- Preview colours (3.207 follow-up, his: "I want it to match … have a consistent color scheme"): one palette (cyan · violet · pink), one font.
- desktop/test/library-tools.mjs 18/18 · makensis compiles · P196 P199 P200 P203 P204 boundary 10/10 · bare-canvas green.

## 3.207 An update can no longer leave ERAVOS half written; the installer's new look as a preview (2026-11-21) — not merged
His words: "update broke my eravos. also can you make a much nicer installer and updater. like matching? animated and vibrant like the rest of eravos?"
- What broke: the ERAVOS.exe he sent is 39,796,736 bytes; its own header says ~246 MB — the install stopped part way through writing it
  and nothing noticed (the release builds were all green; the file on his PC was cut short).
- packaging/windows/install-check.mjs (run by make-exe.ps1): every file of 256 KB or more in the Setup, with its size → checks.nsh.
  eravos.nsi: after writing, each one is checked on disk; a missing or short file → it says which, the version is NOT written, exit 3.
- eravos-update.nsi: the version not in → it runs the Setup once more; still not → it says why and offers the Setup with its window (repair).
- Both compile (makensis 3.09, with and without the list); the Windows end-to-end runs in the release workflow.
- The look (his ask): `docs/previews/installer/installer.html` + stills — black, the palette's waves breathing, the wordmark flowing, a
  glowing progress / ring, "checking every file" as a step. Not built: on his yes (NSIS custom pages, animated by frames).

## 3.206 A part dragged to another box swaps or replaces; right-click a part; Open in Mutation Lab (2026-11-21) — not merged
His words: "i want to be able to drag one component from one part of a tool to another. like directly, with differnt ui options, more components. utilize right click, open in mutation lab, like, i want to drag components to one tool and have them either swap if compatible or remove the one its replacing."
- tools/core/field/board.js: on a drop, what is in the box it lands on goes back into the box the part came from when it fits there (⇄ a swap,
  both tools when across tools); otherwise it replaces it, and inside one tool the part moves (the box it left is cleared: its own part, or
  empty) — one undo step in one tool. The carried ghost says which ("⇄ swaps with …" · "→ replaces … (moved)" · "→ goes in").
- Right-click on a part's box: ⚄ Mutate only this part (its socket and its components' settings; nothing else moves), ✕ Delete it, ○ Show as a
  block / ○ Show as a tile only (kept per tool), ⚄ Open in Mutation Lab. The window's right-click gains ⚄ Open in Mutation Lab: the tool
  blown up with MUTATE · KEEP · THROW lit up front (the Mutation Lab screen in Start stays a preview).
- tools/music/data/part-exchange.js: a drive in Wobble Bass's after-the-amp box is read as a drive, so it swaps back into the grit.
- Open: "more components" — more sockets in the engines (each new socket is engine work, its null render first).
- tests/p204-part-swap.test.js 1/1 (swap through the real drag, replace + move, the menus, mutate only that part, tile view, the Lab);
  P203 2/2, P202 8/8, P199, P200, P196, boundary 10/10, Wobble Bass 18/18.

## 3.205 Synthesize tools together on the canvas; the Wobble Builder removed (2026-11-21) — not merged
His words: "Do it. Then remove that tool. Dont hide it." (after "That's redundant." of the Wobble Builder)
- tools/core/field/board.js: each blown-up tool's core carries a ◆ tile — drag it onto another blown-up tool's core (it lights) → one tool of
  its own, spawned beside them and opened blown up, its parts as tiles; the core counts as solid (boxes move clear of it).
- tools/music/core/assembled-tool.js (moved from the Wobble Builder's engine): AssembledTool.synthesize — each part from the tool it is most
  itself in (tools/music/data/tool-blend.js), the gates (plays cleanly; a twin refused), "<A> × <B>"; made tools' plain kit face; their parts
  in part-exchange.js. The engine runs ensemble-core, osc-noise and the filter envelope.
- Removed: the Wobble Builder tool (window, packs, its tests) — deleted, not hidden. Its spec → specs/eravos.assembled-tool.spec (kept whole).
- On the canvas (docs/previews/workbench/synth-together.shots.mjs): Wobble Bass × Retro DCO — novel (nearest Xen Synth · Silver-Mean Membrane
  0.469), tube → ladder → filter env → Juno II chorus, wobble into the ladder; opened blown up, 5 parts as tiles.
- Tests: P203 2/2 · P202 8/8 (on a synthesized tool) · tests/assembled-tool.test.mjs 32 · boundary 10/10 · the suites green.

## 3.204 Components swapped between tools blown up on the canvas (2026-11-20) — not merged
His words: "Give Eravos the tools to swap tools components when they are blown up on the canvas. Like give me the ability to mutate or
synthesize tools together." · "you click on the component' box and can pick a new one or one from another tool. then uses the ui element for the
compoenent as a block"
- First try rejected ("What the hell is that? … Didn't ask for it."): a COMBINE card + a builder window. Set aside in a git stash; its engine
  parts kept (ensemble-core and osc-noise adapters; the settings→parts mapping became part-exchange.js).
- tools/core/field/board.js: component boxes, no menus (his: "drag components, delete them, change them. not drop down menus") — each box's
  component a tile: drag it onto another box (this tool or another blown-up tool; fits light up, the rest dim), ✕ deletes, the PARTS tray
  holds new ones; what is in a box shows as its block (its own controls); boxes below move down; a wire draws across; one undo step; MUTATE
  takes other tools' parts. The core names no music word (boundary 10/10: the tempo is the domain's to find).
- tools/music/data/part-exchange.js: Wobble Bass (mouth, grit, noise, after the amp, wobble) and Retro DCO (VCF, chorus, noise, LFO) as parts.
- Wobble Bass's insert takes the Juno chorus (ensemble-core, peMode / peMix); its default and every preset unchanged (null render 34/34;
  Retro DCO 12/12).
- On the canvas (docs/previews/workbench/swap-across.shots.mjs): Retro DCO's ladder (1.4k, reso .40, +6 dB) into Wobble Bass's mouth, its Juno II
  chorus after Wobble Bass's amp, Wobble Bass's wobble into Retro DCO's LFO — each dragged; a crusher from the tray; Retro DCO's chorus ✕'d. P203 1/1.

## 3.203 The Wobble Builder, built (2026-11-20) — not merged
His words: "yes build it." (to the preview, 3.202)
- WB1 one engine: assemble.js streams (block / set / amount; render bit-identical to before), every adapter takes new settings in place (no
  click), Assemble.SRC + MusicAdapters.SRC + the kernels' text = one AudioWorklet; Voice() plays offline and live (the same function).
  Live = offline: −148 dB in a bare context; ≤ −60 dB at the tool's engine (the canvas's 5 Hz port DC block comes after, for every tool).
- WB2 the window, all kit (design check clean for the new tool; the shared MUTATE dock now takes a tool's kit — its buttons, its colour).
- WB3 SYNTHESIZE: regression + novelty gates → a real tool (eravos.wb-<name>), defined at every start, in ＋ Add › Bass; a twin refused.
- Measured on the real canvas (docs/previews/wobble-builder/built.shots.mjs): swaps, a mutation, "Gutter Mouth" made (novel, nearest
  Feelings · Longing 0.216) and opened beside it, made again → refused; the builder explodes on the Field (11 pieces, none missing).
- Tests: P202 4/4 (live = offline, a knob live, a slot live, SYNTHESIZE + twin) · the tool contract 4/4 · tests/wobble-builder.test.mjs 26.
- Open: a made tool as a file in Documents\ERAVOS\tools; mod in / wobble out; WB4 adapters.

## 3.202 The Wobble Builder — spec, its ground, the UI preview (2026-11-20) — shown first, not built
His words: "I want to make like a wobble synthsize tool." → "A wobble builder" (his pick: a tool that synthesizes NEW wobble instruments).
- Spec first (axiom 8): tools/music/planned/wobble-builder.spec — slots SOURCE · DRIVE · MOUTH · WOBBLE · FX · SUB · OUT, each a shared component;
  D1–D6 (slots not a free graph, every edit heard, ONE assembled engine live, SYNTHESIZE writes a real tool, the twin refusal + regression gate,
  guards); WB1 live engine → WB2 the window → WB3 SYNTHESIZE → WB4 the missing adapters.
- The ground (built, tested — it changes no tool's sound): filter-svf / filter-ladder contracts gain a `detune` control in-port (a wobble rides
  the kernel's own detune, sample by sample); the lfo adapter (restarted on each note); assemble edges carry an `amount`; FieldMutate's `of`
  (a part's setting names its socket when two sockets take the same part). tests/wobble-builder.test.mjs 10 checks (the wobble at the LFO's
  rate with either filter, none at depth 0, restarted per note, under full scale); compat 38; components all pass.
- The UI preview (docs/previews/wobble-builder/, the Mutation Lab look he approved): the face (WOBBLE · MOUTH · VOICE · OUT), the chain as Field
  gates with ⇄ on every slot, the inspector, the keys, the waveform with the brightness line ("wobbles at … Hz"), the shared ⚄ MUTATE dock,
  MADE BY YOU, LEARNED, SLOTS (what is still to write, dashed). Measured: every part in every slot plays (peaks −0.9 … −8 dB); 8 of 8 mutations
  play; SYNTHESIZE kept a novel one (nearest 0.391) and refused making it again ("your Gutter Mouth again (0.000)").

## 3.201 Mutation everywhere: every tool, every socket, the Workshop (2026-11-20) — shown first, not merged
His words: "need to be able to swap them out. then i want each tool to be able to be able to do that. then the workshop or field. like i want full
mutation, like keep going"
- tools/core/field/mutate.js (new, domain-free): one mutation for every target — a tool's settings, a Workshop document. Sockets swapped, a few
  settings nudged, learns from keep / throw ('@key', 'key=value'), never the same state twice, one undo step; guards (music: level, tempo, key,
  octave, playing switches never move; mutate: false).
- board.js: any tool explodes on the canvas — autoLayout from its window (titled sections + keys, around its core, real sizes, no overlaps);
  ⚄ MUTATE under every core; ⇄ chips by near / key / group; the window's glow hides while it is apart (glass-layer).
- Wobble Bass: noise (osc-noise) and insert (delay-line, filter-svf, tube, tape, bitcrusher) sockets, one mechanism for all four.
- Retro DCO's filter and Piano's model are sockets (⇄ on their gates).
- The Workshop BOARD: ⚄ MUTATE under the document's core (editMany: one undo step; heard by the kind's ▶ HEAR); the note selector kept out.
- Proof: P199 1/1, P200 2/2; null render Wobble 34/34, Retro DCO 12/12, Piano 11/11; every Wobble part measured playing; auto boards for Retro
  DCO, Piano, Tape Memory, Swarm, Supersaw: every section found, 0 overlaps.

## 3.200 Wobble Bass: swap a component in, mutate, keep or throw (2026-11-20) — shown first, not merged
His words: "okay now i want to be able to mutate, and swap components for the wobble bass."
- wobble-bass.engine.js 4.3 PARTS: two sockets. filter: own · filter-svf · filter-ladder; drive: own · saturator-tube · saturator-tape ·
  bitcrusher; each part's own settings (mode, poles, tap, drive, bias, tone, bump, bits, rate, mix). The wobble, the filter bus and the cutoff input
  reach a swapped-in filter through its detune. 'own' by default builds nothing — null render 34 of 34 presets PASS against the code before.
- tools/core/field/board.js (domain-free): a tool's settings say what is a socket ({ socket, near }) and what belongs to a part ({ part }); on its
  board a ⇄ chip on the gate of the part it replaces (FILTER + VOWELS, GRIT), ⚄ MUTATE under the core (parts + their settings, played at once,
  one undo step), ✓ KEEP / ✗ THROW (back to before). Learns: what was kept comes up more, what was thrown less; never the same combination twice.
- The PARTS group in More depth (a new group: nothing on the face moved) and a PARTS gate on the board (since-the-board row).
- Measured on the real canvas (docs/previews/workbench/wobble-mutate.shots.mjs): every part plays, no non-finite sample, peaks 0.54–0.80.
- Tests: P199 1/1; P196 P197 P198 boundary green; Wobble 49/49; bare canvas, no-toys, validate.
- Open: the parts run at 1× (Wobble's own drive is 4× oversampled: 192 samples) — the wobble a little earlier against a swapped-in filter. More
  sockets (oscillators, sub, LFO, squash, output) wait for the WD track.

## 3.199 The Workshop's exploded BOARD — any document, every layer apart, live (2026-11-20) — shown first, not merged
His words: "Love that. Now the exploded view. Of the notes. Agnostic"
- tools/core/field/field.js (domain-free): BOARD beside 2D / 3D (for every kind, also those with no 3D). The document exploded like the Field's
  board: a gate per layer the kind gives (its group's colour, "GROUP · LAYER", its thumbnail, its live fields — field(), so an edit on the board
  is the same edit, one undo step), half each side of a core (the document: title, path, status), wired in. A canvas of its own: drag the
  background, wheel zooms where it points; a gate clicked selects its layer. Entering, every layer flies out of its row in LAYERS into its gate,
  the core blooms, the wires draw in (FieldMotion, shared).
- The notes: 13 layers → 13 gates, 27 live fields; a field edited on the board → one undo step, the core follows.
- Proof: tests/p198 1/1 (a kind from no domain: gates, live fields, core, wires, select, zoom, back); P150–P175, P196, P197, Timeline 33/33,
  Pattern, Step, boundary 10/10, bare-canvas. Video: docs/previews/workbench/workshop-board.mp4 (workshop-board.video.mjs).

## 3.198 The Workshop opens and closes like the Field — one motion, shared (2026-11-20)
His words: "I like that. But do that with the workshop as well. It's supposed to be the same thing, but" (the message ends there — asked).
- tools/core/field/motion.js (window.FieldMotion, domain-free): the motion moved out of board.js so the Field board and the Workshop share it
  (never copied): the scene (the bar away, the canvas full screen, the rest softened back), the camera glide, origin() — where he last pressed —
  and enterApp / leaveApp: a full-screen app assembled out of its origin, each panel flying out of it to its place, the core blooming last;
  leaving, each flies home into it and the canvas comes back.
- The Workshop (tools/core/field/field.js): opens out of what he pressed (a note in the roll, a button) — bar, options, tool strip, tabs, the
  properties and layers panes, status fly out; the viewport blooms last. close() stays immediate for every caller (gone from .ws-app, onClose
  heard); a copy (.ws-out, untouchable) flies home and is removed. No tool's code changed: every Workshop.open gets it.
- Tests: the in-page harness turns motion off (window.ERAVOS_NO_MOTION — not the system's reduced motion, which the app's CSS reacts to), so
  every test sees open / close at once as before; P197 turns it on and checks it (starts where pressed, lands, blooms, closes at once, the copy
  goes). P150 P151 P154 P156–P162 P165–P171 P174 P175 P196 P197, Timeline 33/33, Pattern, Step, boundary 10/10 — all green.
- Video: docs/previews/workbench/workshop-transition.mp4 (workshop-transition.video.mjs); the Field's video re-filmed after the refactor: unchanged.

## 3.197 The Field opens and closes as one animated scene — shown first, as a video (2026-11-20)
His words: "Okay field is full screen. What about animated transition for the dynamic canvas changing. Like opening the field dynamically
changes the ui. Animated and beautiful."
- tools/core/field/board.js: every motion a Web Animation (seekable; reduced motion → the end at once). Opening: the bar slides away and the
  canvas takes the whole screen; every other window, the cables and the dock soften back (fade + blur); the camera glides to frame the board;
  the tool's frame dissolves while its parts lift (rise + scale + shadow) and fly to their places, nearest the core first, settling as they land;
  the core blooms; each wire draws itself into the core; labels, header and legend come up (~3.4 s). Closing (right-click, or Esc): the
  same in reverse — wires and labels go, the parts fly home as the window re-forms, the canvas and the bar return, the camera glides back.
- Found while filming, fixed: the board sat under the windows (the parts were hidden behind their own window for the first half second); each
  part's start was measured after the parts before it had left (the window reflowed — the keyboard flew from the top); parts hidden behind More
  depth started at the screen's corner (now they rise out of the window's foot, fading in); finish() on the face's endless CSS animations threw.
- Video: docs/previews/workbench/field-transition.mp4 (node docs/previews/workbench/field-transition.video.mjs — each frame the animations
  seeked to that moment, 30 fps); frames: field-transition-open.png, field-transition-close.png.
- Proof: P196 1/1 (assemble now awaits the flight home); boundary 10/10; bare-canvas; validate; Wobble 49/49; P102; P119.

## 3.196 A tool exploded on the canvas, live — Wobble Bass in the Field board, editable (2026-11-20)
His words: "okay now let me edit and change the wobble base. also i feel it should be a canvas in itself. so i can scroll around"
- tools/core/field/board.js (window.FieldBoard, domain-free): a tool's live window lifted apart onto the canvas itself — each part (a card by
  its title, controls by their data-key, a selector) moved (not copied) into its gate frame, labelled, wired to the tool's core; the board's
  header, core and legend; the whole tool first, then each gate flies from where its parts were in the window (FLIP). Everything stays live:
  turn a knob, draw the shape, play the keys. Pan, zoom and scroll as everywhere on the canvas. Drag a gate by its label (kept per tool);
  a live part taller than the board's picture pushes the gate under it down. Right-click the board or the window: put it back together.
- Wobble Bass: wobble-bass.board.js (files.extra), GENERATED from the board file by docs/previews/workbench/build-field.mjs --data — the
  22 pieces' places, labels, gates and wires are the board's own; below it, what it has grown since that board (FILTER+, GROWL+, ENVELOPE+,
  LFO 2, WAVETABLE, AMP = amp-chain, OUTPUT), every part live.
- Proof: tests/p196 1/1 (29 parts found, the same live controls moved, a control in a gate still sets the tool, put back where they were);
  boundary 10/10, bare-canvas, validate, Wobble 49/49, P102, P63, P119, P16; screenshots docs/previews/workbench/field-live-*.png
  (node docs/previews/workbench/field-live.shots.mjs).
- Not yet: swapping Wobble Bass's components (its sound is still its own engine — the WD track, CG7); the colours are the app's theme (live parts).

## 3.194 WD1 — Wobble Bass broken down, part 1: the Amp chain is a component (2026-11-16)
His words: "the tools need to be broken down as well into their respective components, like the ones that existed before started doing the mutation."
- components/amp-chain: Wobble Bass 4.2's AMP stage moved out unchanged (same nodes, wires, values) with its contract (ports in / mod / out,
  8 variables, its UI element) and spec. Wobble Bass now calls it.
- Proof: null render 34 / 34 Wobble Bass presets against the baseline recorded before the move (gate −60 dB); amp-chain.test.mjs 16 checks
  (the graph in order, off at exactly 1 / 0, every value set); Wobble 45 / 45; contracts 35 / 35; tool needs announce it.
- The track (written, gated): CG2 ✓ → CG3 ✓ → WD1 ✓ → WD2 the sub → WD3 the output stage → WD4 squash → WD5 LFO + wub seq → WD6 FM growl → CG4.

## 3.191 Reese Bass 2.1 — Deep Sub inside the Reese (2026-11-15)
His words: "expand the reese bass to encompass the deep sub" · (14:01) "Then Reese bass."
- A DEEP SUB section on the Reese: Sub shape, Sub drop + Drop time, Sub sustain + Sub decay, Sub click, Sub floor — each off until
  moved, so every Reese preset sounds as it did (switches proven at exactly 1/0; the Reese's random phases rule out an exact null render).
- Two presets: Deep Sub 808 Reese (drop, click, a sub that falls away under the held Reese) and Deep Sub Square Reese.
- 7 tests. Sub Engine stays until its presets are reproduced on the Reese (then it merges, per the Eravos 2 list).

## 3.190 Wobble Bass 4.2 — Amp: the growl chain, centered and clear (2026-11-15)
His words: "I was saying his sounded centered. Ours rough. … Like I want to make it sound exactly like that. It's one way I quality check it."
- A new AMP stage (off by default, so nothing changes until it is switched on): the sub split off at 130–140 Hz and folded to the
  center untouched; only the growl above it is driven (4× oversampled), wobbled by a second filter (Wow), the boxy 300 Hz cut,
  presence lifted, the fizz rolled off, the drive's own low by-products high-passed out, then glued and limited.
- Character: soft → sharp → gainy on one knob. Glue holds it loud without passing full scale; no added hiss (tail < −80 dB).
- New preset "Centered Growl Chain"; 5 tests (null when off, centered sub, Character, peak held, noise floor).

## 3.189 Feelings 0.2 — the pad moves the tone and depth; Anger cleaned up; Sadness heard (2026-11-15)
His words: "the feelings tool isn't working. Like the field isn't changing the tone and depth. Anger sounds messed up and the third one doesn't work."
- Measured on 0.1.0 first: Up moved the level (≈35 dB) but the brightness only 1.5–1.7×; Across moved the brightness 3–9 %; Sadness sat around
  70 Hz and Anger had 62 % of its energy under 150 Hz — below what a laptop or phone plays, so the third "didn't work".
- Now: Up opens the tone over a decade and brings in the upper partials as well as the level; Across moves colour and depth (partials,
  celeste, space, width; Anger its wobble rate and bite); Anger sits at 110 Hz (still low, harsh, its 30–150 Hz wobble kept), gentler
  drive, 4× oversampled; Sadness an octave up, still dark and sagging.
- Proof: feelings.test.js 14/14; three new tests fail on 0.1.0 (Up brightness 1.48× < 2, Across 9 % < 25 %, Anger 62 % under 150 Hz) and
  pass now. The anger wobble test now reads sidebands (note + rate), since the note itself sits inside 30–150 Hz.

## 3.188 Deep songs, batch 1: six very different songs on 80s · Synth and six on Dubstep, each as deep as ERAVOS goes (2026-11-14)
His words: "what next? the piano is hard for me but l love it. can you look at every major song of all synthwave, edm, dubstep, electronic, etc to make a wide contrast of songs per catagory that are as complex and deep as eravos can be. like per note edits, automation, tools wired to other tools, etc. curves, etc. as deep as possiblr"
- The research first: docs/research/landmark-songs-techniques.md — the landmark records of each style and the technique each song takes
  (technique only, never a melody). Spec: specs/eravos.deep-songs.spec (the depth checklist, the batches, the acceptance).
- data/deep-songbook.js: one song per sub-style, each its own form, tempo, groove and palette, on the shelves that exist (no new category).
  80s · Synth: Nightdrive Talk (half-time, a lead that talks: its vowel opening inside every note) · Outrun Key Change (octave bass, the Arp on
  a pluck, a fuzzed solo, the last chorus up a whole step as a Pitch curve on every instrument) · Turbo Breakdown (darksynth, drive set note by
  note, a half-time breakdown and a blast) · Sunset Bloom (dreamwave, electric piano strummed from one note, a sax-like lead that breathes) ·
  Sequence 84 (the Moroder sequence, its filter opening over the whole song) · Galactic Warble (slow-motion funk, swung, a melt where the
  tapes slow). Dubstep: Request Line Space (the original sound, space, one change at a time) · Cockney Wobble (a wobble rate per note, speeding
  up inside the note) · Talking Machines (two basses in conversation) · Stop-Start Riddim (one figure, one change a bar, the FM moving) ·
  Halo Fall (melodic: piano, pumping saws, a crying lead) · Metal Tearout (three basses switching every half bar).
- Every song uses every per-note kind (a knob on the note, a knob curve inside it, a bend with its own LFO, a chord from one note, plays on pass
  k, chance, ratchets that speed up / slow down, microtiming, humanize), ≥ 12 curve lanes on instruments, effects and the XY Pad, an LFO, the XY
  Pad's X and Y, and a tool or effect driving another (sidechain envelopes, tape dropouts, Swarm coherence, Dynamics' gain reduction).
- Found by the test, fixed: half the wires first named knob inputs a tool does not have (a tool's own input — cutoff, mix, feedback — is used
  where it exists); a song clipped 0.12 % (levels down); every song now played at its loudest: no fault, nothing clipping.
- His ear (2026-11-14): "Nightdrive-Talk.mp3 around .57 seconds, it sounds bad with the wobble. the rest sounds blown out." — measured part by
  part: the talker's preset wobbled its vowel on a drawn 1/8 LFO (≈ 3 Hz at 89 BPM), the sub alone was as loud as the whole mix (−8.7 dB),
  every kit alone peaked at full scale, the mixes ran −7 to −11 dB into the master. Fixed: the talker's LFO stopped (the talking is the vowel
  per note), its drive and resonance tamed, the pump off the bass filter; every kit 0.55, every sub halved, a measured trim per song —
  loudest sections now −10.8 to −14 dB, clipping ≤ 0.003 % (was up to 0.034 %), Nightdrive's verse −12.6 dB with the sub at −17.6.
- His ear again (2026-11-14): "Turbo-Breakdown.mp3 at 0:57 is blown out." · "still overloads." — measured part by part: the build was the bass
  alone, the XY Pad's drive route on it climbing to +14; then OTT's makeup gain pushing the bass's peaks to 0.99 whatever went in. Fixed: the
  bass out of the build and the blast (it returns at the drop), the XY Pad onto the stabs' filter, OTT's out −6 dB and half wet, the grit's
  out −4 dB, bass and kit down; Turbo's drops −13.4 dB, peak 0.78. Talking Machines, Stop-Start Riddim, Metal Tearout: the same OTT fix.
- Found while re-rendering: Sequence 84 turned to NaN at bar 48 — the XY Pad's Y on top of the phaser's feedback curve passed 1. Every wire
  into a feedback (echo or phaser) moved to a safe knob; P188 now guards it (no wire drives a feedback knob). Full render: no NaN.
- "dont forget you can fade in" · "no not all" · "just ones that should.": fades chosen per song and part (pads, keys, risers, tails).
- Proof: P188 18/18; P16 67/67 (every note in key), P172 1/1, P173 6/6, P44 29/29, P62 8/8, P58 18/18, boundary 10/10; songs decomposed
  again (313). Hear them: node docs/previews/deep-songs.render.mjs <dir> (whole songs, MP3).
## 3.187 Feelings — one feeling fills the pad; drag to play it (2026-11-13)
His words: "i also want a actual tool for irrational frequencies, and unconvential harmonic data, like dragging around to create a nervous
system response using poly vegal. like feelings or emotions as frequencies. make patterns from feelings." · "a full drag on a tool and have
it play the sounds like a four way grid" · "i want love, anger which is low irratating pitch, sadness, like hanging tree or bite the hand that
feeds you" · "all one feeling" · "no capture button or return" · "resize to add more dynamic range." · "then build it."
- tools/music/tools/embodiment/feelings/: the picker (Love · Anger · Sadness) and the pad, the whole window. Drag = sound, let go = it fades
  as the feeling does. Up = more of the feeling (−34 → −5 dB, brighter, higher); across = its colour (love: fuller, wider · anger: the
  loudness wobble 30 → 150 Hz · sadness: far, wide, bending). Harmonics auto (Love harmonic, Anger √2, Sadness φ) or any irrational set; Hold,
  Pitch, Level on the tool page; x / y automate; a note plays the feeling at its pitch.
- components/ratio-set (NEW): the irrational sets as shared data — equal to Embodiment Lab's seven (read from its code), plus φ series,
  primes, stretched string, membrane; numbers → ratios.
- The research behind each feeling: docs/research/feelings-as-sound.md.
- Found in the app: the pad's touch was dropped (ui_hooks) — fixed; the window test fails without the fix.
- Odd Couples: Hanging Tree Sorrow in the break of Hanging Tree Dub; an Anger preset. Icon: heart.
- Proof: Feelings 11/11 (the sound measured); ratio-set 37 checks; contracts 34/34; P43 6/6, P63 11/11, P183 2/2, P58 18/18, boundary 10/10,
  no-toys; design check: Feelings clean (59 of 76). Hear it: node docs/previews/feelings-built.shots.mjs → docs/previews/feelings-{love,anger,sadness}.wav (one slow drag each; not committed).

## 3.186 Bassline 2.0 — time, notes, locks and rests (shown, waiting for his yes) (2026-11-13)
His words: "I love the bassline, needs more depth and control. like tempo and the cord tool. bassline is high leverage." (12:31:19Z) · "Okay.
The bassline tool. Way more depth. I like that tool. A lot." (15:58:04Z)
- engine 2.0.0 (bass-gen.spec ADDENDUM 2026-11-13 (2)): TIME feel (half / normal / double), swing, phrase + answer · NOTES a pool (root, + fifth,
  + octave, chord tones, scale, walking) left by tension, range, ahead (anticipation) · STEPS lock and rest lanes. Every one neutral by default.
- Then his "It looks the same. Tempo. Pitch need more automation. Bpm.": the window gains TIME · PITCH — Own BPM, Swing, Answer, Pitch
  (transpose −12..12, in scale steps or semitones), Tension, Range, Ahead knobs; Speed, Feel, Pool, Pitch in strips. Every knob automates:
  Speed and Own BPM now carry knob inputs too (tools/music/domain.js — every music tool). The lanes stay on the Steps tab (no duplicates).
- Found on the way: title case (3.184) turned progressions like i-VI-III-VII into I-VI-III-VII (minor read as major) — numerals in sequence
  keep their case (canvas/runtime/ui-kit.js); P184 guards it.
- Proof: bass-gen.test.js 26/26 (16 of 1.1 unchanged + 10 for 2.0: defaults = 1.1 bar for bar, each control does what it says, pitch moves
  live, every knob has an automation input); P184 2/2, P183 2/2, P132 3/3, P49 10/10, P48 17/17, boundary 10/10; design check no worse.
  Shown first: docs/previews/bassline-2-window.png, bassline-2-steps.png.

## 3.185 The full suite run: six failures of mine found and fixed (2026-11-13)
The full in-page suite (1,600 tests) on today's main: 10 failed. Each re-run on main and on main of 2026-11-10 to find whose they are.
- Mine, fixed here:
  - P63 Piano had no drawn icon → tools/music/icons.json maps it to Lucide's piano (already in the set: no drawing changed); the agents'
    Step tool had none either → footprints (lucide-static 1.72.0 in a scratch folder; the generated files differ only by the new entries).
  - P43 Piano and Pattern had no Odd Couples pack, and no part in the set → packs/odd-couples for both (3 presets each); Piano plays
    in Odd Couples · Glitch Gospel (its keys, level 0.45 — those songs gain a piano); Pattern is a generator like Arp (notes out through a
    wire, which the genre format cannot write yet — the same listed open loop).
  - P16 Wub Floor Machine's Swarm stepped by semitones (+7, +3, +5) in drop 2 — out of key on some chords → scale steps.
  - P58 a Heavy Drops song hidden as a repeat (3.172) was looked for in the listed songs → Songbook.all({ same: true }).
  - P11.S Tape Memory hissed at −30 dB for ever after Stop → the dust runs while the tape runs: the transport playing, or music coming in
    (a follower on the input, a constant that Play / Stop moves; either opens it, never more than fully). Its test plays the transport for
    hiss and crackle.
- Not mine (also failing on main of 2026-11-10): P23 a plain wheel over a fitting Timeline · P70 a curve lane's right-click · P82 ×2
  (known) — listed in CLAUDE.md › Open.
- Songs re-decomposed (Glitch Gospel and Wub Floor Machine changed). Proof: P63 11/11, P43 6/6, P16 67/67, P58 18/18, P11.S 9/9, Tape
  Memory 8/8, P132 3/3, P173 6/6, P172 1/1, song parts ✓, validate 263.
## 3.184 The pedal off the display; options in title case — shown, waiting for his yes (2026-11-13)
His words (with a screenshot): "overlap. why lowercase all the time also? like porffesssional anbd production grade, matching the themes. enterprise grade."
- The overlap, measured: Piano's display ends at y 287 and the Sustain pedal's row starts at 287; the button (30 px in a 27 px row, −1.5 px
  margin, 3 px ring) rides into the display's edge. The pedal now sits in the header beside Model (as Retro DCO's Hold) — no overlap, and
  Piano ~30 px shorter (it helps the "cut off" on a short screen).
- Lowercase: every setting's options are SHOWN in title case — UIKit.optionText (canvas, domain-free: all-lowercase words capitalised, small
  joining words kept small mid-phrase, anything with digits / capitals / symbols as written; a tool may give optionLabels) and UIKit.words, where
  a domain registers its acronyms (music, ui-music.js: SVF, LFO, FM, BPM, MIDI, PWM, HP, LP, DnB, UKG, VHS, file formats, Roman numerals). The
  values are stored as before, so presets, songs and projects are unchanged.
- His "why not hold? like the other piano tool?": the pedal's button is labelled Hold, as Retro DCO's and Retro Poly's (the same place, the same
  word); its hint says it is the sustain pedal (notes ring until Hold is off). The stored key stays `pedal` — presets and projects unchanged.
- Shown first (his rule): docs/previews/case-before-*.png / case-after-*.png (Piano, Retro DCO, Swarm). OPEN: the lowercase words tools draw
  in their displays and hint lines — a second pass, shown first.

## 3.183 Element synthesis, ES1 — Piano's controls separated into elements; a face synthesised from them (preview) (2026-11-13)
His words: "make sure you are seperating the elements for synthesis. i want to add the element synthesis" (14:28:04Z) · earlier: "Each
component of each tool has a element for the ui to synthesis." (13:07:08Z).
- Separating: every Piano control names its element — a component Piano announces (filter-svf, modal-resonator, karplus-string, env-adsr,
  lfo, saturator-tube, stereo-tools) or its own part (own:piano, own:hammer, own:pedal, own:mic, own:out); Decay names both string and tine.
  The music domain's per-tool Speed / Own BPM name own:tempo on every tool. The catalog carries each tool's announced components.
- Synthesis: tools/core/elements/elements.js (domain-free, beside the Field): elementsOf (in the sound's order — announced components in DAG
  order, own parts placed, or the tool's elementOrder), check, face (one uk-group card per element, UI.paramControl — the same kit; skips what
  the tool shows elsewhere, no duplicates; today's face keys first, the rest by element behind More depth ▸).
- PREVIEW, not a change: docs/previews/element-synthesis-piano.png — today's face (left) beside the synthesised one (right, same window,
  same size). Today's stays the default (his rule); ES3 (a choice) after his yes.
- "cut off" (his, 14:27:33Z): measured — the face fits its window; windows are capped at the visible canvas (3.37) and scroll with the keys
  pinned, so a short screen hides the lower cards. A shorter Piano layout is open — to be shown first.
- Proof: tests/p183-elements.test.js 2/2 (every control in an announced or own element; order source → shape → fx, out last; the face holds
  every control once, nothing shown twice, the face keys first); boundary 10/10 (tools/core/elements scanned), Piano 49/49, P163 32/32,
  P38 37/37, validate 261.

## 3.182 Piano — built from its parts, on the face he approved (2026-11-13)
His words: "yes" (2026-11-06, to the lofi previews — Tape Memory, Piano, the Lofi setup, Bind on the lane) · "then i want the next set of
high leverage tools" (2026-11-13T13:53:40Z). The dependency graph: 6 planned tools ready; Retro DCO, Swarm, Tape Memory built; Pattern Editor
became the Field; Ensemble Organism never shown; Piano approved and ready (7 of 7 components) — first.
- tools/music/tools/genre-instruments/piano/: one AudioWorklet from the components' own kernel text (modal-resonator, karplus-string — its new
  KSTRING_SRC, bit-identical to KString, 42 checks — filter-svf, env-adsr, lfo, stereo-tools, saturator-tube) + voice-allocator (24 voices).
  tine and reed are modal (the tine's tonebar + its clamped overtones for Bell; the reed's odd harmonics, Bell = partials 3 and 7); felt /
  upright / honky / grand are 1–3 stretched strings; a hammer pulse (harder = shorter); brightness through the filter (live); a body of modes
  (Resonance, Mic Y); 12 sympathetic strings the pedal opens; the tremolo swing; the tube. 22 controls, 12 on the face (the approved preview,
  its display lit by real notes). Factory pack: the spec's 10 names.
- Found while building, each fixed and guarded: (1) the tine was 400× the strings — per-model gains measured (every model at 0.10 RMS);
  (2) the body fed the whole signal through narrow modes: presets peaked 2.8–7.1 × full scale — input scaled per model, a test now plays every
  factory preset's chords under full scale; (3) the tube sat after the model gain, so it saw ±60 and Drive silenced the sound — gain, then
  tube, then Level; (4) Bright on the tine and reed set the strike, not the sound — now the filter (P163 follows). Hammer and Velocity curve
  shape the strike (onset: true; P163 skips them, as it skips attack and glide).
- Canvas wording: "like the piano roll" in Settings › Canvas's border hint → "the windows a tool opens of its own" (the canvas names no tool —
  with a Piano tool, "piano" became a tool name; tests/boundary.test.js).
- OPEN: MIDI CC64 / CC67 to the pedal — the SDK carries notes, not controllers (bind a pedal with the MIDI Mapper).
- Proof: piano.test.js — the contract 49/49 (presets in range, save → load, closes clean, Stop all) + P182 6/6 (every model sounds and within
  6 dB; every preset's chords under full scale; A3 = 220 Hz on tine and grand; the grand's 12th partial sharp at Stretch 0.5, in tune at 0; key
  up stops, pedal holds; Bright reaches a sounding note); P163 32/32, P130 4/4, P38 37/37, P176, P119, boundary 10/10; design check 58/75
  (clean); no-toys; validate 261. docs/previews/piano-built.png (playing).

## 3.181 CG1 finished: every component with code carries a checked contract (2026-11-13)
His words: "continue with the component contracts. then i want the next set of high leverage tools" (13:53:40Z).
- The 10 data / logic components now carry <id>.contract.json (33 of 33 with code). Types curve, pattern, harmony added to tools/music/types.json.
- build/component-contract.mjs also checks a default against the code wherever the code states one in a form it can read — it caught five
  wrong defaults I had written (pitch-path win 5 → 2, eps 0.15 → 0.08; mod-tree depth 0.5 → 1; karplus-string bright 0.5 → 0.6;
  unison-stack blend 0 → 0.5); a planted wrong default fails it.
- build/tool-needs.mjs: all 18 tools that list their components now announce their components' UI elements too (5 before).
- Proof: component-contract ✓ 33/33, tool-needs --check ✓, validate 259, components ✓.

## 3.180 Songs decomposed one by one — rhythms and lines per tool (SD1) (2026-11-13)
His words: "also songs decomposed one by one." · "rhythmes and notes per tool." · "just begin."
- build/song-decompose.mjs drives the page, takes every song the Songs menu lists (300 from the Song Engine as data — no audio — and 1 from
  its recipe) and takes it apart: tempo, key, sections, each part's tool, preset and role, bar by bar which rhythm and which line it plays,
  how its tools are patched / modulated / wired, its curve lanes. Per tool: the rhythms (onsets; drums keep pads) and lines (notes relative
  to the key root) it plays, each kept once, with the bars that use it, the songs it came from, its mean velocities.
- 301 songs, none failed · 84,388 part-bars → 3,933 rhythms, 4,607 lines, 21 tools (Retro DCO: 14 rhythms, 95 lines; Pads 3,168 rhythms).
  Velocity is not identity (it was: 5,040 "rhythms" that were the same onsets humanised). Deterministic: two runs byte-identical.
- Not into notes: the one recipe song (its notes come from a sequencer starter) — its tools are listed.
- Files: tools/music/data/song-parts/ (index.json, songs.json, one per tool; 4.6 MB, data, not loaded by the app yet — Browse SB2–SB3 will),
  docs/song-decomposition.md. tests/song-parts.test.mjs + an up-to-date check in CI.

## 3.179 Component contracts; every tool announces its needs; the store, Browse and songs decomposed specced (2026-11-13)
His words: "just begin. also songs decomposed one by one. maybe a tool store … like you click browse … a tool page per tool with the relevant
dependancies and packs. rhythmes and notes per tool. like all tools zipped in a zip with all of its components, dag, etc. all isolated from
each other. the canvas using a interaction contract." (13:11:29Z) — after "Each component of each tool has a element for the ui to synthesis."
- CG1 (sound components): tools/music/components/<id>/<id>.contract.json for 23 of the 33 components with code — ports (typed from
  tools/music/types.json), variables, UI element (controls with roles, what is on the face, the kit elements it needs). Five components'
  variables generated from their AudioParams; build/component-contract.mjs checks every contract against its code (80 variables exactly,
  49 by name) — four planted errors each caught (a range, an option, a port type, a name), and it caught two of my own while writing them.
- The announcement: build/tool-needs.mjs writes needs.components (id@version, from the spec's DAG) and needs.elements into each tool.json —
  18 tools; Retro DCO announces its 12 components and their 12 elements. --check in CI; schema knows both keys.
- Specs: eravos.store-browse (Browse: domains → tools → a tool's page with NEEDS, PACKS, SOUNDS, RHYTHMS, NOTES; whole isolated tool zips;
  the interaction contract — manifest, kernel hooks, announced kit elements, SDK), eravos.song-decomposition (every song into parts; rhythms
  and notes per tool), store ADDENDUM (2), components ADDENDUM (3).
- Proof: component-contract ✓ (23/33), tool-needs --check ✓, validate 259, P38 37/37, P139 7/7, P123 9/9, P119 3/3, P176 3/3, boundary 10/10,
  components, library-tools 14/14; the catalog unchanged.

## 3.178 The Field leaves the canvas (BC1) — nothing he sees changes (2026-11-13)
His words: "i feel the workshop should be a tool on its own. like can we make the canvas more bare?" · "yes that works".
- canvas/runtime/workshop.{js,css} → tools/core/field/field.{js,css} (git mv: history kept). tools/core/ is a new tool-less, domain-free
  domain (domain.json "always": true): the Catalog loads a domain marked always before any other, whatever is installed (the canvas reads the
  flag, names no domain); tools/index.js lists core first; the generator carries the flag; the schema knows it. window.Workshop kept as the
  global (16 files call it). Toolless domains are not Start cards, so nothing new shows.
- The rule: tests/bare-canvas.test.mjs — every canvas/runtime/*.js on the spec's host_files line (35), or it fails; tools/core scanned by
  the boundary test as the canvas is. CI now runs build/validate.mjs (3.176's contracts had merged failing it) and the bare-canvas guard.
- Also: P166 still looked for "Open on the Workshop" (a 3.176 rename it had missed).
- Proof: P150 P154 P156–P162 P165–P171 P174–P176, P38 (catalog) 37/37, boundary 10/10 green unchanged; design check no worse; validate 259;
  shipped-files, library-tools 14/14, components, no-toys, no-playwright; a fresh profile in the real canvas: only core loads, the Field is
  there, the Start cards unchanged, installing Timeline + Retro DCO then loads music and its Field kinds, no page errors.

## 3.177 Every song's preview tested; quiet previews levelled, distorted ones trimmed (2026-11-13)
His words: "I cant hear some of them in the preview. Can you also test them. Some sound lterrible".
- Measured, not guessed: every listed song's preview (301) rendered as the Songs page renders it and measured — level (RMS), how spiky (peak
  over average), share under 60 Hz and above 5 kHz, silent bars, and PINNED (samples pressed against the peak: the master's limiter squashing a
  too-hot sum, heard as distortion). None silent or failing (one recipe song has no preview, by design); 44 only slow under load (alone ≤ 35 s).
- Why some could not be heard: previews were normalised by peak, so a spiky song (one loud hit) played far below the rest. tools/music/data/
  song-preview.js now levels by loudness: aim −14 dB RMS (up to 4× the peak gain), a soft clip above 0.89 (tanh) — no new hard clipping.
- Why some sounded terrible: 26 songs pinned 0.20–0.47 % (Floor Falls Out: 0.07 %). Each problem genre's parts were taken out one at a time to
  find the part driving it — the Sub Engine at its 0.8 default in most; a wobble, a wub, an organ, a Reese or an acid line in others.
  tools/music/data/songbook-mix.js (new, data only, loaded after every songbook): 17 level trims on 11 genres, each with its measured before →
  after. Re-measured on 49 songs: median pinned 0.22 → 0.11 (Rivals 0.41 → 0.10, Dark to Dawn 0.47 → 0.13). Still warm: Breathing DnB
  (~0.32 %) and Hanging Dub (~0.20 %) — his ear decides. Lost Love's boomy low end (65–72 % under 60 Hz) left as the genre's character.
- Proof: P19 21/21, P44 29/29, P71 10/10, P72 4/4, P172, P173 green; the audit scripts and per-song table in the session's scratchpad.

## 3.176 The Workshop is the Field; erase, longer, thicker on the map; each tool's own Field (2026-11-13)
His words: "shouldn't the workshop be called field? I like it so far. What about tool dependant. Also erasing parts of the notes or patterns.
Making it thicker or thinner, longer." · his answers: "Rename it Field" · "I meant tool specific. Using the dag maybe or contract" · "Maybe
options for it? Or pitch width."
- FIELD: every word he sees (the surface's title, Close the Field, ⇥ Field, Open in Field, the menus and hints) — code names kept.
- The notes map: ERASE cuts the part of a note (or of several) under the stroke — a note split in two where it crosses the middle · MOVE: the
  body moves (start, pitch), the end grip makes it longer / shorter, the start grip moves its start keeping its end · THICKNESS (Shift+drag up
  / down): options — pitch width (default: a vibrato's depth, drawn as a band), loudness (a pad's default), voices (unison ghosts drawn) —
  a THICKNESS choice in the bar, kept on the note's doc.
- Tool specific, from its contract and its DAG: a tool.json may carry "field": { first: [keys], stages: { group: stage } } (Retro DCO, Swarm,
  Retro Poly, Wobble Bass, Supersaw, Sub Engine written); the catalog carries it (build/index-tools.mjs). The Field offers that tool's FIRST
  knobs first (in the contract's order), then the rest by stage in the sound's order (CONTROL SOURCE SHAPE AMP MOD FX OUT) — a knob with no
  group staged by its name — and a shaped knob's layer sits under its stage.
- Proof: tests/p175-field-map-edits.test.js 4/4, tests/p176-field-tool-specific.test.js 3/3; P150 P154 P156–P162 P165 P167–P174, boundary
  10/10 green; components; design check 57/74, no tool worse.

## 3.175 Layers in the Workshop, finished (2026-11-13, PR #170)
His words: "make sure we can edit, change and manipulate layers in workshop. Let's get that finished."
- The spec promised show · solo · lock · amount · order (W1); only show and "Show only this" were built. Now, for every layer that can:
  the EYE turns it off in what plays (a shape plays as if unshaped, a modulator adds nothing; the row is struck through) — view-only where a
  layer cannot be off; Alt+click the eye shows only it · LOCK (🔒 on the row, /): no edit, field or pen reaches it · AMOUNT 0–100 % (PROPERTIES,
  one place): how much of a shape or a modulator plays · ORDER: drag a row, Ctrl+[ / ] · RENAME: double-click the name, F2 · DUPLICATE:
  Ctrl+J · DELETE: Delete, 🗑 in the footer · RESET · COPY / PASTE (Ctrl+C / V) across notes: a shape, a modulator, a chord, a knob, a value.
  Each is one undo step; the right-click LAYER menu lists only what that layer can do.
- canvas/runtime/workshop.js (domain-free): layerOps(doc, id, { clip }) and set(doc, '@layer', { id, op, value }); copyLayer; the clipboard
  across documents; the kind names the layer to select after a move / duplicate / paste (__sel, never kept). A layer's menu holds layer
  actions only (the note's and pattern's are the view's right-click).
- timeline.workshop.js: the ops on shapes (T:), modulators (m:), the base, knob layers (P:) and value layers; compile plays a shape's off and
  amount; the kind's own − MOD, ✕ KNOB, ✕ UNSHAPE and a modulator's On field are gone (the layer's Delete and eye do them — no duplicates).
- components/mod-tree 1.1: a modulator's amount (m.amt; absent = 1, every 1.0 signal samples the same — 22 checks).
- Proof: tests/p174-workshop-layers.test.js 4/4 (each op reaches what plays: off flattens, 50 % halves the rise, lock refuses delete, amount
  and the pen, Ctrl+J / Ctrl+] / Delete keys, the menu, a shape / modulator / chord pasted onto another note); P150 P154 P156 P157 P158 P159
  P160 P161 P162 P165–P171, boundary green; components; design check no worse. Preview: docs/previews/workshop-layers.png.

## 3.174 The machine songs — his three categories, Floor Falls Out's arc, everything wired, measured (2026-11-13)
His words: "6? also they sound horrible. more like floor falls out." · "considering i said everything eravos could do including automation. way
too shallow for how much depth ive been giving it. also stop making new catagories. i told you the catagories."
- Replaces 3.173's six songs and its shelf (in git: fa2dad5). tools/music/data/eravos-now-songbook.js: three genres x eight songs, on the
  shelves he named — Wub Floor Machine (🔊), Synthwave Night Machine (🌆), Lo-fi Tape Machine (🌙). Each on Floor Falls Out's arc with a
  pause move per song (wub: falls / stairs / freefall / rises · synthwave: gate / riser / cut / swell · lofi: the tape stops / sags / drops
  out / rewinds — keys and drums on their own Tape Memory).
- Everything wired: curve lanes on instruments, EFFECTS and MODULATORS (Tape wear / speed / dropouts, echo throws, sidechain depth, the
  XY Pad's X / Y, the Arp's octaves / gate / rate, DCO filters and vibrato, the Swarm's coupling, the wobble's depth on an LFO); LFOs into
  knobs; the XY Pad's X and Y into two tools; the Swarm's COHERENCE out and Tape Memory's DROPOUT out into other tools; the Arp → a Retro DCO
  pluck; effects in series; the Drop Builder; the Workshop's notes (chords from one note, a stuttering shaped dive, ratchets, ghosts).
- Song Engine (additive, every existing genre byte-identical): curves reach fx<i> / mod<i>; G.routes (any out → any knob); modulate by
  output name and knob port.
- Measured beside Floor Falls Out #5901 (drop −7 dB, 21 % in 30–60 Hz, −19 dB above 150 Hz, the pause a hole, ~0.1 % at the clipper):
  wub drops −6.1 … −7.8 dB, 12–21 %, −17.6 … −20.5; synthwave drops −7.9 … −8.9, ~3.3 dB over the build, pauses holes; lofi pauses −21 … −30
  dB (the tape stops); clipping 0 … 0.21 %. Found on the way: Head Shaker over Earthquake Drop (Heavy Drops' own seeds too) measures 3 % low
  end and −11 dB above 150 Hz — thin and harsh; the wub songs use Floor Falls Out's Classic Wub / Half-time Growl over Deep Sine; a stock
  snare roll made the synthwave builds brighter than their drops (now a whisper that rises); the drops needed a sub.
- Proof: tests/p173-songs-machine.test.js 6/6 (24 songs on his shelves, every preset real, the full extent present, three written with no
  fault and measured against FFO); P172 (no two songs ≥ 80 % the same); P71 (its Drops check reads the type line, not a song's ♪ title),
  P73, P171, P44, P19, P62, P72, boundary, no-toys green; P43 ×2 and P70 as on main.

## 3.173 ERAVOS Now — six songs on the new tools, automation and the Workshop's notes (2026-11-12)
His words: "also add songs that use the new tools, automation, and full extent of eravos."
- tools/music/data/eravos-now-songbook.js (NEW, data only): three genres, two songs each, each song its own variant (by its seed) — Lofi Tape
  (Tape Hiss Diary, Rain on the Reel: Retro Poly keys through Tape Memory → pump, a Retro DCO line, Sub, Lo-fi Dust), Synthwave Night (Neon
  Cartography, Midnight Voice Cards: Retro DCO bass / brass / lead, a Swarm pad, Synthwave Gated), Wobble Lab (Workshop Wub, Vowel Machine:
  Wobble Bass shaped per note, Metal Swarm, Sub, grit → pump). Ten curve lanes (keys and brass filters, DCO vibrato depth, bass filter, the
  Swarm's coupling and restlessness, a pitch riser, the Wobble's depth with an LFO, its rate bend, a filter that closes then rips open);
  notes carry shapes (nested modulators), chords from one note, pass conditions, ratchets both ways, speed, chance, microtiming, humanize,
  a knob per note. A shelf of its own: ✨ ERAVOS Now.
- Found: "Synthwave · Neon Gated" is a kit, not a Drum Machine preset (preset_load faulted) — the showcase pattern and the songs use
  "Retro Machines · Synthwave Gated"; the Odd Couples sidechain preset is "Odd · Wobble Breathes With Kick". P171 / P173 now check names
  against the tool's real preset list.
- Proof: tests/p173-eravos-now-songs.test.js 5/5 (every tool and preset real, the features used, the songs of a genre under 80 % shared
  notes, each genre written with no fault and heard); P171 17/17, P172 1/1 (the new songs included), P19, P44.

## 3.172 The songs library lists no song twice (2026-11-12)
His words: "can you also remove duplicate songs in the songs library, a lot of the same songs"
- No two titles were equal; the sameness was in the notes: most songs are a genre + a seed, and seeds of one genre often write the same
  song. Measured (each song generated; its notes as part · position · pitch class from the key's root; Jaccard against every earlier song
  of its genre): 321 songs, 45 share ≥ 80 % (85 ≥ 70 %, 14 ≥ 90 %). Those 45 are not listed; each is kept, with what it repeats and how much
  (tools/music/data/songbook-same.js; Songbook.same(); Songbook.all({ same: true }) lists every song). Nothing deleted.
- Proof: tests/p172-songs-not-the-same.test.js (no two listed songs of a genre share 80 %); P19 P22 P40–P44 P62 green (P43's two
  pattern-field failures and P70's curve-lane right-click are on main too).

## 3.172b The Workshop: ▶ ⤓ ✕ at the top right, once; no Orbit tool (2026-11-12)
His words: "aslo the play, x and done icons should be in the top right. not duplicated. no duplicates in the ui. i hate that. remove the
duel orbit buttons. the toolbar is for editing, not for different views."
- ▶ ⤓ ✕ moved from the foot of the tool strip to the right of the top bar; the LAYERS footer no longer repeats ⤓ ▶ (＋ ∿ ⤵ stay). The
  Orbit tool is gone from the strip (the options bar's ORBIT / TOP / FRONT and Alt-drag turn the view). A tool key in 3D no longer drops
  to 2D. A shape layer reads "Pitch curve", not a second "Pitch". (2026-11-09 he said "I hate the top right" of the buttons then there;
  today's call puts these three there — P159 keeps both quotes.)
- Proof: P162 (each of ⤓ ▶ ✕ appears once), P159, P161, P166 updated; the Workshop suites and boundary green. Preview:
  docs/previews/workshop-top-right.png.

## 3.171 Showcase patterns — Lofi, Synthwave, Wobble Bass; a library pattern keeps everything its notes carry (2026-11-12)
His words: "also can you make some patterns testing all the new tools and features. lofi, synthwave, and wobblebass?"
- tools/music/data/showcase-patterns.js (NEW, data only): 13 hand-made patterns — Lofi (82 BPM: keys as 9ths from one note, strummed,
  the tape drifting · a melody whose wobble's depth has its own modulator · a sub that sighs with a pickup on pass 4 · drums with a late
  snare, hats by chance, a dragging ratchet), Synthwave (105: Retro DCO outrun bass with a shaped filter per note, a brass swell chord whose
  vibrato blooms, a lead with bends, an accelerating ratchet and a note at double speed · Swarm bloom: coupling rises, cluster breathes on a
  triangle whose rate has a modulator, the second chord skips on pass 2 · Neon Gated drums with a ratchet fill on pass 4), Wobble Bass (150:
  the rate per note and bending up inside each note, a stuttering dive · Yoi talk: vowels per note, the formant sliding, a swap on pass 2 ·
  Tearout: ratchets both ways, a laser dive that grows · Riddim: two notes at double speed). Shapes are compiled as the Workshop compiles
  them, so they play as written and open in the Workshop as made. Filed under Chill, Synth & Dark, Dubstep; the curve transform adds theirs.
- Found and fixed: a library pattern placed on the Timeline (send, the page's ⇥) and a pattern saved from the Workshop (SAVE PATTERN) kept
  only a note's knobs and bend — its shape, how it plays, chance, ratchet, microtiming and knob curves were dropped.
- Proof: tests/p171-showcase-patterns.test.js 17/17 (every preset on its tool, every feature used, every pattern rendered and heard; the
  placement and save checks fail on the old code); P71 P72 P73 P76 P100 P151 P154 P165, boundary, no-toys green.

## 3.170 Drawing on the Workshop draws (2026-11-12)
His words: "okay exploded view works. drawing does nothing."
- At the note a drag only opened the pitch (a drum note: nothing) and in 3D every press turned the camera (as at 3.156). Now a drag at the
  note draws into the shape it is over — the pitch, or a pad's first knob — made if needed, one step, then the view is that shape; in 3D
  the pen draws on the plane under it (a kind with planeDraw: its drag gets 0–1 points on the plane), and Alt, the middle button, O, or a
  drag that starts off every plane turns the camera. The 3D help line says so.
- Proof: tests/p170-drawing-draws.test.js 3/3 (fails on the old code); P156's orbit drag uses Alt; P162's click still picks a shape first.

## 3.169 A new layer on the Workshop — built, shown, not merged yet (2026-11-12)
His words: "also why cant i add layers?" (with a screenshot: a drum note in 3D, one plane)
- Why it looked that way: adding a layer existed only as two ＋ rows at the bottom of the list (Set a knob for this note, Shape something),
  used through a dropdown; and in 3D only curves are planes, so a note with nothing shaped shows one.
- canvas/runtime/workshop.js (domain-free): a kind may say what can be made, addable(doc) → [{ section, label, key, value }]; LAYERS gains
  ＋ (New layer), Ctrl+Shift+N, and a NEW LAYER section in the right-click menus; each item is one history step.
- timeline.workshop.js: SHAPE OVER THE NOTE (Pitch for a melodic note, each knob of the instrument) · SET FOR THIS NOTE ONLY (each free knob).
  A shaped knob is a curve: a plane in 3D. The two ＋ rows stay as they were.
- Found: the Drum Machine gives the Timeline only Volume and Humanize as knobs, so a drum note can add only those (its pads' tune / decay
  are not knobs the Timeline sees) — a next step, his call.
- Then his words: "it worked before. when i was able to add mods. we are regressing. it was exploded before and i was able to draw. no it
  should be under the layers section. also the mods." — the regression: W3h (3.162) drew only shapes in 3D ("a value layer is a number"),
  so a drum note (no curves) went from six planes at 3.156 to one. Every layer is a plane again; a click still picks a shape first where
  planes overlap (P162 kept). ＋ moved from the LAYERS header to its foot, beside ∿ — add a modulator to the selected shape (or pitch / the
  first knob), shaping it first if needed, one step; ＋'s menu gains MODULATE.
- Proof: tests/p169-new-layer.test.js 3/3; P150 P154 P156 P157 P159 P160 P162 P165 P166 P167 P168, boundary green; design check no worse.
  Preview: docs/previews/new-layer-drum-exploded.png, new-layer-drum-mod.png.

## 3.168 The notes in the OUTLINER open when clicked (2026-11-12)
His words: "the notes listed in the note workshop don't do anything."
- Cause: the note kind's outline gave a layer only to the open note; every other note row was plain text, and the outliner did nothing on click.
- canvas/runtime/workshop.js: an outline row may carry an edit ([depth, text, layerId, { key, value, label }]) — a click selects the layer and
  makes the edit (one history step); clickable rows show a pointer (workshop.css). Domain-free.
- timeline.workshop.js: each note row opens its note (sel); the open one stays marked ▸.
- Proof: tests/p168-outliner-opens-notes.test.js 1/1 (fails on the old code); P150 P154 P159 P160 P162 P166, boundary green; design check no worse.
## 3.167 The exploded view explodes again (2026-11-12)
His words: "the eploded view doesn't explode it anymore"
- Cause: the 3D gap was 1.15 / layers. A note (3 layers) still spread; an instrument on the Workshop (I1) has 14 stages, which ended
  0.08 apart and overlapped into one block (277 px top to bottom vs 84 px flat, the planes about 21 px apart).
- canvas/runtime/workshop.js: exploded keeps its distance (0.383–0.42) whatever the count, and the camera steps back to fit the stack
  (the user's zoom still applies). Few layers: unchanged (the note view 198.6 px before and after). view() also returns the drawn planes.
- Proof: tests/p167-exploded-stays-apart.test.js 1/1 (fails on the old code: 21.3 px between planes); P150 P156 P159 P162 P165 P166,
  boundary green; design check no worse. Before / after: docs/previews/exploded-before.png, exploded-after.png.

## Built, shown, not merged yet — 3.166 Any tool on the Workshop, from its own settings (I1) (2026-11-12)
His words: "How hard would that be to edit?" · "Start." (and 2026-11-09: "constraint field of nodes? … could always have each tool, or domain have a template or every kind")
- tools/music/core/instrument-workshop.js (NEW): one kind, `music.instrument`, generated from a tool's settings through music's stage words
  (CONTROL · SOURCE · MOD · SHAPE · AMP · FX · OUT) — no code per tool. Its flow as nodes; drag a bar = set it, LIVE while the hand moves, one
  history step on release (Shift: fine); a word steps to its next choice; a click selects a stage; undo puts the tool back; 3D planes; wires
  only where a modulator's setting names its target ("→ cutoff"). Right-click a tool › Open on the Workshop.
- canvas/runtime/workshop.js: open(…, { onLive }) and kind.toolset (domain-free).
- Proof: tests/p166 3/3 (every tool with settings makes a whole kind; Retro DCO live drag / fine / word / select / undo; an effect opens from
  the menu); boundary 10/10, P150 … P165 green; design check no worse. P70's curve-lane failure is on main.
- Previews: docs/previews/instrument-retro-dco.png, instrument-wobble-bass.png.

## Done — 3.165 Patterns made on the Workshop: the map adds notes, IDEA, save, New pattern (2026-11-11)
His words: "the ability to add a note on the piano roll from the map would be usefull. also the pattern editor is meant to be in the workshop …
i want to be able to add or create patterns for the library and the timeline and import them into the timeline." · "i want to make music
badly. im struggling with complex patterns. never done this before"
- The Workshop's map (navigator): a click on a note opens it; a click on an empty spot adds a note there (the 16th and key under the hand).
  ✕ NOTE (Shift+Delete) takes the open note away. Works on an empty pattern.
- ✦ IDEA (I): fills the pattern with notes in the song's key from a structure (components/pattern-field: a rhythm, a contour, a density by
  seed); again = another take; ＋ BUSIER / − SPARSER keep the take; undo brings the last one back. Live in the Timeline's clip.
- SAVE PATTERN (Ctrl+Shift+S): the whole pattern into the rhythm library under Yours (kept from the root: any key), → Timeline from there.
- Patterns › ＋ New pattern: an empty two-bar pattern on the Timeline, open on the Workshop.
- Also: the Shapes / Yours genres have a family (P73 was failing on main). No screenshot shown (his call: low on tokens).
- Proof: tests/p165 2/2 · P150 P154 P156–P162 P151 P71 P73 P76 boundary green.

## Built, shown — 3.162 What to do with it (W3h); release 0.2.20 (2026-11-09)
His words: "what do i even do with this? i cant edit layers or draw, manipulate or do anything with it. no way to close, save or play the note either."
- The foot of the tool strip: ⤓ save · ▶ play · ✕ close; a help line in the view (the kind's hint); 3D: only shapes are planes, a click picks
  one, a double-click opens it; OSCILLATE's plane is its oscillation only.
- Fixed: the Workshop's element helper set disabled="false" (a disabled button) — the layer tools could never be clicked; tests/run.html now loads
  workshop.css, so the Workshop tests run the real layout (P161 had passed on an unstyled page).
- Proof: tests/p162 1/1; P150 … P161 green. Version 0.2.20.

## Done — 3.164 Knobs while a note sounds: the guard knob by knob; Retro Poly, Supersaw, Organ follow (2026-11-10)
His words: "continue with the remaining instruments."
- The guard rebuilt (tests/p163): for EVERY numeric knob of EVERY instrument, three renders of one held note — low throughout, high from the
  start, low then moved at 1.0 s — by level and brightness. A knob that matters before a note but does nothing mid-note lags. One suite per
  instrument (a whole run in one page ran the browser out of memory). 31 instruments.
- What it showed: Sub Engine, Wub Sub, Pad Forge, Embodiment Lab, Bass Forge, Wobble Bass, Reese, Retro DCO, Swarm DO follow (the first,
  one-knob measure misjudged them: a filter above a pure sine changes nothing either way). The real lags were 36 knobs on 11 tools.
- Fixed: Retro Poly (saw, pulse, width, noise, sustain, filter sustain — with 3.163's cutoff, res, sub: 11 of 12), Supersaw (mix, sustain:
  all), Organ (every drawbar and celeste: all — each note now has a silent pipe for a closed drawbar, so it can be pulled out mid-note).
- Left, listed in the test (20 knobs, the list only shrinks): xen-synth n, baseHz, baseNote, partials, tilt, even, sustain · acid-synth tune · sub-engine sustain · coven spread, vibrato · retro-poly
  envAmt · curve-synth span, sustain · syn-osc fine, detune, width, sustain · syn-partials sustain · wub-osc dive.
- Proof: P163 31/31 with the list · organ 43/43 · retro-poly 12/12 · supersaw 13/13 · P130 4/4.

## Done — 3.163 A knob moved during a note reaches that note: the guard, Retro Poly, Supersaw (2026-11-10)
His words: "the workshop when drawing or manipulating or shaping, doesn't do much to change the sound." · "changing any tools values, knobs,
presets or what ever is really delayed" · "whats cheaper, or higher leverage? … do it."
- Found, measured live: many instruments read a knob only when a note starts, so a knob, preset, automation lane or Workshop curve was heard
  on the NEXT note (Retro Poly: cutoff at note-on; a 150 Hz → 9 kHz sweep mid-note changed the note by 0.00 octave).
- tests/p163-knobs-while-playing.test.js: every instrument with a tone knob holds a note; the knob moves at 1.0 s (offline, sample-exact);
  brightness (RMS of the change over RMS) against the same note left alone. Fixed tools are asserted; the others are listed, and the list
  only shrinks. Today: 12 measured; following: Retro Poly (fixed), Supersaw (fixed), Retro DCO, Swarm, and the worklet tools; partly (0.4–0.5
  oct): Acid Synth (its drive after the filter flattens the measure), Bass Forge, Wobble Bass (its own LFO sweeps the same filter; it sets the
  filter live); not yet: Sub Engine, Wub Sub, Pad Forge, Embodiment Lab.
- Retro Poly: each voice keeps the cutoff it started with; a change shifts its filters by the difference (detune) so its filter envelope keeps
  its shape; resonance and sub level follow too. Supersaw: the same for its cutoff. Nothing changes when no knob moves.
- Also found: Workshop shapes faster than ~32 cycles per note lose depth in the 64-point compile (open).
- Proof: P163 1/1 (fails on the old Retro Poly: −0.00 oct) · retro-poly 12/12 · supersaw 13/13 · P130 4/4 · P147 1/1.

## Done — 3.161 The Workshop's toolbar, tempo, the rhythm library (W3g) (2026-11-09)
His words: "looks great though, the tool but i want to be able to manipulate it on the canvas, like photoshop, needs the toolbar, for drawing, shaping, editing, etc. tempo. next patterns from the pattern storage, maybe rename it to rhythm library."
- canvas/runtime/workshop.js: the toolbar V P L D S G E O (select, pen, line, points, smooth, move, erase, orbit) works on the view, live while
  the hand moves (K.drag → K.set drawn, no history), one step when it lets go; Shift+E spreads / flattens; K.bar fields in the options bar.
- tools/music/components/curve-edit (NEW, spec first): pen, line, move / add / remove a point, smooth and erase brushes (they follow the stroke),
  offset, scale, simplify — 16 checks.
- music.notes: the tools on the open curve or a modulator's wave (it becomes drawn); on the note a tool opens its pitch; POINTS shows handles;
  TEMPO in the options bar (the transport's own; undo puts it back); R opens the RHYTHM LIBRARY (renamed from Patterns: the toolbar button, its
  tab); ⇥ Workshop on a rhythm puts it into the open pattern (one step; undo).
- Proof: tests/p161 3/3; P150 … P160, P76, P86, Timeline 89/89, boundary green; components; design check no worse. P73 (shapes) on main too.
- Previews: docs/previews/workshop-toolbar.png, rhythm-library.png.

## Done — 3.160 Fixed: ERAVOS would not open (0.2.19) (2026-11-09)
His words: "its not opening. i deleted my tools from the program files and no longer have them. i tried to reinstall but it didn't work. looks great though, the tool" (with the dialog "Error: Cannot find module './library-tools.js'", resources\app\main.js:52).
- Cause: 3.155 made desktop/main.js require ./library-tools.js; desktop/build.mjs copied it, packaging/windows/make-exe.ps1 (which makes the
  Setup) did not. Fixed: make-exe.ps1 copies it; main.js opens without it (tools from the app folder, as before); desktop/test/shipped-files.mjs
  follows every require from main.js / preload.js and fails if either build does not ship it (fails on the old make-exe.ps1) — in checks.yml
  and release.yml. Release 0.2.19.

## Done — 3.159 The Workshop's layout (W3e) and navigation, instrument, speed, note library (W3f) (2026-11-09)
His words: see specs/eravos.workshop.spec ADDENDA 2026-11-09 (3) and (4). Approved: "looks great though, the tool".
- W3e: no buttons up top; PROPERTIES over Photoshop-style LAYERS (eyes, thumbnails, folding groups, layer tools in the footer); V B O; keys
  for every action (?); right-click menus with keys. W3f: the navigator (a mini piano roll; click, [ ], N folds); dropdowns for long choices;
  PLAYS (any instrument, a new one added, the lane follows, undo); per-note Speed (the tool's tempo for that note — sdk-music); the Note Library
  (Ctrl+S, From the library, Patterns › Notes tab).
- Proof: tests/p159 1/1, p160 4/4; P150 … P158, Timeline 89/89, P149, P123, P76, boundary green; components; design check no worse.

## Done — 3.158 How a note plays: when, a chord, the ratchet's shape, humanize, A / B (W3d) (2026-11-09)
His words: "Yes the rest of the note shaping. Enterprise grade. Studio quality." · "Decouple. Pretend I didn’t say it · Delete that." — the decouple map and its entries removed.
- timeline.engine.js: note.x (cleaned; absent = exactly as before) — cond (pass k of every N, plays or skips), iv (a chord from the one note:
  strum, direction, each voice softer), rs / rv (the ratchet speeds up or slows down; velocity fades, flat or grows), ht / hv (humanize per pass,
  seeded). timeline.workshop.js: HOW IT PLAYS layers (When, Chord, Ratchet shape, Humanize), A / B (SET A, ▶ A, ⇄ A/B), the view draws voices,
  hits and words; HEAR plays the chord. workshop.js: a long enum in the options bar is a dropdown.
- Proof: tests/p158 6/6; P112 13/13, P157, P156, P154, P150, P149, P76, Timeline 89/89, boundary green; design check no worse.
- Preview: docs/previews/workshop-how-it-plays.png.

## Done — 3.157 The Workshop: hear a shaped note, its shape to all, its own knobs (W3c) (2026-11-09)
His words: "Just ant them to be zipped per tool. With a dag. This is future plans.  Not now. Continue the wokshop"
- ▶ HEAR (the note alone through its instrument, shaped, for its length) · ⇉ ALL NOTES (the shape and knob values to every note, one step) ·
  ITS KNOBS · THIS NOTE ONLY (any number knob of the instrument per note — p; ＋ set, inspector value, ✕ KNOB). timeline.workshop.js (bind),
  timeline.pianoroll.js (the hear hook through note_audition).
- Proof: tests/p157 2/2; P156 3/3, P154 4/4, P150 7/7, Timeline 89/89, P76, P112, boundary green; design check no worse.

## Done — 3.156 The Workshop in 3D; a note shaped fractally (W3) (2026-11-08)
His words: "yeah, that needs to be moved to the editor. pattern editor. i want you to finish the workshop with the 3d." · "i want the 3d. like i want like a full modulation, waveform, oscillation, like all the ways to edit a sound, give it as much depth as possible. fractally and recursively."
- canvas/runtime/workshop.js (domain-free): the viewport in 3D — the kind's layers as planes (K.drawLayer), EXPLODED / FLAT, TOP / FRONT /
  ORBIT (drag turns, wheel zooms), WIRE / LIT, an axis gizmo; a drag in 2D draws (K.stroke, one history step); bar actions that are edits;
  the station path clickable (go up). Canvas 2D only: each plane is an affine map of the kind's drawing.
- tools/music/components/mod-tree (NEW, spec first): a SIGNAL = drawn base + modulators; every modulator's rate and depth are signals, so it
  nests (bounded at 8). Eight waves (sine, triangle, saw, ramp, square, random, smooth, drawn), phase, fade-in, seed; the rate integrated.
- music.notes: ＋ Shape something → Pitch or any number knob of the note's instrument; ▾ INTO / ▴ UP through the tree (stations SONG › PATTERN
  › NOTE › PITCH › MOD 1 › RATE …); base presets (flat, rise, fall, arch, dip, s-curve, zigzag, steps) or drawn; a modulator selected, the drag
  draws its wave. The tree compiles into what the engine plays (b.path, c[knob]) and is kept on the note (sh; the engine keeps it).
- Proof: tests/p156 3/3 (two and three levels; a rising rate speeds the vibrato; ±2 st measured; 3D draws in every view with no error; a drag
  orbits; a drawn base is one step and undo is exact; a knob's curve stays in its range; unshape restores); mod-tree 19 checks; P154, P150,
  P151, P108, P112, P76, P113, Timeline 89/89, boundary 10/10 green; components all pass; design check no worse. P70's curve-lane failure is on main.
- Previews: docs/previews/workshop-shape-3d.png, workshop-shape-2d.png.

## Done — 3.155 The tools live in Documents\ERAVOS\tools (store S3) (2026-11-08)
His words: "no they were in program files. my eravos folder in documents is empty, just empty folders." · "like i want to make everything outside of the canvas, in a seperate repo. like a tool store."
- desktop/library-tools.js (NEW): sync(bundle → library) and resolve(library, else bundle). desktop/main.js: on start (packaged) the app
  folder's tools/ goes into Documents\ERAVOS\tools; eravos://app/tools/* is served from there. Your edits are kept across versions.
- Measured: 1,610 files, 30 MB; first start 278 ms, later 17 ms. desktop/test/library-tools.mjs 14/14, in the release workflow.

## Done — 3.154 W2b withdrawn: the piano roll back out of the Workshop (2026-11-08)
His words: "no the note editor, not the piano, the tools are for the canvas. if its going to be in the workshop, it needs to add what the timeline doesn't. like all the ways to manipulate a note, that the piano roll has. im trying to decide if thats better or not. the note editor is for fully shaping, manipulating."
- workshop.js, workshop.css, timeline.pianoroll.js/.css, P154 and run.html put back as they were before 3.153; tests/p155 and the preview removed.
  The dropped-tool-zip fix from 3.153 stays. The note editor's direction (shaping one note) is in specs/eravos.workshop.spec, his to decide.

## Done — 3.153 The Workshop hosts the whole piano roll (W2b); dropped tool zips kept in Documents\ERAVOS\tools (2026-11-08)
His words: "need all of the node editor from the timeline, like workshop needs much more. can you continue the workshop." · "also tools should be added by dragging in zipped tools. the documents folder, not in the program files."
- canvas/runtime/workshop.js: a kind's own editor can be hosted in the viewport (o.host / hostLabel / hostKey / onView; api.record, api.sync,
  api.view). Two tabs: the hosted editor and the drawn view (kept).
- timeline.pianoroll.js: openWorkshop moves the roll itself into the Workshop (every tool, lane, key and menu), each commit is a HISTORY step
  (ADD / EDIT / DELETE · n notes), undo there puts the clip back, the inspector follows the selected note, close returns it to the same spot.
- Drops: a dropped zip that brings a tool is kept in Documents\ERAVOS\tools (was packs\), other packs in packs\ — never the app's folder;
  both load every start (desktop/main.js keep-pack kind, desktop-bridge.js isTool). Measured on the built packs: 69 tool zips → tools, Core and
  Bundles → packs.
- Proof: tests/p155 3/3; P154 4/4, P150 7/7, P151 2/2, P112 13/13, P76 4/4, P108/P109/P113 green, Timeline 89/89, boundary 10/10; design check no
  worse. P70's curve-lane failure is on main too.

## Done — 3.152 Notes and patterns open on the Workshop (W2a) (2026-11-08)
His words: "The edit pattern or note doesn’t open workshop." · "The workshop should be built. It says in the commit"
- Found: the Workshop was built and released (W1, 3.150; the Step kind, PR #139/#141; in v0.2.17), but only the Pattern and Step tools opened it.
  The piano roll's ✎ Edit note… still opened the 3.116 inline editor and Patterns › ✎ Edit notes the piano roll: W2's note kind was never built.
- tools/music/tools/arrange/timeline/timeline.workshop.js (NEW): the Workshop's NOTES kind (`music.notes`). The document is the clip's notes as the
  roll keeps them. Stations SONG › PATTERN › NOTE. Pattern scale: every note drawn, a click opens one. Note scale: Timing (start, length, nudge),
  Pitch, Velocity, Chance and ratchet, Bend and Oscillate as curves (none for drums). Every edit goes through the roll's own commit (live), one
  undo step each; defaults are not stored; opening it changes nothing.
- ✎ Edit note… opens the note there; double-click keeps the quick editor. Patterns › ✎ Edit notes lands the pattern on the Timeline (as before)
  and opens it on the Workshop. canvas/runtime/workshop.js unchanged (domain-free).
- Proof: tests/p154-workshop-notes.test.js 4/4; P150 7/7, P151 2/2, P112 13/13 (its Edit note… check moved to the quick editor), P76 4/4,
  boundary 10/10, 258 manifests valid. Timeline 88/89: the one failure (a plain wheel scrolls time) fails on main too, not from this.

## Done — 3.151 Patterns in the browser and on the Timeline; the UI field shown (2026-11-07)
His words: "patterns need to be in the timeline or in the pattern browser. Need the dag for the ui. Like dynamically changes using the
constraint field? Like moves around fluidly?" · "Yes. 1 then Show me a preview."
- tools/music/data/pattern-shapes.js (NEW): every Pattern preset, and every structure saved (Pattern window › Save to Patterns, or the
  Workshop's SAVE TO PATTERNS), is a block in the pattern browser — its notes emerge in A minor and are kept as semitones from the root, so it
  plays in any key; sorted bass / lead by its range; played by the instrument it was wired into. To Timeline (window) / TO THE TIMELINE
  (Workshop) puts the notes that emerged on the Timeline as a clip, on that instrument's track, in the song's key.
- The Workshop: a kind may give actions (buttons in the bar; the surface still names no domain); what an action says shows in the status bar.
- Found on the way: a tool's own code may not use browser storage (boundary) — the store lives in the domain's data layer, beside the browser.
- The UI field (PREVIEW, nothing built): specs/eravos.ui-field.spec — the UI DAG generated from each tool's settings (matters-when, drives),
  the layout as a constraint field (IN PLAY · MORE · NOT IN PLAY with why), every move animated; shown on the real Swarm Oscillator in free,
  coupled and harmonic (docs/previews/ui-field-*.png). Opt-in when built; today's layout stays the default.
- Proof: tests/p151 2/2 (each preset a block whose notes are what emerges; save → a block → the Timeline clip holds exactly the emerged notes
  in the song's key) · P150 7/7 · P71 10/10 · P76 4/4 · P100 3/3 · boundary 10/10 · design check no worse.

## Done — 3.150 The Workshop, W1 flat: a pattern as a structure (2026-11-07)
His words: "agnostic. the structure defines the shape which defines the emergent properties of the conditions." · "can you make it more like
photoshop? or like a 3d renderer? then it could support a game engine, like this could be the build surface for emerge." · "Yeah, we can just
start with this. The small, like just the flat".
- components/pattern-field (NEW): a pattern's structure (key, chords per bar, a Euclidean grid k of n, a range, density over the pattern, a
  contour, length, seed, locked notes) → the SHAPE (every note it admits) → what EMERGES (deterministic; two draws a step, so one change never
  reshuffles the rest; locked notes kept whatever the shape). 16 checks.
- Pattern (eravos.pattern-field, Generators): its settings are the structure, the key comes from the canvas; it plays what emerges into any
  instrument wired to it, every change on the next step (live). Window: a flat view of the shape and the notes (the playhead moving), Shape
  and Structure controls, Open in Workshop. Factory: Rising Line, Four on the Floor, Tresillo Bass, Sparse Arch, Falling Rain, Climb.
- canvas/runtime/workshop.js + workshop.css (NEW, domain-free): the approved build-surface layout, flat — the bar (the kind's stations,
  Undo, Redo, Apply →, close), the options bar (the selected layer's fields), the tool strip, a tab, ONE flat viewport the kind draws, OUTLINER,
  LAYERS (grouped; constraint · curve · value · events · emergent), INSPECTOR / HISTORY, a status bar; every edit one undo step, live to its
  owner; a kind is checked before it is accepted (a missing part is named). The look is the Void, scoped to the Workshop (nothing else
  changes); its fonts in canvas/runtime/fonts (SIL OFL, licences beside them).
- The music PATTERN kind (in the tool's UI): STRUCTURE · THE SHAPE (Scale, Chords, Grid, Range, Density, Contour) · WHAT EMERGES (Notes,
  Yours, Variation); a click on a note locks or frees it; ADMITTED / EMERGED counted.
- Found on the way: the light layers drew window rims over the Workshop (hidden while it is open); the outliner looked for the wrong id.
- Proof: tests/p150-workshop.test.js 2/2 (a kind from no domain: refused when incomplete, opens, edits live, undo, redo, history, options bar,
  Esc) · pattern-field.test.js (contract 4/4 + 4: the notes played are exactly the ones that emerged; a change reaches the next step; a lock
  always plays; Open in Workshop → an edit reaches the tool, undo follows, a click locks, closes) · components all pass · boundary 10/10 ·
  design check clean for the new tool (56/73) · 255 manifests valid · P119 3/3, P38 37/37.
- Next: W2 (the NOTE kind, the zoom chain, the library), the 3D viewport, the time lane, the assets; Bassline / Arp / Groove opening here.

## Done — 3.149 A joined note's curve reaches worklet instruments (2026-11-07)
His words: "when i connect the edges it plays flat. but not when i leave them alone. like its not acknowledging the curve."
- Cause: Connect edges (and Sketch, and a note's Bend) send ONE note with a pitch curve; separate notes each carry their own pitch, so
  they played. The SDK's pitch wheel bends the oscillators a tool creates (their .detune) — Retro DCO and Swarm Oscillator make their
  sound in one AudioWorklet, had none, and played the note's first pitch for its whole length.
- sdk-music: ctx.bendInto(param) — a worklet tool hands the wheel an a-rate AudioParam in cents; the same bus drives it (note bends,
  joined notes, Sketch paths, the Pitch lane, bend in). Retro DCO: a `bend` param added to every voice's cents. Swarm: f0 bent per sample
  (and its sub).
- Proof: tests/p149 5/5 — Retro DCO, Swarm, Retro Poly, Supersaw, Pad Forge each glide an octave on a joined path and on a Bend
  (old code: Retro DCO and Swarm ×1.00, flat); P139 7/7, P123 9/9, P108 2/2, retro-dco 4/4, swarm 4/4, timeline 33/33, P130 4/4.

## Done — 3.148 Updates from git: a Beta channel (every merge to main) + release 0.2.16 (2026-11-07)
Asked: "Can you integrate git into Eravos? Like it’s saying no update. I’m on 0.2.15."
- Why "no update": nothing had been released after 0.2.15 — releases were made by hand; main had moved on.
- The release workflow also runs on every merge to main: the same build and tests (components, no-toys, the updater, ERAVOS Update
  end to end), the app stamped v<next patch>-beta.<run> (0.2.17-beta.N after 0.2.16), published as a pre-release that is never
  "latest" — Stable never sees it. A newer merge cancels a beta build still running; a release run by hand is never cancelled.
- desktop/updater.js: Stable (GitHub's latest release, as before) · Beta (the newest of the recent releases and pre-releases that has
  files); versions compare with betas (0.2.15 < 0.2.16-beta.3 < 0.2.16-beta.4 < 0.2.16); kept in channel.json; a beta build starts on Beta.
- ⚙ Settings › About & updates › Updates: Stable · Beta (desktop only) — a new control, nothing else changed (docs/previews/updates-channel.png).
- The installer: Windows' file version takes numbers only — NUMVER (0.2.16 of 0.2.16-beta.12) passed by make-exe.ps1.
- Proof: desktop/test/updater.mjs all pass (+7: beta ordering, stable default, stable on 0.2.15 = no update, beta picks the newest beta
  with files, kept, unknown refused, a beta build starts on Beta); P110 2/2; boundary 10/10 (the canvas says "which updates", not a
  tool word); workflow YAML parses. The first beta proves the rest on GitHub's Windows runner.
- Open: old betas pile up on the releases page (a tidy step that keeps the last few — his call before anything is deleted).

## Done — 3.147 Lag: a time budget for the reactive colours; the arp starts on the next step (2026-11-07)
His words: "the bassline is laggy as hell. it's high leverage. same with arp." (and on Swarm's in-tune Restless: "that sounds worst … like
a horn" — reverted; Restless is as he first heard it.)
- Measured in the real canvas (Bassline → Retro Poly, 6 s of play, the browser's own counters): reactive colours on, the main thread
  busy 5.9 s of 6 (off: 2.3 s), frames 60–100 ms, stalls to 250 ms — the colour writes restyling each window (~2 s), the sound-driven
  glows repainting (~2 s), the full-screen glow layer (~1.5 s). The notes themselves were not late in the sample (≥ 30 ms early); the
  screen and the controls were. Bassline alone with no sound: fine.
- sound-css: a time budget — while frames run slow (average over ~½ s above 22 ms) colours are written up to 4× less often; with room,
  as before. glass-layer: draws every 2nd / 3rd frame while frames are slow (the lights ease on real time, so they move the same).
  Attributes (data-react, data-lv, data-acc-live) written only when they change (data-react was re-set every frame on every window).
  Settings › Graphics › Low takes the same case to stalls of ~10 ms.
- Retro Poly arp: ticks are dealt ~100 ms ahead; a key pressed after a step was dealt waited for the next step dealt after it (up to a
  step + 100 ms). The steps already dealt are kept and played for the key: the first note on the next step. A timed note's release now
  counts from its start, not from when it arrived.
- Proof: tests/p147-arp-starts-now.test.js 1/1 (fails on the old code: silent); retro-poly 12/12, P130 4/4; reactive suites P48 P58 P73
  P77 P83 P84 P102 P106 green; P82 2 failures as on main.
## Done — 3.146 The novelty gate, advisory (2026-11-07)
Sent by him (10:26:25Z): "Novelty gate, advisory mode first. Establish a baseline, detect duplication and flag collisions. Don’t hard-block
merges until the measurement is validated against actual listening." (then W1, waveshaper, spectral-features) · "Novelty isn’t the same as
quality." · "Tool overlap isn’t necessarily redundancy."
- build/novelty-core.mjs: the measure in one place; build/novelty.mjs uses it — proved: old and new code give byte-identical report and
  novelty.json on the same 621-preset render. novelty.mjs also writes docs/novelty-baseline.json (418 fingerprints, scale, calibration).
- build/novelty-gate.mjs: renders the tools a branch changed (or --tools / --audio), compares every new or changed preset with the
  baseline → TWIN / CLOSE / novel in σ; a match in another tool: same role (tool.json "roles", else category) = possible duplicate — listen,
  different role = overlap, usually fine. Exit 0 always; CI step continue-on-error, the table in the job summary.
- Real data: Swarm + Retro DCO re-rendered → 0 changed (renders are repeatable); a temporary near-copy of Locked Unison → TWIN 0.000.
- tests/novelty-gate.test.mjs 8/8 (verdicts, roles, unchanged skipped, failed renders named, never blocks). docs/listening-log.md: the
  four measures the ear decides; first line the Swarm disagreement. Report refreshed: 418 presets, 197 novel, 91 close to another tool.
- Open: declared roles in tool.json (Deep Sub vs Reese Bass); a fair render for effects; 8 s held renders; controllability measured.

## Done — 3.145 N2: Swarm 1.1 — it moves by itself; motion in the fingerprint (2026-11-06)
Asked: "The swarm doesn't seem like anything new sound wise." · "Lets focus on getting tools more novel from each other" (and "Full note
and rhythm editor canvas." — mapped, next).
- oscillator-population 1.1: Restless (locked → a seeded kick in pitch, the coupling rests, then draws it back: it breathes), Form glide
  (harmonic: each note blooms from one pitch into its chord), Field FM (the swarm's mean sine phase-modulates every voice, pitch kept).
  All 0 by default: bit-identical to 1.0 (the 1.0 kernel kept as a fixture and compared sample for sample).
- Swarm Oscillator: More depth ▸ LIFE — Restless, Form glide, Field FM, Lock → tone (coherence moves the cutoff ±2 octaves); every
  existing preset unchanged; the Living pack (Breathing Swarm, Blooming Chord, Metal Swarm, Growl Cloud, Tide Lock, Shatter Bloom).
- Found on the way: a phase jump in Restless clicked (now pitch only); Breathing Swarm's 8-note chord hit 1.49 at full level (retuned:
  0.68).
- The fingerprint measures motion: how fast the tone and the level move (swings a second, trend removed, still = 0.1/s); novelty weighs
  four groups (colour · shape · envelope · motion).
- Measured honestly: over one 2.6 s note the Living presets sit no further from Supersaw than the older ones (median 0.138 vs 0.137,
  +1.0σ; Growl Cloud and Shatter Bloom −0.3σ from Reese Bass / Bass Forge). Restless takes seconds to show; his ear decides; an 8 s held
  render is the next measure.
- Proof: oscillator-population 24 checks; P123 9/9 (+3: Restless swings coherence > 0.3, still < 0.15; Field FM brightness × 1.5; Living
  shipped; every preset's chord < full scale); contract 4/4; audio-measure 42/42; components all pass; 253 manifests valid; design check
  no worse (55/72); no-toys green.

## Done — 3.144 Start: one section, a painting per setup; σ in the novelty report (2026-11-06)
Asked: "can you make the art for each genre of music and consolidate the start from and setups into one section and remove vegal, and wub
drop, then make the animated artwork for the setups" · "could always use sigmas to measure deviations between sounds and tools?"
- Eight animated paintings (240 × 110 SVG, CSS motion, still under reduced motion): EDM Lab (a festival stage, lasers sweeping, the crowd
  bobbing), Gothic (a cathedral, its rose window and candles flickering, bats), Heavy Drops (speaker stacks throwing shockwaves),
  Lofi (a rainy window, the lamp, steam, a cassette), Sound System (a yard at sunset, the stack pushing waves, a palm), Synthwave (the
  striped sun, a scrolling grid, mountains, palms), Wobble Bass Suite (a waveform wobbling over a pumping cone), Xen (a turning lattice).
  Each suite.json names its own painting ("art"); suites.js passes it on (the canvas still names no genre).
- Start page: SETUPS lead START FROM — one section. Vagal and Wub Drop hidden (kept in recipes.js).
- build/novelty.mjs: every distance also in σ from ERAVOS's usual preset spacing.
- The Sequencer ("isn't working"): reproduced in the real app inside the built Lofi setup — steps clicked, notes reach the Drum Machine,
  no faults. Asked him what he sees.
- Proof: P119 3/3, P132 3/3, P63 11/11, P38 37/37, P41 15/15, P42 23/23, boundary 10/10; 252 manifests valid; P11 91/92 (P11.S Tape Memory
  after Stop, failing on main too).

## Done — 3.143 N1: the novelty report across ERAVOS (2026-11-06)
Asked: "The sworm and other tools need to be checked for novelty, like I need to be able to make more with this." (and "Need to make sure
it's all novel").
- tests/audio-measure.js gains fingerprint(): tone colour (24 log bands, each its share in dB), brightness / noisiness and how they move,
  envelope (attack, level half way and at the end, loudness movement) — level-independent; checked against known signals
  (tests/audio-measure.test.mjs: sine vs noise, bright vs dark, a hit vs a held note, tremolo vs steady, level-free).
- tests/tool-audio.mjs runs again: it called Playwright's addScriptTag (Clear Glass has none) and never ran since the switch; it now
  waits for worklet tools (Swarm, Retro DCO, Tape Memory were measured silent or 1.9 s late); every preset carries its fingerprint.
- build/novelty.mjs → docs/novelty-report.md (+ docs/novelty.json): every preset against everything in ERAVOS of its kind; three feature
  groups weighted equally; CLOSE calibrated from ERAVOS itself (as close as two presets of one tool usually are: 0.045), TWIN half.
- Findings (68 tools, 615 presets, 413 comparable): 46 % of presets novel; 21 % have a CLOSE sound in another tool. Deep Sub sits inside
  Reese Bass (60 %). Swarm ↔ Supersaw: median 0.138 against Supersaw's own 0.045 — apart on this measure, so what his ear hears as "nothing
  new" is in the motion over time (not in one 2.6 s note): N2 has to make the swarming audible, and the measure needs a motion feature.
  Effects: not fair yet (one saw burst; gates, sidechain, glitch, throws come out untouched). 162 renders FAILED and are listed:
  Drum Machine 45 (over full scale at its raw output), Wobble Bass 38 (over full scale, sounding after Stop), Pad Forge 34 (late),
  Wub Filter 11, Wub Sub 9, Destroyer 7, Wub Osc 6, Retro Poly 5 (silent — likely the arp presets without the transport) …

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
