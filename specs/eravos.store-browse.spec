# spec_id: eravos.store-browse · version 0.1.0 · status SPEC (mapped 2026-11-13; nothing built; its UI shown to him before it is built) · canvas + store
# his words (2026-11-13, verbatim): "just begin. also songs decomposed one by one. maybe a tool store. like i want to make a store for domains
#   and tools. like you click browse, and it opens a menu for browsing tools per domain, packs per tool, sounds and presets. a tool page per
#   tool with the relevant dependancies and packs. rhythmes and notes per tool. like all tools zipped in a zip with all of its components, dag,
#   etc. all isolated from each other. the canvas using a interaction contract."
#   Session map: specs/eravos.2026-11-13-session.map.spec. Stands on: specs/eravos.store.spec (units, needs, the resolver, import from the
#   zip I1–I4), eravos.p38.catalog (BUILT: install only what you chose), the ＋ Add menu (BUILT: by mode / category, all tools, a tool's
#   presets, its page), ToolPage (BUILT: a page per tool), ERAVOS.kernel.spec (ui_hooks: "the interaction contract between UI and organism
#   logic … Nothing in the UI touches organism internals directly"; K-3, K-7), specs/eravos.song-decomposition.spec (rhythms and notes).

## the map (what exists, 2026-11-13)
  - ＋ Add (canvas/runtime/add-menu.js): modes → categories → tools; "Browse all tools"; a tool's card: needs, inputs, outputs, works-with,
    presets (first 10); its page. It lists what is INSTALLED or offered by the bundled catalog — no store, no packs browsed on their own,
    no rhythms / notes per tool.
  - ToolPage: tabs per tool (panel, packs, components, suites, setup …). Dependencies shown: components (build/components-map.mjs).
  - Packs: per tool in its packs/ (preset packs, kits, patterns); the pattern library (rhythms) and note library are music's, not per tool.
  - Zips: a dropped tool zip is kept in Documents\ERAVOS\tools (3.153); the bundled tools are a folder copied into the library (S3).

## BROWSE (the window — new UI: a preview first, today's ＋ Add kept)
  ⌕ Browse opens one window, four levels, a path across the top (Store › Music › Instruments › Retro DCO › Packs):
  1 DOMAINS     each domain as a card: what it is, how many tools / packs, installed or not, [Install the domain]
  2 TOOLS       per domain, by category; filter (installed · in the store · updates); each card: icon, name, one line, needs in words
  3 A TOOL      its page (the store's view of the ToolPage) — tabs, one each (axiom 6):
                  ABOUT        what it does, its preview (hear it), version, size, by whom (credit), changelog
                  NEEDS        its DAG drawn: the components it is made of (each with its UI element), the canvas elements it uses, its domain;
                               what is already installed, what would come with it — the resolver's plan in words (store S2)
                  PACKS        its packs: each with its presets / kits / patterns listed, hear any, install one or all
                  SOUNDS       every preset across its packs, auditioned with Preview (BUILT, 3.37) before loading
                  RHYTHMS      rhythms for this tool (from decomposed songs, the pattern library, showcase patterns), heard on the tool
                  NOTES        note patterns / lines for this tool (the same sources), heard on the tool; drag one to the canvas or the Timeline
                  [Add to canvas] [Install] [Remove] — installing = importing its zip (store I1–I4)
  4 A PACK      its contents (presets / patterns), what tool it is for, install
  search across all levels; keys: Ctrl+B opens Browse (proposed; his call); the toolbar stays for editing (his 2026-11-12) — Browse lives
  in the Start screen and ＋ Add (a "Browse the store" entry), not a new toolbar view.

## A TOOL'S ZIP — whole and isolated (his words: "all tools zipped in a zip with all of its components, dag, etc. all isolated from each other")
  <tool-id>@<version>.zip
    manifest.json      eravos.tool/2: id, version, digest, needs (announced — generated from the DAG: components, elements, ui, domain,
                       canvas, permissions), credit
    tool/              engine, ui, spec (its dag:, its signal_dag), tests, art, preview
    components/<id>@<v>/   EVERY component it stands on, whole: kernel, spec (ports, variables, element), element, tests — inside the tool's zip
    packs/             its packs (presets, kits, rhythms, notes)
  isolated: a tool's components are its own copies, pinned by version + digest. Updating a component in one tool never changes another tool
    (each tool's sound stays as it was proved). The canvas may hold one copy in memory when two tools carry the SAME digest (same bytes = the
    same part) — sharing without coupling. A component's newer version reaches a tool only when that tool's zip is rebuilt and its tests
    (and null render) pass.
  this refines store I2 ("each needed component's zip imported before the tool"): components travel INSIDE the tool's zip; components are
    still browsable units on their own (for mutation — specs/eravos.compat-graph.spec — and for a new tool to take one).

## THE INTERACTION CONTRACT (his words: "the canvas using a interaction contract")
  The canvas and a tool meet only here — nothing else crosses:
    1 the manifest      what the tool announces it needs (read with no code run); what it offers (ports, hooks, its "editable" kinds)
    2 the kernel hooks  ports and ui_hooks (ERAVOS.kernel.spec layer 3) — typed events, contract versions matched before a wire goes live (K-7)
    3 the kit elements  only the canvas UI elements its manifest names (store S1: needs.ui, generated; a call to an element it did not
                        announce fails the check)
    4 the SDK           OrganismSDK / the domain's SDK — the one API an engine is written against
  never: a tool reading another tool (K-3, tested), a tool reaching canvas internals it did not announce, the canvas naming a tool
    (tests/boundary.test.js). Guards: boundary (exists) · K-3 (exists) · ui-needs (store S1, to build) · a tool zip opened on a canvas with
    only its announced needs works (the isolation test, to build).

## phases
  SB0  this spec + map                                                            (2026-11-13)
  SB1  the preview of Browse (levels 1–4, Retro DCO's page with NEEDS, PACKS, SOUNDS, RHYTHMS, NOTES) — shown to him; nothing built before his yes
  SB2  data: per tool — packs, presets, rhythms, notes (song decomposition), needs (CG1 + store S1) — generated into the catalog
  SB3  Browse built over the bundled catalog (no network)
  SB4  tool zips (whole, isolated) built by a script and imported (store I1–I4); the bundle shipped as zips
  SB5  the store repo (D1) behind the same window

## decisions
  - D1 (his words above): every tool zipped whole — its components, DAG, packs — and isolated from every other tool.
  - D2 (his words above): the canvas and tools meet only through the interaction contract (manifest, hooks, announced kit elements, SDK).
  - D3 (proposed): sharing only by identical digest; a component update reaches a tool only through that tool's rebuild + tests.
  - D4 (proposed): Browse is reached from Start and ＋ Add, not a toolbar view (his 2026-11-12: "the toolbar is for editing").
  - D5 (his call): Ctrl+B for Browse.
open gaps: credit and authors (connecting with people, S7); paid / free (not asked); how a pack for a tool you do not have is shown
  (proposed: listed, with "needs <tool>").
