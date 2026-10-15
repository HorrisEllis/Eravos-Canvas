# spec_id: eravos.organism.ui.style-tokens · status MAPPED (specified, not built) · domain ui
identity:
  id: eravos.ui.style-tokens ; label: Design Tokens ; icon: 🎛 ; category: UI / Web
  folder: tools/ui/tools/<category>/style-tokens/   (tool.json · style-tokens.engine.js · style-tokens.ui.js · style-tokens.spec) — its own pack, never merged into another tool
  purpose: Colours, type scale, spacing, radii, shadows — one source of style.
ports:
  in:
    - (none)
  out:
    - style — design tokens (colours, type, spacing, radii) as JSON
params:
    - palette
    - type scale
    - spacing scale
    - radii
    - dark mode pair
behaviour:
    - contrast checked as you pick
depends_on:
  mode: UI Design   units: [ui.engine, ui.viewport, ui.tokens]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - every text/background token pair meets WCAG AA or is flagged
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
