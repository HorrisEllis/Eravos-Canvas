# ============================================================
# ERAVOS PHASE 13 — SKELETON + PACKS (the canvas expands)
# spec_id:      eravos.phase13-skeleton-packs
# version:      1.0.0
# author:       James Brooks
# status:       canonical
# created_at:   2026-09-28
# pack:         3.23.0-alpha.1
# ============================================================
#
# Intent (James, 2026-09-28): "the canvas is meant to expand. basically have only what's needed as a skeleton,
#   and have it dynamically expand."

shape:
  ERAVOS.exe ships the SKELETON only: kernel (+ intake), runtime (sdk, ui-kit, factory, canvas, wires, workspace,
  recipes, desktop bridge), shell. No domain, no tool. A bare exe shows "This canvas has no tools yet".
  Everything else is a pack: the music DOMAIN is one pack (pack_type domain), each tool family one pack (organism_pack,
  dependencies: [eravos.music]). Packs come from ERAVOS Library › Packs (every start, dependency-ordered, no prompt)
  or a drop on the canvas / into Drop Here (prompted once, then kept in Packs).

packs (built by desktop/packs.mjs from the source tree — file order taken by running the dev loaders; a category no
       family covers fails the build):
  Music 0 - Core            eravos.music            domain: theory, audio engine, transport, sdk, ui kit, data, recipes, css
  Music 1 - Start here      eravos.music.start      Session, Coach
  Music 2 - Mixer           eravos.music.mix        Channel, Master FX, Sidechain
  Music 3 - Synths/basses   eravos.music.sounds     Supersaw, Acid, Wobble, Reese
  Music 4 - Drums/sequencer eravos.music.drums      Drum Machine, Sequencer
  Music 5 - Arrange         eravos.music.arrange    Timeline (+ piano roll), Drop Builder
  Music 6 - Effects         eravos.music.effects    Tape Echo, Filter, Mod Delay, Destroyer, Phaser
  Music 7 - Modulation      eravos.music.modulation LFO, Macro, XY Pad
  Music 8 - Voice/samples   eravos.music.voice      Sample Player, Clip Maker
  Music 9 - Generators      eravos.music.generators EDM Lab
  Music 10 - Tools          eravos.music.tools      MIDI Map, Contrast Analyser
  development (browser, tests) still loads domains/ from source — one tree, two deliveries.

skeleton changes (all domain-free):
  intake: pack_type "domain"; contents.styles → <style data-pack> injected before the pack's code; prompt text for
          packs with no permissions
  recipes: offered only when every organism they mount is installed (Recipes.list/featured; .all() for everything)
  shell:   domain shell hooks run when a domain installs later (kernel:domain-installed); start screen waits for
           ERAVOS_PACKS_READY (desktop) and refreshes when a pack installs while it is open; empty-canvas guidance
  desktop: Packs sent as one batch; page orders them by manifest dependencies (Kahn) and installs sequentially

finding: recipes Spatial / Visual / Emerge / Vagal mount five organisms that were never built
  (eravos.orbit, eravos.euclid, eravos.granular, eravos.breath, eravos.organ) — they only faulted before; now hidden
  until those tools exist. → tools backlog.

evidence (Electron 44.4.5, packaged resources/app, Xvfb):
  full library: 11/11 packs ok, domain music + 26 organisms, 4 working recipes shown, transport/BPM in the toolbar,
    Future Bass recipe: 8 windows, 2 wires, master peak 0.68, 0 faults, 0 page errors
  bare: 0 domains / 0 organisms, empty-canvas card; drop Core + Effects + Synths → 9 tools live, css injected,
    all kept in Packs; restart → 9 tools back, 3/3 packs, no prompts
  suite: 253/253 (4 new: domain pack + css order, missing dependency refused, recipe availability, ghost recipes hidden)
