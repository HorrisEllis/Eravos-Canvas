# ERAVOS

A canvas of living instruments for making music — everything in key, everything on the beat.

## Layout — the canvas and the tools are separate

    canvas/        the empty canvas — what ERAVOS.exe is. Domain-free: kernel/, runtime/, index.html, scripts.js
    tools/         everything you drag onto the canvas, one folder per domain (music, image, video, agents, coding,
                   dataflow; ui is mapped, not built). tools/index.js lists the domains the dev build loads.
                   Inside a domain: core/ (shared engine) · tools/<category>/<tool>/ (one tool each) · content/ · planned/
    schemas/       the formats both sides agree on (tool, pack, mode, category, domain)
    templates/     copy-to-start folders for a new tool, pack, mode, category, domain
    build/         new-tool · index-tools · validate · structure-map · specs · planned-deps · shots · perf
    tests/         cross-cutting tests (node tests/run.mjs); a tool's own tests live in its folder
    specs/         cross-cutting specs (kernel, structure, phase maps); a tool's spec lives in its folder
    desktop/       the exe shell (Electron main/preload) + its builder; ships canvas/ only, tools become packs
    packaging/     packaging/windows/make-exe.ps1 — run by Build ERAVOS.exe.bat: Electron + canvas/ = ERAVOS.exe
    docs/          tool pictures (docs/tools/*.png) and release notes
    Build ERAVOS.exe.bat   builds the exe (the canvas only) into dist/
    index.html     opens canvas/index.html · serve.js / Start ERAVOS.bat / start-eravos.sh serve this folder

The canvas finds the tools through one setting: `canvas/scripts.js` sets `ERAVOS_TOOLS` (default `../tools/`) and loads
`tools/index.js` last. Nothing in `canvas/` names a domain (tests/boundary.test.js enforces it).

## Start

- **Windows:** double-click **Start ERAVOS**.
- **macOS / Linux:** run `./start-eravos.sh`.

This opens ERAVOS at **http://localhost:4747** in your browser. Keep the small black window open while you work; close it to stop.
It needs [Node.js](https://nodejs.org) (the LTS version) installed once.

Why not just open `index.html`? Browsers only allow MIDI controllers, the microphone and dependable saving for pages served
from an address like `localhost`. Firefox in particular refuses MIDI for pages opened straight from a file.

## MIDI controller (pads, keys, knobs)

1. Plug the controller in by USB **before** opening the browser (Firefox only sees devices present when it starts).
2. Add **MIDI Map** (＋ Add), press **Connect MIDI**, choose **Allow**.
3. Press **① Learn pads** and hit pads 1 → 16.

If something goes wrong, the MIDI Map window says why and what to do. Browsers: Chrome, Edge and Firefox work. Safari has no MIDI support.

## Saving

Your work autosaves in the browser for this address. To keep a copy or move it to another computer: **Session → Save**
(a `.eravos.json` file). Drop that file onto the canvas to open it.

Moving from the old way (opening `index.html` directly) to Start ERAVOS? Open the old page one last time, **Session → Save**,
then open that file in the new one — the browser keeps the two addresses' saves separate.

## Undo

**Ctrl+Z** undoes, **Ctrl+Shift+Z** (or Ctrl+Y) redoes — anything you do on the canvas: knob moves, notes and clips,
tracks, adding or closing a window (it comes back with its settings and its connections), wiring. The ↶ ↷ buttons in the
toolbar name the step they will undo. Loading a recipe or a saved song starts a fresh history.

## Song Engine — a new song every press

**Start → SONG ENGINE** and pick a genre (Dubstep, Riddim, Drum & Bass, Neurofunk, Future Bass, Melodic Dubstep, House,
Techno, Trap, Synthwave (80s), Darkwave (80s), Witch House). Every press writes a different finished song — tools, presets,
drums, bass, chords, lead and the arrangement — on the Timeline, all in key. Click any clip to edit it in the piano roll.
The song's name ends in its number: `SongEngine.write('synthwave', 4242)` builds that exact song again.

## 3.45 — Wobble Bass: everything on screen, fluid rates, the Bun Dem screech
- **Fixed**: seven controls (FM, FM ratio, FM wub, Squash, Grit type, Square oct, Sub in phase) were missing from the window.
  Now every control is there, grouped (Rate · Mouth · Growl · Pitch · Tone); a control that waits on a switch is dimmed and says why.
- **Perform pad**: drag sideways to bend the wobble speed smoothly (×¼ … ×4), up and down to open the mouth; springs back on release.
- **Rate glide**: rate changes swoop instead of jumping — wub-seq steps glide into each other. **Pitch wub** to 2400 c (an octave
  scream; it stopped at 1 semitone). **Octave +2**. New inputs: **rate · FM · pitch** — wire an Envelope or LFO into them.
- **Bun Dem presets**: Screech (the drop lead, octave up, FM, octave-wide bends), Talking Growl, Rate Ramp (glide).
- **Matched to the track**: the drop measured (1/8-triplet movement at ~141 BPM, mono F#1 sub, scooped low-mids, a flat bright
  top) and the Wobble Bass tuned against it by an offline search — "Bun Dem · Matched to the track (1/8t)" and "… + drop rhythm".

## 3.44 — Songs by category · the Bun Dem growl
- **Songs page by category**: 🔊 Dubstep & Wubs · ⚡ Drum & Bass · 🏠 House · 🌀 Techno & Trance · 🎛 Trap & Phonk · 🔥 Reggae &
  Dub · 🌆 80s · 🖤 Dark · 🌙 Chill, then the collections 💜 For Her · 🥀 Lost Love · 🧪 Odd Couples. Counts on every chip,
  headings in the grid, a search box (title, genre or tool), and the mood chips still narrow it down.
- **Wobble Bass 3.4 — the growl**: **FM** (a sine bending the saws, in tune) and **FM wub** (the wobble opens the FM too, so
  the growl talks with its harmonics, not just a filter) and **Squash** (3-band OTT-style; the sub stays clean). The
  "Bun Dem Growl" preset now uses FM; new Bun Dem presets: FM Talker, Half-time Yoi 1/4t, Sub Growl (ratio ½).

## 3.43 — small tools that combine · Links · Mods · Synthesis
- **Links — tools grow when they meet.** Every window shows what it is wired to (⇠ feeds it · ⇢ it feeds). Click a chip and
  that tool's main controls unfold inside this window; pairs that belong together (Wub Rate → Wub Filter, Morph Osc → Morph
  Osc, Envelope → anything) unfold on their own when you wire them.
- **Mods — any tool inside another.** Destroyer, Wub Osc, Wub Filter and Wub Sub have a 🧩 MODS rack: ＋ mod puts any effect
  inside (Wub Filter inside the Destroyer, a Destroyer inside a Wub Osc …) — no extra window, one undo step, saved with it,
  mods can hold mods. ⏻ bypass, ↑ ↓ reorder, ⤢ shows a mod's whole window.
- **In and out freely**: ＋ mod also lists the windows already on your canvas — ⇲ moves one inside and joins its cables up
  behind it; ⇱ on a mod pops it back out into its own window, wired straight after its host. A mod that delays its sound
  (a Destroyer's oversampling) is waited for, so its host's Mix never comb-filters.
- **Granular**: any sound into a cloud of grains — live from whatever is wired in (or the tool it sits inside as a mod), or from
  a clip. Freeze, feedback shimmer, tempo-synced stutters, pitch spray in key, play it from notes; click the field to burst.
- **Synthesis** (new category): **Morph Osc** — wavetable oscillator that morphs (analog / vocal / digital / organ tables),
  with FM and Ring INPUTS: wire one Morph Osc into another's FM in and you have FM synthesis — the modulator follows the
  notes by itself. **Envelope** — wire it into any knob on any tool; it moves on that tool's notes. **Partials** — additive:
  draw 24 harmonics, evolve between two spectra, stretch them into bells (kept in tune).

## 3.42 — Destroyer 2.0 · distortion that sits in a mix
- **Same volume, new colour**: drive no longer adds up to +13 dB on quiet parts (1.x levelled itself at full scale) —
  gain is matched across −6…−24 dBFS, so switching it on changes the tone, not the loudness.
- **No more fizz**: its own curves with a smooth knee (hard, fold were brick walls) + **Auto tame** rolls off the top as
  the drive goes up. New shapes **tape · fuzz · rectify**, and **Asym** for warm even harmonics.
- **Bass that stays bass**: **Tight** cuts the mud before the shaper; **Low keep** leaves the sub clean under the grit.
- **Crush that crunches instead of hissing**: **Alias** (0 clean lo-fi … 1 raw 8-bit fold-over), **Dither**, smooth
  fractional downsample under modulation. 7 new presets (Fuzz Box, Wub Grit · sub stays clean, Drum Bus Crunch …).

## 3.41 — Odd Couples · every tool measured · her voice on top
- **Songs → 🧪 Odd Couples**: 72 songs in 12 genres made from tools that never meet — a cathedral organ over the riddim wub
  rig, a 303 at a séance, golden-ratio bells on a dub sound system, a music box over tearout, a breathing drone under 174 drum &
  bass … Every tool has a new **Odd Couples** pack (prefix "Odd ·"). Every song opens her voice rig: record her once in Clip
  Maker — she plays in the break AND lands on the drop with the rest of the mix ducked under her.
- **Drop Builder · Her voice on top** (VOCAL, default 9 dB): everything else dips under each word of her clip; she never does.
- **Measured, not guessed** (specs/eravos.p42-tool-audio.spec): every tool × every preset rendered and measured — timing to the
  sample, pitch to the cent, level, Stop all. Fixed: notes that played 2.7–18 ms late (Sub Engine, Organ with drive, Reese,
  Embodiment, driven drum voices), echo repeats drifting off the beat, dry/wet comb filtering in Destroyer / Filter / Wub Filter,
  presets peaking over full scale. `node tests/tool-audio.mjs [tool]` runs the survey.
- **Songs page**: every card answers a click (39 didn't in the exe) and Write writes the card you picked. A song installs any
  tool it needs and says which. **Settings panels**: scrolling no longer turns the knob that slides under the cursor.

## 3.36 — the Sequencer drives every tool to the beat · "Give Your Head a Shake"
- ＋ lane → automation lane: pick any tool and any knob, paint a value per step (⟋ = glide). Wobble rate, cutoff, DJ filter, reverb — on the beat.
- Right-click a step: 🔒 lock a knob for that one hit · "Plays": every other pass, only in a fill, first pass only…
- ✦ Fill (button, MIDI, Perform pad 8) · Evolve per lane (patterns grow from the 2nd pass, repeatably) · Humanize.
- Preset "Song · Give Your Head a Shake": the whole song — intro, verse, build (her line at the end), pause, two drops, breakdown.
- Lyrics → Rhythm → ⇢ Sequencer: paste your words; they become lanes + a "her voice" lane on every line (load her clip in a Sample Player).

## 3.35.1 — ⏮ restart · your pads do more
- ⏮ (top bar, Timeline, Home): back to the loop start, or bar 1 — keeps playing.
- MIDI Map → What the pads do: Drums · Keys (16 notes in key) · Chords + drums · Split · Perform (⏮ ▶ ⏺ ⟲, markers, drop, tap, patterns A–H) · ✎ any pad.

## 3.35 — the Timeline, easier
- ⤢ fills the screen at true size whatever the canvas zoom (Esc back). Long songs at high zoom no longer go blank.
- Drag the bar above the piano roll to resize it · exports are one ⤓ Export menu · wheel scrolls time · + / − zoom · F fit.

## 3.34.2 — Bass Pack · 3.34.1 — Words → Song
- Bass Pack: 8 genres (tearout, dubstep-og, riddim-war, drumstep, trapstep, bass-house, deathstep, tension-study); genre bar-writer hook `G.bar`; real builds, pause, lift.
- Words → Song (RhythmExpand): lyrics' rhythm drives drums/bass/lead over a Song Engine genre. `SongEngine.generate(id, seed, X)` + `helpers`.
- Merge fix: p22 golden hashes re-captured in-page (old set lacked organism sizes → layout drift; notes unchanged). Windows payload rebuilt (was 3.33).

## 3.34 — nothing sticks, windows that expand, speed + settings per tool, the Mixer
- Drags can no longer get stuck (the "open the dev console and it works again" bug): one guard ends every drag on release, a button-less move, Esc or switching windows.
- ⤢ on every window and the bottom dock (fills the screen). Timeline: fills its window, lane height − / ＋, Ctrl+wheel zoom, Alt+wheel lane height, ⤢ Fit, ruler stays on top.
- Speed per tool: every beat-driven tool has Speed (¼ … 4, or its own BPM) in ⚙ Settings.
- ⚙ Settings on every tool: every parameter (searchable), presets, Reset, and Output (its mixer strip).
- 🎛 Mixer (Mix): a strip per sound (fader, pan, M/S, meter, low cut, EQ, sends, output), ＋ Group / Reverb / Echo / Aux lines.
- Coming next (mapped in specs/eravos.phase34-map.spec): Hard Tune, the Song editor, the UI rebuild pass, new EDM genres, import & map.

## 3.33 — Drop Builder 3, Lyrics → Rhythm, Embodiment Lab, living surfaces

Drop Builder: her voice panel first; every part of every section (tension, build, pause, drop) has its own editor and
a ▶ hear button. Lyrics → Rhythm turns words into a beat or a melody line. Embodiment Lab: an irrational-ratio drone
with a heartbeat pulse, a breath swell and body cues — feelings as presets (Lab mode). Pad Forge and Dub Station are
redesigned; every tool's surface can follow its own sound (UI.alive). Timeline clicks land where you click at any zoom.

## Making new tools, packs, modes, domains (3.32)

Read `specs/eravos.structure.spec`. In short: every tool is its own folder
(`tools/<domain>/tools/<category>/<tool>/` with tool.json, engine, window, spec, preview, packs/), modes are views
that reference tools, packs are content only. Formats: `schemas/`. Starting points: `templates/`.

    node build/new-tool.mjs --domain music --category effects --id fx-shimmer --label "Shimmer" --flavour sound
    node build/index-tools.mjs && node build/validate.mjs

Where every current tool moves: `specs/eravos.structure.map.spec` (generated by `build/structure-map.mjs`).

## 3.31 — your songs, your taste, goals

**📖 Save to Songs** in the Song Recorder keeps the song (audio + the whole canvas) — Songs → **My songs** to listen or
open it again. **Learn → EDM tour**: 22 kinds of EDM, write → hear → rate each; Songs → **For you** shows what you love.
**Goals** at the top of Learn always show the next thing to do. The map of every future domain (image, video, UI,
automation) is in `specs/eravos.domains.map.spec`, one spec per tool.

## 3.30 — blank canvas, pads that just work, Sounds

ERAVOS opens blank: **Start · Add · Options**. Everything else appears when you pick a mode or add a tool.
Your pad controller plays the Drum Machine with no window open, and the pad you hit is the pad you see.
**🎚 Sounds** (toolbar, Music Production): every preset by pack, drum **kit packs** to switch on/off, load and mix pad by
pad, and **Capture → pad**: play any tool and its sound lands on a Drum Machine pad.
On the exe, tools come from **tools/<domain>/** next to ERAVOS.exe — the same folders as this project.

## Songbook and Learn (3.29) — pages of their own, off the canvas

**📖 Songs** (toolbar, Music Production): finished songs in every genre — reggae (Bun Dem), dancehall, Hanging Tree
desert goth, phonk, lo-fi, ambient and all the Song Engine genres. Each card says what to listen for, what the drop
does and where her voice clips go. **▶ Write this song** builds it on the canvas; **🎲 Another like it** rolls a new one.

**🧠 Learn**: short lessons on a map — predict first, then press; each lesson ends on a question the next one answers.
The lesson runs in a small strip at the bottom-left. Finishing some lessons unlocks songs in the Songbook.

Every drop now goes silent for half a beat before it hits (crash + kick on beat 1).

## Connecting tools

Click the **⇢ plug** in a window's title bar: a list shows everything on the canvas it can plug into — click one to
connect (✓ = connected; click again to disconnect). Or drag the plug onto a window. Double-click a wire to remove it.

## Saving pieces

The **＋** next to any preset menu saves your own preset — the knobs **and** what the tool holds: sequencer patterns,
timeline arrangements, drum kits with the clips on the pads, Clip Maker / Sampler clips (their audio is kept too).

## Song Recorder

Its **▶** plays your takes only — the rest of the canvas stays silent. Space plays the whole canvas. Turn on
**Play with song** when you want takes to play along with the canvas (overdubbing).

## Making a track

Press **Start → Future Bass song** for a finished example: click any clip to edit its notes in the piano roll,
drag the ⇢ plug in a window's title bar onto another window to connect them, press Space to play, **Bounce WAV** to export.

## ERAVOS.exe (Windows)

The Windows build is a portable folder with the same layout as this project: double-click **ERAVOS.exe** — no browser,
no Node, no install. Next to it are `canvas/`, `tools/` (every domain) and `schemas/`, the same folders as here, and the
exe loads its tools from `tools/` exactly like the dev build. Your own folders sit beside them: **projects** (Save),
**exports** (Bounce), **drop** (sounds, `.mid`, packs or projects put there appear on the canvas), **packs** (extra tool
packs, loaded every start; packs dropped on the canvas are kept there) and **.appdata** (autosave, presets). A rebuild
never touches them, and an older build's **ERAVOS Library** projects, exports and autosave move across on first start.
**Build ERAVOS.exe.bat** (repo root, Windows, no Node) → `dist/ERAVOS/ERAVOS.exe` and `dist/ERAVOS_<version>.zip`;
`node desktop/build.mjs` does the same anywhere with Node. `dist/` is build output and is not committed.
