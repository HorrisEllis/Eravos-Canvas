# spec_id: eravos.organism.queue · version 1.0.0 · phase P38 · status planned · category flow
identity:
  id: eravos.agents.queue ; label: Queue ; icon: 🧺 ; accent: "#fcd34d"
  comp_intent: Line work up and feed it through at a safe pace — rate limits, batches, priorities — so automations don't flood a service.
  novelty: Throughput control (rate, concurrency, batch) with persistence.
engine: FIFO with priorities ; rate N per period ; concurrency ; batch size + max wait ; dead-letter after K failures ; persisted (IndexedDB)
config: rate ; concurrency ; batch ; priority field ; dead-letter K
hooks: data_in ; data_out next ; data_in ack/fail ; data_out dead-letter
ui: queue length chart ; items list ; pause/resume
tests: rate 2/s with 10 items → 5 s ±0.2 ; failed item retried then dead-lettered after K
