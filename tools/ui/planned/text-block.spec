# spec_id: eravos.organism.ui.text-block · status MAPPED (specified, not built) · domain ui
identity:
  id: eravos.ui.text-block ; label: Text Block ; icon: 🔤 ; category: UI / Web
  folder: domains/ui/tools/<category>/text-block/   (tool.json · text-block.engine.js · text-block.ui.js · text-block.spec) — its own pack, never merged into another tool
  purpose: Headings and paragraphs with token typography.
ports:
  in:
    - text — a UTF-8 string
    - style — design tokens (colours, type, spacing, radii) as JSON
  out:
    - layout — a box tree (component nodes with layout rules)
params:
    - tag: h1…p
    - type token
    - colour token
behaviour:
    - editable in place
depends_on:
  mode: UI Design   units: [ui.engine, ui.viewport, ui.tokens]
  works_with: [image.text-layer]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - h1 with token display-xl renders with that token’s size
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
