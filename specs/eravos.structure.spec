# spec_id: eravos.structure · version 1.0.0 (3.32) · the clean layout, the schemas, the templates, the Pack Browser
# Companion files: schemas/*.schema.json (the formats) · templates/ (copy-to-start) · specs/eravos.structure.map.spec
# (generated: where every current tool goes) · specs/eravos.domains.map.spec (the domains still to build).

## 1. Rules
  R1  A folder holds ONE thing. A tool folder holds only that tool; shared code never lives in a tool folder.
  R2  Domains own folders; modes and categories do not own tools the same way:
        category = the one HOME folder of a tool (stable, one per tool)
        mode     = a VIEW (a manifest that references categories/tools). One tool shows up in many modes without
                   moving or being copied — modes can be added, changed or removed without touching a single tool.
      (Why not folders per mode: Effects and Modulation already appear in two modes today; folders per mode would
       force copies or arbitrary homes — exactly the rigid boxes this is meant to avoid.)
  R3  Code and content are separate. Tools are code. Packs are content (presets, kits, patterns, samples) — never code.
  R4  Shipped and yours are separate. Shipped packs live in the tool's packs/; your packs live in the Library
      (exe) or the browser's storage — an update never overwrites your work.
  R5  Every manifest has a schema (schemas/), every folder has a template (templates/), every tool has a spec
      next to its code. build/validate.mjs fails on anything that does not match.
  R6  The engine's define() is the truth for params and ports; tool.json is packaging (what it needs, which packs,
      preview). validate checks the two agree — nothing is written twice by hand.
  R7  The shell knows none of this: it sees domains through units, modes, needs and packs only (boundary test).

## 2. The tree
  <repo>/
    canvas/                       THE CANVAS — domain-free, what ERAVOS.exe ships (§7)
      kernel/                     the kernel (domain-free)
      runtime/                    shell runtime (domain-free): factory, canvas, wires, workspace, content-packs, add menu…
      index.html · scripts.js     the blank shell (Start · Add · Options); scripts.js sets ERAVOS_TOOLS, loads tools/index.js last
    schemas/                      tool · pack · mode · category · domain  (.schema.json)
    templates/                    tool/ (generic) · tool-sound/ (needs music.engine) · pack/ · mode/ · category/ · domain/
    build/                        new-tool · index-tools · validate · structure-map · specs · domain-specs · shots · perf
    specs/                        cross-cutting specs only (kernel, structure, maps, phases); tool specs live with tools
    tests/                        cross-cutting tests; tool tests may live in the tool's tests/
    desktop/                      the exe shell (Electron main, preload, packs builder)
    packaging/windows/            make-exe.ps1 (run by <repo>/Build ERAVOS.exe.bat): Electron + canvas/ + schemas/ → dist/ERAVOS
    tools/                        THE TOOLS — everything dragged onto the canvas (was domains/ until 3.37, §7)
      index.js                    the domain list the dev build loads (ERAVOS_DOMAINS)
      <domain>/
        domain.json               schemas/domain.schema.json
        domain.js                 registers units, modes, needs with the shell
        core/                     what the domain's tools share (engines, theory, the domain's UI kit)
        modes/<mode>.mode.json    views over the tools (schemas/mode.schema.json)
        pages/<page>/             off-canvas pages (Songbook, Pack Browser, Learn, Goals) — one folder each
        content/<kind>/           domain-wide data packs: genres/, songs/, lessons/, recipes/, bundles/
        tools/
          index.js                GENERATED (build/index-tools.mjs) — file:// cannot list folders
          <category>/
            category.json
            <tool>/
              tool.json           schemas/tool.schema.json
              <tool>.engine.js    define() + engine(ctx) — headless-capable
              <tool>.ui.js        the window (view.* only) — optional for services
              <tool>.css          optional
              <tool>.spec         behaviour contract + acceptance
              preview.png         rendered by build/shots.mjs (preview.svg placeholder until then)
              tests/              optional tool-local tests
              packs/
                index.js          GENERATED — registers the packs below with ContentPacks
                factory/pack.json the tool's own presets (moved out of define())
                <pack>/pack.json  more packs; samples/ and preview.* inside the pack folder

  exe (ERAVOS Library/):
    Mods/<Domain>/core.zip                    the domain (domain.json + core + modes + pages + content)
    Mods/<Domain>/<category>/<Tool>.zip       ONE zip per tool (its files + its packs) — remove one, only it is gone
    Mods/<Domain>/packs/<pack>.zip            content packs you add (dropped .zip = kept here)
    User/<Domain>/packs/<pack>/               packs you make in the Pack Browser (R4)
    Projects/ · Exports/ · Drop Here/         unchanged

