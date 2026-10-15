# spec_id: eravos.organism.ui.export-web · status MAPPED (specified, not built) · domain ui
identity:
  id: eravos.ui.export-web ; label: Export Web ; icon: ⤓ ; category: UI / Web
  folder: domains/ui/tools/<category>/export-web/   (tool.json · export-web.engine.js · export-web.ui.js · export-web.spec) — its own pack, never merged into another tool
  purpose: Export clean HTML + CSS (or a component file).
ports:
  in:
    - layout — a box tree (component nodes with layout rules)
    - style — design tokens (colours, type, spacing, radii) as JSON
  out:
    - asset — a file the kernel holds by hash (audio, image, video, json)
params:
    - format: html|css+html|component
behaviour:
    - tokens become CSS custom properties
depends_on:
  mode: UI Design   units: [ui.engine, ui.viewport, ui.tokens]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - export re-imports to the same tree
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
