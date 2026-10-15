# spec_id: eravos.organism.notify · version 1.0.0 · phase P38 · status planned · category actions
identity:
  id: eravos.agents.notify ; label: Notify ; icon: 🔔 ; accent: "#fbbf24"
  comp_intent: Tell you something — a toast on the canvas, a system notification, a sound, or a message to a service you connected.
  novelty: Delivery with templates and quiet hours.
engine: channels: canvas toast, system Notification (permission), sound (any audio tool preset or a beep), webhook out (via HTTP Tool) ; template {{input}} ; quiet hours ; collapse duplicates within N s
config: channel ; template ; quiet hours ; collapse s
hooks: data_in ; trigger_in ; data_out delivered
ui: preview of the message ; test button
tests: 3 identical inputs within collapse window → 1 delivery ; quiet hours suppress system notifications but log them
