# spec_id: eravos.organism.ui.page · status MAPPED (specified, not built) · domain ui
identity:
  id: eravos.ui.page ; label: Page ; icon: 📄 ; category: UI / Web
  folder: domains/ui/tools/<category>/page/   (tool.json · page.engine.js · page.ui.js · page.spec) — its own pack, never merged into another tool
  purpose: A page (artboard) that holds a component tree.
ports:
  in:
    - layout — a box tree (component nodes with layout rules)
    - style — design tokens (colours, type, spacing, radii) as JSON
  out:
    - layout — a box tree (component nodes with layout rules)
params:
    - size
    - background
    - scroll
behaviour:
    - the root every other UI tool plugs into
depends_on:
  mode: UI Design   units: [ui.engine, ui.viewport, ui.tokens]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - an empty page exports to a valid HTML document
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
