# spec_id: eravos.organism.scene-morph · version 1.0.0 · phase P38 · status planned · category arrange
identity:
  id: eravos.scene-morph ; label: Scenes ; icon: 🎬 ; accent: "#4cc9f0"
  comp_intent: Snapshot the whole canvas (every knob of chosen tools) as scenes and morph between them — instant contrast, or slow evolution.
  novelty: Multi-tool state interpolation on an X/Y pad or a timeline.
engine: scene = {tool → params} for selected tools ; morph: continuous params interpolate (lin/exp per type), enums/booleans switch at 50 % (or a chosen point) ; jump (quantized to beat/bar) vs glide (time) ; 4 scenes on an X/Y pad (bilinear) ; scene list for performance (like clip launch) ; saved with project
config: scenes[] ; tools in scope ; quantize ; glide time ; xy assignments
hooks: STD.transport_in ; STD.midi_in ; data_in (go to scene) ; control_out
ui: scene buttons, X/Y morph pad, "capture" button, per-tool include toggles
tests: morph 50 % between cutoff 200 and 800 (exp) → 400 Hz ; jump quantized to bar lands on the bar ±1 tick
