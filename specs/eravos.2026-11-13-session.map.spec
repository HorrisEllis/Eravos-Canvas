# spec_id: eravos.2026-11-13-session · status: mapped (each line: built / rule / open) · author: James Brooks
# His words, verbatim, with the time each was sent (UTC, from the session transcript). "Map, spec first" (2026-11-06) · "Update the specs so
# nothing is lost." The same list, kept current across sessions: docs/HIS-WORDS-MAP.md (N-X17 …) · the evidence register: docs/competence/.

## 00:11:12Z (2026-11-13T00:11:12.704Z) — verbatim:
  > 6? also they sound horrible. more like floor falls out.
  - BUILT 3.174 (PR #169): 24 songs on his three shelves, Floor Falls Out's arc and sound, measured beside it · P173

## 01:41:23Z (2026-11-13T01:41:23.140Z) — verbatim:
  > Yes. Then make sure we can edit, change and manipulate layers in workshop. Let's get that finished.
  - BUILT 3.175 (PR #170): every layer op (eye, lock, amount, order, rename, duplicate, delete, reset, copy / paste) · P174

## 08:39:01Z (2026-11-13T08:39:01.011Z) — verbatim:
  > Continue. Also shouldn't the workshop be called field? I like it so far. What about tool dependant. Also erasing parts of the notes or patterns. Making it thicker or thinner, longer. Also a lot of songs in the songs menu still on there.
  - his answers to the questions asked: "Rename it Field (Recommended)" · "I meant tool specific. Using the dag maybe or contract" · "Maybe
    options for it? Or pitch width." · "I cant hear some of them in the preview. Can you also test them. Some sound lterrible"
  - BUILT 3.176 (PR #172): FIELD; erase / longer / thicker on the map; a tool's contract first · P175, P176
  - BUILT 3.177 (PR #172): every song preview measured; levelled by loudness; 17 measured trims

## 12:31:19Z (2026-11-13T12:31:19.551Z) — verbatim:
  > I love the bassline, needs more depth and control. like tempo and the cord tool. bassline is high leverage. what do you think about having tools combined when connected into a large interface? not just listing mods but using field to change the ui dynamically. to make something completely new. that would be sick. what about have seperate ui elements for each tool that can merge automatically. dynamic ui synthesiss
  - OPEN, specced: Bassline 2.0 — tools/music/tools/bass/bass-gen/bass-gen.spec ADDENDUM 2026-11-13 (time, the note pool, range,
    anticipation, step locks, phrase) — its UI shown to him before it is built
  - OPEN, specced: dynamic UI synthesis — specs/eravos.ui-field.spec ADDENDUM 2026-11-13 (UI parts with roles; wired tools merge what they
    share; the Field reshapes it; unwiring splits it) · specs/eravos.suites.spec ADDENDUM 2026-11-13 (a merged surface saves as a suite)

## 12:34:18Z (2026-11-13T12:34:18.577Z) — verbatim:
  > what about a compatability graph? i want tools to mutate into new ones. yes the workshop. component integration, ive wanted this for a long time. especially with emerge. like variable driven innovation.
  - OPEN, specced: specs/eravos.compat-graph.spec (NEW — typed ports, slots, bridges, mutation, lineage, the checker; map measured)
  - components' ports as data: specs/eravos.components.spec ADDENDUM 2026-11-13

## 12:36:57Z (2026-11-13T12:36:57.830Z) — verbatim:
  > should we have that in the workshop, the canvas? i feel the workshop should be a tool on its own. like can we make the canvas more bare?
  - OPEN, specced: specs/eravos.bare-canvas.spec (NEW — the canvas's 36 files mapped: host / leaves; the Field first) · specs/eravos.workshop.spec
    ADDENDUM 2026-11-13 (3) (the Field a tool, wired to what it edits; the graph and mutation live in it)

## 12:41:38Z (2026-11-13T12:41:38.732Z) — verbatim:
  > is emerge worth waiting for on this?
  - answered: no — built in v1 as declarative data Emerge takes over (the v1 → v2 table)

## 12:42:13Z (2026-11-13T12:42:13.541Z) — verbatim:
  > add that to the eravos v2 spec
  - DONE: docs/eravos-v2-emerge-looking-glass.md ADDENDUM 2026-11-13 (the idea, decided: do not wait, the v1 → v2 table, open)

## 12:42:48Z (2026-11-13T12:42:48.016Z) — verbatim:
  > lets begin. map and update the specs first. add addendums. and record decisions in the proof of componency doc
  - DONE: this map; NEW specs compat-graph, bare-canvas; ADDENDA 2026-11-13 to workshop, ui-field, suites, components, bass-gen; decisions in
    docs/PROOF-OF-COMPETENCY.md (Decisions, 2026-11-13) and the register (docs/competence/)
  - the order he agreed to begin ("lets begin", after the order was proposed): BC1 the Field out of the canvas → CG1 ports as data → CG2 the
    graph → CG3 one mutant → the Field's swap / mutate UI shown first → Bassline 2.0 on the graph

## (after 12:42:48Z) — verbatim:
  > yes that works
  - BUILT 3.178 (BC1): the Field → tools/core/field/; the canvas the host only (tests/bare-canvas.test.mjs); validate in CI

## 13:07:08Z (2026-11-13T13:07:08.971Z) — verbatim:
  > Each component of each tool has a element for the ui to synthesis. Should we call Eravos 2: synthesis, or field?
  - RULE (specced): every component carries its own UI element; a tool's UI is synthesised from its components' elements —
    specs/eravos.ui-field.spec ADDENDUM 2026-11-13 (2) · specs/eravos.components.spec ADDENDUM 2026-11-13 (2)
  - the name: recommended "ERAVOS 2: Synthesis" (Field stays the surface inside it); his next message began "Okay." — recorded as
    proposed, to confirm (docs/eravos-v2-emerge-looking-glass.md ADDENDUM 2026-11-13 (2))

## 13:08:14Z (2026-11-13T13:08:14.110Z) — verbatim:
  > Okay. Each tool needs that. Dag. It has to anounce what it needs to the canvas. The canvas needs to import it from the zip.
  - RULE (specced): every tool announces what it needs — generated from its DAG: its components (each bringing its element), the canvas's
    kit elements, its domain — and the canvas imports it from the tool's zip: specs/eravos.store.spec ADDENDUM 2026-11-13 (S1 and S3 extended:
    the announcement; I1–I4: import from the zip) · specs/eravos.compat-graph.spec ADDENDUM 2026-11-13

## 13:11:29Z (2026-11-13T13:11:29.305Z) — verbatim:
  > just begin. also songs decomposed one by one. maybe a tool store. like i want to make a store for domains and tools. 
  > like you click browse, and it opens a menu for browsing tools per domain, packs per tool, sounds and presets. a tool page per tool with the relevant dependancies and packs. rhythmes and notes per tool. like all tools zipped in a zip with all of its components, dag, etc. all isolated from each other. the canvas using a interaction contract.
  - "just begin": BUILT 3.179 — CG1 for the 23 sound components (tools/music/components/<id>/<id>.contract.json: ports, variables, UI
    element; build/component-contract.mjs checks each against its code) and every tool's announcement from its DAG (build/tool-needs.mjs:
    needs.components + needs.elements in 18 tool.json)
  - OPEN, specced: specs/eravos.store-browse.spec (NEW — Browse, a tool's page, whole isolated zips, the interaction contract) · store.spec
    ADDENDUM 2026-11-13 (2)
  - BUILT 3.180 (SD1): specs/eravos.song-decomposition.spec — 301 songs into parts; 3,933 rhythms and 4,607 lines per tool (build/song-decompose.mjs)

## 13:27:55Z (2026-11-13T13:27:55.379Z) — verbatim (after the Browse preview, SB1):
  > no. i like the current ui. do not change it.
  - RULE: the UI stays as it is — Browse not built (specs/eravos.store-browse.spec ADDENDUM 2026-11-13 — the Browse UI: NO); the preview kept
    unmerged on branch claude/browse-preview. Data and no-UI work (contracts, announcements, decomposed songs, zips, import) continue.

## 13:53:40Z (2026-11-13T13:53:40.203Z) — verbatim:
  > continue with the component contracts. then i want the next set of high leverage tools
  - BUILT 3.181: CG1 finished — the 10 data / logic components' contracts (33 of 33 with code); a check that a contract's default equals the
    default the code states (it found 5 wrong defaults of mine, now fixed); all 18 tools announce their components' UI elements
  - OPEN: the next set of high-leverage tools — from the dependency graph (docs/eco-graph.md), each spec first and its UI shown to him first
  - BUILT 3.182: the first of the next set — Piano (approved 2026-11-06, the one approved tool ready to build: 7 of 7 components built).
    The rest of the set, from docs/eco-graph.md: Ensemble Organism (ready, never shown — UI preview first); the components that unlock the most
    (slew-lag, mpe-expression, relationship-graph, reverb-fdn, waveshaper) — each spec + tested code, no UI.

## 14:27:33Z (2026-11-13T14:27:33.120Z) — verbatim:
  > okay. what leverage does this add? also the ui was okay, but cut off
  - answered (measured from the specs): waveshaper + env-msseg + slew-lag take the ready planned tools from 2 to 5 (Analog Drift, Hoover
    Engine, Log Drum), reach 29 planned tools, leave 8 one part away; Destroyer, Wobble Bass, Acid Synth, Sub Engine move onto them
  - "cut off": measured — Piano's face fits its window (0 px over); a window is capped at the visible canvas (3.37) and then scrolls with its
    keys pinned at the bottom, so on a short screen the lower cards slide under the keys. OPEN: a shorter Piano layout — shown to him first.

## 14:28:04Z (2026-11-13T14:28:04.336Z) — verbatim:
  > make sure you are seperating the elements for synthesis. i want to add the element synthesis
  - BUILT 3.183 (ES1): specs/eravos.ui-field.spec ADDENDUM 2026-11-13 (3) — every Piano control names its element (a component it announces,
    or its own part); tools/core/elements/ synthesises a face from them (one card per element, in the sound's order, the same kit); the
    tempo controls every music tool carries name own:tempo; P183 guards it. PREVIEW: docs/previews/element-synthesis-piano.png (today's face
    beside the synthesised one) — today's stays until his yes.

## (after 14:28:04Z) — verbatim, with a screenshot of Piano's Sustain pedal button over the display's edge:
  > overlap. why lowercase all the time also? like porffesssional anbd production grade, matching the themes. enterprise grade.
  - measured: the display ends where the pedal's row begins (y 287); the button (30 px, −1.5 px margin, a 3 px ring) rides into it
  - 3.184 (SHOWN, not merged): the pedal moves into the header beside Model (no row under the display — Piano also ~30 px shorter); every
    setting's options SHOWN in title case (values kept as stored: presets, songs, projects unchanged) — the kit capitalises, a domain registers
    its acronyms (music: SVF, LFO, FM, BPM, MIDI, DnB, VHS, I–VII …). Before / after: docs/previews/case-{before,after}-{piano,retro-dco,swarm-oscillator}.png
  - OPEN: lowercase text drawn inside displays and hint lines (each tool's own words) — a second pass, shown first

## (after the before / after) — verbatim:
  > okay why not hold? like the other piano tool?
  - done in 3.184: Piano's pedal button labelled Hold (as Retro DCO / Retro Poly); hint: the sustain pedal; stored key `pedal` kept

## 15:58:04Z (2026-11-13T15:58:04.232Z) — verbatim:
  > Okay. The bassline tool. Way more depth. I like that tool. A lot.
  - "Okay.": the Hold / title-case branch merged (PR #185)
  - 3.186 (SHOWN, not merged): Bassline 2.0 — bass-gen.spec ADDENDUM 2026-11-13 (2): TIME, NOTES, LOCK and REST lanes on its page; the
    window unchanged; defaults play 1.1's notes. docs/previews/bassline-2-{window,steps}.png

## (after 15:58:04Z) — verbatim, after the preview:
  > It looks the same. Tempo. Pitch need more automation. Bpm.
  - 3.186 (SHOWN, not merged): TIME · PITCH on the window itself — Own BPM, Swing, Answer, Pitch (transpose, scale steps / semitones), Tension,
    Range, Ahead; Speed, Feel, Pool, Pitch in. Every knob automates (Speed and Own BPM gained their inputs, every music tool). P184: numerals
    in sequence keep their case (i-VI-III-VII)

## (after the Time · Pitch preview) — verbatim:
  > Push. The. Next tool.
  - "Push.": PR #186 merged (Bassline 2.0, CI green)
  - "The next tool": Ensemble Organism (docs/eco-graph.md — 6 of 6 components built). SPEC FIRST: its depth audit (ADDENDUM 2026-11-13 — ports,
    params, signal_dag, modes, decisions D1–D4); UI SHOWN FIRST: tools/music/planned/ensemble-organism.ui.md,
    docs/previews/ensemble-organism-{preview,beside-mod-delay,more-depth}.png — built on his yes
