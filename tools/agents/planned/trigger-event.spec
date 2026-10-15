# spec_id: eravos.organism.agents.trigger-event · status MAPPED (specified, not built) · domain agents
identity:
  id: eravos.agents.trigger-event ; label: On Event ; icon: ⚡ ; category: Automation
  folder: tools/agents/tools/<category>/trigger-event/   (tool.json · trigger-event.engine.js · trigger-event.ui.js · trigger-event.spec) — its own pack, never merged into another tool
  purpose: Start a flow when something happens on the canvas (any bus topic) or a file lands.
ports:
  in:
    - event — bus topic with a JSON schema (note:trigger, transport:tick, …)
  out:
    - trigger — a pulse with a payload — "go now"
    - json — a JSON value with a schema
params:
    - topic
    - filter
behaviour:
    - bridges any domain into automation
depends_on:
  mode: Automation   units: [agents.runner, agents.log, agents.keys]
  works_with: [music.song-recorder, ui.button]   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - publishing the topic fires exactly one trigger
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
