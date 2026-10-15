# spec_id: eravos.organism.agents.each · status MAPPED (specified, not built) · domain agents
identity:
  id: eravos.agents.each ; label: For Each ; icon: 🔁 ; category: Automation
  folder: domains/agents/tools/<category>/each/   (tool.json · each.engine.js · each.ui.js · each.spec) — its own pack, never merged into another tool
  purpose: Run the next steps once per item in a list.
ports:
  in:
    - json — a JSON value with a schema
  out:
    - json — a JSON value with a schema
params:
    - concurrency
    - stop on error
behaviour:
    - progress in the run log
depends_on:
  mode: Automation   units: [agents.runner, agents.log, agents.keys]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - 3 items → 3 runs of the next step
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
