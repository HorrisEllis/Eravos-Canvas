# spec_id: eravos.organism.agents.memory · status MAPPED (specified, not built) · domain agents
identity:
  id: eravos.agents.memory ; label: Memory ; icon: 💾 ; category: Automation
  folder: domains/agents/tools/<category>/memory/   (tool.json · memory.engine.js · memory.ui.js · memory.spec) — its own pack, never merged into another tool
  purpose: Keep values between runs (a small key/value store per flow).
ports:
  in:
    - json — a JSON value with a schema
  out:
    - json — a JSON value with a schema
params:
    - key
    - ttl
behaviour:
    - stored locally, exportable
depends_on:
  mode: Automation   units: [agents.runner, agents.log, agents.keys]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - a value written in run 1 is read in run 2
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
