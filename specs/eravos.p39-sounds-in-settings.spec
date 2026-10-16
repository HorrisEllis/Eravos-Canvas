# spec_id: eravos.p39.sounds-in-settings · version 1.0.0 · phase P39 · status MAPPED · order 3
# R2 "i want presets, packs and sounds, but in the tools settings" · R3 "a way to make sounds for each tool"
# R8 "make a fuck ton of packs and sounds for each tool … full expanded packs, with presets"

## Findings (3.38)
  presets live in each tool's packs/<id>/pack.json (ContentPacks); the ⚙ Settings panel (runtime/tool-settings.js) shows
  every param + a preset list + Reset; packs are switched on/off only on the separate Sounds page (Presets / Kits tabs).
  counts today: 366 presets across 50 music tools — Drum Machine 4, Sequencer 2, Timeline 0, Mixer 0, Macro 0, XY 0,
  Clip Maker 0 … the most used tools are the thinnest.

## §S The SOUND tab in every tool's ⚙ (one surface for all tools — domain-free, a ToolSettings section)
  Settings gets three tabs: SOUND (default) · CONTROLS (today's param list) · ABOUT (spec, needs, works-with, version).
  SOUND, top to bottom:
    search + tag chips (genre · mood · era · character: dark bright wide dirty clean soft hard) — filter as you type
    PACKS strip: every pack that has items for THIS tool (factory, bundles 80s/Club/EDM Pads/…, yours, dropped zips) as
      cards with thumbnail + count + on/off switch — the same switch the Sounds page uses (one state, two views)
    LIST: every preset of the switched-on packs; each row = ▶ (audition on the tool's own preview phrase, A2) · name ·
      pack · tags · ♥ (favourites float to the top) ; click = load (one undo step) ; hover-preview optional (off default)
    YOURS: "＋ Save current sound" (name + tags) into a pack of yours · rename · delete · move between your packs
    SHARE: export a pack of yours as .zip · drop a .zip anywhere on the tab to add it
  The Sounds page stays as the cross-tool overview (all tools at once); the Kits tab moves into the Drum Machine's SOUND
  tab (kits are presets of the Drum Machine) and stays reachable from Sounds.

## §M Make sounds for every tool (R3) — four ways, one panel ("MAKE" under the list), all domain-free
  M1 MORPH   pick A and B presets → a slider between them (numbers interpolate, enums switch at 50 %, arrays morph per
             element) → ▶ while dragging → Save. Works on any tool because it only reads the tool's config schema.
  M2 BREED   pick 2–4 parents → 8 children (crossover per param group + seeded mutation, strength slider) → ▶ each →
             keep the ones you like, breed again (generations kept as a small tree). = the "genomes" idea applied to
             presets (specs/eravos.genomes-ecosystems-behaviors.spec), per tool.
  M3 MATCH   drop or capture a sound → ERAVOS searches this tool's params to sound like it (invention I13) → a preset.
  M4 DRAW    tools with a drawable surface expose it here (Wobble's shape — BUILT 3.38; Reese movement, LFO Pro, Wub Lab
             wavetable later) — the drawing is saved inside the preset.
  Every made sound passes the LEVEL GATE before it can be saved: rendered peak ≤ −1 dBFS and loudness within ±3 LU of the
  tool's factory median (so a beginner's preset never blows up a mix), else Save offers "fix level" (one click).

## §P Packs — the "fuck ton", made measurable (A4)
  target per tool (factory + genre packs): sound sources & bass ≥ 60 · drums: Drum Machine ≥ 40 kits + ≥ 200 pad sounds
  (pads.spec PLANNED 3.0) · effects ≥ 30 · modulation ≥ 25 · sequencer ≥ 60 patterns (sequencer.spec PLANNED 3.0) · mixer /
  channel ≥ 20 chains · arrange tools ≥ 15 templates.
  genre packs (each spans the tools it touches, like the 80s/Club bundles): Riddim · Brostep · Tearout · Colour Bass ·
  Melodic Dubstep · Neuro/DnB · Jungle · Juke/Footwork · UKG/2-step · Melodic House (her song) · Progressive House · Tech
  House · Hard Techno · Hardstyle · Trance · Synthwave/Darkwave · Phonk · Trap · Dancehall/Ragga · Afro House · Amapiano ·
  Lo-fi · Ambient/Cinematic · Witch House.
  pack quality gate (build/validate-packs.mjs, offline render of every item):
    - level gate (§M) for every preset ; zero faults on load ; every param in range (exists in toolContract)
    - DIVERSITY: within a pack, the median pairwise distance of rendered feature vectors (I6 features, per tool) ≥ a
      threshold per tool kind — a pack of 40 near-identical presets FAILS (this is the drum-kit problem, measured)
    - naming: unique per tool ; tags from the shared vocabulary only
## Acceptance
  - ⚙ opens on SOUND for any tool that has ≥ 1 preset; CONTROLS for tools with none
  - switching a pack off in a tool's SOUND tab is reflected on the Sounds page and vice versa (one state)
  - ▶ audition never changes the tool's saved state and never enters undo
  - MORPH at 0 = A exactly, at 1 = B exactly ; BREED children all pass toolContract ranges ; same seed → same children
  - every shipped pack passes the quality gate in CI (fails the build otherwise)
