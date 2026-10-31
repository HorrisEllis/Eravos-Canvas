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

## ADDENDUM 2026-10-31 — packs are DLC: "i want sound packs to be like dlc in a way. each pack adds new sounds or capabilities."
  This sharpens "additive" (2026-10-25/26) into a rule every pack must pass. Everything above stays; where it conflicts, this wins.
  DLC RULE   a pack exists to ADD what ERAVOS did not have before it was installed. Each pack must bring at least one of:
               NEW SOUNDS        sound sources nothing else has: drum recipes (3.74b), new oscillator / wavetable / partial banks,
                                 samples, a new voice model for an existing instrument. Measured apart from everything already
                                 installed (the 3.74b fingerprint test: ≥ 6 dB per feature from every other sound).
               NEW CAPABILITIES  tools that did not exist: a new effect, instrument or component (Synthwave: Gated Reverb, FM Keys,
                                 Ensemble Chorus, Vocoder, Brass section — the P74b.4 gaps), new pattern generators, new suite scenes.
             Presets, kits, patterns and songs ride along inside a DLC (they show off what it adds), but a pack that is ONLY retuned
             presets of tools everyone already has is not a DLC: the validator says so, and the store does not list it as one.
  WHAT A DLC IS ON DISK  tools/<domain>/packs/<id>/ — dlc.json (schema eravos.dlc/1: id, label, version, art, blurb, adds: { sounds,
             tools, presets, kits, patterns, songs, scenes }, needs: { packs, tools }) · sounds/ (recipes, banks, samples as data) ·
             tools/ (each a normal tool folder: engine + ui + spec + tests + tool.json, its category from the catalog) · content/
             (ContentPacks files with "pack": "<id>"). Tools inside a DLC exist in the catalog only while the DLC is installed.
             This amends eravos.pack.format ("data, never code"): a CONTENT pack stays data only; a DLC may carry tools, and every
             tool in it passes the same gates as a built-in tool (spec, tests, sovereign, boundary). Signed by its id + hash.
  INSTALL LIKE DLC  a PACKS page (the store): one card per DLC with its art, what it adds in numbers ("Synthwave · 3 new tools · 22 new
             drum sounds · 1 wavetable bank · 112 presets · 40 patterns · 6 songs"), a 20-second demo you can hear before installing
             (rendered from the pack's own song), and Install / Uninstall. Installed → its tools appear in ＋ Add under their categories
             with a small pack badge, its sounds in the instruments, its presets in the menus, its songs and patterns in their pages.
             Uninstall → all of it leaves, and a project that used it says what is missing and offers to reinstall (Catalog.ensure).
             The pack page of the first addendum (Tools by category · Sounds · Patterns · Songs · Suites · Missing · Build the rig) is
             the DLC's own page once installed.
  NEW PHASES (replace GP1–GP5; the first addendum's acceptance still applies)
    DLC1 the DLC format (dlc.json, schema, validator with the DLC rule), install / uninstall with tools via the catalog, the pack
         badge, Catalog.ensure for projects                                                                                  mapped
    DLC2 the Packs store page: cards with art, numbers, a demo to hear, Install / Uninstall                                   mapped
    DLC3 SYNTHWAVE DLC: its 22 drum sounds (3.74b) moved in, + NEW TOOLS Gated Reverb · FM Keys · Ensemble Chorus, + the 80s
         presets and its patterns and songs; each new tool with its own tests                                                mapped
    DLC4 one DLC per genre after it, each with its own new sounds and at least one new capability (Dubstep: e.g. a growl resynth;
         Reggae: spring reverb + dub siren; Hip-hop: vinyl sampler + MPC swing; Jazz: brushes + upright bass; Orchestral: the
         ensemble instruments of eravos.phase75-map G3)                                                                      mapped
  ACCEPTANCE  every listed DLC passes the DLC rule (tested: it adds ≥ 1 sound measured apart, or ≥ 1 tool nothing else provides) ·
             install → its tools spawn and sound, uninstall → none of it remains anywhere (tested) · a saved project that used a
             DLC reopens after reinstall exactly as saved · works offline in the exe and the web build.

## ADDENDUM 2026-10-31 (later) — CORRECTED by him: "what?  packs are for tools..."
  The DLC addendum above read "packs" as genre-wide bundles that ship their own tools. That is wrong. His model:
  A PACK BELONGS TO ONE TOOL and is that tool's DLC: it adds NEW SOUNDS or NEW CAPABILITIES to that tool.
    Drum Machine  a pack adds drum sounds the machine never had (recipes, 3.74b) + kits that use them
    a synth       a pack adds new oscillator/wavetable/partial banks, voice models, modes — then presets that use them
    an effect     a pack adds new algorithms or modes (a gated room for a reverb, a spring, a tape model)
    a generator   a pack adds new pattern styles / grooves
  Presets ride along inside a tool's pack; a pack of retuned presets alone is not a DLC (the DLC rule above still applies, per tool).
  GENRE = a TAG on tool packs, not a pack of its own. "Synthwave" is the set of every tool's Synthwave pack. "find all tools for it"
  = a view: the tools that have a Synthwave pack, grouped by category (Drums · Bass · Synthesis · Effects …), each with what its pack
  adds, Install/Uninstall per pack, and "install all Synthwave packs" as a convenience. Genres with no pack for a tool show it as
  missing for that tool (the gap list).
  WITHDRAWN from the addendum above: packs that carry their own tools (a new tool is a tool, installed through the catalog as today);
  the genre-wide dlc.json. KEPT: the DLC rule (adds sounds measured apart, or a capability), install/uninstall leaving nothing behind,
  a project naming a missing pack and offering it.
  PHASES (replace DLC1–DLC4)
    TP1 the tool-pack DLC model: a pack declares what it adds to its tool (sounds / capabilities / presets); the tool's engine reads
        added sounds and capabilities from installed packs; the DLC rule validator per tool; install/uninstall on the tool page   mapped
    TP2 Drum Machine first (its recipe interpreter exists): every one of its 13 packs adds sounds of its own (= P74b.3)             mapped
    TP3 one synth (Retro Poly or Supersaw): packs add wave banks / voice models, not just presets                                 mapped
    TP4 the genre view: "Synthwave" lists every tool with a Synthwave pack by category, with the gaps                             mapped

## ADDENDUM 2026-10-31 (third) — CORRECTED again by him: "no it should be a pack. like full packs, are packs of sounds for tools.
##   like tools should should have more power, like wobble bass, full range of depth in all aspects."
  Two different things, now kept apart:
  1 PACKS ARE FULL PACKS OF SOUNDS. A pack is one thing (Synthwave, Riddim, …) that brings SOUNDS for the tools it fits, across many
    tools at once: presets for the synths and basses, kits and new drum sounds for the Drum Machine, patterns, samples. That is the
    model of the FIRST section of this spec (one pack id adding to every tool that fits, a pack page listing its tools by category,
    on/off as one) — it stands again. A pack carries sounds, never tools.
  2 POWER BELONGS TO THE TOOLS. New capabilities are not a pack's job: each tool itself must reach the full range of depth in every
    aspect (his example: Wobble Bass). That is specs/eravos.tool-depth.spec.
  WITHDRAWN: "a pack belongs to one tool" (second addendum) and "packs carry their own tools" (DLC addendum). KEPT from the DLC addendum:
  the store-like Packs page (cards, numbers, a demo to hear, Install / Uninstall), and the DLC RULE read for sounds: a pack must add
  sounds that are new (measured apart from what is installed — the 3.74b fingerprint test), not copies of other packs.
  PHASES (replace TP1–TP4 and DLC1–DLC4): GP1–GP4 of the first section (+ the Packs store page from the DLC addendum), Synthwave first.
