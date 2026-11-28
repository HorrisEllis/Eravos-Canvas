# ERAVOS — the to-do ledger

His words (2026-11-24): "also log all of this, don't lose anything, update the specs, phases. and add that to a to do ledger".

One list of everything asked and not finished. Each line: what, his words (dated), where it is specced, its state. **States:** `decided`
(his call made, to build) · `open` (a question of his still to answer, with the recommended reading) · `specced` (phases written, not
started) · `built, unconfirmed` (shipped, not yet seen on his PC) · `waiting` (on his yes to a preview). A line is never deleted. When done,
it moves to **Done**, and says where and the proof. His words in full, with what came of each: `docs/HIS-WORDS-MAP.md`, and the session maps
`specs/eravos.*-session.map.spec`. Finished work: the Ledger in `CLAUDE.md` and `PROGRESS.md`.

## Now: the toolbar and Settings (2026-11-24) · `specs/eravos.bare-canvas.spec` + `specs/eravos.settings-buttons-dag.map.spec` ADDENDA 2026-11-24

| # | What | His words (2026-11-24) | State |
|---|---|---|---|
| T-04 | **Options into Settings** (ST1 / TB1): the ⋯ Options button and drop-down go; Stop all, Show ports, Fit all, Clear canvas become a section of ⚙ Settings (their keys stay). **Undo / Redo buttons removed** (Ctrl+Z / Ctrl+Shift+Z stay). Redundant options removed. Preview first. | "okay well no options and settings." · "first one, beyond removing the undo and redo, and redundany options." | decided |
| T-05 | **Settings a real menu** (ST2): sections down the side, search across every option. Preview first. | "also the settings needs to be a real menu" | decided |
| T-06 | **The Start button leaves the toolbar** (BUILT 3.236, 2026-11-25 — shown first) (TB6): top-left is Add only; the domains still open on launch. | "remove the start button from the corner and just have the add button" | decided |
| T-07 | **Organize / Tidy up: one** (TB2), the same action today. Recommended: keep **Organize** on the toolbar. | "organize or tidy up, don't need both." | decided (which name: recommended Organize) |
| T-08 | **Sounds · Rhythms · Songs (· Learn): one entry** (TB3). Recommended: one **Library** button, one browser with tabs. Other readings: keep Songs only; all into Add. | "sounds or rhythms, and songs." | open |
| T-09 | **Metronome and loop region** (TB4). Readings: out of the agnostic toolbar into the music transport (recommended) · onto the canvas as a loop-region bar · the Timeline only. | "metronome loop region in the canvas ui." | open |
| T-10 | **The toolbar's noise when choosing a domain** (TB5): before a domain, only Add · Settings · the fault light; after, recommended: only what the tools on the canvas need (not the domain's whole set). | "need to clean up the noise. need to when choosing a domain." | open |
| T-11 | **The catalog (Add) gets "← Domains" in its top-left corner** (BUILT 3.236, 2026-11-25 — shown first) (TB7): back to the domain screen. | "with a back to domain, in the top left corner of the catalog." | decided |
| T-12 | **Settings' sections grow from the tools' DAG contracts** (ST3), agnostic: Audio with real-time audio, MIDI with MIDI in, GPU / image memory with image tools; each option names the tools that asked; hides when none needs it, values kept. | "that expands from the tools dag contract, like what is needed expands the options." | specced |

## Performance and animations · `specs/eravos.performance-plan.spec` (his PC: Ryzen 7 3700X · GTX 1650 · 16 GB)

