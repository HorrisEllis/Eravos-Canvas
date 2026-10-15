# spec_id: eravos.organism.error-catch · version 1.0.0 · phase P38 · status planned · category flow
identity:
  id: eravos.agents.error-catch ; label: On Error ; icon: 🛟 ; accent: "#f87171"
  comp_intent: Decide what happens when a step fails — retry differently, use a fallback value, notify you, or stop cleanly.
  novelty: Error ports as a first-class branch (tools with error outputs feed it).
engine: inputs: error values (AI Step error, HTTP error, Code Cell error, Workflow failed) ; classify (network, timeout, auth, rate-limit, validation, unknown) ; actions per class: retry after, fallback value, route to port, notify, fail run
config: rules[] {class, action, params}
hooks: data_in error ; data_out fallback ; data_out route ; trigger_out failed
ui: rules table ; recent errors with class
tests: 429 → classified rate-limit → retried after Retry-After seconds ; auth error → never retried
