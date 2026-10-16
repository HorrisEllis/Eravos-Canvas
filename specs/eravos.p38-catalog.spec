# spec_id: eravos.p38.catalog · version 1.0.0 · phase P38 · status planned · canvas
# "The catalog needs to be empty by default. None of the tools are baked in."
identity:
  id: eravos.catalog ; label: Catalog ; icon: 📚
  comp_intent: The canvas starts with NO tools installed. Tools, packs and domains are installed from folders (or packs) and can be removed again; nothing in the canvas depends on any of them.
engine:
  install sources: tool folders already on disk (domains/<d>/tools/**) shown as "available", desktop pack zips, a dropped zip, a URL (desktop only)
  installed set: stored in IndexedDB (eravos.catalog) ; boot loads ONLY installed tools' files (tools/index.js becomes a manifest, not a loader) ; first run shows the domain picker → "install the starter set for this domain?" (explicit, one click, never silent)
  dependencies: tool.json gains requires {tools[], capabilities[], domains[]} and works_with {tools[], wire types} and conflicts {tools[]} ; installing resolves requires (asks), removing warns about dependants ; a project that needs uninstalled tools offers to install them on open (lists names) instead of failing
  domains: a domain's core (theory, audio engine…) loads when its first tool is installed
config: installed[] ; autoload starter bool (off by default)
hooks: (canvas service, no wires)
ui: Catalog page: Installed / Available / Packs tabs ; each tool card shows needs, works with, conflicts ; boundaries shown as coloured chips
tests: fresh profile → zero tools registered, canvas empty ; install Pads → only pads files fetched (network log) ; remove a tool that another installed tool requires → warning listing it ; opening a project with 3 uninstalled tools → install prompt naming the 3

## 3.39 amendment (P39 R6, order 6) — "i want the catalog to use the thumbnails for each tool. and have packs listed under each tool"
finding: every built tool folder ships preview.png (rendered by build/shots.mjs — a real screenshot of the window), but the
  ＋ Add cards (runtime/add-menu.js) show an emoji icon + text only; packs are visible only on the Sounds page.
cards: each tool card shows its preview.png (16:10, lazy-loaded, the icon + accent as fallback while loading or if missing)
  · label · one-line purpose · chips: mode, "+N toolbar" (exists), "N presets in M packs".
packs under each tool: the card expands (click the "N presets" chip, or the detail pane) into the tool's pack list — every
  pack with items for this tool: thumbnail (pack preview or the tool's), name, count, tags, on/off switch (the SAME switch as
  the tool's ⚙ SOUND tab and the Sounds page — one state, specs/eravos.p39-sounds-in-settings.spec §S) and ▶ on a few
  representative presets. Installing a tool from the Catalog (this spec's §engine) shows its packs before you add it.
bundles (packs spanning tools — 80s, Club, EDM Pads, the P39 genre packs) are listed under EVERY tool they feed, marked
  "bundle · also feeds Supersaw, Pad Forge …".
acceptance: every built tool's card renders its preview.png (no broken image — fallback tested by deleting one) ·
  the pack count on the card equals the tool's SOUND tab count · toggling a pack on a card flips it everywhere.
