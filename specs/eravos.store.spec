# spec_id: eravos.store · version 0.1.0 · status PLANNED (map + spec first; no code yet) · canvas
# written 2026-11-06, from his words below. Stands on: eravos.p38.catalog (BUILT: installs only what you chose), eravos.pack.format
# (BUILT: a zip with a manifest), eravos.structure (canvas ⟂ tools). Nothing in those specs is changed by this one — it adds to them.

his_words (2026-11-06, verbatim, in order):
  - "can we add like branches from the GitHub as like a beta version? … the goal is, right, is that the canvas is its own thing, right,
     and then just adding tools, because the canvas is kind of the point of the canvas is just to be the deterministic foundation, right,
     that builds dynamically when you add the tools, which it does right now, but it only does it for music, right, it expands and
     contracts, it's supposed to be fluid. Which it is, which is why it works with dynamic, or the DAG, or you could say it's like a
     constraint field."
  - "the canvas is its own thing, and then the packs, the components, like everything else is in a some kind of store, right? I don't,
     thinking either a different repo or whatever, and then we just have it download from the repo instead of coming with the entirety,
     because imagine how big this is going to get."
  - "Because the canvas is supposed to install on the system, right? And then everything else goes in the documents folder. Is what's
     supposed to happen. The saves, the exports. Like, it's supposed to be completely... There's supposed to be a very clear line of
     separation between them. Like, right, the tools are zipped with the entirety of what they are, and the dependency graph tells the
     canvas what elements from the UI it needs."