| # | What | His words (2026-11-24) | State |
|---|---|---|---|
| T-13 | **PF0 measure** (live numbers built in 3.222; the saved report still to do): Settings › Performance — GPU status, frame times, main-thread busy %, audio load, workers, memory; a saved report. Gate for the rest. | "like is it optimized?" | specced |
| T-14 | **PF1 pause what is not seen + lazy load**: one shared frame scheduler (15 loops today); off-screen / covered / minimised windows draw nothing; a tool's face built on first sight. | "like lazy load" | specced |
| T-15 | **PF2 Performance mode** (3.222: the custom settings + Auto cover it; a one-switch mode still possible): no transitions, no reactive colours / glow, slower meters; follows reduce-motion. Off by default. | "like disabling animations, transitions." | specced |
| T-16 | **PF3 simpler when zoomed out**: a tool becomes one cached picture (or name, colour, level) below a zoom level; live again zoomed in. | "like real pixelated when zooming out" | specced |
| T-17 | **PF4 tools that grow as they are resized**: small = the essentials, wider = more, up to today's full face. Preview first. | "what about a simplified ui for tools. then they expand as you resize them?" | specced (waits a preview) |
| T-18 | **PF5 displays on the GPU** (WebGL / OffscreenCanvas): spectra, scopes, meters, waveforms, wires. | "like is it using my graphics card? like offloading?" · "gpupu" | specced |
| T-19 | **PF6 a worker pool across the cores** for offline work (synthesizing + judging, mutation, bouncing, analysis). | "using all my cpu cores, ram?" | specced |
| T-20 | **PF7 faster sound per core** (moved to the engine, 2026-11-24: kernels in Emerge, EN3): shared DSP kernels in WebAssembly + SIMD; proven by components.mjs + the null render. | "can we optimize the performance even more?" | specced |
| T-21 | **PF8 safe Chromium switches** (GPU rasterization / zero-copy; never ignore-gpu-blocklist). | "at least until looking glass replaces electron." | specced |
| T-22 | **RP1 resource needs in every tool's contract** (`needs.resources`, from its DAG; a CI check). | "what ever is on the canvas, is priority … it needs to remain agnostic." | specced |
| T-23 | **RP2 priority follows the canvas**: the canvas sums the needs of what is on it (audio first for music, GPU / images for image tools, both when both); names no domain. | same | specced |
| T-32 | **Lag fixed at its cause + Settings › Performance + Auto** (3.222): measured; the forced layout in the reactive colours removed; custom settings (display rate, effects, animations, resolution, blur, GPU on next start); Auto steps effects down while lagging. Shown first — waits his yes to merge. | "needs performance optimization. the cpu cores. its lagging with plenty of overhead. maybe custom settings, like cpu cores, animations, graphics acceloratoin. maybe invent a better driver" | built, shown first |
| T-24 | **AN1–AN3 beautiful animations**: one motion language (FieldMotion) for windows, tools landing, wires, menus, Start's steps; transform + opacity only; **shown as a video first**. | "i want beautiful animations in eravos." | specced (waits a video) |

## The Mutation Lab, the Workbench, the Tool Builder · `specs/eravos.assembled-tool.spec` ADDENDUM 2026-11-24

