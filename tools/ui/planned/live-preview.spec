# spec_id: eravos.organism.ui.live-preview · status MAPPED (specified, not built) · domain ui
identity:
  id: eravos.ui.live-preview ; label: Live Preview ; icon: 👁 ; category: UI / Web
  folder: tools/ui/tools/<category>/live-preview/   (tool.json · live-preview.engine.js · live-preview.ui.js · live-preview.spec) — its own pack, never merged into another tool
  purpose: The page running for real, in a sandboxed frame.
ports:
  in:
    - layout — a box tree (component nodes with layout rules)
    - style — design tokens (colours, type, spacing, radii) as JSON
  out:
    - event — bus topic with a JSON schema (note:trigger, transport:tick, …)
params:
    - device
    - theme
behaviour:
    - events flow back to the canvas
depends_on:
  mode: UI Design   units: [ui.engine, ui.viewport, ui.tokens]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - preview DOM matches the exported HTML
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
