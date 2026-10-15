# spec_id: eravos.organism.agents.run-log · status MAPPED (specified, not built) · domain agents
identity:
  id: eravos.agents.run-log ; label: Run Log ; icon: 📜 ; category: Automation
  folder: tools/agents/tools/<category>/run-log/   (tool.json · run-log.engine.js · run-log.ui.js · run-log.spec) — its own pack, never merged into another tool
  purpose: Every run, every step, inputs and outputs, timing, errors.
ports:
  in:
    - event — bus topic with a JSON schema (note:trigger, transport:tick, …)
  out:
    - json — a JSON value with a schema
params:
    - keep: N runs
behaviour:
    - nothing fails silently
depends_on:
  mode: Automation   units: [agents.runner, agents.log, agents.keys]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - a failed step appears with its error and input
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