## 3. Making something new (the replicable path)
  tool      node build/new-tool.mjs --domain music --category effects --id fx-shimmer --label "Shimmer" [--flavour sound]
            → tools/music/tools/effects/fx-shimmer/ with every file above, ids filled in, a factory pack
            → node build/index-tools.mjs   (it loads: dev page, tests, and its own zip in the exe)
            → node build/validate.mjs      (schemas + engine id + files + category folder)
            → write the engine, the window and the spec's acceptance tests; status building → built when they pass
  pack      copy templates/pack/ into a tool's packs/ (or Mods/<Domain>/packs/), fill items, index, validate
  mode      copy templates/mode/__MODE__.mode.json into tools/<d>/modes/, list units + categories (+ include/exclude)
  category  copy templates/category/ (new-tool makes it for you when the folder is new)
  domain    copy templates/domain/ → tools/<new>/ and add <new> to tools/index.js (P32.4 adds build/new-domain.mjs with a working first tool)
  Agnostic by default: templates/tool needs nothing but the kernel. A tool that makes sound declares
  needs.units ["music.engine"]; one that records declares needs.tools ["eravos.song-recorder"]. The shell turns on
  exactly what is declared — so "what can it not be without" is written in one place and nowhere else.
  Verified in 3.32: scaffold → index → validate → the tool loads, plays, shows its factory presets; switching its
  pack off removes them; the exe builds it into its own zip.

## 4. Packs (content) — runtime/content-packs.js → ContentPacks
  One registry for every domain and kind. Kinds: presets (merged into the tool's preset menu as "<Pack> · <name>"),
  kits, patterns, samples, … (a domain registers new kinds with ContentPacks.kind). Every pack can be switched on/off
  (remembered); a bundle is a pack that feeds several tools (today: 80s, Club, EDM Pads). 3.32 moved the music preset
  packs and the drum kit packs onto it — one system, not three.

## 5. The Pack Browser (pages/pack-browser — grows out of today's Sounds page)  P32.3
  Browse:   every pack of every installed tool, as cards with preview (image or a short audio preview), tags, counts.
            Filter by domain → mode → category → tool → tag (genre, mood, era) → kind; search across all of it.
  Control:  switch packs on/off; see exactly what each adds to which tool; open a tool's window from its card.
  Mix:      pick items from any packs (a preset here, a kit there, three pads from two kits) into a new bundle.
  Make:     save the current sound of any window as a preset into one of YOUR packs; save a kit; capture any sound to a
            pad (exists); export a pack as a .zip to share; drop a .zip in to add one.
  Preview:  presets audition on the tool's own preview note/pattern; kits play pads; previews render offline and cache.

## 6. Phases
  P32.1 DONE   schemas · templates (generic + sound) · build/new-tool · index-tools · validate · ContentPacks (presets + kits
               moved onto it) · per-tool zips for new-layout tools · build/ (was tools/) · this spec + the map
  P32.2        build/migrate.mjs: move the 47 music tools into tools/<category>/<tool>/ one by one (git mv), write tool.json
               from define(), split built-in presets into packs/factory, keep every test green after each move
  P32.3        Pack Browser page (§5) replacing the Presets/Kits tabs of Sounds
  P32.4        core/ · modes/*.mode.json · pages/ · content/ folders for music; build/new-domain.mjs
  P32.5        previews: build/shots.mjs writes preview.png into each tool folder; audio previews for packs
  P32.6        first non-music domain from eravos.domains.map.spec, built only from the templates (the proof)

## 7. Canvas | tools split (3.37 layout pass)
  R8  canvas/ and tools/ are sibling folders. The canvas reaches the tools through ONE variable, ERAVOS_TOOLS
      (canvas/scripts.js: data-tools attribute, default <data-base>../tools/). Every domain loader resolves against it.
  R9  Same URL layout everywhere: dev (file:// and serve.js) serves <repo>/ → /canvas/index.html + /tools/;
      the exe serves resources/app/eravos/ → /canvas/index.html + /tools/index.js (an empty stub; tools come as packs).
      Storage is keyed by origin only (localhost:4747, eravos://app) — moving the page under /canvas/ keeps every save.
  R10 Pack zips hold domain-relative paths (desktop/packs.mjs strips "<domain>/"), so the move changed no zip:
      all 52 Mods zips are byte-identical to 3.36. Existing ERAVOS Library folders keep working.
  R11 Build output (ERAVOS.exe, zips) lives in dist/ and is never committed.
  R12 The exe IS the canvas: Build ERAVOS.exe.bat ships Electron + canvas/ + schemas/ and an empty tools/index.js —
      no tools. Tools are everything else and arrive as packs (ERAVOS Library\\Mods or a dropped .zip).
  Verified: tests/run.mjs 809/809 · validate 127 manifests · page loads 6 domains, 54 tools, 52 packs, 0 errors
  (file://, root redirect, serve.js) · exe overlay boots bare with 0 errors.
