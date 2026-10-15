# spec_id: eravos.organism.webhook-in · version 1.0.0 · phase P38 · status planned · category triggers
# Needs the desktop runtime (a local HTTP listener) — in a plain browser tab it explains that instead of failing.
identity:
  id: eravos.agents.webhook-in ; label: Webhook ; icon: 🪝 ; accent: "#22d3ee"
  comp_intent: Start automations from other apps — a URL on this computer that other services or scripts can call.
  novelty: Inbound trigger (HTTP Tool is outbound).
engine: desktop bridge opens 127.0.0.1:<port>/hook/<id> ; optional shared-secret header (stored with ctx.secret) ; JSON/text/form bodies ; rate limit ; response mode immediate 202 | wait for workflow result (timeout) ; request log
config: path ; secret on/off ; methods ; rate limit ; response mode
hooks: data_out request (json {method, headers(filtered), body}) ; trigger_out
ui: URL with copy ; test-send button ; log
tests: POST with right secret → value out ; wrong secret → 401 logged, nothing sent ; browser-only → plain "needs the desktop app" state
