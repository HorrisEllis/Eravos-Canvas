# spec_id: eravos.organism.ui.interaction · status MAPPED (specified, not built) · domain ui
identity:
  id: eravos.ui.interaction ; label: Interaction ; icon: ✨ ; category: UI / Web
  folder: domains/ui/tools/<category>/interaction/   (tool.json · interaction.engine.js · interaction.ui.js · interaction.spec) — its own pack, never merged into another tool
  purpose: Hover/press/enter animations and transitions.
ports:
  in:
    - layout — a box tree (component nodes with layout rules)
    - modulation — control signal (-1…1 or 0…1) into a parameter
  out:
    - layout — a box tree (component nodes with layout rules)
params:
    - trigger
    - property
    - duration
    - easing
behaviour:
    - respects reduced motion
depends_on:
  mode: UI Design   units: [ui.engine, ui.viewport, ui.tokens]
  works_with: [music.lfo]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - with reduced-motion on, durations become 0
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
