# spec_id: eravos.p39.map · version 1.0.0 · phase P39 · status MAPPED (spec only — nothing below is built unless marked)
# The single list of everything asked for since 3.36, where each item is specced, and the order to build it.
# Supersedes nothing: P38 (specs/eravos.p38-wub-lab.spec) stays the Wub Lab stage plan; this map points at it.

## The goal every item serves (user, 2026-10-16)
  "i want to build her a song. from my heart but im not good at this." · "i have no idea what im doing at all."
  · "i want it to be easier, but something the most talented artist could use and find it expansive, like impressed by it."
  → Two users in one: the beginner who must get to a finished, heartfelt song without theory, and the pro who must never hit
    a ceiling. Every spec below answers BOTH (axiom A1). Reference listening: the playlist "Lost love." (§ her song).

## Axioms (apply to every P39 item)
  A1 Two depths, one tool: every window has a simple face (≤ 6 controls that matter most) and the full depth one click away
     (invention I12). Never two tools for one job (one tool per tool).
  A2 Sound first: a beginner judges by ear. Every choice (preset, pack, kit, model, fill, song) can be heard before it is
     taken (▶ audition, P37.3 previews), and every take is undoable.
  A3 Technique, never copies: no melody, lyric, sample or stem of any record. References inform technique only.
  A4 Measured, not claimed: "contrast", "variety", "level" are numbers ERAVOS computes (I6) — tests check them.
  A5 The canvas shows only what the tools on it need (canvas shrink, R10).

## Requests → spec → order
  #   request (user's words, short)                                   spec                                         order
  R0  "build her a song … no idea what im doing"                      specs/eravos.p39-her-song.spec                 1
  R1  "drum machine presets worthless, pad sounds absent"             pads/pads.spec § PLANNED 3.0                   2
  R2  "presets, packs and sounds, but in the tools settings"          specs/eravos.p39-sounds-in-settings.spec       3
  R3  "a way to make sounds for each tool"                            specs/eravos.p39-sounds-in-settings.spec §M    3
  R4  "in the sequencer, four on floor is terrible" + precision       sequencer/sequencer.spec § PLANNED 3.0         4
  R5  "timeline hard to use, scrolling, cluttered" ; "wired tools     timeline/timeline.spec § PLANNED 3.0           5
       should add to the timeline right?"
  R6  "catalog: thumbnails for each tool, packs listed under it"      specs/eravos.p38-catalog.spec § 3.39 amendment 6
  R7  "Tranki … the way it fights the rhythm, tools for that"         tools/music/planned/contrast-engine.spec v2   7
  R8  "fuck ton of packs and sounds for each tool"                    specs/eravos.p39-sounds-in-settings.spec §P    3→
  R9  "the arrows on each tool to connect them, and the lines on      § R9 below (GAP — question open)               —
       the sequencer"
  R10 "canvas ui shrinks when the tool that depends on it is removed" specs/eravos.p39-canvas-shrink.spec            2
  R11 "most contrast … least similar songs … push eravos"             specs/eravos.p39-contrast-songs.spec           8
  R12 "invent something no one has ever seen" (spec only)            specs/eravos.p39-inventions.spec               —
  R13 Wobble editor (BUILT 3.38, S1) · Reese editor · Wub Lab voice   specs/eravos.p38-wub-lab.spec S2–S3 ;          S2 after 4
       · LFO Pro                                                        reese-bass/reese-bass.spec § PLANNED 2.0
  Order rationale: R0 first (the reason for all of it, and it mostly USES what exists) · R1 + R10 next (the drums every song
  stands on; the shrink is small and makes the canvas calmer for a beginner) · R2/R3/R8 (one sound surface for every tool,
  then fill it) · R4 R5 (the two places songs are written) · R6 · R7 · R11 last (songs need the tools at their limits).

## R9 — "the arrows on each tool to connect them, and the lines on the sequencer"  (GAP — not designed until answered)
  What exists: every window has port dots on its edges (in left, out right; colour = wire type) and a ⇢ plug in the title
  bar that lists every compatible target; wires are drawn as curves; a wire is removed by double-click. The Sequencer draws
  its lanes as rows of step cells with beat lines every 4 steps.
  Possible meanings (ask, do not guess): (a) the dots/arrows are too small or unclear — which goes where?; (b) wires clutter
  the canvas; (c) you want to wire by drawing a line straight from a Sequencer lane to a tool; (d) the Sequencer's grid
  lines are hard to read. Candidate answers already specced: (c) = sequencer.spec PLANNED 3.0 §L "lane plug"; (b)/(a) =
  canvas-shrink §W "wire calm mode". Confirm before building.
