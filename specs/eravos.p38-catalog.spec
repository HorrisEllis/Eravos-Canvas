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
