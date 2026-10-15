# spec_id: eravos.organism.wait · version 1.0.0 · phase P38 · status planned · category flow
identity:
  id: eravos.agents.wait ; label: Wait ; icon: ⏱ ; accent: "#cbd5e1"
  comp_intent: Pause a workflow — for a time, until a time, until a value arrives, or until you press Continue.
  novelty: Durable wait (survives reload when inside a Workflow).
engine: modes duration | until clock time | until event (port) | manual ; timeout branch ; durable via Workflow checkpoint
config: mode ; duration ; until ; timeout
hooks: data_in ; data_in event ; data_out passed ; data_out timeout
ui: countdown / waiting-for display ; Continue button
tests: 500 ms wait passes value after 500 ±20 ms ; until-event with timeout 1 s and no event → timeout port
