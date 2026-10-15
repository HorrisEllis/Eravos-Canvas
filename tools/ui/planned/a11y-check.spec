# spec_id: eravos.organism.ui.a11y-check · status MAPPED (specified, not built) · domain ui
identity:
  id: eravos.ui.a11y-check ; label: Accessibility Check ; icon: ♿ ; category: UI / Web
  folder: tools/ui/tools/<category>/a11y-check/   (tool.json · a11y-check.engine.js · a11y-check.ui.js · a11y-check.spec) — its own pack, never merged into another tool
  purpose: Contrast, alt text, labels, focus order, headings.
ports:
  in:
    - layout — a box tree (component nodes with layout rules)
    - style — design tokens (colours, type, spacing, radii) as JSON
  out:
    - json — a JSON value with a schema
params:
    - (none)
behaviour:
    - reads only; lists issues with a jump-to
depends_on:
  mode: UI Design   units: [ui.engine, ui.viewport, ui.tokens]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - a 2:1 contrast pair is reported
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