| # | What | His words (2026-11-24) | State |
|---|---|---|---|
| T-25 | **ML1 more tools trade parts** — 3.224 (2026-11-25, "i love the mutation and synthesis. can you expand to the rest of eravos?"): Supersaw, Swarm Oscillator, Retro Poly, Piano, Tape Memory DONE (P218, shown first); next: every other instrument and effect, by shared components. | "okay but did we choose to do the exploded view on the canvas for existing tools?" · "swap components better" | specced |
| T-26 | **ML2 two or more cores at once** → one made tool. | "synthesize two or more cores, and make something completely new." | specced |
| T-27 | **ML3 more slots in the engine** (unison, sub, envelopes, the formant mouth, the wub sequence …) so fewer parts are left behind. | "combine the sound of retro dcs with the rest of wobble bass." | specced |
| T-28 | **ML4 the Mutation Lab**: a shelf of every component and core; spec + preview first. | "you open the mutation lab, and it has all the components, and cores to play with." | specced (waits a preview) |
| T-29 | **ML5 the Workbench / Tool Builder**: from scratch — parts, then each control's UI element and the theme; saved as a tool of its own. Spec + preview first. | "the workbench to be able to build from scratch from components and the broad selection of ui elements, with different control types, and themes, like a tool builder." | specced (waits a preview) |
| T-30 | **ML6 a made tool as its own zip** (isolated: deleted whole if unstable). | "also tools are isolated so if they cause instability they can be deleted." | specced |
| T-39 | **What it will make, and why not** (3.226): ◇ the plan + ▶ hear before making; a refusal flashes the blamed parts red with the reason and fixes beside them. Shown first (screenshots). | "tools when the can't synthesize, need to flash the reasons why. also expand the ability. its hard to tell what it will do when i synthesize" | built, shown first |
| T-40 | **ML3a the VOICE grows**: unison (Reese Bass, Supersaw) and string (the Piano) voices in the engine, so Wobble × Retro and Reese × Piano carry both voices. Composite node specced in the compat graph first. | "like the wobble and the retro could sound amazing. or the reese and the piano" | specced |
| T-41 | **ML3b Retro Poly whole** in synthesis: poly voices, PWM, unison. | "like also the retro poly." | specced |
| T-42 | **GP genre packs for every tool**: Lofi · Dubstep · Synthwave · EDM; novelty-measured, levelled, no toys. Dubstep first. | "also the packs, for each tool, have like lofi, dubstep, synthwave, edm, dubstep" | specced |
| T-43 | **The baseline: "Make It Bun Dem"** studied as technique (docs/research), then the dubstep tools and packs measured against it. "trenke" — which track? | "i want to make music that sounds like make it bun dem by skrillex, thats my baseline of reverse engineering. like i want the dubstep tools, synthwave tools, like look deeply into trenke by skrillex" | specced — answered 2026-11-25 (his screenshot): "trenke" is the same record, "Make It Bun Dem" (Skrillex & Damian Marley, After Hours EP) |
| T-44 | **The next highest-leverage components and tools** (docs/eco-graph.md), each UI shown first. | "or what about making the next highest leverage components and tools." | specced |
| T-45 | **Open a made sound in the Lab** — the Lab mode or the Mutation Lab (ML4)? | "synthesis and mutation and the unqiue sounds and opening them in the lab" | open (asked) |
| T-46 | **Font**: Settings › Look › Font (As it is · Grotesk · Grotesk only · Plain) built 3.227; today's stays until he picks one to be the default. | "okay, i hate the font." | waiting (his pick) |
| T-47 | **The green everywhere else**: tools' own UIs still carry fixed greens inside them (each tool's code) — moved to the theme colour tool by tool. | "yes. almost all of it. make it colored. the themes, and the reactive color.s" | open |
| T-48 | **D0 the gate generalised**: a domain hands render → works / why / fingerprint; the twin judgement and the reasons card for every domain; proven on generative pictures. | "Use this to find domains we can use this canvas for" | specced (specs/eravos.domains-from-the-toolkit.spec) |
| T-49 | **D1 FRAMEWORK** (his toolkit as tools: ledger, gap finder, leverage scorer, hostile verifier) on one type table shared with MIND. | (same) | specced, waits his pick |
| T-50 | **D2 SYSTEMS** (stocks, flows, feedback) on the assembled engine — a model you hear. | (same) | specced, waits his pick |
| T-51 | **D3 CONNECTION** (two people on one canvas; consent as the gate) — the two-machine link first. | (same) | specced, waits his pick |
| T-52 | **D4 WORDS** (lines, meter, rhyme) beside the dubstep tools. | (same) | specced |
| T-53 | **Learn it step by step on his own words**: Lyrics → Rhythm walks him through (1) syllables on the beat (2) a stanza's part (3) contrast (4) the melody (5) the song — each step heard, his choice kept, ERAVOS fills the rest. Preview first. | "i want to learn how to make music from my lyrics. that is the point of the rhythm tool" | open (next) |
| T-54 | **His voice in it**: record the lyrics (Song Recorder) and lock the take to the syllables the tool placed (vocal-chop as instrument — the Make It Bun Dem technique). | "i want to make music with contrast. thats my rhytm" | open |
| T-55 | **His poetry index as a shelf**: each poem → a song shape to start from, kept in Documents\ERAVOS (his, never shipped). | (the zip he sent, 2026-11-25) | open (asks him first) |
| T-56 | **Voice Lab › TUNE**: pitch-tracker + pitch-shifter, the hard tune at 0 ms (voice-tune.spec). UI shown first. | "T pain like auto tune." | specced (specs/eravos.voice-lab.spec) |
| T-57 | **Voice Lab › CREATE**: a voice made from nothing (vocal-tract + letter-to-sound) singing his lyrics from Lyrics → Rhythm. | "Creating voice." | specced |
| T-58 | **Voice Lab › WUB**: the voice's mouth opens the Wobble Bass (talkbox / vocoder), or the wobble opens the voice. | "And wubs, wow. Like voice music like wubs, etc." | specced |
| T-59 | **UE: any control shown as another element, any element in another style** (right-click › Show as; Settings › Look › Elements, shown first). | "I want to be able to change the ui elements to other styles, types" | specced (specs/eravos.ui-elements-and-combining.spec) |
| T-60 | **CB: combine two components into one part** (on the board; its own contract; gated; mixable everywhere). Needs the composite node. | "build components from combining two." | specced |
| T-61 | **EX: the engines grow** (VOICE: unison · string · wavetable; MOUTH: formant; SPACE and SUB places) and every tool speaks the character table. | "Expand the tools and engines maybe," | specced |
| T-62 | **A made tool is his: rename · edit fully in the Workshop · delete** — built 3.231 (P231). Next: the same on a tool's page and in ＋ Add. | "also merge and push. need to be able to delete custom tools. rename them. open them in workshop and edit them fully." | built |
| T-63 | **Song Import** SI0 MIDI → SI1 tempo / key / sections → SI2 drums → SI3 lines → SI4 chords → SI5 the tools + the closeness gate → SI6 stems. | "I want to be able to import a song and have Eravos open it with the needed tools to replicate it. Hard? That could be a good test." | specced (specs/eravos.song-import.spec) |
| T-64 | **Voices for his lyrics, on top of his own** — Voice Lab CREATE first (vocal-tract + letter-to-sound), characters per genre. | "Can we have voices for the lyrics? On top of my own?" | specced (voice-lab ADDENDUM (2)) |
| T-65 | **All of the tools in the words' song**: beyond the Piano — the LFO / XY Pad / Automation lanes driving knobs over the stanzas, Tape Memory on the breaks, the Arp under choruses, Feelings for the stanza's valence (each a capability ERAVOS uses from the words' shape). | "Like all of the tools." | open (next) |

## ERAVOS's own engine · `specs/eravos.engine.spec` (decided 2026-11-24: written in Emerge — "wait for emerge")

| # | What | His words (2026-11-24) | State |
|---|---|---|---|
| T-33 | **EN1 today's stack** (specced in full 2026-11-25, "just spec it": EN1.1–EN1.6 in the engine spec's addendum) (no new language): the audio thread's load measured; silent tools sleep; voices / tails below the floor ended; denormal guards + headroom checked in every component; TPDF dither on export; latency / sample rate / output device settings. Null render proves no change. | "dynamic, load balancing, signal to noise? wait for emerge" | specced (his: "just spec it") |
| T-34 | **EN2 Emerge prerequisites**: E2 native_windows, E3 calling Windows (COM for WASAPI), threads, atomics, a lock-free queue, MMCSS — in HorrisEllis/Emerge (needs push access there). | "wait for emerge" | specced (blocked on access) |
| T-35 | **EN3 kernels in Emerge**, each against its contract, bit-close to today's by the null render. | "invent our own? specifically made more eravos?" | specced |
| T-36 | **EN4 the engine process in Emerge**: WASAPI exclusive / shared, ASIO; DYNAMIC (graph swapped at a block, cross-faded); LOAD BALANCING (the DAG scheduled over cores, work stealing, measured cost, critical path first); SIGNAL TO NOISE (64-bit mix, FTZ, headroom + true-peak, TPDF dither, oversampling; work only on what is heard); tools isolated; its own process; Web Audio the fallback. | "dynamic, load balancing, signal to noise?" | specced |
| T-37 | **EN5 Settings › Audio** from the engine (driver, device, buffer, sample rate, cores, per-core load, per-tool cost). | "that is still not great. what about the audio driver or engine that electron uses?" | specced |
| T-38 | **Which lags on his PC — the screen or the sound?** (decides what is cut next) | "that is still not great. what about the audio driver or engine that electron uses?" | open (asked) |

