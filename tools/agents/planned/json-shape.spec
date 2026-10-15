# spec_id: eravos.organism.agents.json-shape · status MAPPED (specified, not built) · domain agents
identity:
  id: eravos.agents.json-shape ; label: Shape Data ; icon: 🔧 ; category: Automation
  folder: tools/agents/tools/<category>/json-shape/   (tool.json · json-shape.engine.js · json-shape.ui.js · json-shape.spec) — its own pack, never merged into another tool
  purpose: Pick, rename, map and filter JSON.
ports:
  in:
    - json — a JSON value with a schema
  out:
    - json — a JSON value with a schema
params:
    - mapping (JSONata-like)
behaviour:
    - pure function — same input, same output
depends_on:
  mode: Automation   units: [agents.runner, agents.log, agents.keys]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - identity mapping returns the input unchanged
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
