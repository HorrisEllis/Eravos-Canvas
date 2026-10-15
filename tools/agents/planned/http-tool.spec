# spec_id: eravos.organism.agents.http-tool · status MAPPED (specified, not built) · domain agents
identity:
  id: eravos.agents.http-tool ; label: HTTP Request ; icon: 🌐 ; category: Automation
  folder: domains/agents/tools/<category>/http-tool/   (tool.json · http-tool.engine.js · http-tool.ui.js · http-tool.spec) — its own pack, never merged into another tool
  purpose: Call an API: method, URL, headers, body.
ports:
  in:
    - json — a JSON value with a schema
    - trigger — a pulse with a payload — "go now"
  out:
    - json — a JSON value with a schema
params:
    - method
    - url
    - headers
    - body
behaviour:
    - domains allow-listed per flow
depends_on:
  mode: Automation   units: [agents.runner, agents.log, agents.keys]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - a non-allow-listed URL is refused before sending
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