## Asked 2026-11-25 (this branch; renumbered when merged with main)

| # | What | His words (2026-11-25) | State |
|---|---|---|---|
| T-83 | **The whole UI consistent — the canvas and the themes**: one audit of every canvas surface (toolbar, Start, catalog, Settings, tool pages, menus, cards, the Field, toasts) in every theme; what differs listed; a preview of the consistent version shown first (the 2026-11-05 "the UI stays as it is" holds until he approves). | "also can you make all of the ui consistent? all of the canvas, and the themese." | open |
| T-84 | **The catalog in a domain lists every domain's tools** (Image Manipulation showed Genre instruments, Sound Forge …) — only its own? (asked) | (from his screenshot) | open (asked) |
| T-85 | **Autosave fixed; Ctrl+S saves** (3.237). | "after that can you fix the autosave? also make control s a hotkey to save." | built — confirm on his PC |
| T-86 | **Not made: flash + a card with why and what to do** — withdrawn: main's 3.226 (what it will make, and why not; T-39 above) does it. | "okay i need it to like flash when it can't synthesize, not a toast with no direction" | superseded |
| T-87 | **The tip line in a domain** (Image Manipulation showed a music tip — "voice clips", ".mid") — the domain's own tip. | (noticed 2026-11-25) | open (asked) |
| T-88 | **Patterns as deep as possible**: per-note editing, curves, every feature at full variety, for every tool (O-07). Spec + a preview first. | "Can you make the patterns deep as possible? Like per note editing, curves, like each feature at full variaty." (2026-11-26) | open — spec next |
| T-89 | **Chords and Bassline easier to adjust** (he likes them). | "I like the chords and bassline. Can you make them easier to adjust?" (2026-11-26) | open — spec + preview |
| T-90 | **A key macro recorder**: tap record, click the piano keys, the tool plays them (and they become automation / a pattern). | "Like maybe a way to record macros of the keys. Like tap the start button, then you click the piano keys, and have it play the tool with it. Automation?" (2026-11-26) | open — spec + preview |
| T-91 | **Wobble Bass: contrast** — a pendulum swing between highs and lows, oscillatory, cleaner. Capability first (what lets ERAVOS make it), measured. | "Also wobble bass is still not full what I want it to be. Like I contrast. The pendulum swing, highes and lows. Oscillatory. Like I want it to be cleaner." (2026-11-26) | open — spec |
| T-92 | **Wobble Bass presets**: measured against the synthwave ones he loves; the weak ones named and remade as settings (no toys). | "I love the synthwave ones. A lot of the wobble bass presets aren't great." (2026-11-26) | open — measure first |
| T-93 | **The bassline lagging** (3.235): notes booked further ahead after a stall; displays draw less (the same picture). | "Also the bassline keeps lagging." (2026-11-26) | built — confirm on his PC |

