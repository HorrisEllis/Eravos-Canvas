# spec_id: eravos.organism.agents.llm-call · status MAPPED (specified, not built) · domain agents
identity:
  id: eravos.agents.llm-call ; label: LLM Call ; icon: 🧠 ; category: Automation
  folder: tools/agents/tools/<category>/llm-call/   (tool.json · llm-call.engine.js · llm-call.ui.js · llm-call.spec) — its own pack, never merged into another tool
  purpose: Send text to a model you configure; get text or JSON back.
ports:
  in:
    - text — a UTF-8 string
    - trigger — a pulse with a payload — "go now"
  out:
    - text — a UTF-8 string
    - json — a JSON value with a schema
params:
    - provider
    - model
    - max tokens
    - JSON schema (optional)
behaviour:
    - keys from the vault only
    - schema-checked JSON or a clear failure
depends_on:
  mode: Automation   units: [agents.runner, agents.log, agents.keys]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - a schema-mismatched reply is reported, not passed on
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
