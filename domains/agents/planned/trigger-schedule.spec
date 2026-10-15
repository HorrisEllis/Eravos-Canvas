# spec_id: eravos.organism.agents.trigger-schedule · status MAPPED (specified, not built) · domain agents
identity:
  id: eravos.agents.trigger-schedule ; label: Schedule ; icon: ⏰ ; category: Automation
  folder: domains/agents/tools/<category>/trigger-schedule/   (tool.json · trigger-schedule.engine.js · trigger-schedule.ui.js · trigger-schedule.spec) — its own pack, never merged into another tool
  purpose: Start a flow at times (cron-like) or every N minutes.
ports:
  in:
    - (none)
  out:
    - trigger — a pulse with a payload — "go now"
params:
    - when
    - timezone
behaviour:
    - runs as a service — no window needed
depends_on:
  mode: Automation   units: [agents.runner, agents.log, agents.keys]
  works_with: []   # other domains reached only through typed ports / bus events
acceptance (must pass before status → built — nothing pretends to work):
    - every-minute schedule fires once per minute ±1 s
    - standard: renders/produces output through its out port; unmount leaves zero subscribers, ports, wires; params clamp; presets load
