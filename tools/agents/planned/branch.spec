# spec_id: eravos.organism.agents.branch · status MAPPED (specified, not built) · domain agents
identity:
  id: eravos.agents.branch ; label: Branch ; icon: 🔀 ; category: Automation
  folder: domains/agents/tools/<category>/branch/   (tool.json · branch.engine.js · branch.ui.js · branch.spec) — its own pack, never merged into another tool
  purpose: If / else on a condition.
ports:
  in:
    - json — a JSON value with a schema
  out:
    - json ×2 — a JSON value with a schema
params:
    - condition
behaviour:
    - exactly one output fires per input
depends_on:
  mode: Automation   units: [agents.runner, agents.log, agents.keys]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - true goes left, false goes right, never both
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