## Asked 2026-11-27 · `specs/eravos.contrast-space.spec`

| # | What | His words (2026-11-27) | State |
|---|---|---|---|
| T-94 | **The preview of the seven component UI elements** (RIPPLE · WAVELENGTH · COLLISION · SPACE · PENDULUM · TENSION · EMERGENCE) on Contrast Space — his yes or changes. | "i want a bunch of spacial tools and ui elements for components. tension, oscillations. wavelengths, emergence." | preview shown (3.241) — waiting (his yes) |
| T-95 | **Ripples**: detune in Hz on unison-stack and oscillator-population (CS1); the pendulum LFO shape (CS2) — also Wobble Bass's contrast (T-91). | "the way it creates ripples and tension" | **built** 3.242 (Ripple; LFO Pendulum) — confirm by ear |
| T-96 | **Collisions and space**: masking-analyzer, per-band ducker, panner, early-reflections built (CS3, CS4); Contrast Space the tool (CS9). | "the frequencies how the collide" | collisions **built** 3.243 (Collision); space **built** 3.244 (Spatial Organism); CS9 withdrawn (a setup instead) |
| T-97 | **Tension and emergence** as signals: tension-meter (CS5), agreement (sync) out of oscillator-population + relationship-graph (CS6); silence and release in the song engine (CS8). | "tension, oscillations. wavelengths, emergence." | tension **built** 3.246 (Tension Field); emergence, CS8 open |
| T-99 | **No lowercase**: every label, hint, readout and summary starts with a capital (sentence case) — the new tools first, then all. | "als ostop with the lowercase." | the four new tools **built** 3.248; the rest of ERAVOS: asked (the same everywhere?) |
| T-100 | **No cheap icons**: the new tools' glyph icons (≈ ⨯ ◎ T) replaced by real drawn icons like the rest. | "and cheap icons." | **built** 3.247 (drawn icons + paintings) — are there other icons he means? |
| T-101 | **Make music from his lyrics, with the Piano** he loves (Lyrics → Rhythm's song). | "Still feel like i want to make music with this. using my lyrics. i love the piano its beautiful look at it." | open |
| T-102 | **The wub tools route** (3.245). | "like the wub tools wire but don't route." | **built** — confirm on his PC |
| T-103 | **The Voice Lab, all of it**: record · hard tune (T-Pain) · a synthesized voice · his voice playing the tools · full editing and modulation · remix (EDM, dubstep). | "Voice tools. Like recording. Making sound like the tools? Full editing and modulation. Full t pain auto tune. Synthesized voice. Everything needed for remixing, EDM; dubstep." | VL1 pitch-tracker **built** 3.249; next VL3 vocal-tract + VL4 letter-to-sound, then VL2, then the Tune tool (its face shown first) |
| T-104 | **Tools to connect to tools**: connectors made from what exists — a sound's loudness as a signal (envelope-follower), a sound's pitch as notes (pitch-tracker), a sound's hits as triggers. | "Also tools to connect to tools." | Follow 3.252, Hits 3.253, Pitch → Notes 3.254 — **built** (to release) |
| T-105 | **Ripple renders repeat to −70 dB, not −90** (the null render asks −90): the cause not found. | (found 3.250) | open |
| T-106 | **The squeak, judged by him**: S0–S4 (Ripple 1.2 MOD, the recipe he pasted) — which is closest, and what is still wrong. | "Like a screech. I think it is a a voice." | renders sent 2026-11-28 — **his ear** |
| T-107 | **One big Contrast instrument** that breaks off into tools, then components (asked; his yes / no). | "Maybe it should have been one big tool that you can break off into smaller tools, then into components." | **open — his call** |
| T-108 | **The wobble that tightens**: which reading is his, T1–T4; then the capability (e.g. an LFO Rate that rises over a time, one knob, not a hand-made preset). | "The frequency gets tighter as it drags on for about 3 seconds. … The wavelength narrows not the volume." | renders sent 2026-11-28 — **his ear** |
| T-109 | **The wobble becomes a rhythm** — the Rumble study (R0–R2) judged by him; then what is missing, as capability: (a) a Level / gate input on Ripple, so Wub Rate can chop the sub and the grind as well as a filter; (b) the study saved as a Setup he can open and change. Nothing added before his ear. | (N-X179) | renders sent 2026-11-28 — **his ear** |
| T-110 | **Keep the screech on top**: the study (R0–R2) lost it under the Wub growl ("These are worst") — U1–U3: the screech itself tightens on the beat and is chopped, the sub and drums quiet under it. A lesson kept: the screech is the lead, the rest serves it. | "Lost the screech. These are worst" | renders sent 2026-11-28 — **his ear** |
| T-111 | **The Rumble layers, one by one** (the breakdown he pasted): 1 pulsing bass (L1–L4 rendered) · 2 mid-bass at 375 Hz · 3 growl (triangle FM, automated FM amount) · 4 squeak (U3, his pick) · 5 hats with a fade-in · 6 a voice (Voice Lab). Then his pick saved as a Setup he can open. | "I think it's the wobble. … I like glitchy, and oscillatory. Like it's fighting itself." | layer 1 sent — **his ear** |
| T-112 | **Import a song; the canvas opens the tools to make it** (Song Import, audio first): onset-detector → beat-tracker → key-detector (SI1) → drums by band (SI2) → the lines (SI3) → the nearest tools, opened wired (SI5) → the gate. The import UI shown first. | "Can we make the canvas import a song and open the relevant tools to make it?" | `specs/eravos.song-import.spec` — **building SI1** |
| T-98 | **The voice**: a made character (deep, dry, close, level) on Voice Lab's CREATE, or his own voice through the same chain (CS7) — never a copied person. | "voice, sounds, all of it." | open — after Voice Lab VL3 |

## Shipped, to confirm on his PC

| # | What | His words | State |
|---|---|---|---|
| T-01 | **Borderless window** (0.2.36): no Windows title bar; drag by the toolbar; window buttons at its right. | "also borderless windows please?" (2026-11-24) | built, unconfirmed |
| T-02 | **Updating in the app** (0.2.34): the updater runs from a copy; a held updater is kept. Confirm an in-app update goes through. | "trying to update it. fails to close eravos. also broke my current version." (2026-11-24) | built, unconfirmed |
| T-03 | **Start in two steps** (0.2.36). | "like only show the domains at first." (2026-11-24) | CONFIRMED on his PC (2026-11-25 screenshot) — 3.225: a picked domain shows only its own setups; Empty canvas removed |
| T-31 | **The new Start (StartScreen, SS2)** replacing today's Start: a preview since 2026-11-20. | "domain screen first, then animated transition into the next screen" (2026-11-20) | waiting (his yes) |

## Older open items (from CLAUDE.md › Open, carried here so this is the one list)

| # | What | Asked | Where |
|---|---|---|---|
| O-01 | The store: the canvas on the system, everything else as whole zips in Documents\ERAVOS; decisions D1–D4 his. | 2026-11-06 | `specs/eravos.store.spec` |
| O-02 | Novel, full depth, no noise: every preset novel against all of ERAVOS; every tool full depth; a Tuning & settings tab per tool (N1 ✓ → N2 ✓ → N3 → N4). | 2026-11-06 | `specs/eravos.music-ecosystem.spec`, `eravos.tool-depth.spec` |
| O-03 | Mutation, a bare canvas, dynamic UI: UIs that merge when wired; every component carries its UI element; tools announce their needs; ERAVOS 2's name ("Synthesis" proposed, to confirm). | 2026-11-13 | `specs/eravos.compat-graph.spec`, `eravos.ui-field.spec`, `eravos.store.spec` |
| O-04 | The store's Browse: every tool an isolated zip; the Browse UI rejected ("no. i like the current ui. do not change it.") — the work goes on underneath. | 2026-11-13 | `specs/eravos.store-browse.spec` |
| O-05 | Connecting with people: share as a link, remix with credit, play together, share packs. | 2026-11-05 | CLAUDE.md › Direction |
| O-06 | Songs as a rhythm-exploring tool only. | — | CLAUDE.md › Open |
| O-07 | Patterns for each tool with variety: presets, depth, curves, per-note editing. | — | CLAUDE.md › Open |
| O-08 | Delete the merged branch `claude/nice-dirac-t64qeo` (needs his permission). | — | CLAUDE.md › Open |
| O-09 | Emerge E1–E3 (a session with push access to HorrisEllis/Emerge); E4 widen "only kernel32"? (his call). | 2026-11-05 | `docs/eravos-v2-emerge-looking-glass.md` |
| O-10 | The next high-leverage set: Ensemble Organism (UI preview first) → slew-lag, mpe-expression, relationship-graph, reverb-fdn, waveshaper. | 2026-11-13 | `docs/eco-graph.md` |
| O-11 | Piano: MIDI CC64 / CC67 to the pedal; a shorter layout for short screens (shown first). | 2026-11-13 | CLAUDE.md › Open |
| O-12 | Element synthesis ES2 (Retro DCO, Swarm, Tape Memory) → ES3 a choice — after his yes to ES1. | 2026-11-13 | CLAUDE.md › Open |
| O-13 | Tests failing before today's work: P23 (wheel over a fitting Timeline), P70 (a curve lane's right-click), P82 ×2 (glass layer); and `tests/p16-ui.mjs` stops at `plug.click is not a function` (on main too, found 2026-11-24). | — | CLAUDE.md › Open |
| O-14 | Wobble Bass sounds before any note in an offline headless render. | 3.130 | CLAUDE.md › Open |
| O-15 | AE vowel: Wub Filter's third band −12 dB vs the table's −14 dB (his call). | 2026-11-05 | CLAUDE.md › Open |
| O-16 | Phase 1 components, bottom up: lfo → osc-va → waveshaper → env-adsr → env-msseg … (some built since); each new tool's UI shown first. | 2026-11-05 | `docs/eco-graph.md` |

