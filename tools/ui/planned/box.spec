# spec_id: eravos.organism.ui.box · status MAPPED (specified, not built) · domain ui
identity:
  id: eravos.ui.box ; label: Box ; icon: ▭ ; category: UI / Web
  folder: tools/ui/tools/<category>/box/   (tool.json · box.engine.js · box.ui.js · box.spec) — its own pack, never merged into another tool
  purpose: A container: flex or grid layout, padding, gap, border, radius.
ports:
  in:
    - layout ×N — a box tree (component nodes with layout rules)
    - style — design tokens (colours, type, spacing, radii) as JSON
  out:
    - layout — a box tree (component nodes with layout rules)
params:
    - direction
    - align
    - justify
    - gap
    - padding
    - grid template
    - radius
    - border
behaviour:
    - children laid out by the browser engine itself
depends_on:
  mode: UI Design   units: [ui.engine, ui.viewport, ui.tokens]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - a row box with 3 children of 100 px and gap 10 measures 320 px
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
