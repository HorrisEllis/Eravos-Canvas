# spec_id: eravos.organism.agents.prompt · status MAPPED (specified, not built) · domain agents
identity:
  id: eravos.agents.prompt ; label: Prompt ; icon: 📝 ; category: Automation
  folder: tools/agents/tools/<category>/prompt/   (tool.json · prompt.engine.js · prompt.ui.js · prompt.spec) — its own pack, never merged into another tool
  purpose: A prompt template with {slots} filled from inputs.
ports:
  in:
    - json — a JSON value with a schema
    - text — a UTF-8 string
  out:
    - text — a UTF-8 string
params:
    - template
    - examples
behaviour:
    - missing slot → visible error, never an empty prompt
depends_on:
  mode: Automation   units: [agents.runner, agents.log, agents.keys]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - all slots filled → no {…} left in the output
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