the_line (the rule this spec exists for):
  SYSTEM  (C:\Program Files\ERAVOS, installed, updated by ERAVOS Update; read-only to the app)
          the canvas only: Electron host, kernel/, runtime/ (windows, wires, kit, themes, tool pages, catalog, store client), schemas/,
          the canvas's own UI elements. Names no tool, domain or topic (tests/boundary.test.js already enforces the words).
  LIBRARY (Documents\ERAVOS, yours; never touched by installing, updating or uninstalling)
          everything else: domains/ (a domain's core: music engine, theory …), tools/, components/, packs/, suites/, and what you make —
          projects/, exports/, drop/, .appdata/ (settings, caches, the store's downloads).
  A fresh install = the canvas + an empty library + the Store. (Open: a starter set — see decisions.)

what_exists_today (measured 2026-11-06):
  - canvas/ 0.8 MB · tools/music 28 MB (66 built tools) · six domains in tools/ (dataflow, music, video, image, agents, coding)
  - the installer is 125 MB, most of it Electron; content grows with every tool — the store stops that growth reaching the installer
  - Catalog (P38): a fresh profile installs nothing; boot loads only installed tools' files; a domain's core loads with its first tool;
    Catalog.ensure installs what a project names. Its files still come from the app folder (tools/), not the library.
  - Packs (pack.format): zips with manifest.json from Documents\ERAVOS\packs and \tools are already read at start (desktop/main.js
    sendPacks) and installed in dependency order.
  - tool.json: needs.units (e.g. music.engine), needs.permissions, packs.accepts — no versions, no UI elements, no components yet.
  - Spec DAGs (build/spec-dag.mjs): every tool spec lists the components it stands on, layer by layer.

units (what the store carries — each one a zip with "the entirety of what it is"):
  tool       engine, ui, spec (with its dag:), tests, art, preview, its own packs/ — manifest eravos.tool/2
  component  kernel code, its spec, its node test — manifest eravos.component/1
  domain     a domain's core (engine, theory, its UI words, its key groups) — manifest eravos.domain/1
  pack       data only (presets, kits, patterns, curves) — eravos.pack.format (as now)
  suite      parts + wires + settings (data) — eravos.suite/1
  Every unit: id, version (semver), digest (sha256 of the zip), and needs: (below). Nothing is installed whose digest does not match.

needs (the dependency graph a unit carries; the canvas resolves it — the "constraint field"):
  needs:
    canvas:     ">=1.4"                      the canvas version (its API) the unit was tested on
    ui:         [kit.knob@1, kit.segmented@1, kit.keyboard@1, panel@1, …]   the canvas UI elements it uses — GENERATED from the code
                (build/ui-needs.mjs: every UIKit.X / UI.X / CanvasWM.X it calls), never hand-written
    domain:     music@^1                     the domain core it runs in
    components: [filter-svf@^1, osc-va@^1, …]    from the spec's dag: (build/spec-dag.mjs already computes them)
    tools:      []                           whole tools it needs (rare: a suite, an arp that drives an instrument)
    permissions: [audio_out, midi_in, …]     as today
  The canvas, before installing or loading anything:
    1. builds the graph: unit → its needs → theirs …, from manifests only (no code runs)
    2. checks every edge: the canvas has each ui element at a compatible version; every component/domain/tool is installed or in the
       store at a version that satisfies the range; no cycle; permissions are ones you allow
    3. picks versions deterministically (highest satisfying, ties by digest) — the same library + the same store index → the same plan
    4. installs in topological order (domain core → components → tool → its packs), each digest-checked, or installs nothing and says
       which edge failed, in words ("Retro DCO needs the ladder filter 1.x; the store has 2.0 only")
    5. removing a unit removes what only it needed; anything another unit still needs stays (reference counted from the same graph)
  The canvas loads only the UI elements and components the installed graph names (lazy) — a tool that needs a UI element the canvas
  does not have is refused with the reason, not broken on screen.

store (where units come from):
  index      one store.json: [{ id, kind, version, channel: stable|beta, url, digest, size, needs, label, summary, icon, art }]
  sources    1. the store repo's releases (default; decision below: a separate repo or this one) — CI builds each unit's zip, runs
                its tests (node component tests; the in-page tool tests through the driver), writes store.json
             2. your own folder (drop a zip in Documents\ERAVOS\drop, as today) — "local", no index needed
             3. later: someone's shared link (connecting with people) — a unit with credit (author, from) in its manifest
  channels   stable · beta — a unit's beta is built from a branch on demand (Actions › store › Run workflow › branch, beta on); the
             app's own beta channel (ERAVOS itself) works the same way through ERAVOS Update. Settings › Store: Stable / Beta.
  offline    everything installed works with no network; the store is only asked when you open it or check for updates
  updates    each unit updates alone (a new pack never needs a new ERAVOS); an update re-runs the graph check first

signal_dag (the flow, top to bottom):
  store.json ─┐
  drop/*.zip ─┼─→ graph (manifests only) ─→ check edges ─→ plan (deterministic) ─→ download + digest ─→ unpack to Documents\ERAVOS
  project    ─┘                                                                                      ─→ Catalog.install (load, in order)

phases (each proved before the next; the sound never changes — null render — and nothing you made stops opening):
  S0  map + spec (this file) — shown to him first
  S1  manifests v2: version + digest + needs (canvas, ui, domain, components) for every built unit, GENERATED (ui-needs, spec-dag);
      a check that fails when code uses a UI element its manifest does not name
  S2  the resolver: graph, check, plan, remove — plain node, tested on made-up graphs (cycles, conflicts, missing, ranges, determinism)
  S3  the library holds content: Catalog reads tools/components/domains from Documents\ERAVOS (as packs already are); the app folder's
      tools/ becomes the first "store" (copied into the library on first start, as the old folders were moved in) — no download yet
  S4  the store: store.json + a CI workflow that zips and tests each unit; Settings › Store and ＋ Add show what is in the store, install
      with one click (the plan shown in words first when it pulls in more than the unit)
  S5  the installer ships the canvas only (+ the starter set, if chosen); content comes from the store
  S6  channels: beta units from branches; the app's beta channel
  S7  sharing: a unit or a project as a link, remix with credit (the open "connect with people" item)

guards (tests that keep the line):
  - boundary: canvas/ names no domain, tool or topic (exists)
  - ui-needs: a unit uses only the UI elements its manifest names; the canvas has every element some installed unit names
  - library: the app writes nothing under Program Files at run time; uninstall + reinstall leaves Documents\ERAVOS byte-identical
  - determinism: the same library + index → the same plan, twice, on two machines (a fixture)
  - digest: a tampered zip is refused

decisions (his call):
  D1 where the store lives: a separate repo (HorrisEllis/eravos-store: the line is the repo line; needs a session with access to it)
     or this repo's releases (simpler to start). Proposal: start here (S1–S4), move to its own repo when it is real.
  D2 what a fresh install brings: nothing (the Store opens first) or a starter set. Proposal: a small starter set per domain, shown on
     the first start, each removable.
  D3 betas: on demand per branch (proposal) or every push.
  D4 how far the line goes in v1 (Electron) — the music domain core in the library too (proposal: yes; it is content, not canvas).

open_gaps:
  - versions: today no unit has a version history; S1 starts every unit at its current number
  - components shared by tools are copied into each tool's files today in places (docs/duplicates.md, ~9 %): the store needs them as
    their own units first (the phase-1 components are; older shared code is not yet)
  - in-page tool tests need a browser in the store's CI (the driver exists; the runner on Linux is proven, Windows not yet)
