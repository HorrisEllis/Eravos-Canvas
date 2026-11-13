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
