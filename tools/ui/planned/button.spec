# spec_id: eravos.organism.ui.button · status MAPPED (specified, not built) · domain ui
identity:
  id: eravos.ui.button ; label: Button ; icon: 🔘 ; category: UI / Web
  folder: tools/ui/tools/<category>/button/   (tool.json · button.engine.js · button.ui.js · button.spec) — its own pack, never merged into another tool
  purpose: A button with states (rest, hover, press, focus, disabled).
ports:
  in:
    - style — design tokens (colours, type, spacing, radii) as JSON
    - event — bus topic with a JSON schema (note:trigger, transport:tick, …)
  out:
    - layout — a box tree (component nodes with layout rules)
    - event — bus topic with a JSON schema (note:trigger, transport:tick, …)
params:
    - label
    - variant
    - size
    - action
behaviour:
    - emits an event when pressed in preview
depends_on:
  mode: UI Design   units: [ui.engine, ui.viewport, ui.tokens]
  works_with: [agents.trigger-event]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - pressing in preview emits ui:pressed once
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
