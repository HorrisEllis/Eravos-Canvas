# spec_id: eravos.genre-packs · version 1.0.0 · status mapped (not built) · 2026-10-26
# "also all the packs were supposed to be additive, like synthwave in relation to the tools. like find all tools for it. bass tools.
#  synthesis. etc" (2026-10-26) · before it: "every pack needs to be additive" · "yes like there is supposed to be full range of
#  synthwave sounds and tools" (2026-10-25, specs/eravos.phase74b-map.spec)

## What the code shows (main e2f60d2)
  K1 A pack is per tool in practice: ContentPacks.items(toolId, kind) answers one tool at a time, and the only place a pack is seen is
     ONE tool's page (tool-page.js) or its pack editor. Nothing lists what a pack adds across tools, or finds the tools for a genre.
  K2 Synthwave is split in two unrelated packs: content/bundles/80s (presets for 15 tools: Retro Poly, Supersaw, Acid, Reese, Sub, Pad
     Forge, Organ, Echo, Mod Delay, Phaser, Filter, Destroyer, Master FX, Channel, LFO) and data/drum-packs/synthwave.js (22 drum sounds,
     4 kits, 3.74b). Neither knows the other.
  K3 Patterns, songs and suite scenes have genres but no pack: the Pattern Library's Synthwave patterns and the Synthwave suite are not
     reachable from "the Synthwave pack".

## Model — a GENRE PACK is one id that ADDS to every tool that fits
  - one id (e.g. synthwave), one label, one colour/icon; any number of pack files may contribute to it ("pack": "synthwave" in each),
    so a drum pack, a preset bundle and a pattern set join the same pack. Nothing is replaced or overwritten (additive, D-74b.1).
  - what it can add, by kind: drum sounds (recipes) + kits · presets for any tool · patterns (Pattern Library) · songs (Songbook) ·
    suite scenes · samples. Every kind is already a ContentPacks kind or gets one (patterns, songs, scenes are new kinds).
  - ON/OFF as one: switching Synthwave off removes every addition everywhere (presets, kits, sounds — P74b.5 — patterns, songs, scenes).
  - CATEGORIES come from the catalog (tools/music/tools/<category>/): Drums & rhythm · Bass · Synthesis · Sound sources ·
    Genre instruments (keys, poly) · Effects · Mix · Modulation · Generators · Arrange · plus Patterns · Songs · Suites.

## The pack page — "find all tools for it"
  ＋ Add and Start get PACKS (genres): one card per genre pack with what it adds ("Synthwave · 19 tools · 112 presets · 22 drum sounds ·
  40 patterns · 6 songs"). The pack page (a tool-page style page, tabs as in 3.48.4):
    Tools      every tool it adds to, GROUPED BY CATEGORY (Bass: Reese, Sub, Acid … · Synthesis: … · Effects: …), each row: the tool, what
               the pack adds to it (n presets, n kits), ▶ hear (the pack's first preset on that tool, rendered off the canvas), Open (spawns
               the tool with the pack's preset loaded)
    Sounds     the drum sounds and kits, playable
    Patterns   the library filtered to the pack · Songs (its songs) · Suites (scenes that use it)
    Missing    the tools the genre needs that ERAVOS does not have yet, from the inventory (synthwave: gated reverb, FM keys, brass
               stabs, vocoder, ensemble chorus — P74b.4), so the gaps are visible, not hidden
    Build the rig: opens the pack's core tools (one per category: drums, bass, poly/keys, lead, fx) with its presets, wired into a suite,
               on the pack's own key and BPM — the fastest way from "I want synthwave" to sound (Undo takes it back step by step)
  Search: typing "synthwave" anywhere (＋ Add, Patterns, Songs) finds the pack and every tool it adds to.

## Phases
  GP1 the genre-pack model in ContentPacks (pack id across files, kinds patterns/songs/scenes, on/off as one) + P74b.5     mapped
  GP2 Synthwave as one pack: the 80s bundle + the drum pack + its patterns, songs and the Synthwave suite joined              mapped
  GP3 the pack page (Tools by category, Sounds, Patterns, Songs, Suites, Missing) + Packs in ＋ Add and Start + search        mapped
  GP4 Build the rig                                                                                                         mapped
  GP5 every other genre gets its pack the same way, one per push (Club, Dubstep, DnB, House, Techno, Trap, Reggae, Dark,
      Chill, then the new genres of eravos.phase75-map G5)                                                                  mapped
## Acceptance
  a pack page lists exactly what ContentPacks reports for that pack, grouped by the catalog's categories (tested) · Synthwave touches at
  least 5 categories · off → zero items from it in every tool, the pattern library and the songbook · Build the rig opens, wires and
  plays (rendered, not silent) · every Open loads the pack's preset (tested per tool)
