# spec_id: eravos.organism.state-machine · version 1.0.0 · phase P38 · status planned · category flow
identity:
  id: eravos.agents.state-machine ; label: States ; icon: 🔀 ; accent: "#a78bfa"
  comp_intent: Model anything that has modes — idle → recording → reviewing → published — and let events move it; each state can run actions on enter/exit.
  novelty: Explicit finite-state machine with guards, timeouts and history.
engine: states {name, onEnter actions, onExit actions, timeout → event} ; transitions {from, event, guard (expression over the event value and variables), to, action} ; history (last N transitions) ; actions = send a value on a port, set a variable, start a workflow ; invalid event in a state → logged, never thrown
config: states[] ; transitions[] ; initial
hooks: data_in event ; data_out state ; trigger_out per state (generated)
ui: diagram (states as nodes, transitions as arrows) ; current state glows ; event log
tests: idle --rec--> recording --stop--> reviewing ; guard false blocks transition ; timeout 2 s fires its event
