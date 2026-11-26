# spec_id: eravos.2026-11-24-session · status: mapped (each line: built / rule / open / answered) · author: James Brooks
# His words, verbatim, in the order he sent them on 2026-11-24 (this session had no per-message timestamps — the order is exact, the times
# are not recorded). "Map, spec first" (2026-11-06) · "Update the specs so nothing is lost." · today: "also log all of this, don't lose
# anything, update the specs, phases. and add that to a to do ledger". The same list, kept current: docs/HIS-WORDS-MAP.md (N-X97 … N-X125)
# · the evidence register: docs/competence/ · what is still to do: docs/TODO-LEDGER.md.

## 1 — verbatim:
  > can you merge branches. figure out why it keeps telling me error writing eravos.exe
  - ANSWERED: every branch on origin was already in main. BUILT 3.213 (PR #211, 0.2.32): a running ERAVOS was never seen by the Setup
    or the updater (tasklist /NH starts with an empty line) — fixed. Not his cause (see 2).

## 2 — verbatim:
  > its not running. eravos isn't even installed.

## 3 — verbatim:
  > windows defender is turned off.

## 4 — verbatim:
  > so have actually done something right? it didnt have this problem pre 2.30.
  - BUILT 3.214 (PR #212, 0.2.33): when the Setup's own window (0.2.30) cannot write the app, the Setup writes it the 0.2.29 way.

## 5 — verbatim:
  > need to realease 2.32
  - DONE: v0.2.32 released.

## 6 — verbatim (with two screenshots: "ERAVOS Update.exe: EBUSY: resource busy or locked" · "ERAVOS.exe (missing) …"):
  > trying to update it. fails to close eravos. also broke my current version.
  - BUILT 3.215 (PR #213, 0.2.34): the updater runs from a copy; a held updater kept and replaced at restart; the fallback by robocopy
    (3.214's CopyFiles had left ERAVOS.exe out — said plainly). Repair: run the Setup by hand.

## 7 — verbatim (with a screenshot of a component tile framed alone):
  > it works. but i want to be able to mutate the tools, synthesize two or more cores, and make something completely new. like my goal is to add the capability to create a mix of the retro dcs and the wobble bass to make the retro wobble or something. like it would play synthewave style wobble bass. like combine the sound of retro dcs with the rest of wobble bass. also want to be able to swap components better, like moving, them around and moving parts from one to another tool. like maybe when you hover tells you what it is and the point of it and how it effects sound, in the simplest ways, so even a child could understand it. like i want THE MUTATION explotion view on the canvas, to be able to create new tools from current ones, then the workbench to be able to build from scratch from components and the broad selection of ui elements, with different control types, and themes, like a tool builder. built completely in relation to the tool builder and mutation lab. like you open the mutation lab, and it has all the components, and cores to play with. What do you think? also
  >
  > the screenshot, the purple box should surround the entire component ui. also right click to replace. this is meant to be like creative space to create creative tools to create creatively, infinitely possibility possibly.
  - BUILT 3.216 (PR #214): the box framed whole; the hover card in the simplest words (tools/music/data/part-words.js); right-click › REPLACE WITH.
  - BUILT 3.217 (PR #215): the voice pickable; right-click › "◆ … the rest from <tool>" — ERAVOS makes "Retro DCO × Wobble Bass" from his picks.
  - OPEN: synthesize two or more CORES (whole tools) at once · the Mutation Lab's shelf (every component and core) · the Workbench / Tool
    Builder (from scratch: components, UI elements, control types, themes) — specs/eravos.assembled-tool.spec ADDENDUM 2026-11-24 (ML1–ML6).
  - OPEN: more tools able to swap parts (part-exchange profiles beyond Wobble Bass and Retro DCO) — the same addendum.

## 8 — verbatim:
  > like this is meant to be dynamic and fluid. also tools are isolated so if they cause instability they can be deleted.
  - RULE (CLAUDE.md): dynamic and fluid; tools isolated.

## 9 — verbatim (the first paragraph is a line of the AI coder's, quoted back; the second is his):
  > Retro Wobble: synthesizing keeps one tool's voice and the other's motion, and you choose which by what you pick. Proven by a render you can listen to.
  > eravos makes it, not you. only add capability. always capability first.
  - RULE (CLAUDE.md): capability first — ERAVOS makes it, not the coder.

## 10 — verbatim:
  > Yes.
  - his yes to 3.216 (merged, PR #214).

## 11 — verbatim:
  > Also update the readme, with images if possible.
  - BUILT 3.218 (PR #215): the README current, with pictures; every older note kept under Release history.

## 12 — verbatim:
  > okay do the exploded note view for the screenshot also. marge and publish.
  - BUILT 3.219 (PR #216, 0.2.35).

## 13 — verbatim:
  > okay but did we choose to do the exploded view on the canvas for existing tools?
  - ANSWERED: yes — 3.196 / 3.201: every tool explodes on the canvas with MUTATE; swapping parts only between Wobble Bass, Retro DCO and
    made tools (part-exchange.js). OPEN: profiles for the rest (Supersaw, Swarm, Retro Poly, Piano, Tape Memory first).

## 14 — verbatim (with a screenshot of today's Start and a notification of the Claude app):
  > what is that? also the start from should only show after you pick music. like only show the domains at first.
  - ANSWERED: the notification was the Claude app's (this session's title), not ERAVOS.
  - BUILT 3.220 (PR #217, 0.2.36): Start in two steps — the domains first; a domain picked → its modes, songs, START FROM.

## 15 — verbatim (with a screenshot: a note in 3D · EXPLODED):
  > like this
  - BUILT 3.220: the README's picture of a note blown apart in 3D.

## 16 — verbatim:
  > also borderless windows please?
  - BUILT 3.220 (0.2.36): no Windows title bar; the toolbar is the window's top (titleBarOverlay). Unconfirmed on Windows.

## 17 — verbatim:
  > i want beautiful animations in eravos. also can we optimize the performance even more? like is it using my graphics card? like offloading? using all my cpu cores, ram? like is it optimized? at least until looking glass replaces electron.
  - ANSWERED (nothing built): the GPU composites by default (no flags set); one tool uses WebGL; sound is one audio thread, the UI one main
    thread (~3–4 cores used); no tuning set; 15 files run their own animation loop.
  - OPEN: specs/eravos.performance-plan.spec (PF0–PF8) · animations: the same spec, AN1–AN3 (shown as a video first).

## 18 — verbatim:
  > dont build just tell me

## 19 — verbatim:
  > i mean i have a 3700x, rtx 1650, 16 gbs or ram, like disabling animations, transitions. like lazy load, like real pixelated when zooming out, gpupu, like what about a simplified ui for tools. then they expand as you resize them?
  > good idea?
  - ANSWERED: yes — each placed as a phase in specs/eravos.performance-plan.spec (performance mode, lazy / off-screen pause, a simpler look
    zoomed out, tools that grow as they are resized — preview first, GPU for pictures not for sound).

## 20 — verbatim:
  > also:
  > what ever is on the canvas, is priority, like if its music, its audio, if its image manipulation, its images and audio if there is more, like it needs to remain agnostic. also the settings needs to be a real menu, that expands from the tools dag contract, like what is needed expands the options.
  - RULE (CLAUDE.md): priority follows what is on the canvas, agnostic — from the tools' declared needs, never a domain named by the canvas.
  - OPEN: specs/eravos.performance-plan.spec RP1–RP3 (resource needs in the contract, priority) · specs/eravos.settings-buttons-dag.map.spec
    ADDENDUM 2026-11-24 (ST1–ST5: Settings a real menu, its sections from what the tools on the canvas need).

## 21 — verbatim:
  > okay well no options and settings. organize or tidy up, don't need both. sounds or rhythms, and songs. metronome loop region in the canvas ui. need to clean up the noise. need to when choosing a domain. remove the start button from the corner and just have the add button, with a back to domain, in the top left corner of the catalog.
  - asked (four questions); he answered the first (22). The rest: OPEN with the reading recommended, in docs/TODO-LEDGER.md (T-06 … T-10)
    and specs/eravos.bare-canvas.spec ADDENDUM 2026-11-24 (TB1–TB7).

## 22 — verbatim (his answer to "Options and Settings: you don't need both. Where should Options' actions go?" — options were: Into Settings · Into right-click · Both):
  > first one, beyond removing the undo and redo, and redundany options. also log all of this, don't lose anything, update the specs, phases. and add that to a to do ledger
  - DECIDED: Options' actions go INTO SETTINGS; the Undo / Redo buttons are removed (Ctrl+Z / Ctrl+Shift+Z stay); redundant options removed.
  - DONE 3.221: this map, the specs' addenda and phases, docs/TODO-LEDGER.md (the to-do ledger), the his-words map, the register.

## 23 — verbatim:
  > needs performance optimization. the cpu cores. its lagging with plenty of overhead. maybe custom settings, like cpu cores, animations, graphics acceloratoin. maybe invent a better driver
  - MEASURED (10 tools playing): main thread blocked ~46 % of each second, ~32 fps, stalls to 150 ms; the reactive colours nearly all of it
    (off: 60 fps, no long task). Inside them: one `offsetParent` read per window per frame forced the whole page's layout.
  - BUILT 3.222: the forced layout removed (IntersectionObserver); Settings › Performance (live numbers; Display rate, Reactive colours &
    glow, Animations, Resolution, Blur & shadows, Graphics acceleration on the next start); AUTO — "a better driver": the effects step down
    while the screen lags and come back with room. CPU cores: shown; spreading background work over them is PF6 (next).

## 24 — verbatim:
  > that is still not great. what about the audio driver or engine that electron uses?
  - ANSWERED: Chromium's Web Audio — one real-time thread for every tool, WASAPI shared mode (~10 ms), no ASIO / exclusive / device / buffer
    choice. Asked: is "still not great" the screen or the sound? (not answered yet)

## 25 — verbatim:
  > invent our own? specifically made more eravos?
  - ANSWERED: an engine of ERAVOS's own (not a driver): the DAG as the schedule across cores, tools isolated, everything live, synthesis in
    the engine, agnostic, live = offline, its own process.

## 26 — verbatim:
  > dynamic, load balancing, signal to noise? wait for emerge
  - DECIDED: the native engine is written in Emerge and waits for it (E2 / E3). DYNAMIC, LOAD BALANCING and SIGNAL TO NOISE written into
    specs/eravos.engine.spec (NEW, EN0–EN6); docs/TODO-LEDGER.md T-33 … T-38. Open: EN1 (today's stack) now?

## 27 — verbatim (2026-11-25):
  > i love the mutation and synthesis. can you expand to the rest of eravos?
  - BUILT 3.224 (shown first): Supersaw, Swarm Oscillator, Retro Poly, Piano and Tape Memory trade parts (part-exchange.js) and can be
    synthesized (tool-blend.js); what the engine cannot run yet is named, never faked. P218. ML1 continues for the rest.

## 28 — verbatim (2026-11-25; the first part quotes the AI coder's question, "just spec it" is his):
  > 1. EN1, now? Part of this needs no new language and works in today's ERAVOS: measure the audio thread's load, let silent tools sleep, end tails nobody can hear, add dither to exports, and add latency, sample-rate and output-device settings. It would help now and carries straight over to the Emerge engine. just spec it
  - SPECCED 3.224: specs/eravos.engine.spec ADDENDUM 2026-11-25 — EN1.1 measure · EN1.2 silent tools sleep · EN1.3 end what nobody hears ·
    EN1.4 clean exports (dither) · EN1.5 latency / sample rate / output device · EN1.6 denormals + headroom in every component. Nothing built.

## 29 — verbatim (2026-11-25): "yes merge." (with a screenshot: Start's first step on his PC — the domains only)
  - DONE: PR #221 merged. CONFIRMED on his PC: Start's two steps (T-03).

## 30 — verbatim (2026-11-25, with a screenshot: Image Manipulation picked, START FROM full of the music setups):
  > these shouldn't show in other domains. also remove the button that says empty canvas
  - FIXED 3.225: with a domain picked, Start shows only that domain's setups and songs (another domain switched on no longer leaks in);
    the Empty canvas button and card removed (Browse every tool starts the same way).

## 31 — verbatim (2026-11-25; with a pasted progress report from another session of his — not his words — about an autosave rename and synthesis-failure feedback):
  > find the other branch.
  - ANSWERED: no branch on GitHub holds that work (every remote branch and open PR checked; no other session reachable) — it was not pushed.
    The synthesis-failure feedback it described was then built here (32, 3.226); the autosave rename was not (it is not in any branch).

## 32 — verbatim (2026-11-25, with a screenshot: ＋ Add › Modes — "Pick a mode — or stay agnostic", the four mode cards):
  > remove these from the tool catalog. tools when the can't synthesize, need to flash the reasons why. also expand the ability. its hard to tell what it will do when i synthesize. like the wobble and the retro could sound amazing. or the reese and the piano, or what about making the next highest leverage components and tools. like also the retro poly. also the packs, for each tool, have like lofi, dubstep, synthwave, edm, dubstep, i want to make music that sounds like make it bun dem by skrillex, thats my baseline of reverse engineering. like i want the dubstep tools, synthwave tools, like look deeply into trenke by skrillex, like continue making eravos huge. synthesis and mutation and the unqiue sounds and opening them in the lab
  - DONE 3.226: the catalog has no Modes page (it opens on All tools). Synthesis: ◇ What will it make? (each place, the tool it comes from,
    what it is, what stays behind, ▶ Hear it, ◆ Make it); refused → the parts to blame flash and keep a red ring, the reason beside them
    with steps and buttons that fix it (the VOICE / MOUTH from another tool, the rest from another, 6 dB quieter, open the mouth, tame it,
    pick the boxes that fit, mutate then make). The plan shows while one core is carried over another. P226 2/2.
  - SPECCED (specs/eravos.assembled-tool.spec ADDENDUM 2026-11-25): ML3a the engine's VOICE gains unison (Reese, Supersaw) and a string
    (the Piano) so Wobble × Retro and Reese × Piano carry their voices; Retro Poly's poly / PWM; genre packs per tool (Lofi, Dubstep,
    Synthwave, EDM; technique only); the baseline "Make It Bun Dem" studied as technique; the next leverage set. docs/TODO-LEDGER.md T-39 … T-45.
  - OPEN (asked): "trenke by skrillex" — which track? · "opening them in the lab" — the Lab mode (analysis, spectra) or the Mutation Lab?

## 33 — verbatim (2026-11-25; the AI coder's question pasted back, with his screenshot — Spotify, his Liked Songs, #1 "Make It Bun Dem",
## Skrillex, Damian Marley, album "Make It Bun Dem After Hours EP", added Aug 22, 2026):
  > "trenke" by Skrillex: which track do you mean?
  - ANSWERED (his screenshot): the track is "Make It Bun Dem" (Skrillex & Damian Marley), the After Hours EP — the same record as his baseline.
    The baseline study (T-43) is that one record, looked into deeply: technique only, never its tune or a recording.

## 34 — verbatim (2026-11-25, of 3.226's catalog without Modes):
  > no. domains are meant to be there. just consistent with the rest of ui,
  - CORRECTED 3.226: the Modes page is back, made like the rest of the catalog — "Modes" heads it as "All tools" does; each mode and Stay
    agnostic is a tool card (the picture frame with its icon, glyph + name, blurb, plain chips); a click selects it, the detail on the right
    shows what it turns on and shows (as a tool's dependencies) with Enter / Browse where Add to canvas sits. Screenshot catalog-modes.png.

## 35 — verbatim (2026-11-25, of the catalog's Modes as tool cards):
  > okay, i hate the font. also the green. also i want the thumbnails back. and i want those generated per tool, mutated tool, consistent style.
  - ASKED (three questions: which font · what replaces the green · the paintings?) — he answered in 36.

## 36 — verbatim (2026-11-25, his answer):
  > yes. almost all of it. make it colored. the themes, and the reactive color.s
  - READ AS: the paintings, yes; the green — almost all of it — coloured by the themes and the reactive colours.
  - DONE 3.227: --ok (what is on / ready / done) is the theme's colour (Dusk #ff6fa8, Studio cyan, Field its accent, Midnight #8fa8ff) and the
    Beat colour moves it; every canvas use of the fixed green moved to it. Paintings: the mode cards show Start's paintings; the 7 tools without
    one painted (build/tool-art.py); a tool made on the canvas — synthesized or mutated — is painted at once in the same style
    (tools/core/art/painter.js: one ribbon per tool it came from, in its colour). FONT: a choice in Settings › Look (As it is · Grotesk ·
    Grotesk only · Plain), today's the default until he picks (catalog-fonts.png). P227 3/3.
  - OPEN: which font (his pick from catalog-fonts.png).

## 37 — verbatim (2026-11-25, with his Innovation Toolkit pasted — his own document, personal, not copied into the repo):
  > Use this to find domains we can use this canvas for
  - MAPPED: specs/eravos.domains-from-the-toolkit.spec — the toolkit run on the canvas: its invariants (I1–I8), the constraint field (C1–C4),
    the gaps (G1–G4), candidates scored with his weighting (the gate generalised · SYSTEMS · FRAMEWORK · CONNECTION · MIND · WORDS · pictures ·
    play), hostile verification, a proposed order D0–D4. Nothing built. Open: which first; the names.

## 38 — verbatim (2026-11-25, with a zip — his poetry index, 24 pages — and a poem of his as the lyrics; both personal, kept with him, not here):
  > continue making more tools for eravos. i want to make music with contrast. thats my rhytm;
  > i want to learn how to make music from my lyrics. that is the point of the rhythm tool
  - BUILT 3.228: the lyric-shape component (the shape of the words: energy, space, opposites, what comes back) → ♫ Make a song gives each
    stanza the part its words are and turns a stanza with opposites line by line; Lyrics → Rhythm shows SHAPE (each stanza's part and why)
    and "How words become music". P228 4/4. Next (T-53 … T-55): a tool that teaches it step by step on his own words; the vocal itself; the
    poetry index as songs to start from.

## 39 — verbatim (2026-11-25, with his personal book of philosophy — kept with him, not here):
  > How does it sound? Like I want it deep as hell.
  > More of my rhythm. Make patterns.
  - BUILT 3.229: Depth (Lyrics → Rhythm › SONG; build/render-words.mjs renders and measures it: his poem's song as WAVs, given to him);
    ⇢ Patterns (each stanza: words · mirror · shadow · pendulum) — the pendulum from his own book: "The amount of time the pendulum swings to the left is directly proportional to the amount of time in takes to swing to the right."

## 40 — verbatim (2026-11-26):
  > No like more dimentions. Also Like I want a voice lab. T pain like auto tune. Creating voice. And wubs, wow. Like voice music like wubs, etc.
  - BUILT 3.230: Dimensions (layers in the loud parts, a counter-line in the words' gaps, more space) beside Depth. SPECCED: specs/eravos.voice-lab.spec
    (TUNE · CREATE · WUB; components pitch-tracker, pitch-shifter, vocal-tract, letter-to-sound). Open: which door first.

## 41 — verbatim (2026-11-26):
  > I want to be able to change the ui elements to other styles, types, build components from combining two. Also the color keeps being yellow. I want to be able to tell what's mixing with what. Like I want to be able to mix the dco with the wobble bass and know it will make a wobble synthwave sound. You know? Expand the tools and engines maybe,
  - BUILT 3.230: the yellow gone (a made tool's colour = its parents' blended; an auto board's parts in the tool's own colour family);
    what mixes with what: every synthesis plan says what it will sound like ("wobble synthwave") and which tool brings which character
    (ToolBlend.CHAR / sound). SPECCED: specs/eravos.ui-elements-and-combining.spec (UE type / style, CB combine two components, EX engines).

## 42 — verbatim (2026-11-26, of "the composite node" in the coder's answer on what is highest leverage):
  > What the highest leverage?
  > didn't i name it in the spec?
  - ANSWERED: yes — SNAP, his (specs/eravos.workbench.spec ADDENDUM 2026-11-15 (3): "it would also be cool to 'snap off' components and snap components together."); the spec now says so (ADDENDUM (2)).
  > also merge and push. need to be able to delete custom tools. rename them. open them in workshop and edit them fully.
  - DONE: the branch merged (PR). BUILDING 3.231: a made tool deleted, renamed, opened in the Workshop and edited fully.

## 43 — verbatim (2026-11-26, with two poems of his as the lyrics — kept with him, not here):
  > Can you add contrasting rhythm or a bunch with tension?
  > I want to be able to import a song and have Eravos open it with the needed tools to replicate it. Hard? That could be a good test. Did you create extremely deep patterns?
  > I am a good writer.  It would be cool to be able to import my words.  Can we have voices for the lyrics? On top of my own? Like I want to be able to make any genre of music using Eravos.
  - BUILT 3.232: TENSION (who speaks: I / you per clause; the answer off the beat, three against four under it, bass and lead unresolved, the
    last line home with an arrival; Lyrics → Rhythm › Tension) · ⇣ Import words (.txt / .md / a Notion .zip; Your words) · DEEP patterns
    (ratchets on accents, ghosts on weak syllables, the answer lagging, line ends doubled, the pendulum's return every other pass).
  - ANSWERED: deep patterns — before 3.232, no (rhythm and pitch only); now each note carries how it plays.
  - SPECCED: specs/eravos.song-import.spec (SI0 MIDI … SI6 stems; honest scope) · specs/eravos.voice-lab.spec ADDENDUM (2): CREATE first, on top of his own voice.

## 44 — verbatim (2026-11-26):
  > I contrast as you might have notives
  > Also Make sure you use the per note editing, curves, way too much variance to waste in nexus. Like multidimentional. Really push Eravos. Like all of the tools. But make some sound beautiful. The piano doesn't get enough love.
  - BUILT 3.233: EXPRESSION (every note of the words' song shaped by its word — knob curves from the Song Engine's moves, bends, chords from
    one note, chance, ratchets, humanize) and the PIANO (a Piano part on any style: it opens alone, climbs through the breaks, soft dyads under
    the verses, octaves on the hits, one rolled chord at the end). Lyrics → Rhythm › Expression · Piano. Heard: his two poems rendered (to him).
  - RULE (his): contrast is his way ("I contrast as you might have notives") — every words-song capability keeps contrast first.
  - BUILT 3.234 (the same words, "The piano doesn't get enough love."): measured, the piano carried a rumble under hearing (Felt Lullaby 42 %
    under 30 Hz) — cut under each note and at 28 Hz, every model's loudness given back; the words-song piano intro played out (0.5–0.7). A
    guard in P182 holds it.
## 31 — verbatim (2026-11-25, with a screenshot of the catalog "Add to canvas" in Image Manipulation):
  > also told you to remove the add button once i pick a domain, up wheere it says add to canvas, add a back to domains screen,
  > also can you make all of the ui consistent? all of the canvas, and the themese.
  - BUILT 3.236 (TB6 + TB7, decided 2026-11-24 and not built until now — said plainly): the Start button left the toolbar (Add stays); the
    catalog's top left carries "← Domains" (back to the domain screen). Read as: the Start button goes, not Add (his 2026-11-24 words).
  - OPEN: the whole UI consistent — the canvas and the themes (an audit + a preview first; the 2026-11-05 "the UI stays as it is" holds
    until he approves a preview). docs/TODO-LEDGER.md T-83. Also OPEN (noticed): the catalog lists every domain's tools in Image Manipulation.

## 32 — verbatim (2026-11-25):
  > after that can you fix the autosave? also make control s a hotkey to save.
  - BUILT 3.237: measured — picking a domain pins its docked window at once and the autosave wrote that lone window over the real one (and a
    relaunch within a minute replaced the history's copy: 10 tools → "1 tools"). Now: no autosave without work (a tool that is not docked);
    each launch keeps its own history entry; Start offers the newest autosave that holds work. Ctrl+S saves the project (its name asked the
    first time); Ctrl+Shift+S still saves an .erv. tests/p237-autosave.mjs 6/6.

## 33 — verbatim (2026-11-25, with a screenshot: two toasts — "synthesizing 22 parts…" and "not made — this is your Wobble Bass · parts again"):
  > okay i need it to like flash when it can't synthesize, not a toast with no direction
  - BUILT 3.234 — WITHDRAWN: the same was already on main from a parallel session (its 3.226 "the plan, the reasons", richer); main's kept, this one removed: not made → the parts it is about flash red where they are; a card beside them says why and what to do, with buttons that do
    it (the rest from another tool — only when that can change something; Mutate these parts; Try again); stays until closed or the next try.
    tests/p228-not-made.test.js 2/2.

## 34 — verbatim (2026-11-26):
  > Look at main. Can you make the patterns deep as possible? Like per note editing, curves, like each feature at full variaty. Also the bassline keeps lagging. I like the chords and bassline. Can you make them easier to adjust? Like maybe a way to record macros of the keys. Like tap the start button, then you click the piano keys, and have it play the tool with it. Automation? Also wobble bass is still not full what I want it to be. Like I contrast. The pendulum swing, highes and lows. Oscillatory. Like I want it to be cleaner. I love the synthwave ones. A lot of the wobble bass presets aren't great.
  - LOOKED AT MAIN: nothing new beyond what this branch already merged (PR #226, sweet-sagan).
  - BUILT 3.235 "the bassline keeps lagging" — measured (Bassline → Deep Sub playing): two causes.
    (1) TIMING: the clock's wake (every 25 ms) sometimes reached the page 100–200 ms late, behind drawing; notes were booked after their
        time and sounded late (3 of 19 notes late in a 16 s run, up to 63 ms; 214 ms at the start). Now the transport books further ahead
        after a stall (up to 0.35 s; back to 0.1 s after 4 s calm): 0 of 19 late without Chords, 1 of 19 with (27 ms, a > 0.35 s stall).
    (2) DRAWING: the display fitting asked the page for its size every frame (a forced layout) — now at most twice a second; the Bassline's
        map redraws only when a note or the step changes; the spectrum's grid is one cached picture, its sunset gradients made once and slid.
        The same picture (before / after screenshots). Long tasks 0 ms/s.
  - OPEN, specced next (spec + a preview first): T-88 patterns as deep as possible · T-89 Chords and Bassline easier to adjust · T-90 a key
    macro recorder (tap record, click the keys, the tool plays them) and its automation · T-91 Wobble Bass: contrast, a pendulum swing between
    highs and lows, oscillatory, cleaner · T-92 Wobble Bass presets measured against the synthwave ones he loves, the weak ones replaced.

