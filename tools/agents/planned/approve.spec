# spec_id: eravos.organism.agents.approve · status MAPPED (specified, not built) · domain agents
identity:
  id: eravos.agents.approve ; label: Approve ; icon: ✋ ; category: Automation
  folder: tools/agents/tools/<category>/approve/   (tool.json · approve.engine.js · approve.ui.js · approve.spec) — its own pack, never merged into another tool
  purpose: Pause until a person says yes — required before anything irreversible.
ports:
  in:
    - json — a JSON value with a schema
  out:
    - json — a JSON value with a schema
params:
    - message
    - timeout
behaviour:
    - sending, deleting and paying steps refuse to run without one upstream
depends_on:
  mode: Automation   units: [agents.runner, agents.log, agents.keys]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - a send step with no approve upstream refuses to run
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
