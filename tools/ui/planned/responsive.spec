# spec_id: eravos.organism.ui.responsive · status MAPPED (specified, not built) · domain ui
identity:
  id: eravos.ui.responsive ; label: Responsive ; icon: 📱 ; category: UI / Web
  folder: tools/ui/tools/<category>/responsive/   (tool.json · responsive.engine.js · responsive.ui.js · responsive.spec) — its own pack, never merged into another tool
  purpose: Preview and override at phone / tablet / desktop widths.
ports:
  in:
    - layout — a box tree (component nodes with layout rules)
  out:
    - layout — a box tree (component nodes with layout rules)
params:
    - breakpoints
    - per-breakpoint overrides
behaviour:
    - no horizontal scroll check at each width
depends_on:
  mode: UI Design   units: [ui.engine, ui.viewport, ui.tokens]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - at 360 px the page has no horizontal overflow
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