## Done (moved here, never deleted)

| # | What | Where · proof |
|---|---|---|
| D-01 | Branches merged (none were left); "error writing ERAVOS.exe" — a running ERAVOS was never seen (3.213, 0.2.32) | PR #211 · setup-copy 14/14 |
| D-02 | The Setup falls back to the 0.2.29 way (3.214, 0.2.33) — made his install worse; fixed by D-03 | PR #212 |
| D-03 | Updating no longer breaks on the running ERAVOS Update.exe (3.215, 0.2.34) — "it works." | PR #213 · setup-copy 15/15 |
| D-04 | The box framed whole; hover words; right-click › Replace with (3.216) | PR #214 · P216 |
| D-05 | Pick the voice; "the rest from <tool>" — ERAVOS makes it from his picks (3.217) | PR #215 · P217 |
| D-06 | The README, current, with pictures (3.218); the exploded note in it (3.219, 0.2.35) | PR #215, #216 |
| D-07 | Start in two steps; borderless window; the 3D exploded note (3.220, 0.2.36) | PR #217 · p16-ui (the two steps) |
| D-08 | This ledger, the 2026-11-24 session map, the specs' addenda and phases (3.221) | `specs/eravos.2026-11-24-session.map.spec`, `specs/eravos.performance-plan.spec` |
| D-09 | The piano without its rumble (3.234): "The piano doesn't get enough love." — energy under hearing cut (each voice under its note, the piano at 28 Hz), loudness given back per model | `piano.engine.js` · P182 7/7 (guard fails on the old code) |
